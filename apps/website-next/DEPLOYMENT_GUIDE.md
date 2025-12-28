# Next.js Migration - Azure Static Web Apps Deployment Guide

## Overview

This document outlines the changes needed to deploy the Next.js version of the Life Psychology website to Azure Static Web Apps with hybrid SSR support.

## Current Architecture (Vite)

The current website is a Vite-based SPA deployed to Azure Static Web Apps:
- Build output: `apps/website/dist/`
- Deployment: Static file upload via `Azure/static-web-apps-deploy@v1`
- No server-side rendering

## Target Architecture (Next.js SSR)

The new website uses Next.js with App Router for hybrid rendering:
- Build output: `apps/website-next/.next/standalone/`
- Deployment: Azure SWA hybrid mode with managed backend
- Features: SSR, RSC, API routes, Image optimization

## Changes Required

### 1. CI/CD Workflow Updates

Update `.github/workflows/ci-cd.yml`:

```yaml
build-website-frontend:
  name: 🌐 Build Website Frontend (Next.js)
  runs-on: ubuntu-latest
  needs: [determine-environment, lint, type-check]
  # ... existing conditions ...
  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install Dependencies
      working-directory: apps/website-next
      run: npm ci

    - name: Build Next.js Application
      working-directory: apps/website-next
      run: npm run build
      env:
        NEXT_PUBLIC_SITE_URL: ${{ needs.determine-environment.outputs.website-frontend-url }}
        NEXT_PUBLIC_API_URL: ${{ needs.determine-environment.outputs.bloom-api-url }}

    - name: Upload Artifacts
      uses: actions/upload-artifact@v4
      with:
        name: website-frontend-${{ needs.determine-environment.outputs.environment }}
        path: apps/website-next/.next/standalone/
        if-no-files-found: error
        retention-days: 7

deploy-website-frontend:
  name: 🚀 Deploy Website Frontend (Next.js)
  # ... existing conditions ...
  steps:
    - uses: actions/checkout@v4

    - name: Download Frontend Artifacts
      uses: actions/download-artifact@v4
      with:
        name: website-frontend-${{ needs.determine-environment.outputs.environment }}
        path: dist

    - name: Deploy to Azure Static Web Apps
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets[needs.determine-environment.outputs.website-frontend-secret] }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: 'upload'
        app_location: 'dist'
        skip_app_build: true
        skip_api_build: true
```

### 2. Azure Static Web Apps Configuration

Azure SWA automatically detects Next.js hybrid applications. Key configurations:

- **Managed Backend**: Automatically provisioned for SSR
- **Max App Size**: 250 MB (use standalone output)
- **Node Version**: Specified in package.json engines field

### 3. Environment Variables

Set these in Azure SWA portal under Configuration > Application settings:

```
NEXT_PUBLIC_SITE_URL=https://life-psychology.com.au
NEXT_PUBLIC_API_URL=https://bloom-functions-prod.azurewebsites.net
```

### 4. Routing Configuration

The `next.config.ts` handles routing. The `.swa/health.html` path is automatically excluded to ensure deployment validation succeeds.

## Migration Steps

1. **Phase 1 - Development** (Current)
   - [x] Create Next.js app structure
   - [x] Migrate components
   - [x] Configure standalone output
   - [ ] Test locally with `npm run dev`

2. **Phase 2 - Staging Deployment**
   - [ ] Update CI/CD for Next.js build
   - [ ] Deploy to staging environment
   - [ ] Test SSR functionality
   - [ ] Verify LCP performance

3. **Phase 3 - Production**
   - [ ] A/B test old vs new site
   - [ ] Full production deployment
   - [ ] Monitor performance metrics

## Performance Expectations

After Next.js SSR migration:
- **LCP**: < 2.5s (from ~5s currently)
- **FCP**: < 1.5s
- **CLS**: < 0.1 (already achieved)
- **Lighthouse Score**: 90+ (from 65)

## Rollback Plan

Keep the Vite-based website (`apps/website/`) intact during migration. If issues arise:
1. Update CI/CD to point back to `apps/website/`
2. Redeploy previous version

## References

- [Azure SWA Next.js Hybrid Deployment](https://learn.microsoft.com/en-us/azure/static-web-apps/deploy-nextjs-hybrid)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Azure SWA Next.js Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/nextjs)
