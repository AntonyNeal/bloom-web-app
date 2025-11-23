# LPA Website Monorepo Setup Complete ✅

The LPA website has been successfully integrated into the monorepo CI/CD workflow.

## 📁 Structure Created

```
apps/website/
├── src/
│   ├── pages/
│   │   ├── HomePage.tsx       # Main landing page
│   │   ├── AboutPage.tsx      # About page
│   │   └── NotFoundPage.tsx   # 404 page
│   ├── App.tsx                # React Router setup
│   ├── main.tsx               # Entry point
│   ├── index.css              # Global styles
│   └── vite-env.d.ts          # TypeScript definitions
├── functions/
│   └── src/
│       ├── functions/
│       │   └── health.ts      # Health check endpoint
│       └── index.ts           # Function registration
├── public/                    # Static assets (to be added)
├── index.html                 # HTML template
├── package.json               # Dependencies
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript config
├── tailwind.config.js         # Tailwind CSS config
├── postcss.config.js          # PostCSS config
├── .env.example               # Environment variables template
├── .env.production            # Production environment
├── .gitignore
└── README.md
```

## 🚀 CI/CD Configuration

The monorepo workflow (`.github/workflows/monorepo-deploy.yml`) is already configured to build and deploy the LPA website:

### Deployment Targets

| Environment | Branch | Frontend App | API App |
|------------|--------|--------------|---------|
| Development | `develop` | `lpa-website-dev` | `lpa-website-functions-dev` |
| Staging | `staging` | `lpa-website-staging` | `lpa-website-functions-staging` |
| Production | `main` | `lpa-website-prod` | `lpa-website-functions-prod` |

### Build Commands

The following commands have been added to the root `package.json`:

```bash
# Build commands
pnpm build:bloom       # Build Bloom Portal
pnpm build:website     # Build LPA Website

# Development commands
pnpm dev:bloom         # Run Bloom Portal dev server
pnpm dev:website       # Run LPA Website dev server

# Lint commands
pnpm lint:bloom        # Lint Bloom Portal
pnpm lint:website      # Lint LPA Website
```

## 📋 Required GitHub Secrets

To enable deployments, configure these secrets in your GitHub repository:

### Frontend (Static Web Apps)
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_DEV`
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_STAGING`
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_PROD`

### API (Azure Functions)
- `WEBSITE_DEV_API_PUBLISH_PROFILE`
- `WEBSITE_STAGING_API_PUBLISH_PROFILE`
- `WEBSITE_PROD_API_PUBLISH_PROFILE`

### Getting Deployment Tokens

```powershell
# Static Web App tokens
az staticwebapp secrets list --name lpa-website-dev --query "properties.apiKey" -o tsv
az staticwebapp secrets list --name lpa-website-staging --query "properties.apiKey" -o tsv
az staticwebapp secrets list --name lpa-website-prod --query "properties.apiKey" -o tsv

# Function App publish profiles
az functionapp deployment list-publishing-profiles --name lpa-website-functions-dev --resource-group rg-lpa-unified --xml
az functionapp deployment list-publishing-profiles --name lpa-website-functions-staging --resource-group rg-lpa-unified --xml
az functionapp deployment list-publishing-profiles --name lpa-website-functions-prod --resource-group rg-lpa-unified --xml
```

## 🔄 Workflow Triggers

The website will be built and deployed when:

1. **Automatic Triggers:**
   - Changes to `apps/website/src/**`
   - Changes to `apps/website/functions/**`
   - Changes to `packages/**` (shared code)
   - Changes to `.github/workflows/**`
   - Push to `main`, `staging`, or `develop` branches

2. **Manual Trigger:**
   - GitHub Actions → Monorepo Deploy workflow
   - Select environment
   - Check "Deploy Website"
   - Run workflow

## 🛠️ Local Development

### Frontend

```bash
# Install dependencies (from root)
pnpm install

# Start website development server
cd apps/website
pnpm dev

# Runs on http://localhost:3001
```

### API Functions

```bash
# Start Azure Functions
cd apps/website/functions
pnpm start

# Runs on http://localhost:7072
```

### Environment Variables

Copy `.env.example` to `.env.development`:

```bash
cd apps/website
cp .env.example .env.development
```

## 📦 Dependencies Installed

### Frontend
- React 18 + React DOM
- React Router DOM
- TypeScript
- Vite
- Tailwind CSS
- Axios (for API calls)

### API
- Azure Functions v4
- TypeScript

## ✅ Next Steps

1. **Create Azure Resources** (if not already created):
   ```powershell
   # Static Web Apps
   az staticwebapp create --name lpa-website-dev --resource-group rg-lpa-unified --location eastasia --sku Free
   az staticwebapp create --name lpa-website-staging --resource-group rg-lpa-unified --location eastasia --sku Standard
   az staticwebapp create --name lpa-website-prod --resource-group rg-lpa-unified --location eastasia --sku Standard

   # Function Apps
   az functionapp create --name lpa-website-functions-dev --resource-group rg-lpa-unified --consumption-plan-location eastasia --runtime node --runtime-version 20 --functions-version 4 --storage-account lpaunified
   az functionapp create --name lpa-website-functions-staging --resource-group rg-lpa-unified --consumption-plan-location eastasia --runtime node --runtime-version 20 --functions-version 4 --storage-account lpaunified
   az functionapp create --name lpa-website-functions-prod --resource-group rg-lpa-unified --consumption-plan-location eastasia --runtime node --runtime-version 20 --functions-version 4 --storage-account lpaunified
   ```

2. **Configure GitHub Secrets** with the deployment tokens and publish profiles

3. **Install dependencies**:
   ```bash
   # Install pnpm if not already installed
   npm install -g pnpm

   # Install root dependencies
   pnpm install

   # Install website dependencies
   cd apps/website
   pnpm install

   # Install website API dependencies
   cd functions
   pnpm install
   ```

4. **Test local build**:
   ```bash
   cd apps/website
   pnpm build
   # Should create dist/ folder with index.html
   ```

5. **Commit and push** to trigger deployment:
   ```bash
   git add .
   git commit -m "feat: add LPA website to monorepo"
   git push origin develop
   ```

6. **Monitor deployment** in GitHub Actions

## 🎨 Customization

The current website is a basic template with:
- Home page with welcome content
- About page
- 404 page
- Tailwind CSS styling
- React Router navigation

You can now:
- Add more pages to `src/pages/`
- Add components to `src/components/`
- Customize styles in `tailwind.config.js`
- Add API endpoints to `functions/src/functions/`
- Configure environment-specific variables in `.env.*` files

## 📚 Documentation

- Website README: `apps/website/README.md`
- Workflow README: `.github/workflows/README.md`
- Monorepo Migration Plan: `docs/archived-reports/MONOREPO_MIGRATION_PLAN.md`

---

## Status: ✅ Ready for Deployment

The LPA website is now integrated into the monorepo and ready for deployment once:
1. Azure resources are created
2. GitHub secrets are configured
3. Dependencies are installed
4. Changes are committed and pushed
