# CI/CD Setup Guide

This document lists all required GitHub secrets for the CI/CD pipelines.

## Required GitHub Secrets

Navigate to your repository → Settings → Secrets and variables → Actions

### Website Deployment

**Static Web Apps (Frontend):**
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_DEV` - Deployment token for lpa-frontend-dev
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_STAGING` - Deployment token for lpa-frontend-staging
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_PROD` - Deployment token for lpa-frontend-prod

**Function Apps (API):**
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_WEBSITE_DEV` - Publish profile for lpa-functions-dev
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_WEBSITE_STAGING` - Publish profile for lpa-functions-staging
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_WEBSITE_PROD` - Publish profile for lpa-functions-prod

### Bloom Deployment

**Static Web Apps (Frontend):**
- `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_DEV` - Deployment token for lpa-bloom-dev
- `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_STAGING` - Deployment token for lpa-bloom-staging
- `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_PROD` - Deployment token for lpa-bloom-prod

**Function Apps (API):**
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_BLOOM_DEV` - Publish profile for bloom-functions-dev
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_BLOOM_STAGING` - Publish profile for bloom-functions-staging-new
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_BLOOM_PROD` - Publish profile for bloom-functions-prod

**Azure AD Configuration:**
- `AZURE_CLIENT_ID_STAGING` - Azure AD app client ID for staging (MSAL authentication)
- `AZURE_CLIENT_ID_PROD` - Azure AD app client ID for production (MSAL authentication)
- `AZURE_TENANT_ID` - Azure AD tenant ID (shared across environments)
- `BLOOM_API_BASE_URL_STAGING` - Base URL: https://bloom-functions-staging-new.azurewebsites.net
- `BLOOM_API_BASE_URL_PROD` - Base URL: https://bloom-functions-prod.azurewebsites.net

## How to Get Secrets

### Static Web Apps API Tokens
1. Go to Azure Portal → Static Web Apps
2. Select your app (website or bloom)
3. Go to Overview → Manage deployment token
4. Copy the token and add it to GitHub secrets

### Function App Publish Profiles
**All publish profiles have been generated and saved to your temp folder.**

Function App names in Azure:
- **Website API**: lpa-functions-dev, lpa-functions-staging, lpa-functions-prod
- **Bloom API**: bloom-functions-dev, bloom-functions-staging-new, bloom-functions-prod

To get profiles again:
1. Run: `az functionapp deployment list-publishing-profiles --name {app-name} --resource-group rg-lpa-unified --xml`
2. Copy the entire XML content
3. Add to GitHub secrets

### Azure AD Credentials
1. Go to Azure Portal → Azure Active Directory
2. App registrations → Select your app
3. Copy the Application (client) ID
4. Copy the Directory (tenant) ID
5. Add both to GitHub secrets

## Workflow Triggers

### Website Deploy (`website-deploy.yml`)
Triggers on changes to:
- `apps/website/**`
- `packages/**`
- The workflow file itself

### Bloom Deploy (`bloom-deploy.yml`)
Triggers on changes to:
- `apps/bloom/src/**`
- `apps/bloom/public/**`
- `apps/bloom/*.ts` or `*.json`
- `packages/**`
- The workflow file itself

### Website API Deploy (`website-api-deploy.yml`)
Triggers on changes to:
- `apps/website/functions/**`
- The workflow file itself
- Manual trigger available

### Bloom API Deploy (`bloom-api-deploy.yml`)
Triggers on changes to:
- `apps/bloom/api/**`
- The workflow file itself
- Manual trigger available

## Testing Workflows

After adding all secrets:

1. Make a change to a specific app (e.g., edit `apps/website/src/App.tsx`)
2. Commit and push to `staging` branch
3. Only the website workflow should trigger (not bloom)
4. Check Actions tab to verify deployment

This path-based triggering ensures independent deployments for each application.
