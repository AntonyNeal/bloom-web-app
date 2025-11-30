# Bloom Web Application

[![CI/CD](https://github.com/AntonyNeal/bloom-web-app/actions/workflows/bloom-cicd.yml/badge.svg)](https://github.com/AntonyNeal/bloom-web-app/actions/workflows/bloom-cicd.yml)

Bloom is Life Psychology Australia's practitioner onboarding platform, enabling psychologists and mental health practitioners to apply to join the Bloom network.

## 🚀 Live Deployments

| Environment | Frontend URL | API URL | Branch |
|-------------|--------------|---------|--------|
| **Development** | https://lpa-bloom-dev.azurestaticapps.net | https://bloom-functions-dev.azurewebsites.net | `develop` |
| **Staging** | https://lpa-bloom-staging.azurestaticapps.net | https://bloom-functions-staging-new.azurewebsites.net | `staging` |
| **Production** | https://bloom.life-psychology.com.au | https://bloom-platform-functions-v2.azurewebsites.net | `main` |

---

## 📖 Documentation Index

This project has extensive documentation. Use this index to find what you need.

### 🚀 Getting Started

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | **Start here** - Get up and running in under 10 minutes |
| [QUICK_START.md](./QUICK_START.md) | A/B Testing Dashboard quick setup with templates |
| [DEVELOPMENT_ENVIRONMENT_SETUP_REPORT.md](./DEVELOPMENT_ENVIRONMENT_SETUP_REPORT.md) | Complete dev environment setup including tools, extensions, and MCP servers |

### 🏗️ Architecture & System Design

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | **Essential** - System architecture diagrams, data flows, user journeys, deployment topology |
| [FLYWAY_COSMOS_ARCHITECTURE.md](./FLYWAY_COSMOS_ARCHITECTURE.md) | Database version control architecture using Flyway + Cosmos DB |
| [A_B_TESTING_SYSTEM_OVERVIEW.md](./A_B_TESTING_SYSTEM_OVERVIEW.md) | A/B testing system connected to Azure Functions with real production data |

### 🚢 Deployment & CI/CD

| Document | Description |
|----------|-------------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Comprehensive deployment guide for all Azure resources |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Pre-flight checklist for production deployment |
| [CICD_SETUP_GUIDE.md](./CICD_SETUP_GUIDE.md) | GitHub Actions workflow documentation, secrets, and troubleshooting |
| [CICD_CONFIGURATION_COMPLETE.md](./CICD_CONFIGURATION_COMPLETE.md) | Current CI/CD setup status and configuration |
| [SECRETS_CONFIGURATION.md](./SECRETS_CONFIGURATION.md) | GitHub repository secrets configuration guide |
| [TROUBLESHOOTING_API_DEPLOY.md](./TROUBLESHOOTING_API_DEPLOY.md) | API deployment 401 errors, secret mapping per branch |
| [.github/workflows/README.md](./.github/workflows/README.md) | GitHub Actions workflow reference |

### 🔐 Authentication & Security

| Document | Description |
|----------|-------------|
| [AZURE_AD_AUTHENTICATION_REPORT.md](./AZURE_AD_AUTHENTICATION_REPORT.md) | Azure AD B2C implementation with MSAL, AuthProvider, protected routes |
| [AZURE_AD_CONFIGURATION_CHECKLIST.md](./AZURE_AD_CONFIGURATION_CHECKLIST.md) | App registration, redirect URIs, API permissions, token configuration |
| [BLOOM-AUTH-SETUP-INSTRUCTIONS.md](./BLOOM-AUTH-SETUP-INSTRUCTIONS.md) | Step-by-step Azure AD authentication setup |
| [AUTHENTICATION_COMPLETE.md](./AUTHENTICATION_COMPLETE.md) | Phase 1 authentication completion with ProtectedRoute and useAuth hook |

### 🗄️ Database

| Document | Description |
|----------|-------------|
| [DATABASE_MIGRATION_SYSTEM.md](./DATABASE_MIGRATION_SYSTEM.md) | Flyway-based version control with CI/CD integration |
| [DATABASE_VERSION_CONTROL_IMPLEMENTATION.md](./DATABASE_VERSION_CONTROL_IMPLEMENTATION.md) | Azure SQL/Cosmos DB integration, CLI tools, GitHub Actions |
| [DATABASE_FIX_INSTRUCTIONS.md](./DATABASE_FIX_INSTRUCTIONS.md) | Quick fixes for missing columns via Azure Portal |
| [db/README.md](./db/README.md) | Database migrations directory structure |
| [scripts/db-version-control/README.md](./scripts/db-version-control/README.md) | PowerShell CLI tools for database version control |

### ☁️ Azure Infrastructure

| Document | Description |
|----------|-------------|
| [AZURE_INFRASTRUCTURE_AUDIT_REPORT.md](./AZURE_INFRASTRUCTURE_AUDIT_REPORT.md) | Complete audit of Azure resources (Marketing Website vs Proto-Bloom) |
| [AZURE_RESOURCES_AUDIT_REPORT.md](./AZURE_RESOURCES_AUDIT_REPORT.md) | Active vs legacy resources with cleanup recommendations |
| [AZURE_STATIC_WEB_APPS_CONNECTION_CLARIFICATION.md](./AZURE_STATIC_WEB_APPS_CONNECTION_CLARIFICATION.md) | Why "Not Connected" status is normal for GitHub Actions deployments |
| [USING_EXISTING_AZURE_FUNCTIONS.md](./USING_EXISTING_AZURE_FUNCTIONS.md) | Azure Functions for application submission and file upload |

### 📊 A/B Testing

| Document | Description |
|----------|-------------|
| [AB-TESTING-DASHBOARD-IMPLEMENTATION.md](./AB-TESTING-DASHBOARD-IMPLEMENTATION.md) | Dashboard at `/admin/ab-tests` with real-time updates and CSV export |
| [AB-TESTING-DASHBOARD-SPECIFICATION.md](./AB-TESTING-DASHBOARD-SPECIFICATION.md) | Detailed specification with LLM integration and visualization requirements |
| [AB-TESTING-INFRASTRUCTURE-REPORT.md](./AB-TESTING-INFRASTRUCTURE-REPORT.md) | Azure Function endpoints, Cosmos DB schema, API documentation |
| [AB_TESTING_DASHBOARD_READY.md](./AB_TESTING_DASHBOARD_READY.md) | Dashboard connected to existing Azure Function App |
| [AB_TESTING_REAL_DATA_GUIDE.md](./AB_TESTING_REAL_DATA_GUIDE.md) | SQL database collection, API endpoints, tracking library |
| [REAL_AB_TESTING_SETUP.md](./REAL_AB_TESTING_SETUP.md) | Real A/B testing setup with database backend |
| [REAL_DATA_AB_TESTING_README.md](./REAL_DATA_AB_TESTING_README.md) | Complete implementation summary with architecture diagram |
| [SETUP_AB_TESTING_COMPLETE.md](./SETUP_AB_TESTING_COMPLETE.md) | SQL migrations and GitHub Actions deployment for A/B testing |
| [CONSOLE_LOGS_GUIDE.md](./CONSOLE_LOGS_GUIDE.md) | Expected console logs, error troubleshooting, network debugging |

### ⚡ Performance Optimization

| Document | Description |
|----------|-------------|
| [PERFORMANCE_OPTIMIZATION_PLAN.md](./PERFORMANCE_OPTIMIZATION_PLAN.md) | 12 bottlenecks identified with 4-phase execution roadmap |
| [PERFORMANCE_OPTIMIZATION_REPORT.md](./PERFORMANCE_OPTIMIZATION_REPORT.md) | -4.41KB JS bundle, 60fps animations, CSS animation framework |
| [PERFORMANCE_OPTIMIZATION_REPORT_2.md](./PERFORMANCE_OPTIMIZATION_REPORT_2.md) | 55% SVG complexity reduction, -0.38KB bundle |
| [LIGHTHOUSE_OPTIMIZATION_FINAL_REPORT.md](./LIGHTHOUSE_OPTIMIZATION_FINAL_REPORT.md) | 22.5% QualificationCheck reduction, -10.57KB JavaScript |
| [LIGHTHOUSE_PERFORMANCE_OPTIMIZATION_PLAN.md](./LIGHTHOUSE_PERFORMANCE_OPTIMIZATION_PLAN.md) | TBT 3853ms→<500ms target, component splitting strategies |
| [CRITICAL_LCP_FIX_REPORT.md](./CRITICAL_LCP_FIX_REPORT.md) | Fix for NO_LCP Lighthouse error |

### 🎨 Landing Page Optimization

| Document | Description |
|----------|-------------|
| [LANDING_PAGE_OPTIMIZATION_REPORT.md](./LANDING_PAGE_OPTIMIZATION_REPORT.md) | CSS deferral (50KB saved), pure CSS flowers, 3x faster load |
| [LANDING_PAGE_OPTIMIZATION_FINAL.md](./LANDING_PAGE_OPTIMIZATION_FINAL.md) | CSS-only optimizations maintaining 100% visual fidelity |
| [LANDING_PAGE_OPTIMIZATION_PHASE_2.md](./LANDING_PAGE_OPTIMIZATION_PHASE_2.md) | Preload hints, Framer Motion deferral, viewport meta |
| [LANDING_PAGE_OPTIMIZATION_COMPLETE_SUMMARY.md](./LANDING_PAGE_OPTIMIZATION_COMPLETE_SUMMARY.md) | 40% critical path reduction, 56% faster FCP, +17 Lighthouse points |
| [LANDING_PAGE_OPTIMIZATION_EXECUTIVE_SUMMARY.md](./LANDING_PAGE_OPTIMIZATION_EXECUTIVE_SUMMARY.md) | Executive summary of all optimizations |
| [LANDING_PAGE_GARDEN_ANIMATION_REPORT.md](./LANDING_PAGE_GARDEN_ANIMATION_REPORT.md) | 7-flower garden with Miyazaki-inspired design |

### 🎯 Design System & UI

| Document | Description |
|----------|-------------|
| [DESIGN_SYSTEM_PROGRESS_REPORT.md](./DESIGN_SYSTEM_PROGRESS_REPORT.md) | Phases 1-8: colors, typography, shadcn/ui, 60fps performance |
| [BLOOM_DEVELOPMENT_PROMPT.md](./BLOOM_DEVELOPMENT_PROMPT.md) | 4000+ line design system guide with Australian compliance |
| [ACCESSIBILITY_IMPROVEMENTS.md](./ACCESSIBILITY_IMPROVEMENTS.md) | Typography for aging vision: 18px base, WCAG AAA compliance |
| [COLOR_CONTRAST_ANALYSIS.md](./COLOR_CONTRAST_ANALYSIS.md) | WCAG-compliant text colors (#3A3A3A at 11.2:1 ratio) |
| [BLOOM_BUTTON_ENHANCEMENT.md](./BLOOM_BUTTON_ENHANCEMENT.md) | "Bloom" button with purple rose, 64px height |

### 🌸 Phase Development (Studio Ghibli Design)

| Document | Description |
|----------|-------------|
| [AMBIENT_BACKGROUND_PHASE_1.md](./AMBIENT_BACKGROUND_PHASE_1.md) | Studio Ghibli watercolor atmosphere: 3 blobs, 6 particles |
| [PHASE_1_FIX_NO_MORE_GRUBS.md](./PHASE_1_FIX_NO_MORE_GRUBS.md) | Fixed ambient elements by adjusting blob sizes and opacity |
| [PHASE_2_ENTRANCE_ANIMATIONS.md](./PHASE_2_ENTRANCE_ANIMATIONS.md) | Mobile-first animations, reduced motion support |
| [PHASE_3_FORM_INTERACTIONS.md](./PHASE_3_FORM_INTERACTIONS.md) | Custom checkbox, input focus animations, 44x44px touch targets |
| [PHASE_7_THE_GARDEN_GATE.md](./PHASE_7_THE_GARDEN_GATE.md) | Landing page with reused flowers, falling petals, mission copy |
| [PHASE_8_SPATIAL_NAVIGATION.md](./PHASE_8_SPATIAL_NAVIGATION.md) | Horizontal axis navigation, directional transitions |
| [QUALIFICATION_CHECK_PHASE_PROGRESS_REPORT.md](./QUALIFICATION_CHECK_PHASE_PROGRESS_REPORT.md) | Complete 7-phase Studio Ghibli implementation (2900+ lines) |
| [TIER_1_CHERRY_BLOSSOM_REFINEMENT.md](./TIER_1_CHERRY_BLOSSOM_REFINEMENT.md) | Cherry blossom with reversed gradient, delicate stamens |
| [TIER_2_ROSE_MIYAZAKI_REDESIGN.md](./TIER_2_ROSE_MIYAZAKI_REDESIGN.md) | Purple rose with dual petal layers, Miyazaki philosophy |

### 📋 Features & Applications

| Document | Description |
|----------|-------------|
| [APPLICATION_MANAGEMENT_README.md](./APPLICATION_MANAGEMENT_README.md) | Application form, admin review portal, backend API |
| [APPLICATION_SUBMISSION_DEPLOYMENT.md](./APPLICATION_SUBMISSION_DEPLOYMENT.md) | Backend API deployment for application submission |
| [apps/website/functions/README.md](./apps/website/functions/README.md) | Azure Functions for application processing |
| [JOIN_US_COPY_STRATEGY.md](./JOIN_US_COPY_STRATEGY.md) | Copy style aligned with Bloom's "calm, human-centered" voice |

### 📈 Marketing & Analytics

| Document | Description |
|----------|-------------|
| [GOOGLE_ADS_OPTIMIZATION_REPORT_NOV_2025.md](./GOOGLE_ADS_OPTIMIZATION_REPORT_NOV_2025.md) | Google Ads audit: Top 10% income = 100% conversions, bid adjustments |

### 🔧 Integrations

| Document | Description |
|----------|-------------|
| [docs/halaxy-integration-architecture.md](./docs/halaxy-integration-architecture.md) | Halaxy practice management sync: 15-min schedule, webhooks |
| [docs/halaxy-test-practitioner-setup.md](./docs/halaxy-test-practitioner-setup.md) | Test practitioner configuration for Bloom-Halaxy integration |

### 📁 Project Management

| Document | Description |
|----------|-------------|
| [PROJECT_HANDOVER.md](./PROJECT_HANDOVER.md) | Complete handover: MVP features, infrastructure, credentials, maintenance |
| [FUTURE_DEVELOPMENT_ROADMAP.md](./FUTURE_DEVELOPMENT_ROADMAP.md) | Jira tickets across 10 epics: Security, Testing, UX, API, Monitoring |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Proto-Bloom MVP: database schema, backend, frontend, admin portal |
| [DOCUMENTATION_LIBRARY.md](./DOCUMENTATION_LIBRARY.md) | Curated library organizing 55 files into Active/Archived/Obsolete |

### 🐛 Bug Fixes & Troubleshooting

| Document | Description |
|----------|-------------|
| [CRITICAL_BUG_APPLICATION_SUBMISSION_500_ERROR.md](./CRITICAL_BUG_APPLICATION_SUBMISSION_500_ERROR.md) | Root cause: missing qualification columns in database |
| [CRITICAL_FIX_REQUIRED.md](./CRITICAL_FIX_REQUIRED.md) | Infrastructure fix for accidental lpa-frontend-prod deployment |
| [APPLICATION_FIX_SUCCESS_REPORT.md](./APPLICATION_FIX_SUCCESS_REPORT.md) | Database columns added, function code updated |
| [ENDPOINT_CONSOLIDATION_REPORT.md](./ENDPOINT_CONSOLIDATION_REPORT.md) | API consolidation back to bloom-platform-functions-v2 |
| [iOS-debugging-guide.md](./iOS-debugging-guide.md) | iOS-specific debugging tips |

---

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

- **A/B Testing Dashboard** (`/admin/ab-tests`) - Analytics and experimentation:
  - Real-time variant performance tracking
  - Statistical significance calculations
  - CSV export for offline analysis

### Design System

- Custom design system based on Bloom brand guidelines
- Sage green (#8CA88C) and terracotta (#D97757) color palette
- Poppins (headings) and Inter (body) typography
- shadcn/ui component library integration
- Studio Ghibli-inspired animations and visual design

---

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
- **Auth**: Azure AD B2C (MSAL)

---

## 🏗️ Project Structure

```
bloom-web-app/
├── api/                          # Azure Functions backend
│   ├── applications/            # Application CRUD endpoints
│   └── upload/                  # File upload endpoint
├── apps/
│   └── website/
│       └── functions/           # Additional Azure Functions
├── db/
│   └── migrations/
│       └── versioned/           # Flyway SQL migrations
├── docs/                        # Integration documentation
├── infra/                       # Infrastructure as Code
├── scripts/
│   └── db-version-control/      # Database CLI tools
├── src/
│   ├── pages/
│   │   ├── JoinUs.tsx          # Application form
│   │   └── admin/              # Admin portal
│   ├── components/             # Reusable components
│   ├── features/               # Feature modules
│   └── design-system/          # Design tokens
├── .github/workflows/           # CI/CD pipelines
├── schema.sql                   # Database schema
└── staticwebapp.config.json     # SWA configuration
```

---

## 🔧 Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Azure CLI (`az`)
- Azure Functions Core Tools (`func`)

### Quick Start

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

For full setup including backend, see [QUICKSTART.md](./QUICKSTART.md).

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

---

## 🚢 Deployment

### Multi-Environment CI/CD

The project uses GitHub Actions for automated deployments. Push to the corresponding branch to deploy:

| Branch | Environment | Auto-Deploy |
|--------|-------------|-------------|
| `develop` | Development | ✅ |
| `staging` | Staging | ✅ |
| `main` | Production | ✅ |

### Deployment Pipeline

1. **Detects Changes**: Path filtering for frontend/API/infrastructure
2. **Quality Checks**: Parallel lint and type-check
3. **Builds**: Vite (frontend), TypeScript (API)
4. **Deploys**: Environment-specific Azure resources
5. **Reports**: Deployment summary

See [CICD_SETUP_GUIDE.md](./CICD_SETUP_GUIDE.md) for complete documentation.

---

## 🔐 Environment Configuration

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `BLOOM_DEV_DEPLOYMENT_TOKEN` | Dev Static Web App token |
| `BLOOM_STAGING_DEPLOYMENT_TOKEN` | Staging Static Web App token |
| `BLOOM_PROD_DEPLOYMENT_TOKEN` | Production Static Web App token |
| `BLOOM_DEV_API_PUBLISH_PROFILE` | Dev Azure Functions publish profile |
| `BLOOM_STAGING_API_PUBLISH_PROFILE` | Staging Azure Functions publish profile |
| `BLOOM_PROD_API_PUBLISH_PROFILE` | Production Azure Functions publish profile |

See [SECRETS_CONFIGURATION.md](./SECRETS_CONFIGURATION.md) for setup instructions.

### Backend Environment Variables

Configure in Azure Functions Application Settings:

```
AZURE_SQL_CONNECTION_STRING=Server=tcp:lpa-sql-server.database.windows.net,...
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
NODE_ENV=development|staging|production
```

---

## 🎨 Design System

### Colors

| Role | Color | Hex |
|------|-------|-----|
| Primary | Sage Green | `#8CA88C` |
| Secondary | Terracotta | `#D97757` |
| Accent | Warm Yellow | `#F4C95D` |
| Text | Charcoal | `#2C2C2C` |
| Background | Soft Cream | `#FAF8F3` |

### Typography

- **Headings**: Poppins (600 weight)
- **Body**: Inter (400 weight)

See [DESIGN_SYSTEM_PROGRESS_REPORT.md](./DESIGN_SYSTEM_PROGRESS_REPORT.md) for the complete design system.

---

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure tests pass and linting is clean
4. Submit a pull request

---

## 📝 License

Copyright © 2025 Life Psychology Australia

---

## 🆘 Support

- Open an issue on GitHub
- Contact the development team
