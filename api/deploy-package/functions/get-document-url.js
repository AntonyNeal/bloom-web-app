"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const storage_blob_1 = require("@azure/storage-blob");
/**
 * Generates a signed URL (SAS token) for accessing blob storage documents.
 * This is required because the storage account has public access disabled.
 */
async function getDocumentUrlHandler(req, context) {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
    };
    if (req.method === "OPTIONS") {
        return { status: 204, headers };
    }
    try {
        // Get the blob URL from query parameter
        const blobUrl = req.query.get("url");
        if (!blobUrl) {
            return {
                status: 400,
                headers,
                jsonBody: { error: "Missing 'url' query parameter" },
            };
        }
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            return {
                status: 500,
                headers,
                jsonBody: { error: "Storage connection string not configured" },
            };
        }
        // Parse account name and key from connection string
        const accountMatch = connectionString.match(/AccountName=([^;]+)/);
        const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
        if (!accountMatch || !keyMatch) {
            return {
                status: 500,
                headers,
                jsonBody: { error: "Invalid storage connection string" },
            };
        }
        const accountName = accountMatch[1];
        const accountKey = keyMatch[1];
        // Parse the blob URL to extract container and blob name
        // URL format: https://<account>.blob.core.windows.net/<container>/<blobpath>
        let containerName;
        let blobName;
        try {
            const url = new URL(blobUrl);
            const pathParts = url.pathname.split('/').filter(p => p);
            if (pathParts.length < 2) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: "Invalid blob URL format" },
                };
            }
            containerName = pathParts[0];
            blobName = pathParts.slice(1).join('/');
        }
        catch {
            return {
                status: 400,
                headers,
                jsonBody: { error: "Invalid URL format" },
            };
        }
        // Check if blob exists
        const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobName);
        const exists = await blobClient.exists();
        if (!exists) {
            return {
                status: 404,
                headers,
                jsonBody: { error: "Document not found" },
            };
        }
        // Generate SAS token (valid for 1 hour for security)
        const sharedKeyCredential = new storage_blob_1.StorageSharedKeyCredential(accountName, accountKey);
        const sasToken = (0, storage_blob_1.generateBlobSASQueryParameters)({
            containerName,
            blobName,
            permissions: storage_blob_1.BlobSASPermissions.parse("r"), // Read only
            startsOn: new Date(),
            expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        }, sharedKeyCredential).toString();
        const signedUrl = `${blobClient.url}?${sasToken}`;
        return {
            status: 200,
            headers,
            jsonBody: { url: signedUrl },
        };
    }
    catch (error) {
        context.error("Error generating document URL:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate document URL";
        return {
            status: 500,
            headers,
            jsonBody: { error: errorMessage },
        };
    }
}
functions_1.app.http("get-document-url", {
    methods: ["GET", "OPTIONS"],
    authLevel: "anonymous",
    route: "get-document-url",
    handler: getDocumentUrlHandler,
});
//# sourceMappingURL=get-document-url.js.map