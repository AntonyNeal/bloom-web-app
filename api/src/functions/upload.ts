import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from "@azure/storage-blob";

async function uploadHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (req.method === "OPTIONS") {
    return { status: 204, headers };
  }

  try {
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

    // Get file from form data
    const formData = await req.formData();
    const fileEntry = formData.get("file");

    if (!fileEntry || typeof fileEntry === "string") {
      return {
        status: 400,
        headers,
        jsonBody: { error: "No file uploaded" },
      };
    }
    
    const file = fileEntry;

    const fileType = req.query.get("type") || "document";
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${fileType}/${timestamp}-${sanitizedFilename}`;

    context.log(`Uploading file: ${fileName}`);

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    // Get file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Set content type
    const contentTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };
    
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const contentType = contentTypeMap[ext] || "application/octet-stream";

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    // Generate a SAS token for the blob (valid for 1 year)
    // Parse account name and key from connection string
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
        permissions: BlobSASPermissions.parse("r"), // Read only
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }, sharedKeyCredential).toString();
      
      url = `${blockBlobClient.url}?${sasToken}`;
    }

    return {
      status: 200,
      headers,
      jsonBody: { url },
    };
  } catch (error) {
    context.error("Error in upload handler:", error);
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    return {
      status: 500,
      headers,
      jsonBody: { error: errorMessage },
    };
  }
}

app.http("upload", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "upload",
  handler: uploadHandler,
});
