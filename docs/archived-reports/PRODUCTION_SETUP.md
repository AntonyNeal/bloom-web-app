# Production Instance Setup Guide

## Prerequisites
- Azure subscription with appropriate permissions
- GitHub repository access
- Current staging instance working correctly

---

## Step 1: Create Production Static Web App (Azure Portal)

### 1.1 Create the Resource

1. Go to **Azure Portal**: https://portal.azure.com
2. Click **"Create a resource"**
3. Search for **"Static Web App"**
4. Click **"Create"**

### 1.2 Configure Basic Settings

**Basics Tab:**
- **Subscription**: Azure subscription 1
- **Resource Group**: `lpa-resources` (same as staging)
- **Name**: `lpa-frontend-prod`
- **Plan type**: `Standard` (for production features)
- **Region**: `East Asia` (or your preferred region)
- **Deployment source**: `GitHub`

### 1.3 GitHub Configuration

**IMPORTANT: Choose "Other" for deployment source initially**

We already have a custom GitHub Actions workflow, so:
- Select **"Other"** as the deployment source
- This prevents Azure from creating a duplicate workflow file

### 1.4 Review + Create

- Click **"Review + create"**
- Review the configuration
- Click **"Create"**
- Wait for deployment to complete (2-3 minutes)

---

## Step 2: Get Deployment Token

### 2.1 Navigate to Your Static Web App

1. Once created, go to your Static Web App resource
2. In the left menu, click **"Overview"**
3. Click **"Manage deployment token"** (top toolbar)
4. Copy the deployment token (looks like: `abc123...xyz`)

**IMPORTANT**: Save this token securely - you'll need it in the next step

---

## Step 3: Configure GitHub Secrets

### 3.1 Create Production Environment in GitHub

1. Go to your GitHub repository: https://github.com/AntonyNeal/bloom-web-app
2. Click **Settings** → **Environments**
3. Click **"New environment"**
4. Name: `production`
5. Click **"Configure environment"**

### 3.2 Add Required Reviewers (Optional but Recommended)

Under **"Environment protection rules"**:
- ✅ Enable **"Required reviewers"**
- Add yourself or team members who must approve production deployments
- This adds a safety gate before deploying to production

### 3.3 Add Environment Secrets

In the `production` environment, add these secrets:

Click **"Add secret"** for each:

#### Required Secret:
- **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- **Value**: `<paste the deployment token from Step 2.1>`

#### Optional Production Secrets:

These will be injected at build time (check your requirements):

- **VITE_GTM_ID**: Your production Google Tag Manager ID
  - Example: `GTM-XXXXXXX`

- **VITE_GA_MEASUREMENT_ID**: Your production Google Analytics ID
  - Example: `G-XXXXXXXXXX`

- **VITE_GOOGLE_ADS_ID**: Your production Google Ads ID
  - Example: `AW-XXXXXXXXXX`

- **VITE_GOOGLE_ADS_CONVERSION_LABEL**: Your production conversion label
  - Example: `xxxXXXxxx`

- **VITE_OPENAI_API_KEY**: Your production OpenAI API key
  - Example: `sk-proj-xxxxx` (if using OpenAI features)

- **VITE_BOOKING_URL**: Your production booking URL
  - Example: `https://booking.life-psychology.com.au`

- **VITE_CHAT_ENABLED**: Enable chat feature
  - Value: `true` or `false`

- **VITE_ASSESSMENT_ENABLED**: Enable assessment feature
  - Value: `true` or `false`

- **VITE_DEBUG_PANEL**: Enable debug panel (should be false for prod)
  - Value: `false`

---

## Step 4: Verify Workflow Configuration

The workflow is already configured! Check `ci-cd-pipeline.yml`:

```yaml
"refs/heads/main")
  echo "environment=production" >> $GITHUB_OUTPUT
  echo "app-name=lpa-frontend-prod" >> $GITHUB_OUTPUT
  echo "should-deploy=true" >> $GITHUB_OUTPUT
  echo "should-test=true" >> $GITHUB_OUTPUT
  ;;
```

✅ When you push to `main`, it will automatically:
- Build for production environment
- Run full test suite
- Deploy to `lpa-frontend-prod`

---

## Step 5: Deploy to Production

### 5.1 Merge Staging to Main

```powershell
# Make sure you're on staging and it's up to date
git checkout staging
git pull origin staging

# Switch to main
git checkout main
git pull origin main

# Merge staging into main
git merge staging

# Push to trigger deployment
git push origin main
```

### 5.2 Monitor Deployment

1. Go to **GitHub Actions**: https://github.com/AntonyNeal/bloom-web-app/actions
2. Watch the workflow run:
   - ✅ Lint & Format Check
   - ✅ TypeScript Check
   - ✅ Security Scan
   - ✅ Run Test Suite
   - ✅ Build Application
   - ✅ Deploy to production

3. If you enabled required reviewers, you'll need to approve the deployment:
   - The workflow will pause at the deployment step
   - Click **"Review deployments"**
   - Click **"Approve and deploy"**

### 5.3 Verify Production Deployment

Once deployed, your production app will be available at:
- **URL**: `https://lpa-frontend-prod.azurestaticapps.net`

Or if you have a custom domain configured:
- **Custom Domain**: `https://your-domain.com`

---

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Custom Domain

1. In Azure Portal, go to your Static Web App
2. Click **"Custom domains"** in the left menu
3. Click **"+ Add"**
4. Choose **"Custom domain on other DNS"**
5. Enter your domain: `bloom.life-psychology.com.au`
6. Click **"Next"**

### 6.2 Add DNS Records

Add these DNS records to your domain registrar:

**CNAME Record:**
- **Type**: `CNAME`
- **Name**: `bloom` (or `@` for apex domain)
- **Value**: `lpa-frontend-prod.azurestaticapps.net`
- **TTL**: `3600`

**TXT Record (for validation):**
- **Type**: `TXT`
- **Name**: `_dnsauth.bloom` (or `_dnsauth` for apex)
- **Value**: `<validation code from Azure>`
- **TTL**: `3600`

### 6.3 Validate Domain

1. Wait for DNS propagation (5-60 minutes)
2. Click **"Validate"** in Azure Portal
3. Once validated, Azure will generate an SSL certificate
4. Your site will be available at your custom domain with HTTPS

---

## Step 7: Post-Deployment Verification

### 7.1 Smoke Tests

Visit your production site and verify:

- ✅ Homepage loads correctly
- ✅ Navigation works
- ✅ Application form loads
- ✅ No console errors
- ✅ API endpoints are connecting (if backend is deployed)
- ✅ Analytics tracking works (check GTM/GA)
- ✅ SSL certificate is valid
- ✅ Mobile responsive design works

### 7.2 Backend API Configuration

If you have Azure Functions backend, ensure:

1. **Production Function App** exists: `lpa-bloom-functions-prod`
2. **CORS configured** to allow your production domain
3. **Connection strings** point to production database
4. **Environment variables** are set in Function App settings

### 7.3 Database

Ensure production database is separate:
- Server: `lpa-sql-server` (or production-specific server)
- Database: `lpa-bloom-db-prod`
- **DO NOT share database with staging/dev**

---

## Rollback Procedure

If something goes wrong:

### Option 1: Revert Git Commit

```powershell
# Find the commit hash of the last working version
git log --oneline

# Revert to that commit
git revert <commit-hash>

# Push to trigger redeployment
git push origin main
```

### Option 2: Redeploy Previous Version

1. Go to **GitHub Actions**
2. Find a previous successful workflow run
3. Click **"Re-run all jobs"**

### Option 3: Emergency Staging Promotion

```powershell
# Deploy staging build to production (emergency only)
git checkout staging
git pull origin staging
git checkout main
git reset --hard staging
git push origin main --force
```

---

## Monitoring & Maintenance

### Application Insights

1. Enable **Application Insights** in Azure Portal
2. Monitor:
   - Request rates
   - Response times
   - Failure rates
   - Custom events

### Alerts

Set up alerts for:
- High error rates
- Slow response times
- SSL certificate expiration
- Quota limits

### Regular Updates

Production deployment cadence:
- **Hot fixes**: As needed (critical bugs)
- **Minor releases**: Weekly from staging
- **Major releases**: Monthly with full testing

---

## Security Checklist

- ✅ Debug panel disabled (`VITE_DEBUG_PANEL=false`)
- ✅ Production API keys (not dev/staging keys)
- ✅ HTTPS enforced
- ✅ CORS properly configured
- ✅ SQL firewall rules set
- ✅ No secrets in code
- ✅ Content Security Policy configured
- ✅ Rate limiting enabled on API
- ✅ Regular security scans (Trivy in CI/CD)
- ✅ Dependency updates scheduled

---

## Summary

✅ **What's Automated**:
- Build process
- Testing
- Security scanning
- Deployment to Azure
- SSL certificate management

✅ **What You Control**:
- When to merge to main
- Approval gates (if configured)
- Environment variables
- Custom domain configuration

🎉 **Your production deployment is now configured and ready!**

---

## Quick Reference

| Environment | Branch | App Name | URL |
|------------|--------|----------|-----|
| Development | develop | lpa-frontend-dev | https://lpa-frontend-dev.azurestaticapps.net |
| Staging | staging | lpa-frontend-staging | https://lpa-frontend-staging.azurestaticapps.net |
| **Production** | **main** | **lpa-frontend-prod** | **https://lpa-frontend-prod.azurestaticapps.net** |

---

## Need Help?

- Check workflow logs: https://github.com/AntonyNeal/bloom-web-app/actions
- Azure Static Web Apps docs: https://docs.microsoft.com/azure/static-web-apps/
- Contact support if issues persist
