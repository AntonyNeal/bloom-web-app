# Bloom Platform — System Architecture & Technical Overview

**Life Psychology Australia**  
*January 2026*

---

## System Overview

Bloom is a full-stack web platform consisting of three main applications, a serverless API layer, and integrations with external services. This document describes the technical architecture, not the business model.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│   Bloom Portal      │   Marketing Site    │   Admin Dashboard               │
│   (React SPA)       │   (React SPA)       │   (within Bloom Portal)         │
│   bloom.life-...    │   life-psychology.  │   /admin/*                      │
│                     │   com.au            │                                 │
└─────────┬───────────┴─────────┬───────────┴─────────────────┬───────────────┘
          │                     │                             │
          ▼                     ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AZURE STATIC WEB APPS                              │
│   CDN + Hosting + SSL + Custom Domains                                       │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API LAYER (Azure Functions)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ~45 HTTP Endpoints    │  Timer Triggers     │  Webhook Handlers            │
│  - Applications CRUD   │  - Halaxy Sync      │  - Halaxy Webhooks           │
│  - Practitioners       │  - Reminders        │  - Payment Webhooks          │
│  - Bookings            │                     │                              │
│  - Documents           │                     │                              │
└─────────┬───────────────────────┬───────────────────────┬───────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────────────┐
│  Azure SQL      │   │  Azure Blob     │   │  External Services              │
│  Database       │   │  Storage        │   │  - Halaxy (FHIR API)            │
│                 │   │                 │   │  - Azure Comm Services (Email)  │
│  25 migrations  │   │  CVs, Certs,    │   │  - Stripe (Payments)            │
│  applied        │   │  Contracts      │   │  - Google Analytics             │
└─────────────────┘   └─────────────────┘   └─────────────────────────────────┘
```

---

## 1. Frontend Architecture

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool, dev server, HMR |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | - | Component library (Radix primitives) |
| Framer Motion | 11.x | Animations |
| React Router | 6.x | Client-side routing |
| TanStack Query | 5.x | Server state management |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |

### Application Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui primitives (Button, Input, etc.)
│   ├── bloom/           # Bloom-specific components
│   └── forms/           # Form components
├── pages/               # Route components
│   ├── admin/           # Admin dashboard pages
│   ├── practitioner/    # Practitioner portal pages
│   └── public/          # Public pages (login, apply)
├── services/            # API client functions
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── config/              # Configuration (API URLs, etc.)
└── styles/              # Global styles, Bloom design tokens
```

### Design System

The UI follows a custom "Bloom" design language inspired by Studio Ghibli aesthetics:

```typescript
// Core color palette
const bloomStyles = {
  colors: {
    petalPink: '#F8E8E8',
    eucalyptusSage: '#6B8E7F',
    honeyAmber: '#E8B86D',
    clayTerracotta: '#C17767',
    skyMist: '#E8F4F8',
    paperWhite: '#FDFCFB',
    inkCharcoal: '#3A3A3A',
  }
};
```

**Animation Philosophy:**
- Subtle, organic movements
- Framer Motion for entrance/exit animations
- Reduced motion support via `prefers-reduced-motion`
- Custom flower/plant growth animations for progress indicators

### State Management

- **Server State:** TanStack Query for API data caching, refetching, optimistic updates
- **Form State:** React Hook Form with Zod validation schemas
- **UI State:** Local React state (useState/useReducer)
- **No Redux:** Intentionally avoided for simplicity; most state is server-derived

---

## 2. Backend Architecture (Azure Functions)

### Runtime

- **Runtime:** Node.js 18 (Azure Functions v4 programming model)
- **Language:** TypeScript
- **Deployment:** Azure Static Web Apps managed functions

### API Endpoints

```
api/src/functions/
├── applications.ts          # CRUD for practitioner applications
├── accept-application.ts    # Accept + create practitioner record
├── accept-offer.ts          # Candidate accepts their offer
├── send-offer.ts            # Send offer email with contract
├── upload.ts                # File upload to Blob Storage
├── get-document-url.ts      # Generate SAS URLs for documents
├── practitioners-admin.ts   # Admin practitioner management
├── list-practitioners.ts    # Public practitioner listing
├── onboarding.ts            # Onboarding flow handlers
├── create-payment-intent.ts # Stripe payment creation
├── capture-payment.ts       # Stripe payment capture
├── get-halaxy-availability.ts  # Fetch practitioner slots
├── create-halaxy-booking.ts    # Create appointment in Halaxy
├── halaxy-webhook.ts        # Receive Halaxy real-time updates
├── halaxy-sync-timer.ts     # Scheduled sync trigger
├── trigger-halaxy-sync.ts   # Manual sync trigger
├── verify-halaxy-practitioner.ts  # Verify practitioner in Halaxy
├── send-appointment-reminders.ts  # Scheduled reminder emails
├── ab-test.ts               # A/B test variant assignment
├── track-ab-test.ts         # Conversion tracking
├── smoke-test.ts            # Health check endpoint
└── health.ts                # Basic health endpoint
```

### Database Schema (Azure SQL)

**Core Tables:**

```sql
-- Applications (practitioner recruitment)
applications (
  id, first_name, last_name, email, phone,
  ahpra_registration, specializations, experience_years,
  cv_url, certificate_url, photo_url, cover_letter,
  status, created_at, updated_at, reviewed_by,
  waitlisted_at, accepted_at, interview_scheduled_at,
  contract_url, offer_sent_at, decision_reason
)

-- Practitioners (approved clinicians)
practitioners (
  id, first_name, last_name, email,
  halaxy_practitioner_id, ahpra_number,
  specializations, bio, photo_url,
  onboarding_token, onboarding_completed_at,
  status, created_at
)

-- Availability (synced from Halaxy)
availability_slots (
  id, practitioner_id, halaxy_slot_id,
  start_time, end_time, service_type,
  is_available, created_at, synced_at
)

-- A/B Testing
ab_test_experiments (id, name, description, status)
ab_test_variants (id, experiment_id, name, weight)
ab_test_assignments (id, experiment_id, variant_id, session_id)
ab_test_conversions (id, assignment_id, event_type, value)
```

**Migration System:**
- 25 versioned SQL migrations
- Applied via custom migration runner (not Flyway)
- Idempotent migrations with version tracking

---

## 3. Halaxy Integration

Halaxy is the clinical practice management system. We integrate via their FHIR-R4 API.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Bloom Portal   │────▶│  Azure Functions │────▶│  Halaxy API     │
│                 │     │  (API Layer)     │     │  (FHIR-R4)      │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Halaxy Sync    │
                        │  Worker         │
                        │  (Container App)│
                        └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Azure SQL      │
                        │  (cached data)  │
                        └─────────────────┘
```

### Sync Worker (Azure Container Apps)

- **Image:** Custom Docker container
- **Schedule:** Every 15 minutes via timer trigger
- **Also:** Real-time webhooks for immediate updates

**Data Synced:**
- Practitioners → `practitioners` table
- Patients → Used for client matching
- Appointments → `availability_slots` / appointment records
- Availability → Booking system slot display

### Authentication

```typescript
// OAuth2 flow with Halaxy
const getAccessToken = async (): Promise<string> => {
  // Tokens cached for 15 minutes
  // Auto-refresh on expiry
  // Credentials stored in Azure Key Vault
};
```

---

## 4. File Storage (Azure Blob Storage)

### Container Structure

```
bloom-documents/
├── applications/
│   └── {applicationId}/
│       ├── cv.pdf
│       ├── certificate.pdf
│       └── photo.jpg
├── contracts/
│   └── {applicationId}/
│       ├── contract.pdf
│       └── signed-contract.pdf
└── practitioners/
    └── {practitionerId}/
        └── profile-photo.jpg
```

### Security

- **Upload:** Signed URLs with 15-minute expiry
- **Download:** SAS tokens generated on-demand
- **Access:** Private containers, no public access

---

## 5. Email & Notifications

### Azure Communication Services

```typescript
// Email service structure
const sendEmail = async (params: {
  to: string;
  subject: string;
  htmlContent: string;
}) => {
  // Uses verified domain: life-psychology.com.au
  // Sender: noreply@life-psychology.com.au
};
```

### Email Templates

| Template | Trigger |
|----------|---------|
| Application Received | New application submitted |
| Application Denied | Admin denies application |
| Waitlisted | Admin waitlists application |
| Interview Invitation | Admin schedules interview |
| Offer Sent | Admin sends offer |
| Acceptance Confirmation | Candidate accepts offer |
| Onboarding Instructions | After offer accepted |

**Template System:**
- HTML templates with inline CSS (email client compatibility)
- Gradient backgrounds matching Bloom aesthetic
- Responsive design

---

## 6. Analytics & Tracking

### Google Analytics 4

```typescript
// GA4 integration via react-ga4
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');

// Page views
ReactGA.send({ hitType: 'pageview', page: '/booking' });

// Events
ReactGA.event({
  category: 'Booking',
  action: 'start_booking',
  label: 'anxiety-therapy'
});
```

### Google Ads Conversion Tracking

```typescript
// Conversion tracking
const trackConversion = (conversionId: string, value?: number) => {
  window.gtag('event', 'conversion', {
    send_to: `AW-11563740075/${conversionId}`,
    value: value,
    currency: 'AUD'
  });
};

// Tracked conversions:
// - Booking intent
// - Book now clicks  
// - Completed bookings ($250 value)
// - Contact form submissions
// - Phone clicks
```

### Conversion Funnel

```
Awareness     Interest      Decision      Action        Retention
    │             │             │            │              │
    ▼             ▼             ▼            ▼              ▼
page_view → view_service → book_now → start_booking → confirm_booking
                    └──────────────────────────────────────────┘
                           Full funnel tracked with values
```

### A/B Testing Infrastructure

Custom-built A/B testing system:

```typescript
// Variant assignment (deterministic by session)
const getVariant = async (experimentName: string, sessionId: string) => {
  // Returns consistent variant for session
  // Weighted random assignment
  // Stored in ab_test_assignments table
};

// Conversion tracking
const trackConversion = async (sessionId: string, eventType: string, value?: number) => {
  // Links conversion to variant
  // Enables statistical analysis
};
```

**Current Experiments:**
- Hero image variants
- Booking flow copy
- CTA button colors

---

## 7. Marketing Website

### Separate Application

```
apps/website/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── Services/
│   │   │   ├── AnxietyDepression.tsx
│   │   │   ├── CouplesTherapy.tsx
│   │   │   ├── Neurodiversity.tsx
│   │   │   ├── NDIS.tsx
│   │   │   └── TraumaRecovery.tsx
│   │   ├── Pricing.tsx
│   │   ├── Appointments.tsx
│   │   ├── Contact.tsx
│   │   └── FAQ.tsx
│   └── services/
│       └── applicationApi.ts
├── public/
│   ├── staticwebapp.config.json
│   └── sitemap.xml
└── package.json
```

### SEO Implementation

- **React Helmet** for meta tags
- **Sitemap.xml** for search engines
- **Canonical URLs** to prevent duplicates
- **Structured data** (JSON-LD) for services
- **Performance optimized** (Lighthouse scores monitored)

### Booking Integration

The marketing site connects to the same API for:
- Fetching practitioner availability
- Creating booking sessions
- Processing payments (Stripe)

---

## 8. Infrastructure & Deployment

### Environments

| Environment | Branch | Frontend URL | API URL |
|-------------|--------|--------------|---------|
| Development | `develop` | gray-stone-xxx.azurestaticapps.net | bloom-functions-dev |
| Staging | `staging` | lpa-bloom-staging.azurestaticapps.net | bloom-functions-staging |
| Production | `main` | bloom.life-psychology.com.au | bloom-platform-functions-v2 |

### CI/CD Pipeline (GitHub Actions)

```yaml
# Simplified workflow
on:
  push:
    branches: [develop, staging, main]

jobs:
  detect-changes:
    # Smart change detection - only deploy what changed
    
  quality-checks:
    # Parallel: lint, typecheck
    
  deploy-bloom-portal:
    if: needs.detect-changes.outputs.bloom-changed == 'true'
    # Build and deploy React app
    
  deploy-website:
    if: needs.detect-changes.outputs.website-changed == 'true'
    # Build and deploy marketing site
    
  deploy-api:
    if: needs.detect-changes.outputs.api-changed == 'true'
    # Build and deploy Azure Functions
    
  run-migrations:
    if: needs.detect-changes.outputs.migrations-changed == 'true'
    # Apply database migrations
```

### Azure Resources

| Resource | SKU/Tier | Purpose |
|----------|----------|---------|
| Static Web Apps | Free/Standard | Frontend hosting |
| Functions | Consumption | Serverless API |
| SQL Database | Basic (5 DTU) | Primary database |
| Blob Storage | Standard LRS | File storage |
| Communication Services | Pay-as-you-go | Email/SMS |
| Container Apps | Consumption | Halaxy sync worker |
| Key Vault | Standard | Secrets |
| Application Insights | Pay-as-you-go | Monitoring |

### Monthly Infrastructure Cost

~$150-200 AUD (primarily SQL Database + Functions execution)

---

## 9. Security

### Authentication

- **Azure AD B2C** for practitioner/admin authentication
- **MSAL.js** library for token management
- **JWT tokens** with role claims

### API Security

- CORS configured per environment
- HTTPS enforced
- Input validation (Zod schemas)
- SQL injection prevention (parameterized queries)

### Data Protection

- Blob storage: Private access only
- Database: Azure-managed encryption at rest
- Secrets: Azure Key Vault
- No PII in logs

---

## 10. Monitoring & Observability

### Application Insights

- API request tracking
- Dependency tracking (SQL, Halaxy, Blob)
- Custom metrics
- Exception logging

### Health Endpoints

```
GET /api/health        # Basic health check
GET /api/smoke-test    # Full system test (DB, Blob, Email)
```

### Alerting

- Azure Monitor alerts on:
  - API error rate > 5%
  - Response time > 2s
  - Failed deployments

---

## Summary

**What Exists:**
- Production-ready React applications (portal + marketing site)
- Serverless API with 45+ endpoints
- Full CI/CD with environment promotion
- Halaxy integration (sync + real-time)
- Complete analytics stack (GA4 + Ads + custom A/B)
- Email notification system
- File upload/storage system
- Database with 25 migrations

**Architecture Principles:**
- Serverless-first (pay for what you use)
- TypeScript everywhere (type safety)
- Component-based UI (shadcn/ui + custom)
- API-first design (frontend agnostic)
- Environment parity (dev ≈ staging ≈ prod)
