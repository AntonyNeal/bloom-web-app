# Test Practitioner Setup Guide

This guide explains how to configure a test practitioner with a real identity in both Bloom and Halaxy systems.

## Overview

Bloom uses **Dr. Sarah Chen** as the primary test practitioner. To enable real Halaxy sync, you need to link this test account to actual Halaxy credentials.

## Current Test Practitioner

| Field | Value |
|-------|-------|
| **Bloom ID** | `A1B2C3D4-E5F6-7890-ABCD-EF1234567890` |
| **Name** | Dr. Sarah Chen |
| **Email** | sarah.chen@bloom.health |
| **AHPRA** | PSY0012345 |
| **Halaxy Practitioner ID** | `HAL-PRAC-001` (placeholder) |
| **Halaxy Role ID** | `HAL-PR-001` (placeholder) |

## Step 1: Get Halaxy API Credentials

1. Log into the [Halaxy Developer Portal](https://developer.halaxy.com/)
2. Create a new application or use an existing one
3. Note these values:
   - **Client ID**
   - **Client Secret**
   - **Refresh Token** (obtained via OAuth flow)
   - **Healthcare Service ID** (your practice ID)

## Step 2: Get Your Practitioner ID from Halaxy

Use the Halaxy FHIR API to find your practitioner ID:

```bash
# Get access token
curl -X POST https://au-api.halaxy.com/api/oauth/token \
  -d "grant_type=refresh_token&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&refresh_token=YOUR_REFRESH_TOKEN"

# List practitioners
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://au-api.halaxy.com/fhir/Practitioner
```

The response will include practitioner IDs like `Practitioner/12345`.

## Step 3: Configure Local Environment

Create `.env` file in `services/halaxy-sync-worker/`:

```env
# Environment
ENVIRONMENT=development

# Database
SQL_CONNECTION_STRING=Server=tcp:your-server.database.windows.net,1433;...

# Halaxy Credentials
HALAXY_CLIENT_ID=your-client-id
HALAXY_CLIENT_SECRET=your-client-secret
HALAXY_REFRESH_TOKEN=your-refresh-token
HALAXY_HEALTHCARE_SERVICE_ID=your-healthcare-service-id

# Real Practitioner ID from Halaxy
# This replaces the placeholder HAL-PRAC-001
HALAXY_PRACTITIONER_ID=12345
```

## Step 4: Update Database Seed

Update the seed data to use real Halaxy IDs. Edit `api/src/functions/seed-database.ts`:

```typescript
// Replace placeholder with real Halaxy ID
const HALAXY_PRACTITIONER_ID = process.env.HALAXY_PRACTITIONER_ID || 'HAL-PRAC-001';
const HALAXY_ROLE_ID = process.env.HALAXY_ROLE_ID || 'HAL-PR-001';

// In the INSERT statement:
await pool.request()
  .input('id', sql.UniqueIdentifier, PRACTITIONER_ID)
  .query(`
    INSERT INTO practitioners (
      id, halaxy_practitioner_id, halaxy_practitioner_role_id,
      ...
    ) VALUES (
      @id, '${HALAXY_PRACTITIONER_ID}', '${HALAXY_ROLE_ID}',
      ...
    )
  `);
```

## Step 5: Configure GitHub Secrets

For CI/CD deployment, add these secrets to your GitHub repository:

### Azure Credentials (for Container Apps deployment)
- `AZURE_CLIENT_ID` - Service Principal client ID
- `AZURE_TENANT_ID` - Azure AD tenant ID  
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID

### Halaxy Credentials (for sync worker)
- `HALAXY_CLIENT_ID`
- `HALAXY_CLIENT_SECRET`
- `HALAXY_REFRESH_TOKEN`
- `HALAXY_HEALTHCARE_SERVICE_ID`

## Step 6: Run Sync

Once configured, the Halaxy Sync Worker will:

1. Fetch practitioner data from Halaxy FHIR API
2. Match to Dr. Sarah Chen by `halaxy_practitioner_id`
3. Sync patients (clients) and appointments (sessions)
4. Update Bloom database with real Halaxy data

## Testing Without Halaxy

If you don't have Halaxy credentials yet, the system works with mock data:

```bash
# Seed mock data
curl -X POST http://localhost:7071/api/admin/seed

# The dashboard will show mock data for Dr. Sarah Chen
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  Halaxy PMS     │────▶│  Sync Worker     │────▶│  Bloom DB       │
│  (Source)       │     │  (Container App) │     │  (Azure SQL)    │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
   Practitioner           Maps Halaxy IDs          Dr. Sarah Chen
   ID: 12345              to Bloom GUIDs           ID: A1B2C3D4-...
```

## Troubleshooting

### Sync Not Working
1. Check Halaxy credentials are valid
2. Verify practitioner ID exists in Halaxy
3. Check worker logs in Azure Container Apps

### Dashboard Shows No Data
1. Run the seed endpoint first
2. Verify database connection string
3. Check practitioner ID matches in requests

### CI Failing
If GitHub Actions fail with "Azure credentials not configured":
- The TypeScript build still succeeds
- Docker image push is skipped
- Add Azure secrets to enable full deployment
