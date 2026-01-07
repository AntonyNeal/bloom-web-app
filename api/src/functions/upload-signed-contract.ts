import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from "@azure/storage-blob";

// Support both connection string and individual credentials
const getConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) {
    return connectionString;
  }
  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };
};

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Upload Signed Contract Endpoint
 * 
 * POST /api/accept-offer/:token/signed-contract
 * 
 * Allows applicants to upload their signed contract before accepting the offer.
 * Uses the offer token for authentication.
 */
async function uploadSignedContractHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Upload signed contract request: ${request.method} ${request.url}`);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  const token = request.params.token;

  if (!token) {
    return {
      status: 400,
      headers,
      jsonBody: { error: 'Offer token is required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    // Get the file from form data
    const formData = await request.formData();
    const fileEntry = formData.get('file');

    if (!fileEntry || typeof fileEntry === 'string') {
      return {
        status: 400,
        headers,
        jsonBody: { error: 'No file uploaded' },
      };
    }

    const file = fileEntry;

    pool = await sql.connect(getConfig());

    // Verify the application exists and has a valid offer token
    const appResult = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT id, email, status, first_name, last_name
        FROM applications
        WHERE offer_token = @token
      `);

    if (appResult.recordset.length === 0) {
      return {
        status: 404,
        headers,
        jsonBody: { error: 'Invalid or expired offer link' },
      };
    }

    const application = appResult.recordset[0];

    // Upload file to Azure Blob Storage
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.STORAGE_CONNECTION_STRING;
    
    if (!connectionString) {
      return {
        status: 500,
        headers,
        jsonBody: { error: "Storage connection string not configured" },
      };
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient("applications");

    // Ensure container exists
    await containerClient.createIfNotExists();

    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `signed_contracts/${application.id}-${timestamp}-${sanitizedFilename}`;

    context.log(`Uploading signed contract: ${fileName}`);

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    // Get file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' },
    });

    // Generate a SAS token for the blob (valid for 1 year)
    const accountMatch = connectionString.match(/AccountName=([^;]+)/);
    const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
    
    let url = blockBlobClient.url;
    
    if (accountMatch && keyMatch) {
      const accountName = accountMatch[1];
      const accountKey = keyMatch[1];
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
      
      const sasToken = generateBlobSASQueryParameters({
        containerName: "applications",
        blobName: fileName,
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }, sharedKeyCredential).toString();
      
      url = `${blockBlobClient.url}?${sasToken}`;
    }

    // Update the application with the signed contract URL
    await pool.request()
      .input('token', sql.NVarChar, token)
      .input('signedContractUrl', sql.NVarChar, url)
      .query(`
        UPDATE applications
        SET signed_contract_url = @signedContractUrl
        WHERE offer_token = @token
      `);

    context.log(`Signed contract uploaded for application ${application.id} (${application.email})`);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        message: 'Signed contract uploaded successfully',
      },
    };
  } catch (error) {
    context.error(`Error uploading signed contract: ${error}`);
    return {
      status: 500,
      headers,
      jsonBody: { error: 'Failed to upload signed contract', details: error instanceof Error ? error.message : 'Unknown error' },
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

app.http('upload-signed-contract', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'accept-offer/{token}/signed-contract',
  handler: uploadSignedContractHandler,
});
