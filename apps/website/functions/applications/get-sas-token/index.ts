import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from '@azure/storage-blob';

const httpTrigger = async (
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log('Get SAS token function processed a request.');

  try {
    // Get query parameters
    const url = new URL(req.url);
    const fileName = url.searchParams.get('fileName');
    const fileType = url.searchParams.get('fileType');

    if (!fileName) {
      return {
        status: 400,
        jsonBody: { error: 'fileName query parameter is required' },
      };
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (fileType && !allowedTypes.includes(fileType)) {
      return {
        status: 400,
        jsonBody: { error: 'File type not allowed' },
      };
    }

    // Get Azure Storage connection string
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      return {
        status: 500,
        jsonBody: { error: 'Storage configuration not found' },
      };
    }

    // Generate unique blob name
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const blobName = `temp/${timestamp}-${randomId}-${fileName}`;

    // Create BlobServiceClient
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerName = 'applications';
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists (without public access)
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlobClient(blobName);

    // Generate SAS token with write permissions
    const startsOn = new Date();
    const expiresOn = new Date(startsOn);
    expiresOn.setMinutes(startsOn.getMinutes() + 15); // 15 minutes expiry

    const sasOptions = {
      containerName: containerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('w'), // write permission
      startsOn: startsOn,
      expiresOn: expiresOn,
      protocol: SASProtocol.Https,
    };

    // Extract account name and key from connection string for SAS generation
    const connStrParts = connectionString.split(';');
    const accountName = connStrParts
      .find((p) => p.startsWith('AccountName='))
      ?.split('=')[1];
    const accountKey = connStrParts
      .find((p) => p.startsWith('AccountKey='))
      ?.split('=')[1];

    if (!accountName || !accountKey) {
      return {
        status: 500,
        jsonBody: { error: 'Invalid storage connection string' },
      };
    }

    const { StorageSharedKeyCredential } = await import('@azure/storage-blob');
    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();

    // Return the SAS URL
    const sasUrl = `${blobClient.url}?${sasToken}`;

    return {
      status: 200,
      jsonBody: {
        sasUrl: sasUrl,
        blobName: blobName,
        expiresAt: expiresOn.toISOString(),
      },
    };
  } catch (error) {
    context.error('Error generating SAS token:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to generate SAS token' },
    };
  }
};

app.http('getSasToken', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'applications/get-sas-token',
  handler: httpTrigger,
});
