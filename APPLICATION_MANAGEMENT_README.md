# Bloom Application Management System

> **Last Updated**: November 2025
> **Status**: Production with Azure AD Authentication

## Overview

The Bloom Application Management System is the onboarding solution for Life Psychology Australia's Bloom platform. It enables psychologists to submit applications online and provides an authenticated admin portal for reviewing and managing these applications.

## Features

### ✅ Practitioner Application Form (`/join-us`)

- **Personal Information**: Name, email, phone
- **Professional Details**: AHPRA registration number, years of experience
- **Cover Letter**: Free-form text to explain interest
- **File Uploads**: CV/Resume, AHPRA Certificate, Professional Photo
- **Validation**: Required field checking, file type validation
- **Success Feedback**: Toast notifications and success screen

### ✅ Admin Review Portal (`/admin/*`) - Protected by Azure AD

- **Dashboard** (`/admin`): Quick overview of application counts by status
- **Application List** (`/admin/applications`): View all submitted applications with status badges
- **Detail View** (`/admin/applications/:id`): Click any application to see full details
- **Status Management**: Mark as Reviewing, Approve, or Reject
- **Document Access**: Direct links to uploaded files in Azure Blob Storage
- **Real-time Updates**: Status changes persist immediately to database

### ✅ A/B Testing Dashboard (`/admin/ab-tests`) - Protected

- Real-time variant performance tracking
- Statistical significance calculations
- CSV export for offline analysis

### ✅ Smoke Test Dashboard (`/admin/smoke-tests`) - Protected

- System health monitoring
- API endpoint status checks

### ✅ Practitioner Dashboard (`/bloom-home`) - Protected

- Practice overview with blossom tree visualization
- Business metrics and growth tracking (`/business-coach`)

### ✅ Backend API (Azure Functions v4)

**Core Endpoints:**
- **GET /api/applications**: List all applications
- **GET /api/applications/{id}**: Get single application details
- **POST /api/applications**: Submit new application
- **PUT /api/applications/{id}**: Update application status
- **POST /api/upload**: Upload files to Azure Blob Storage

**Analytics & Monitoring:**
- **GET /api/ab-test**: A/B test configuration
- **POST /api/track-ab-test**: Track A/B test events
- **GET /api/smoke-test**: System health check
- **GET /api/health**: API health endpoint

**Integrations:**
- **POST /api/halaxy-webhook**: Halaxy practice management webhook
- **/api/practitioner-dashboard**: Dashboard data for authenticated practitioners

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, shadcn/ui components
- **Backend**: Azure Functions v4 (Node.js/TypeScript)
- **Database**: Azure SQL Database
- **Storage**: Azure Blob Storage
- **Auth**: Azure AD B2C (MSAL)
- **Design System**: shadcn/ui (sage green/terracotta color scheme)

## Project Structure

```
bloom-web-app/
├── api/                          # Azure Functions backend (v4 programming model)
│   ├── src/
│   │   └── functions/           # Function endpoints
│   │       ├── applications.ts  # Application CRUD
│   │       ├── upload.ts        # File upload to Blob Storage
│   │       ├── ab-test.ts       # A/B test management
│   │       ├── track-ab-test.ts # A/B tracking events
│   │       ├── smoke-test.ts    # Health checks
│   │       ├── health.ts        # API health endpoint
│   │       ├── practitioner-dashboard.ts
│   │       ├── halaxy-sync-timer.ts
│   │       ├── halaxy-webhook.ts
│   │       └── dbvc.ts          # DB version control
│   ├── migrations/              # Database migrations
│   ├── package.json
│   ├── tsconfig.json
│   ├── host.json
│   └── local.settings.json
├── src/
│   ├── pages/
│   │   ├── JoinUs.tsx           # Application form page
│   │   ├── BloomHomepage.tsx    # Practitioner dashboard
│   │   ├── BusinessCoach.tsx    # Business analytics
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── ApplicationManagement.tsx
│   │       ├── ApplicationDetail.tsx
│   │       ├── ABTestDashboard.tsx
│   │       └── SmokeTestDashboard.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── auth/                # Authentication components
│   │   └── common/              # Shared components (ProtectedRoute, etc.)
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── useAuth.ts           # Authentication hook
│   ├── config/
│   │   └── api.ts               # API endpoint configuration
│   └── App.tsx                  # Main app with routing
├── schema.sql                    # Database schema
├── DEPLOYMENT.md                 # Deployment guide
└── README.md
```

## Database Schema

### Applications Table

```sql
CREATE TABLE applications (
  id INT PRIMARY KEY IDENTITY(1,1),
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  phone NVARCHAR(20),
  ahpra_registration NVARCHAR(50) NOT NULL,
  specializations NVARCHAR(MAX),        -- JSON array
  experience_years INT,
  cv_url NVARCHAR(500),
  certificate_url NVARCHAR(500),
  photo_url NVARCHAR(500),
  cover_letter TEXT,
  status NVARCHAR(20) DEFAULT 'submitted',  -- submitted, reviewing, approved, rejected
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  reviewed_by NVARCHAR(100),
  reviewed_at DATETIME2
);
```

## Getting Started

### Prerequisites

- Node.js 18+
- Azure CLI
- Azure Functions Core Tools
- Azure subscription with resources:
  - SQL Database
  - Storage Account
  - Function App
  - Static Web App

### Local Development

1. **Clone the repository**

   ```powershell
   git clone https://github.com/AntonyNeal/bloom-web-app.git
   cd bloom-web-app
   ```

2. **Install frontend dependencies**

   ```powershell
   npm install
   ```

3. **Install backend dependencies**

   ```powershell
   cd api
   npm install
   cd ..
   ```

4. **Configure local settings**

   Edit `api/local.settings.json`:

   ```json
   {
     "Values": {
       "SQL_SERVER": "your-server.database.windows.net",
       "SQL_DATABASE": "your-database",
       "SQL_USER": "your-username",
       "SQL_PASSWORD": "your-password",
       "AZURE_STORAGE_CONNECTION_STRING": "your-connection-string"
     }
   }
   ```

5. **Run database migrations**

   ```powershell
   az sql db query --server your-server --database your-db --file schema.sql
   ```

6. **Start the backend** (in `api/` folder)

   ```powershell
   cd api
   func start
   ```

7. **Start the frontend** (in new terminal)

   ```powershell
   npm run dev
   ```

8. **Access the app**
   - Frontend: http://localhost:5173
   - Application Form: http://localhost:5173/join-us
   - Admin Portal: http://localhost:5173/admin (requires Azure AD login)
   - Practitioner Dashboard: http://localhost:5173/bloom-home (requires Azure AD login)
   - API: http://localhost:7071/api

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

**Quick Deploy:**

```powershell
# Deploy backend (use environment-specific function app name)
cd api
# Dev: func azure functionapp publish bloom-functions-dev
# Staging: func azure functionapp publish bloom-functions-staging-new
# Prod: func azure functionapp publish bloom-platform-functions-v2

# Deploy frontend (via GitHub Actions - push to appropriate branch)
git add .
git commit -m "feat: application management system"
git push origin develop  # or staging/main for respective environments
```

## Usage

### Submitting an Application

1. Navigate to `/join-us`
2. Fill in all required fields (marked with \*)
3. Upload required files:
   - CV/Resume (PDF, DOC, DOCX)
   - AHPRA Certificate (PDF, JPG, PNG)
   - Professional Photo (optional - JPG, PNG)
4. Click "Submit Application"
5. Wait for success confirmation

### Reviewing Applications (Admin)

1. Navigate to `/admin`
2. View dashboard showing application counts by status
3. Click any application card to view full details
4. Review uploaded documents by clicking links
5. Change status using action buttons:
   - **Mark as Reviewing**: Move from submitted to under review
   - **Approve**: Accept the application
   - **Reject**: Decline the application
6. Status changes are saved immediately

## Application Statuses

- **submitted**: Initial state when application is received
- **reviewing**: Admin is actively reviewing the application
- **approved**: Application accepted
- **rejected**: Application declined

## API Endpoints

### List Applications

```http
GET /api/applications
Response: Array<Application>
```

### Get Single Application

```http
GET /api/applications/{id}
Response: Application
```

### Create Application

```http
POST /api/applications
Body: {
  first_name, last_name, email, phone,
  ahpra_registration, experience_years,
  cover_letter, cv_url, certificate_url, photo_url
}
Response: Application
```

### Update Application Status

```http
PUT /api/applications/{id}
Body: { status, reviewed_by }
Response: Application
```

### Upload File

```http
POST /api/upload?type={cv|certificate|photo}
Body: multipart/form-data
Response: { url, fileName, size }
```

## Security Notes

✅ **Implemented Security Features:**

- Azure AD B2C authentication for admin/practitioner portals
- ProtectedRoute component with useAuth hook
- MSAL (Microsoft Authentication Library) integration
- Private blob storage (no public access)
- SQL injection protection (parameterized queries)
- File type validation
- CORS configured per environment
- Input validation with Zod

⚠️ **Pending Improvements** (deferred):

- Rate limiting on API endpoints
- Email verification for applicants
- More restrictive CORS policies
- Application Insights monitoring enhancements

## File Upload Limits

- **CV/Resume**: PDF, DOC, DOCX (max 10MB)
- **AHPRA Certificate**: PDF, JPG, PNG (max 5MB)
- **Professional Photo**: JPG, PNG (max 2MB)

Files are stored in Azure Blob Storage with private access. URLs are pre-signed for secure access.

## Environment Variables

### Backend (Azure Functions)

```env
SQL_SERVER=lpa-sql-server.database.windows.net
SQL_DATABASE=lpa-bloom-db
SQL_USER=admin_username
SQL_PASSWORD=secure_password
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
```

### Frontend

Configured in `src/config/api.ts`:

- Development: `http://localhost:7071/api` (local) or `https://bloom-functions-dev.azurewebsites.net/api`
- Staging: `https://bloom-functions-staging-new.azurewebsites.net/api`
- Production: `https://bloom-platform-functions-v2.azurewebsites.net/api`

## Monitoring

### Check Application Count

```powershell
az sql db query \
  --server lpa-sql-server \
  --database lpa-bloom-db \
  --query "SELECT status, COUNT(*) as count FROM applications GROUP BY status"
```

### View Recent Uploads

```powershell
az storage blob list \
  --container-name applications \
  --query "[?properties.createdOn > '2025-01-01'].{name:name, size:properties.contentLength}" \
  --output table
```

### Function Logs

```powershell
# Use environment-specific function app name
az functionapp log tail \
  --name bloom-platform-functions-v2 \
  --resource-group rg-lpa-unified
```

## Troubleshooting

### Issue: "Cannot connect to database"

- Check SQL firewall rules allow your IP
- Verify connection string in `local.settings.json`
- Test connection: `az sql db show-connection-string`

### Issue: "File upload fails"

- Verify storage connection string
- Check blob container exists and has correct permissions
- Ensure file size within limits

### Issue: "CORS error"

- Add your origin to Function App CORS settings
- Check `Host.CORS` in `local.settings.json` for local dev

## Future Enhancements (Phase 2+)

- [ ] Email notifications to applicants
- [ ] Admin authentication with Azure AD B2C
- [ ] Multi-step application wizard
- [ ] AHPRA verification API integration
- [ ] Application analytics dashboard
- [ ] Automated status change workflows
- [ ] Template-based email responses
- [ ] Interview scheduling integration
- [ ] Document version control

## Contributing

This is an internal project for Life Psychology Australia. For questions or issues, contact the development team.

## License

Proprietary - Life Psychology Australia © 2025

---

**Built with ❤️ for Life Psychology Australia**
