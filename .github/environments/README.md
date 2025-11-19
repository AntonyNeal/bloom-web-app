# GitHub Environments Setup Guide

This guide explains how to configure GitHub environments for the CI/CD pipeline.

## Required GitHub Environments

Create the following environments in your GitHub repository:

### 1. Development Environment

- **Name**: `development`
- **Environment secrets**:
  - `AZURE_STATIC_WEB_APPS_API_TOKEN_DEVELOPMENT`
  - `VITE_GA_MEASUREMENT_ID`
  - `VITE_GOOGLE_ADS_ID`
  - `VITE_GOOGLE_ADS_CONVERSION_LABEL`
  - `VITE_OPENAI_API_KEY`
  - `VITE_CHAT_ENABLED`
  - `VITE_ASSESSMENT_ENABLED`
  - `VITE_GTM_ID`

### 2. Staging Environment

- **Name**: `staging`
- **Environment secrets**:
  - `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING`
  - `VITE_GA_MEASUREMENT_ID`
  - `VITE_GOOGLE_ADS_ID`
  - `VITE_GOOGLE_ADS_CONVERSION_LABEL`
  - `VITE_OPENAI_API_KEY`
  - `VITE_CHAT_ENABLED`
  - `VITE_ASSESSMENT_ENABLED`
  - `VITE_GTM_ID`

### 3. Production Environment

- **Name**: `production`
- **Environment secrets**:
  - `AZURE_STATIC_WEB_APPS_API_TOKEN_PRODUCTION`
  - `VITE_GA_MEASUREMENT_ID`
  - `VITE_GOOGLE_ADS_ID`
  - `VITE_GOOGLE_ADS_CONVERSION_LABEL`
  - `VITE_OPENAI_API_KEY`
  - `VITE_CHAT_ENABLED`
  - `VITE_ASSESSMENT_ENABLED`
  - `VITE_GTM_ID`

## Branch-to-Environment Mapping

- `develop` branch → `development` environment
- `staging` branch → `staging` environment
- `main` branch → `production` environment

## Environment Protection Rules (Recommended)

For production environment, add these protection rules:

- **Required reviewers**: At least 1 reviewer
- **Wait timer**: 0 minutes (or add delay if needed)
- **Allow force pushes**: Disabled
- **Allow deletions**: Disabled

## How to Create Environments

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Scroll down to **Environments** in the left sidebar
4. Click **New environment**
5. Enter the environment name (development, staging, production)
6. Add the required secrets
7. Configure protection rules (for production)

## Testing the Setup

After setting up environments:

1. Push to `develop` branch → Should deploy to development environment
2. Push to `staging` branch → Should run tests and deploy to staging environment
3. Push to `main` branch → Should run tests and deploy to production environment

## Troubleshooting

- **Environment not found**: Make sure the environment names match exactly (case-sensitive)
- **Secrets not available**: Check that secrets are added to the correct environment
- **Deployment fails**: Verify the Azure Static Web Apps API tokens are correct
