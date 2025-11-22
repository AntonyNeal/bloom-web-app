# Bloom Web Application

[![CI/CD](https://github.com/AntonyNeal/bloom-web-app/actions/workflows/bloom-cicd.yml/badge.svg)](https://github.com/AntonyNeal/bloom-web-app/actions/workflows/bloom-cicd.yml)

Bloom is Life Psychology Australia's practitioner onboarding platform, enabling psychologists and mental health practitioners to apply to join the Bloom network.

## 🚀 Live Deployments

- **Development**: https://lpa-bloom-dev.azurestaticapps.net
- **Staging**: https://lpa-bloom-staging.azurestaticapps.net
- **Production**: https://lpa-bloom-prod.azurestaticapps.net (https://bloom.life-psychology.com.au)

## 📋 Features

### Application Management System

- **Application Form** (`/join-us`) - Practitioners can submit applications with:
  - Personal information and qualifications
  - AHPRA registration details
  - File uploads (CV, certificates, profile photo)
  - Experience details and cover letter

- **Admin Portal** (`/admin`) - Review and manage applications:
  - Dashboard with application statistics
  - List view with filtering and sorting
  - Detail view for individual applications
  - Status management (submitted, under review, approved, rejected)
  - Document access and download

### Design System

- Custom design system based on Bloom brand guidelines
- Sage green (#8CA88C) and terracotta (#D97757) color palette
- Poppins (headings) and Inter (body) typography
- shadcn/ui component library integration

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **Forms**: React Hook Form + Zod validation

### Backend

- **API**: Azure Functions (Node.js/TypeScript)
- **Database**: Azure SQL Database
- **Storage**: Azure Blob Storage
- **Hosting**: Azure Static Web Apps

## 🏗️ Project Structure

```
bloom-web-app/
├── api/                          # Azure Functions backend
│   ├── applications/            # Application CRUD endpoints
│   └── upload/                  # File upload endpoint
├── src/
│   ├── pages/
│   │   ├── JoinUs.tsx          # Application form
│   │   └── admin/              # Admin portal
│   ├── components/             # Reusable components
│   ├── features/               # Feature modules
│   └── design-system/          # Design tokens
├── schema.sql                   # Database schema
└── .github/workflows/           # CI/CD pipelines
```

## 🔧 Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Azure account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/AntonyNeal/bloom-web-app.git
cd bloom-web-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## 🚢 Deployment

### Multi-Environment CI/CD

The project uses GitHub Actions for automated deployments across three environments:

#### Environment Strategy

- **Development** (`develop` branch)
  - Frontend: https://lpa-bloom-dev.azurestaticapps.net
  - API: https://bloom-functions-dev.azurewebsites.net
  - Auto-deploys on push to `develop`
  - Suitable for active development and testing

- **Staging** (`staging` branch)
  - Frontend: https://lpa-bloom-staging.azurestaticapps.net
  - API: https://bloom-functions-staging-new.azurewebsites.net
  - Auto-deploys on push to `staging`
  - Pre-production testing and UAT

- **Production** (`main` branch)
  - Frontend: https://lpa-bloom-prod.azurestaticapps.net
  - API: https://bloom-platform-functions-v2.azurewebsites.net
  - Auto-deploys on push to `main`
  - Live production environment

#### Deployment Pipeline

The workflow automatically:

1. **Detects Changes**: Uses intelligent path filtering to identify frontend/API/infrastructure changes
2. **Quality Checks**: Runs parallel lint and type-check validations
3. **Builds**: Compiles only changed components (frontend with Vite, API with TypeScript)
4. **Deploys**: Pushes to environment-specific Azure resources
5. **Reports**: Provides comprehensive deployment summary

#### Manual Deployments

Use GitHub Actions UI to manually trigger deployments:

1. Go to Actions → Bloom CI/CD
2. Click "Run workflow"
3. Select branch and optionally specify target environment
4. Click "Run workflow"

### Setup Requirements

See [CICD_SETUP_GUIDE.md](./CICD_SETUP_GUIDE.md) for complete configuration instructions.
See [CICD_CONFIGURATION_COMPLETE.md](./CICD_CONFIGURATION_COMPLETE.md) for current setup status.

## 🔐 Environment Configuration

### Required GitHub Secrets

Set these in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

#### Frontend Deployment Tokens

- `BLOOM_DEV_DEPLOYMENT_TOKEN` - Dev Static Web App deployment token
- `BLOOM_STAGING_DEPLOYMENT_TOKEN` - Staging Static Web App deployment token
- `BLOOM_PROD_DEPLOYMENT_TOKEN` - Production Static Web App deployment token

#### API Deployment Profiles

- `BLOOM_DEV_API_PUBLISH_PROFILE` - Dev Azure Functions publish profile (XML)
- `BLOOM_STAGING_API_PUBLISH_PROFILE` - Staging Azure Functions publish profile (XML)
- `BLOOM_PROD_API_PUBLISH_PROFILE` - Production Azure Functions publish profile (XML)

See [CICD_CONFIGURATION_COMPLETE.md](./CICD_CONFIGURATION_COMPLETE.md) for actual secret values (secure this file!).

### Backend Environment Variables

Configure in Azure Functions Application Settings for each environment:

```
AZURE_SQL_CONNECTION_STRING=Server=tcp:lpa-sql-server.database.windows.net,1433;Database=lpa-applications-db;...
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=lpastorage13978;...
NODE_ENV=development|staging|production
```

## 📚 Documentation

- [CI/CD Setup Guide](./CICD_SETUP_GUIDE.md) - Complete workflow documentation and troubleshooting
- [CI/CD Configuration Complete](./CICD_CONFIGURATION_COMPLETE.md) - Current setup status and secrets
- [Future Development Roadmap](./FUTURE_DEVELOPMENT_ROADMAP.md) - Feature backlog and Jira tickets
- [Architecture Overview](./ARCHITECTURE.md) - System design and infrastructure
- [Application Management](./APPLICATION_MANAGEMENT_README.md) - Admin features and workflows
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Development history

## 🎨 Design System

The application follows Life Psychology Australia's Bloom brand guidelines:

### Colors

- **Primary**: Sage Green (#8CA88C)
- **Secondary**: Terracotta (#D97757)
- **Accent**: Warm Yellow (#F4C95D)
- **Text**: Charcoal (#2C2C2C)
- **Background**: Soft Cream (#FAF8F3)

### Typography

- **Headings**: Poppins (600 weight)
- **Body**: Inter (400 weight)

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure tests pass and linting is clean
4. Submit a pull request

## 📝 License

Copyright © 2025 Life Psychology Australia

## 🆘 Support

For issues or questions:

- Open an issue on GitHub
- Contact the development team
