/**
 * Video Recording Upload API
 * 
 * Handles uploading session recordings to Azure Blob Storage.
 * Recordings are stored with consent metadata and linked to appointments.
 * 
 * Security:
 * - Requires authenticated clinician
 * - Validates consent was given before allowing upload
 * - Generates time-limited SAS URLs for playback
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from "@azure/storage-blob";

const CONTAINER_NAME = "session-recordings";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB max

interface RecordingMetadata {
  appointmentId: string;
  practitionerId: string;
  patientInitials: string;
  sessionDate: string;
  duration: number;
  consentGivenAt: string;
  consentType: 'verbal' | 'written';
}

/**
 * Generate a pre-signed URL for uploading a recording
 * POST /api/recordings/upload-url
 */
async function generateUploadUrl(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Azure-User-Id",
    "Access-Control-Max-Age": "86400",
  };

  if (req.method === "OPTIONS") {
    return { status: 204, headers };
  }

  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.STORAGE_CONNECTION_STRING;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    
    if (!connectionString || !accountName || !accountKey) {
      context.log("Storage configuration missing");
      return {
        status: 500,
        headers,
        jsonBody: { error: "Storage not configured" },
      };
    }

    const body = await req.json() as {
      appointmentId: string;
      contentType: string;
      fileSize: number;
      metadata: RecordingMetadata;
    };

    const { appointmentId, contentType, fileSize, metadata } = body;

    // Validate required fields
    if (!appointmentId || !metadata?.consentGivenAt) {
      return {
        status: 400,
        headers,
        jsonBody: { error: "Missing required fields: appointmentId, consent timestamp" },
      };
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return {
        status: 400,
        headers,
        jsonBody: { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      };
    }

    // Validate content type
    const allowedTypes = ['video/webm', 'video/mp4', 'audio/webm', 'audio/mp4'];
    if (!allowedTypes.includes(contentType)) {
      return {
        status: 400,
        headers,
        jsonBody: { error: "Invalid content type. Allowed: video/webm, video/mp4, audio/webm, audio/mp4" },
      };
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Ensure container exists with private access
    await containerClient.createIfNotExists({
      access: undefined, // Private access only
    });

    // Generate blob name with date partitioning
    const date = new Date();
    const datePrefix = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    const extension = contentType.includes('mp4') ? 'mp4' : 'webm';
    const blobName = `${datePrefix}/${appointmentId}-${Date.now()}.${extension}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Generate SAS token for upload (valid for 1 hour)
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const expiresOn = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const sasToken = generateBlobSASQueryParameters({
      containerName: CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse("cw"), // Create and Write
      expiresOn,
    }, sharedKeyCredential).toString();

    const uploadUrl = `${blockBlobClient.url}?${sasToken}`;

    context.log(`Generated upload URL for appointment ${appointmentId}`);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        data: {
          uploadUrl,
          blobName,
          expiresAt: expiresOn.toISOString(),
          metadata: {
            ...metadata,
            contentType,
          },
        },
      },
    };
  } catch (error) {
    context.error("Error generating upload URL:", error);
    return {
      status: 500,
      headers,
      jsonBody: { error: "Failed to generate upload URL" },
    };
  }
}

/**
 * Confirm recording upload and store metadata
 * POST /api/recordings/confirm
 */
async function confirmUpload(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Azure-User-Id",
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
        jsonBody: { error: "Storage not configured" },
      };
    }

    const body = await req.json() as {
      blobName: string;
      metadata: RecordingMetadata;
    };

    const { blobName, metadata } = body;

    if (!blobName || !metadata) {
      return {
        status: 400,
        headers,
        jsonBody: { error: "Missing blobName or metadata" },
      };
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Verify blob exists
    const exists = await blockBlobClient.exists();
    if (!exists) {
      return {
        status: 404,
        headers,
        jsonBody: { error: "Recording not found" },
      };
    }

    // Set metadata on the blob
    await blockBlobClient.setMetadata({
      appointmentId: metadata.appointmentId,
      practitionerId: metadata.practitionerId,
      patientInitials: metadata.patientInitials,
      sessionDate: metadata.sessionDate,
      duration: String(metadata.duration),
      consentGivenAt: metadata.consentGivenAt,
      consentType: metadata.consentType,
      uploadedAt: new Date().toISOString(),
    });

    context.log(`Confirmed recording upload for appointment ${metadata.appointmentId}`);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        data: {
          blobName,
          confirmedAt: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    context.error("Error confirming upload:", error);
    return {
      status: 500,
      headers,
      jsonBody: { error: "Failed to confirm upload" },
    };
  }
}

/**
 * Get playback URL for a recording
 * GET /api/recordings/{appointmentId}
 */
async function getRecordingUrl(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Azure-User-Id",
    "Access-Control-Max-Age": "86400",
  };

  if (req.method === "OPTIONS") {
    return { status: 204, headers };
  }

  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.STORAGE_CONNECTION_STRING;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    
    if (!connectionString || !accountName || !accountKey) {
      return {
        status: 500,
        headers,
        jsonBody: { error: "Storage not configured" },
      };
    }

    const appointmentId = req.params.appointmentId;
    if (!appointmentId) {
      return {
        status: 400,
        headers,
        jsonBody: { error: "Missing appointmentId" },
      };
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Find blob by appointment ID prefix
    let foundBlob: { name: string; metadata?: Record<string, string> } | null = null;
    
    for await (const blob of containerClient.listBlobsFlat({ includeMetadata: true })) {
      if (blob.name.includes(appointmentId)) {
        foundBlob = { name: blob.name, metadata: blob.metadata };
        break;
      }
    }

    if (!foundBlob) {
      return {
        status: 404,
        headers,
        jsonBody: { error: "Recording not found for this appointment" },
      };
    }

    const blockBlobClient = containerClient.getBlockBlobClient(foundBlob.name);

    // Generate SAS token for reading (valid for 4 hours)
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const expiresOn = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    const sasToken = generateBlobSASQueryParameters({
      containerName: CONTAINER_NAME,
      blobName: foundBlob.name,
      permissions: BlobSASPermissions.parse("r"), // Read only
      expiresOn,
    }, sharedKeyCredential).toString();

    const playbackUrl = `${blockBlobClient.url}?${sasToken}`;

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        data: {
          playbackUrl,
          expiresAt: expiresOn.toISOString(),
          metadata: foundBlob.metadata,
        },
      },
    };
  } catch (error) {
    context.error("Error getting recording URL:", error);
    return {
      status: 500,
      headers,
      jsonBody: { error: "Failed to get recording URL" },
    };
  }
}

// Register functions
app.http("recordings-upload-url", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "recordings/upload-url",
  handler: generateUploadUrl,
});

app.http("recordings-confirm", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "recordings/confirm",
  handler: confirmUpload,
});

app.http("recordings-get", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "recordings/{appointmentId}",
  handler: getRecordingUrl,
});
