# Quick Deploy to Azure Static Web Apps - Proto-Bloom

## Option 1: Using Azure Portal (Recommended - 5 minutes)

### Step 1: Create Static Web App

1. Go to Azure Portal: https://portal.azure.com
2. Click "Create a resource"
3. Search for "Static Web App"
4. Click "Create"

### Step 2: Configure Settings

**Basics:**
- Subscription: Azure subscription 1
- Resource Group: `lpa-resources`
- Name: `lpa-proto-bloom-staging`
- Plan type: Free
- Region: East Asia (or nearest available)
- Deployment source: GitHub

**GitHub Configuration:**
- Click "Sign in with GitHub"
- Organization: AntonyNeal
- Repository: bloom-web-app
- Branch: staging

**Build Details:**
- Build Presets: Custom
- App location: `/`
- Api location: `api`
- Output location: `dist`

### Step 3: Review + Create

- Click "Review + create"
- Click "Create"

### Step 4: Wait for Deployment

Azure will:
1. Create the Static Web App resource
2. Add a GitHub Actions workflow to your repo
3. Automatically build and deploy your app

This takes about 3-5 minutes.

### Step 5: Get Your URL

Once deployed, you'll get a URL like:
`https://lpa-proto-bloom-staging.azurestaticapps.net`

---

## Option 2: Using Azure CLI (Current Issues)

The existing `lpa-frontend-staging` is already linked to GitHub, so we'd need to either:
1. Unlink it from GitHub first, OR
2. Create a new Static Web App (which the portal does easily)

---

## After Deployment

Your Proto-Bloom app will be live at:
- Home: `https://your-app.azurestaticapps.net/`
- Application Form: `https://your-app.azurestaticapps.net/#/join-us`
- Admin Portal: `https://your-app.azurestaticapps.net/#/admin`

### Automatic Updates

Every time you push to the `staging` branch, GitHub Actions will automatically rebuild and redeploy your app!

---

## Next Step: Deploy Backend API

Once your frontend is deployed, follow `DEPLOYMENT.md` to deploy the Azure Functions backend for full functionality.

**For now**, the frontend will work but API calls will fail (since the backend isn't deployed yet).

---

**Current Status:**
✅ Code committed to GitHub  
✅ Build successful (dist/ folder created)  
⏳ Need to create Static Web App in Azure Portal  
⏳ Then deploy Azure Functions backend
