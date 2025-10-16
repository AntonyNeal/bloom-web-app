import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import * as multipart from "parse-multipart";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  // Set CORS headers
  context.res = {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    context.res.status = 200;
    return;
  }

  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    
    if (!connectionString) {
      context.res = {
        ...context.res,
        status: 500,
        body: { error: "Storage connection string not configured" },
      };
      return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient("applications");

    // Ensure container exists
    await containerClient.createIfNotExists();

    // Parse multipart form data
    const contentType = req.headers["content-type"] || "";
    
    if (!contentType.includes("multipart/form-data")) {
      context.res = {
        ...context.res,
        status: 400,
        body: { error: "Content-Type must be multipart/form-data" },
      };
      return;
    }

    const boundary = multipart.getBoundary(contentType);
    const parts = multipart.Parse(Buffer.from(req.body), boundary);

    if (!parts || parts.length === 0) {
      context.res = { 
        ...context.res,
        status: 400, 
        body: { error: "No file uploaded" } 
      };
      return;
    }

    const file = parts[0];
    const fileType = req.query.type || "document"; // cv, certificate, photo
    const timestamp = Date.now();
    const sanitizedFilename = file.filename?.replace(/[^a-zA-Z0-9.-]/g, "_") || "file";
    const fileName = `${fileType}/${timestamp}-${sanitizedFilename}`;

    context.log(`Uploading file: ${fileName}`);

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    // Set content type based on file extension
    const contentTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };
    
    const ext = sanitizedFilename.split(".").pop()?.toLowerCase() || "";
    const blobContentType = contentTypeMap[ext] || "application/octet-stream";

    await blockBlobClient.upload(file.data, file.data.length, {
      blobHTTPHeaders: {
        blobContentType: blobContentType,
      },
    });

    const fileUrl = blockBlobClient.url;

    context.res = {
      ...context.res,
      status: 200,
      body: { 
        url: fileUrl, 
        fileName: fileName,
        size: file.data.length,
      },
    };
  } catch (error: any) {
    context.log.error("Upload error:", error);
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Upload failed", details: error.message },
    };
  }
};

export default httpTrigger;
