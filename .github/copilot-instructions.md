# Bloom Project - Copilot Instructions

This file provides context for AI assistants working on the Bloom codebase.

## Project Overview

**Bloom** is Life Psychology Australia's practitioner onboarding and practice management platform. It enables psychologists and mental health practitioners to:
1. Apply to join the Bloom network
2. Complete onboarding and verification
3. Manage their practice (appointments, clients, clinical notes)
4. Conduct telehealth sessions

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **UI Components** | Shadcn/ui (Radix primitives), Framer Motion |
| **State** | React Query (TanStack), React Context |
| **Backend** | Azure Functions v4, Node.js, TypeScript |
| **Database** | Azure SQL Server (MSSQL) - Primary data store |
| **Analytics DB** | Azure Cosmos DB (conversion-analytics, version-control) |
| **Storage** | Azure Blob Storage |
| **Auth** | Azure AD B2C via MSAL React |
| **Video/SMS** | Azure Communication Services |
| **Practice Mgmt** | Halaxy API (FHIR-R4 compliant) |
| **Payments** | Stripe |

## Project Structure

```
bloom-web-app/
├── apps/bloom/src/           # Main React application
│   ├── components/           # UI components (use barrel exports)
│   │   ├── ui/               # Shadcn/Radix primitives
│   │   ├── common/           # Shared (ErrorBoundary, Loading, ProtectedRoute)
│   │   ├── layout/           # Layout components
│   │   └── flowers/          # Bloom visual components (tiers 1-3)
│   ├── pages/                # Route pages
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API clients
│   ├── types/                # TypeScript types
│   ├── config/               # Configuration (api, auth, routes, constants)
│   └── utils/                # Utility functions
│
├── api/src/                  # Azure Functions backend
│   ├── functions/            # HTTP endpoints (see README.ts for categories)
│   └── services/             # Business logic
│       ├── halaxy/           # Halaxy practice management integration
│       ├── clinical-notes/   # AI-assisted clinical notes
│       └── notifications/    # Email/SMS services
│
├── packages/                 # Shared monorepo packages
├── docs/                     # Documentation
└── db/                       # Database migrations
```

## Key Conventions

### Imports - Use Barrel Exports
```tsx
// ✅ Preferred
import { Button, Card, Badge } from '@/components/ui';
import { useAuth, useToast } from '@/hooks';
import { ROUTES, APP_STATUS, BLOOM_COLORS } from '@/config';
import type { Application, SessionFeedItem } from '@/types';

// ❌ Avoid direct file imports
import { Button } from '@/components/ui/button';
```

### Component Pattern
```tsx
// Standard component structure
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // 1. Hooks first
  const [state, setState] = useState();
  const { data } = useQuery();
  
  // 2. Derived state / memos
  const computed = useMemo(() => /* ... */, []);
  
  // 3. Handlers
  const handleClick = () => { /* ... */ };
  
  // 4. Render
  return <div>...</div>;
}
```

### API Function Pattern
```typescript
// api/src/functions/*.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders };
  
  try {
    // Implementation
    return { status: 200, headers: corsHeaders, jsonBody: { success: true, data } };
  } catch (error) {
    context.error('[FunctionName] Error:', error);
    return { status: 500, headers: corsHeaders, jsonBody: { error: 'message' } };
  }
}

app.http('functionName', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'route-name',
  handler,
});
```

## Domain Concepts

### Application Workflow
1. **Submitted** → Practitioner applies via `/join-us`
2. **In Review** → Admin reviews application
3. **Interview Scheduled** → Video interview via ACS
4. **Accepted** → Offer sent
5. **Offer Accepted** → Contract signed
6. **Onboarding** → Halaxy verification, profile setup
7. **Active** → Practitioner can see clients

### Qualification Tiers (Flowers)
- **Tier 3** (Clinical Psychologist) - Most complex flower
- **Tier 2** (10+ years or PhD) - Medium flower
- **Tier 1** (Standard) - Simple flower

### Halaxy Integration
- **Sync Service**: Webhooks + 15-minute scheduled sync
- **FHIR-R4**: Standard healthcare data format
- **Entities**: Practitioner, Patient, Appointment, Location

### Telehealth Sessions
- **Azure Communication Services** for video
- **Session Token** → Patient joins via link
- **Transcription** → AI-assisted clinical notes

## Constants Reference

### Application Status
```typescript
APP_STATUS.SUBMITTED | IN_REVIEW | INTERVIEW_SCHEDULED | ACCEPTED | 
OFFER_SENT | OFFER_ACCEPTED | ONBOARDING | ACTIVE | DENIED | WAITLISTED
```

### Session Status
```typescript
SESSION_STATUS.BOOKED | CONFIRMED | ARRIVED | IN_PROGRESS | 
COMPLETED | CANCELLED | NO_SHOW | SCHEDULED
```

---

## Design Systems

Life Psychology Australia uses **two distinct design systems** for different audiences:

### BLOOM Design System (Practitioner Platform)
**Audience**: Psychologists, clinical psychologists, mental health practitioners  
**Aesthetic**: Miyazaki/Studio Ghibli inspired — botanical, organic, craft guild feel  
**Goal**: Create in-group belonging, reduce admin cognitive load, foster professional community

**Color Palette**:
```typescript
// Primary (Botanical)
BLOOM_COLORS.eucalyptusSage    // #6B8E7F - Primary brand, backgrounds
BLOOM_COLORS.softFern          // #8FA892 - Secondary accents, hover states
BLOOM_COLORS.warmCream         // #FAF7F2 - Page backgrounds

// Extended (Accessibility)
BLOOM_COLORS.deepSage          // #4A6B5C - Primary text (4.5:1 contrast)
BLOOM_COLORS.forestShadow      // #3D5A4C - Headers (7:1 AAA)
BLOOM_COLORS.softStone         // #E8E4DF - Borders, dividers

// Semantic
BLOOM_COLORS.success           // #059669 - Growth, completion
BLOOM_COLORS.warning           // #D97706 - Gentle attention
BLOOM_COLORS.error             // #DC2626 - Critical
```

**Typography**: Inter (primary), Merriweather (expressive moments)  
**Animation**: Organic easing, nature-inspired micro-interactions, respect reduced-motion  
**Components**: Soft shadows, 8px rounded corners, generous padding

### NEXT-WEBSITE Design System (Client Platform)
**Audience**: Potential therapy clients, corporate HR (EAP referrals)  
**Aesthetic**: Modern healthcare institution — glass, blue tile, stainless steel  
**Goal**: Build institutional trust, maximize booking conversion, AHPRA compliant

**Color Palette**:
```typescript
// Primary (Institutional Trust)
NEXT_COLORS.trustBlue          // #1E40AF - Primary brand, CTAs
NEXT_COLORS.calmSky            // #3B82F6 - Links, interactive elements
NEXT_COLORS.healingTeal        // #0D9488 - Success, wellness accents
NEXT_COLORS.warmCream          // #FEF9F5 - Page backgrounds
NEXT_COLORS.cleanWhite         // #FFFFFF - Cards, elevated surfaces
NEXT_COLORS.professionalGray   // #1F2937 - Primary text

// Semantic
NEXT_COLORS.success            // #059669 - Shared with BLOOM
NEXT_COLORS.warning            // #D97706 - Shared with BLOOM
NEXT_COLORS.error              // #DC2626 - Shared with BLOOM
```

**Typography**: Plus Jakarta Sans (primary), Georgia (testimonials)  
**Animation**: Minimal, purposeful, fast feedback  
**Components**: Clean shadows, subtle depth, prominent CTAs

### Shared Design Tokens
Both systems share foundational tokens for consistency:
- **Spacing**: 4, 8, 12, 16, 24, 32, 48, 64, 96px
- **Border Radius**: 4px (inputs), 8px (buttons), 12px (cards), 16px (modals)
- **Breakpoints**: sm(640), md(768), lg(1024), xl(1280), 2xl(1536)
- **Shared success color**: #059669 (teal-green wellness accent)

### AHPRA Compliance (Both Platforms)
- ❌ No clinical outcome testimonials
- ✅ Service experience reviews permitted
- ✅ Factual credentials (verifiable on AHPRA register)
- ✅ Medicare pricing: Show total fee + rebate + gap

> **Full design system research**: `docs/epics/DESIGN_SYSTEM_RESEARCH_FINDINGS.md`

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Routes | `apps/bloom/src/config/routes.ts` |
| Constants | `apps/bloom/src/config/constants.ts` |
| Types | `apps/bloom/src/types/index.ts` |
| API Endpoints | `apps/bloom/src/config/api.ts` |
| Auth Config | `apps/bloom/src/config/authConfig.ts` |
| API Functions Guide | `api/src/functions/README.ts` |
| Halaxy Types | `api/src/services/halaxy/types.ts` |

## Documentation Structure

| Folder | Purpose |
|--------|---------|
| `docs/` | All project documentation (see `docs/README.md`) |
| `docs/halaxy/` | Halaxy integration, sync, and compliance docs |
| `docs/guides/` | Workflow and implementation guides |
| `docs/archived-reports/` | Historical status and progress reports |
| `docs/epics/` | Feature planning and epics |

## Environment Variables

### Frontend (apps/bloom/.env)
```
VITE_API_URL=https://bloom-functions-dev.azurewebsites.net/api
VITE_B2C_CLIENT_ID=<azure-ad-b2c-client-id>
VITE_B2C_AUTHORITY=https://<tenant>.b2clogin.com/<tenant>.onmicrosoft.com/<policy>
VITE_B2C_SCOPES=openid profile email
```

### Backend (api/local.settings.json)
```
# Primary Database (Azure SQL)
SQL_SERVER=lpa-sql-server.database.windows.net
SQL_DATABASE=lpa-bloom-db-dev (dev/staging) | lpa-bloom-db-prod (prod)
SQL_USER, SQL_PASSWORD

# Analytics Database (Cosmos DB - secondary)
COSMOS_DB_CONNECTION_STRING, COSMOS_DB_DATABASE=conversion-analytics
DBVC_COSMOS_CONNECTION_STRING, DBVC_COSMOS_DATABASE=lpa-dbvc-dev

# Azure Services
AZURE_STORAGE_CONNECTION_STRING
ACS_CONNECTION_STRING, ACS_ENDPOINT
AZURE_SPEECH_KEY, AZURE_SPEECH_REGION=australiaeast
AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, AZURE_OPENAI_DEPLOYMENT

# Integrations
HALAXY_CLIENT_ID, HALAXY_CLIENT_SECRET
HALAXY_PRACTITIONER_ID, HALAXY_HEALTHCARE_SERVICE_ID
INFOBIP_API_KEY, SMS_FROM_NUMBER
STRIPE_SECRET_KEY
```

## Azure Infrastructure

> **Living Document**: Update this section when infrastructure changes are deployed.
> **Last Updated**: January 28, 2026

### Subscription & Resource Groups
| Resource Group | Location | Purpose |
|---------------|----------|---------|
| `rg-lpa-unified` | Australia East | Primary resources (Functions, SQL, Storage) |
| `lpa-rg` | Australia East | Legacy/shared resources |

**Subscription ID**: `47b5552f-0eb8-4462-97e7-cd67e8e660b8`

### Core Services

#### Azure SQL Server (Primary Database)
| Resource | Value |
|----------|-------|
| Server | `lpa-sql-server.database.windows.net` |
| Dev Database | `lpa-bloom-db-dev` |
| Prod Database | `lpa-bloom-db-prod` |
| Auth | SQL Authentication (`SQL_USER`, `SQL_PASSWORD`) |

#### Azure Cosmos DB (Analytics Only)
| Database | Container | Purpose |
|----------|-----------|---------|
| `conversion-analytics` | Various | Funnel analytics, A/B testing |
| `lpa-dbvc-dev` | `version-control` | Database version control |

**Endpoint**: `cdbt42kldozqahcu.documents.azure.com`

#### Azure Functions
| App | Environment | URL |
|-----|-------------|-----|
| `bloom-functions-dev` | Development | `https://bloom-functions-dev.azurewebsites.net/api` |
| `bloom-functions-prod` | Production | `https://bloom-functions-prod.azurewebsites.net/api` |

**Runtime**: Node.js 18, Azure Functions v4

#### Azure Static Web Apps (Frontend)
| Environment | URL Pattern |
|-------------|-------------|
| Production | `https://delightfulglacier-*.azurestaticapps.net` |
| Dev/Preview | PR-based preview URLs |

#### Azure Communication Services
| Resource | Value |
|----------|-------|
| Name | `lpa-communication-service` |
| Region | Australia |
| Endpoint | `https://lpa-communication-service.australia.communication.azure.com` |
| Features | Video calling, SMS (via Infobip) |

#### Azure AI Services
| Service | Region | Details |
|---------|--------|---------|
| Azure OpenAI | Australia East | Deployment: `gpt-4-1` |
| Azure Speech | Australia East | Transcription for clinical notes |

#### Application Insights
| App | Purpose |
|-----|---------|
| `bloom-functions-prod` | Production monitoring & alerts |
| `bloom-functions-dev` | Development telemetry |

### Third-Party Integrations
| Service | Purpose |
|---------|---------|
| **Halaxy** | Practice management (FHIR-R4) |
| **Infobip** | SMS notifications |
| **Stripe** | Payment processing |

### Environment Naming Convention
```
dev     → Development (local + Azure dev resources)
staging → Staging (uses dev database)
prod    → Production (separate database + resources)
```

### Infrastructure Files
| File | Purpose |
|------|---------|
| `infra/halaxy-sync-worker.bicep` | Container Apps worker (planned) |
| `infra/realtime-sync-infrastructure.bicep` | SignalR, Redis, Service Bus (planned) |
| `infra/availability-alert.json` | Production monitoring alerts |
| `staticwebapp.config.json` | SWA routing & caching rules |
| `swa-cli.config.json` | Local SWA emulator config |

---

## Testing Context

- **Local Dev**: `npm run dev:bloom` (frontend) + `cd api && func start` (backend)
- **Reset Test Data**: `cd api && node reset-application.js`
- **Check State**: `cd api && node check-application-detailed-state.js`

## Design Philosophy

The UI follows **Miyazaki/Studio Ghibli** design principles:
- Natural, organic animations
- Botanical color palette (sage, fern, terracotta)
- Soft, inviting visual language
- "Care for People, Not Paperwork" ethos

## When Making Changes

1. **Use existing patterns** - Check similar files first
2. **Update barrel exports** - Add new exports to index.ts files
3. **Use constants** - Don't hardcode status strings or colors
4. **Type everything** - Add types to types/index.ts or types/bloom.ts
5. **Document API functions** - Follow README.ts pattern
6. **Test locally** - Both frontend and API before committing
