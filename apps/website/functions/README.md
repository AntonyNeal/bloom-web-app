# Life Psychology Australia - Application Functions

Azure Functions for processing psychologist job applications.

## Functions

### Submit Application (`/applications/submit`)

- **Method**: POST
- **Auth**: Function key required
- **Purpose**: Process and validate psychologist application submissions
- **Features**:
  - Comprehensive validation of all required fields
  - AHPRA qualification gate enforcement
  - File upload handling to Azure Blob Storage
  - Email notifications (placeholder for SendGrid integration)
  - Application ID generation

### Get SAS Token (`/applications/get-sas-token`)

- **Method**: GET
- **Auth**: Function key required
- **Purpose**: Generate secure SAS tokens for file uploads
- **Query Parameters**:
  - `fileName`: Name of the file to upload
  - `fileType`: MIME type of the file (optional, validated)
- **Features**:
  - 15-minute expiry tokens
  - Write-only permissions
  - HTTPS-only access
  - File type validation

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables in `local.settings.json`:

   ```json
   {
     "AZURE_STORAGE_CONNECTION_STRING": "your-storage-connection-string",
     "SENDGRID_API_KEY": "your-sendgrid-api-key",
     "ADMIN_EMAIL": "admin@life-psychology.com.au"
   }
   ```

3. Build the functions:

   ```bash
   npm run build
   ```

4. Start locally:
   ```bash
   npm start
   ```

## Deployment

Deploy to Azure Functions using Azure CLI or VS Code extension:

```bash
func azure functionapp publish <your-function-app-name>
```

## File Upload Flow

1. Frontend requests SAS token: `GET /applications/get-sas-token?fileName=cv.pdf&fileType=application/pdf`
2. Function returns SAS URL for secure upload
3. Frontend uploads file directly to Azure Blob Storage using SAS URL
4. Frontend submits application with file references
5. Submit function validates and processes the application

## Validation Rules

- **Qualification Gate**: Must be Clinical Psychologist, 8+ years AHPRA registration, or PhD
- **Required Fields**: All personal info, AHPRA details, experience, references, consents
- **File Types**: PDF, DOC, DOCX, JPG, PNG (max 10MB for CV, 5MB for certificates)
- **Email Notifications**: Admin notified of new applications (SendGrid integration needed)

## Security

- Function-level authentication required
- SAS tokens expire in 15 minutes
- HTTPS-only file uploads
- Input validation on all endpoints
- File type restrictions enforced
