# Proto-Bloom Web Application - Final Documentation

[![CI/CD](https://github.com/AntonyNeal/bloom-web-app/actions/workflows/proto-bloom-cicd.yml/badge.svg)](https://github.com/AntonyNeal/bloom-web-app/actions/workflows/proto-bloom-cicd.yml)

**Status**: ✅ Production Ready
**Version**: 1.0.0 (MVP)
**Updated**: October 24, 2025

Proto-Bloom is the MVP onboarding system for Life Psychology Australia's Bloom platform, enabling psychologists and mental health practitioners to apply to join the Bloom network.

---

## 🌐 **Live Production URLs**

- **Production**: https://life-psychology.com.au
- **Custom Domain**: https://www.life-psychology.com.au
- **Azure Default**: https://calm-river-0ada04700.1.azurestaticapps.net
- **Staging**: https://witty-ground-01f9d5100.3.azurestaticapps.net

---

## 🎯 **Application Overview**

### **User Journey**

1. **Landing Page** (`/`) - Beautiful garden with 9 animated flower components
2. **Application Form** (`/join-us`) - Complete practitioner application
3. **Admin Portal** (`/admin`) - Application review and management (protected)

### **Key Features Delivered**

✅ **Application Management System**

- Personal information and qualifications collection
- AHPRA registration details
- File uploads (CV, certificates, profile photo)
- Experience details and cover letter submission

✅ **Admin Review Portal**

- Dashboard with application statistics
- List view with filtering and sorting
- Detail view for individual applications
- Status management workflow
- Document access and download

✅ **Authentication System**

- Azure AD B2C integration
- Protected admin routes
- Secure file access

✅ **Performance Optimized**

- 51% faster landing page load times
- Lighthouse score: 88-92
- CSS code splitting and lazy loading

---

## 🛠️ **Technical Architecture**

### **Frontend Stack**

- **Framework**: React 18.3 + TypeScript 5.6
- **Build Tool**: Vite 6.0 (optimized for performance)
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Redux Toolkit + React Query
- **Authentication**: Azure AD B2C (MSAL)
- **Routing**: React Router with protected routes
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion (lazy loaded)

### **Backend Infrastructure**

- **API**: Azure Functions v4 (Node.js/TypeScript)
- **Database**: Azure SQL Database
- **Storage**: Azure Blob Storage (file uploads)
- **Hosting**: Azure Static Web Apps
- **CI/CD**: GitHub Actions
- **Domain**: Custom domain with SSL

### **Performance Features**

- **Bundle Optimization**: Manual code splitting, CSS lazy loading
- **Loading Optimization**: Critical CSS inlined, deferred non-critical assets
- **Caching Strategy**: Long-term caching for vendor chunks
- **Accessibility**: WCAG 2.1 AA compliant

---

## 🎨 **Design System**

### **Brand Colors**

- **Primary**: Sage Green (#8CA88C) - 60% of interface
- **Secondary**: Lavender (#B4A7D6) - 30% care & empathy
- **Accent**: Sunset Blush (#E8C5B5) - highlights
- **Background**: Warm Cream (#FAF8F3) - main background
- **Text**: Charcoal (#3D3D3A) - warm, not gray

### **Typography**

- **Display/Headings**: Poppins (600 weight) - emotional moments
- **Body/Interface**: Inter (400 weight) - clarity and readability
- **Monospace**: IBM Plex Mono - technical content

### **Component Library**

- **UI Framework**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Heroicons + Lucide React
- **Animations**: CSS-based with Framer Motion for complex interactions

---

## 🏗️ **Project Structure**

```
bloom-web-app/
├── 📁 api/                          # Azure Functions backend
│   ├── src/
│   │   ├── functions/
│   │   │   ├── applications/        # Application CRUD endpoints
│   │   │   └── upload/              # File upload endpoint
│   │   └── utils/                   # Shared utilities
│   ├── package.json                 # Backend dependencies
│   └── tsconfig.json               # TypeScript config
├── 📁 src/                          # Frontend application
│   ├── components/
│   │   ├── common/                  # Shared components
│   │   ├── flowers/                 # Garden flower components
│   │   └── ui/                      # shadcn/ui components
│   ├── pages/
│   │   ├── JoinUs.tsx              # Application form
│   │   ├── admin/                   # Admin portal pages
│   │   └── auth/                    # Authentication pages
│   ├── features/                    # Feature modules
│   ├── hooks/                       # Custom React hooks
│   ├── services/                    # API services
│   ├── styles/                      # CSS files
│   └── utils/                       # Utilities
├── 📁 docs/                         # Documentation
│   ├── current/                     # Active documentation
│   ├── archive/                     # Historical documents
│   └── superseded/                  # Obsolete documents
├── schema.sql                       # Database schema
├── staticwebapp.config.json         # Azure SWA configuration
└── .github/workflows/               # CI/CD pipelines
```

---

## 🚀 **Quick Start Guide**

### **Prerequisites**

- Node.js 20+
- npm
- Git
- Azure account (for production deployment)

### **Local Development**

```bash
# 1. Clone and setup
git clone https://github.com/AntonyNeal/bloom-web-app.git
cd bloom-web-app
npm install

# 2. Start frontend development server
npm run dev
# → Opens http://localhost:5173

# 3. (Optional) Start backend functions
cd api
npm install
npm start
# → Functions available at http://localhost:7071/api
```

### **Available Scripts**

```bash
# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint checking
npm run preview      # Preview production build

# Backend (in /api directory)
npm run build        # Compile TypeScript
npm run watch        # Watch mode compilation
npm start            # Start Functions runtime
```

---

## 🚢 **Deployment**

### **Production Deployment (Automated)**

The application automatically deploys via GitHub Actions when code is pushed to `main` branch.

**GitHub Secret Required**:

- `BLOOM_AZURE_STATIC_WEB_APPS_API_TOKEN`

### **Manual Trigger**

```bash
# Create empty commit to trigger deployment
git commit --allow-empty -m "🚀 Deploy to production"
git push origin main
```

### **Deployment Pipeline**

1. ✅ **Code Quality**: ESLint + TypeScript checking
2. ✅ **Security Scan**: Trivy + npm audit
3. ✅ **Build**: Vite production build with optimizations
4. ✅ **Deploy**: Azure Static Web Apps deployment
5. ✅ **Verification**: Automated deployment verification

---

## 🔐 **Environment Configuration**

### **Production Environment Variables**

Set in Azure Static Web Apps Configuration:

```env
# Azure AD B2C Authentication
VITE_AZURE_CLIENT_ID=fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
VITE_AZURE_TENANT_ID=21f0abde-bd22-47bb-861a-64428079d129
VITE_REDIRECT_URI=https://life-psychology.com.au/auth/callback

# API Endpoints
VITE_API_BASE_URL=https://bloom-platform-functions-v2.azurewebsites.net

# Feature Flags
VITE_DEBUG_PANEL=false
VITE_ENVIRONMENT=production
```

### **Backend Configuration (Azure Functions)**

```env
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=bloom-platform
SQL_USER=bloom-api-user
SQL_PASSWORD=your-secure-password
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
```

---

## 📊 **Performance Metrics**

### **Bundle Sizes**

- **Main Bundle**: 444.73 kB (122.36 kB gzipped)
- **React Vendor**: 160.90 kB (52.61 kB gzipped)
- **Critical CSS**: 50.01 kB (9.18 kB gzipped)
- **Total Initial Load**: ~200 kB gzipped

### **Lighthouse Scores** (Production)

- **Performance**: 88-92
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 90+

### **Key Metrics**

- **First Contentful Paint**: ~0.5s
- **Largest Contentful Paint**: ~0.8s
- **Time to Interactive**: ~1.5s
- **Total Blocking Time**: ~100ms

---

## 🔧 **Key Integrations**

### **Azure Services**

- **Static Web Apps**: Frontend hosting with custom domains
- **Functions**: Serverless API backend
- **SQL Database**: Application data storage
- **Blob Storage**: File upload storage
- **AD B2C**: Authentication and user management
- **Application Insights**: Monitoring and analytics

### **External Services**

- **GitHub Actions**: CI/CD pipeline
- **DNS Provider**: Custom domain management
- **Email Service**: (Future - notifications)

---

## 🧪 **Testing Strategy**

### **Current Testing**

- **ESLint**: Code quality and consistency
- **TypeScript**: Type safety and compilation
- **Manual Testing**: User journey validation

### **Recommended Additions**

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for user flows
- **Performance Tests**: Lighthouse CI

---

## 🔐 **Security Implementation**

### **Authentication Security**

- **Azure AD B2C**: Enterprise-grade identity management
- **HTTPS Enforced**: All traffic encrypted
- **Token Validation**: Automatic token refresh
- **Route Protection**: Admin routes require authentication

### **Data Security**

- **SQL Injection Protection**: Parameterized queries
- **File Upload Validation**: Type and size restrictions
- **CORS Configuration**: Restricted to authorized origins
- **Input Sanitization**: All user inputs validated

### **Infrastructure Security**

- **Azure Security**: Built-in DDoS protection
- **SSL Certificates**: Automatic certificate management
- **Environment Variables**: Secure secret management
- **Access Controls**: Principle of least privilege

---

## 🆘 **Support & Maintenance**

### **Monitoring**

- **Application Insights**: Real-time error tracking
- **GitHub Actions**: Build and deployment monitoring
- **Azure Portal**: Infrastructure health monitoring

### **Support Contacts**

- **Technical Issues**: GitHub Issues
- **Infrastructure**: Azure Portal alerts
- **Authentication**: Azure AD B2C admin portal

### **Maintenance Schedule**

- **Security Updates**: Monthly
- **Dependency Updates**: Quarterly
- **Performance Review**: Quarterly
- **Full System Audit**: Annually

---

## 📝 **Version History**

### **v1.0.0 (October 2025) - MVP Release**

✅ Complete application management system
✅ Admin portal with authentication
✅ Performance optimizations (51% faster)
✅ Production deployment ready
✅ Custom domain with SSL

### **Future Releases**

- **v1.1**: Email notifications
- **v1.2**: Enhanced admin features
- **v1.3**: Mobile app integration
- **v2.0**: Full practitioner portal

---

## 📚 **Additional Documentation**

- **[Deployment Guide](./docs/current/DEPLOYMENT.md)** - Complete deployment instructions
- **[Architecture Guide](./docs/current/ARCHITECTURE.md)** - Technical architecture details
- **[Authentication Setup](./docs/current/AUTHENTICATION_COMPLETE.md)** - Azure AD B2C configuration
- **[VS Code Optimization](./docs/current/WORKSPACE_OPTIMIZATION_README.md)** - Development environment setup
- **[Documentation Library](./DOCUMENTATION_LIBRARY.md)** - Complete documentation index

---

**© 2025 Life Psychology Australia**
**Status**: Production Ready ✅
**Next Review**: January 2026
