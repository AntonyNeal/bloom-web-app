# Proto-Bloom Web Application

[![CI/CD](https://github.com/AntonyNeal/bloom-web-app/actions/workflows/proto-bloom-cicd.yml/badge.svg)](https://github.com/AntonyNeal/bloom-web-app/actions/workflows/proto-bloom-cicd.yml)

Proto-Bloom is the MVP onboarding system for Life Psychology Australia's Bloom platform, enabling psychologists and mental health practitioners to apply to join the Bloom network.

## 🚀 Live Deployment

- **Staging**: https://witty-ground-01f9d5100.3.azurestaticapps.net

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

### Automated CI/CD

The project uses GitHub Actions for continuous deployment:

- **Triggers**: Push to `main`, `staging`, or `develop` branches
- **Pipeline Steps**:
  1. ✅ Lint code (ESLint)
  2. ✅ Type check (TypeScript)
  3. ✅ Build application (Vite)
  4. ✅ Deploy to Azure Static Web Apps

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy using Azure Static Web Apps CLI
npx @azure/static-web-apps-cli deploy \
  --deployment-token <YOUR_TOKEN> \
  --app-location . \
  --output-location dist
```

## 🔐 Environment Configuration

### Required GitHub Secrets

Set these in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Azure Static Web Apps deployment token

### Backend Environment Variables

Configure in Azure Functions Application Settings:

```
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=bloom-platform
SQL_USER=your-username
SQL_PASSWORD=your-password
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
```

## 📚 Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Quick Start Guide](./QUICKSTART.md)
- [Application Management](./APPLICATION_MANAGEMENT_README.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

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
