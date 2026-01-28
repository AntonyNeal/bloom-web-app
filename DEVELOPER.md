# 🌸 Bloom Developer Guide

> **Start Here** - Everything you need to understand and develop the Bloom platform.

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Quick Start](#-quick-start-5-minutes)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Development Workflow](#-development-workflow)
- [Key Concepts](#-key-concepts)
- [API Reference](#-api-reference)
- [Common Tasks](#-common-tasks)
- [Troubleshooting](#-troubleshooting)

---

## 🌱 Project Overview

**Bloom** is Life Psychology Australia's practitioner onboarding platform, enabling psychologists and mental health practitioners to apply to join the Bloom network.

### Key Features

| Feature | Description |
|---------|-------------|
| **Practitioner Onboarding** | Multi-step application with qualification checks |
| **Admin Dashboard** | Application review, status management, interview scheduling |
| **Clinician Dashboard** | Session management, client tracking, notes |
| **Telehealth Sessions** | Azure Communication Services video calls |
| **Halaxy Integration** | Practice management system sync |
| **A/B Testing** | Built-in experimentation framework |

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Backend** | Azure Functions v4, Node.js, TypeScript |
| **Database** | Azure SQL Server |
| **Storage** | Azure Blob Storage |
| **Auth** | Azure AD B2C (MSAL React) |
| **Video** | Azure Communication Services |
| **Practice Mgmt** | Halaxy API (FHIR-R4) |

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

```bash
node --version    # v18+
npm --version     # v9+
func --version    # Azure Functions Core Tools v4
```

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# API dependencies  
cd api && npm install && cd ..
```

### 2. Configure Environment

Copy environment files:
```bash
# Frontend (apps/bloom)
cp apps/bloom/.env.development.example apps/bloom/.env.development

# API
cp api/local.settings.example.json api/local.settings.json
```

### 3. Start Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev:bloom
# → http://localhost:5173
```

**Terminal 2 - API:**
```bash
cd api && func start
# → http://localhost:7071
```

### 4. Verify Setup

- Frontend: http://localhost:5173
- API Health: http://localhost:7071/api/health

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure Static Web App                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │   Landing    │   │   Join Us    │   │  Admin Portal    │    │
│  │   (/)        │   │  (/join-us)  │   │  (/admin/*)      │    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │   Clinician  │   │  Telehealth  │   │   Notes/Client   │    │
│  │  Dashboard   │   │  Sessions    │   │   Management     │    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (HTTPS)
┌───────────────────────────▼─────────────────────────────────────┐
│                    Azure Functions v4                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ applications | upload | session | halaxy-sync | dashboard  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────┬───────────────────────────────────┬──────────────────┘
           │                                   │
    ┌──────▼──────┐                     ┌──────▼──────┐
    │  Azure SQL  │                     │ Blob Storage│
    │  Database   │                     │  (Files)    │
    └─────────────┘                     └─────────────┘
```

### Data Flow

1. **Application Submission**: User → Frontend → API → SQL Database + Blob Storage
2. **Admin Review**: Admin → API → SQL Database → Status Email
3. **Halaxy Sync**: Webhooks/Timer → Halaxy API → Bloom SQL Database
4. **Telehealth**: ACS Token → Video Room → Transcription → Clinical Notes

---

## 📁 Project Structure

```
bloom-web-app/
├── apps/
│   └── bloom/                    # Main React application
│       ├── src/
│       │   ├── components/       # UI components (barrel exports via index.ts)
│       │   │   ├── ui/           # Shadcn/Radix primitives
│       │   │   ├── common/       # Shared components (ErrorBoundary, Loading, etc.)
│       │   │   ├── layout/       # Layout components (Header, BloomHeader)
│       │   │   └── flowers/      # Bloom visual components
│       │   ├── pages/            # Route pages
│       │   │   ├── admin/        # Admin dashboard pages
│       │   │   ├── session/      # Telehealth pages
│       │   │   └── ...
│       │   ├── features/         # Feature-specific components
│       │   ├── hooks/            # Custom React hooks (barrel export)
│       │   ├── services/         # API clients (barrel export)
│       │   ├── types/            # TypeScript types (barrel export)
│       │   ├── config/           # App configuration (barrel export)
│       │   │   ├── api.ts        # API endpoints
│       │   │   ├── authConfig.ts # Azure AD B2C config
│       │   │   ├── constants.ts  # App constants (colors, status, etc.)
│       │   │   └── routes.ts     # Route definitions
│       │   ├── utils/            # Utility functions (barrel export)
│       │   └── styles/           # Global styles
│       └── package.json
│
├── api/                          # Azure Functions backend
│   ├── src/
│   │   ├── functions/            # HTTP endpoints (see README.ts for categories)
│   │   ├── services/             # Business logic
│   │   │   ├── halaxy/           # Halaxy integration
│   │   │   ├── clinical-notes/   # AI notes service
│   │   │   └── notifications/    # Email/SMS
│   │   └── config/               # Configuration
│   └── package.json
│
├── packages/                     # Shared packages (monorepo)
│   ├── shared-types/             # Shared TypeScript types
│   ├── shared-utils/             # Shared utilities
│   └── shared-ui/                # Shared UI components
│
├── docs/                         # Documentation
│   ├── current/                  # Active documentation
│   └── archived-reports/         # Historical reports
│
├── reports/                      # Generated reports (gitignored)
│   └── lighthouse/               # Performance audits
│
├── db/                           # Database migrations
├── infra/                        # Infrastructure (Bicep)
└── scripts/                      # Utility scripts
```

---

## 📦 Import Conventions

All major directories have barrel exports (`index.ts`) for cleaner imports:

```tsx
// ✅ Good - Use barrel exports
import { Button, Card, Badge } from '@/components/ui';
import { ProtectedRoute, ErrorBoundary, LoadingState } from '@/components/common';
import { BloomHeader } from '@/components/layout';
import { useAuth, useToast, useDashboard } from '@/hooks';
import { API_ENDPOINTS, ROUTES, BLOOM_COLORS, APP_STATUS } from '@/config';
import { formatDate, formatCurrency, getInitials } from '@/utils';
import type { Application, SessionFeedItem } from '@/types';

// ❌ Avoid - Direct file imports (unless necessary)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
```

---

## 🔄 Development Workflow

### Branch Strategy

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production | bloom.life-psychology.com.au |
| `staging` | Pre-production | lpa-bloom-staging.azurestaticapps.net |
| `develop` | Development | lpa-bloom-dev.azurestaticapps.net |

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Run `npm run lint`
- **Prettier** - Auto-format on save
- **Imports** - Use `@/` alias for `src/`
- **Barrel Exports** - Use index.ts for cleaner imports

### Component Patterns

```tsx
// ✅ Good - Feature component
export function MyFeature({ prop1, prop2 }: MyFeatureProps) {
  // hooks first
  const [state, setState] = useState();
  
  // handlers
  const handleClick = () => { /* ... */ };
  
  // render
  return <div>...</div>;
}

// ✅ Good - Use barrel exports
import { Button, Card, Badge } from '@/components/ui';
import { useAuth, useToast } from '@/hooks';
```

---

## 🔑 Key Concepts

### Authentication

Uses Azure AD B2C via MSAL React:

```tsx
// Check auth in component
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();
  
  if (!isAuthenticated) return <Login />;
  return <Dashboard user={user} />;
}

// Protect routes
<Route path="/admin/*" element={
  <ProtectedRoute>
    <AdminLayout />
  </ProtectedRoute>
} />
```

### API Configuration

```tsx
// config/api.ts - Use this for all API calls
import { API_ENDPOINTS } from '@/config/api';

// Fetch applications
const response = await fetch(API_ENDPOINTS.applications);

// Upload file
await fetch(API_ENDPOINTS.upload + '?type=cv', {
  method: 'POST',
  body: formData,
});
```

### Halaxy Integration

The Halaxy service syncs practitioner and appointment data:

```typescript
// api/src/services/halaxy/
├── client.ts         // API client with retry logic
├── sync-service.ts   // Sync orchestration
├── token-manager.ts  // OAuth token handling
├── transformers.ts   // FHIR → Bloom data transforms
└── types.ts          // FHIR type definitions
```

---

## 📡 API Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/applications` | GET, POST | List/create applications |
| `/api/applications/:id` | GET, PUT | Get/update application |
| `/api/upload` | POST | Upload file to storage |
| `/api/practitioner-dashboard` | GET | Clinician dashboard data |
| `/api/clinician-schedule` | GET | Weekly schedule |

### Authentication

Protected endpoints require Bearer token:
```http
Authorization: Bearer {access_token}
```

### Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 🛠️ Common Tasks

### Add a New Page

1. Create page in `apps/bloom/src/pages/`
2. Add route in `App.tsx`
3. If protected, wrap with `<ProtectedRoute>`

### Add a New API Endpoint

1. Create function in `api/src/functions/`
2. Register in `api/src/index.ts`
3. Add types if needed

### Add a New Component

1. Create in appropriate `components/` subfolder
2. Export from folder's `index.ts`
3. Use `cn()` for conditional classes

### Run Database Migration

```bash
cd api
node run-migration.js V024_new_feature.sql
```

### Test Email/SMS

```bash
# Local testing
cd api
node test-sms-quick.js
```

---

## 🐛 Troubleshooting

### API Not Responding

1. Check Functions are running: `func start`
2. Verify environment variables in `local.settings.json`
3. Check firewall allows SQL Server access

### Auth Redirect Issues

1. Verify redirect URIs in Azure AD B2C
2. Check `VITE_B2C_CLIENT_ID` is set
3. Clear browser cache/cookies

### Build Errors

```bash
# Clean build
rm -rf node_modules dist
npm install
npm run build
```

### Database Connection

```bash
# Test connection
cd api
node test-db.cjs
```

---

## 📚 Further Reading

| Document | Purpose |
|----------|---------|
| [docs/current/ARCHITECTURE.md](docs/current/ARCHITECTURE.md) | Detailed system design |
| [docs/current/QUICKSTART.md](docs/current/QUICKSTART.md) | Full setup guide |
| [docs/current/DEPLOYMENT.md](docs/current/DEPLOYMENT.md) | Deployment procedures |
| [TESTING_WORKFLOW.md](TESTING_WORKFLOW.md) | Testing application workflow |
| [api/HALAXY_ENV_SETUP.md](api/HALAXY_ENV_SETUP.md) | Halaxy integration setup |

---

## 🤝 Getting Help

- **Slack**: #bloom-dev
- **Email**: dev@life-psychology.com.au
- **Issues**: GitHub Issues

---

*Last updated: January 2026*
