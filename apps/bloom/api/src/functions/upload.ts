import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

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

    const url = blockBlobClient.url;

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
