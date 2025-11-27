# Halaxy Sync Service - Environment Variables

The Halaxy credentials are **already configured** in the `lpa-halaxy-webhook-handler` Azure Function App.

## API URL Structure

Halaxy uses different base URLs for different purposes:

- **OAuth Token**: `https://au-api.halaxy.com/oauth2/token`
- **FHIR API**: `https://au-api.halaxy.com/fhir/` (for Patient, Appointment, Practitioner)
- **Main API**: `https://au-api.halaxy.com/main/` (for Organization, etc.)

## Existing Configuration (lpa-halaxy-webhook-handler)

The following environment variables are already set in the existing function app:

```bash
# Halaxy API Credentials (ALREADY CONFIGURED)
HALAXY_CLIENT_ID=6596938477cda9626813ca7454526177
HALAXY_CLIENT_SECRET=****** (stored securely)

# Halaxy API Base URLs
HALAXY_BASE_URL=https://au-api.halaxy.com/main    # Main API endpoints
HALAXY_FHIR_URL=https://au-api.halaxy.com/fhir    # FHIR API endpoints (used by sync service)

# Organization and Practitioner IDs
HALAXY_ORGANIZATION_ID=CL-1023041
HALAXY_PRACTITIONER_ID=1304541
HALAXY_PRACTITIONER_ROLE_ID=PR-2442591
HALAXY_HEALTHCARE_SERVICE_ID=562269
```

## Local Development

For local testing, add to `api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SQL_CONNECTION_STRING": "your_connection_string",
    "HALAXY_CLIENT_ID": "6596938477cda9626813ca7454526177",
    "HALAXY_CLIENT_SECRET": "get_from_azure_portal_or_team",
    "HALAXY_FHIR_URL": "https://au-api.halaxy.com/fhir",
    "HALAXY_ORGANIZATION_ID": "CL-1023041",
    "HALAXY_PRACTITIONER_ID": "1304541",
    "HALAXY_WEBHOOK_SECRET": "your_webhook_secret"
  }
}
```

## Copying Settings from Existing Function

To copy settings from the existing function app:

```bash
# List all settings
az functionapp config appsettings list \
  --name lpa-halaxy-webhook-handler \
  --resource-group rg-lpa-unified \
  --query "[?starts_with(name, 'HALAXY')].{name:name, value:value}" -o table

# Copy to bloom-api-development (if deploying there)
az functionapp config appsettings set \
  --name bloom-api-development \
  --resource-group rg-lpa-unified \
  --settings \
    HALAXY_CLIENT_ID="6596938477cda9626813ca7454526177" \
    HALAXY_FHIR_URL="https://au-api.halaxy.com/fhir" \
    HALAXY_ORGANIZATION_ID="CL-1023041" \
    HALAXY_PRACTITIONER_ID="1304541"
```

## Webhook Configuration in Halaxy

1. Log into Halaxy Admin Panel
2. Go to **Settings** > **Integrations** > **Webhooks**
3. Add a new webhook:
   - **URL**: `https://bloom-api-development.azurewebsites.net/api/halaxy/webhook?code=YOUR_FUNCTION_KEY`
   - **Events**: Select all appointment and patient events
   - **Secret**: Generate and copy to `HALAXY_WEBHOOK_SECRET`
