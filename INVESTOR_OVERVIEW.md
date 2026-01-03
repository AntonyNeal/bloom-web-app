# Bloom Platform - Technology & Business Overview

**Prepared for Prospective Investors**  
**Life Psychology Australia Pty Ltd**  
**January 2026**

---

## Executive Summary

Bloom is Life Psychology Australia's proprietary digital platform for practitioner recruitment, practice management, and telehealth service delivery. Built on a modern, scalable cloud architecture, Bloom enables psychologists and mental health practitioners to join our network, manage their practice, and deliver care to patients across Australia.

**Live Platform:** https://bloom.life-psychology.com.au

---

## 1. Technology Architecture

### 1.1 Full-Stack Overview

Bloom is built on a modern, serverless architecture optimized for scalability, security, and cost efficiency.

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18/19, Next.js 16, TypeScript, Tailwind CSS |
| **UI Framework** | shadcn/ui, Radix UI, Framer Motion |
| **Backend** | Azure Functions v4 (Node.js 18), serverless |
| **Databases** | Azure SQL (relational), Cosmos DB (NoSQL) |
| **Storage** | Azure Blob Storage (documents), CDN |
| **Authentication** | Azure AD B2C, Microsoft Entra ID, MSAL |
| **Infrastructure** | Azure Static Web Apps, Container Apps, Key Vault |
| **CI/CD** | GitHub Actions, automated deployments |

### 1.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AZURE CLOUD (Australia East)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        FRONTEND LAYER                                │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│   │  │ Development  │  │   Staging    │  │  Production  │               │   │
│   │  │  Static Web  │  │  Static Web  │  │  Static Web  │               │   │
│   │  │     App      │  │     App      │  │     App      │               │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         API LAYER                                    │   │
│   │  ┌─────────────────────────────────────────────────────────────┐    │   │
│   │  │           Azure Functions (Serverless API)                   │    │   │
│   │  │  • Applications    • Practitioners   • Booking               │    │   │
│   │  │  • Payments        • A/B Testing     • Halaxy Sync           │    │   │
│   │  │  • Authentication  • Onboarding      • Dashboard             │    │   │
│   │  └─────────────────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│          ┌─────────────────────────┼─────────────────────────┐              │
│          ▼                         ▼                         ▼              │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐       │
│   │  Azure SQL   │         │ Blob Storage │         │  Cosmos DB   │       │
│   │  Database    │         │  (Documents) │         │  (Analytics) │       │
│   │              │         │              │         │              │       │
│   │ Applications │         │ CVs, Certs   │         │ A/B Tests    │       │
│   │ Practitioners│         │ Photos       │         │ Experiments  │       │
│   │ Sessions     │         │ Contracts    │         │ Version Ctrl │       │
│   └──────────────┘         └──────────────┘         └──────────────┘       │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    INTEGRATION LAYER                                 │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│   │  │   Halaxy     │  │   Stripe     │  │  Microsoft   │               │   │
│   │  │  (Practice   │  │  (Payments)  │  │   Graph API  │               │   │
│   │  │  Management) │  │              │  │  (Identity)  │               │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    SECURITY & MONITORING                             │   │
│   │  • Azure Key Vault (Secrets)        • Application Insights          │   │
│   │  • Azure AD B2C (Authentication)    • Log Analytics                 │   │
│   │  • HTTPS/TLS Everywhere             • Health Monitoring             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Integrations

| Integration | Purpose | Status |
|-------------|---------|--------|
| **Halaxy** | Australia's leading practice management system. Real-time availability sync, appointment booking, practitioner data. | ✅ Production |
| **Stripe** | Payment processing with Australian compliance. Payment intents, captures, refunds. | ✅ Production |
| **Microsoft 365** | Real @life-psychology.com.au email accounts for practitioners with full Outlook mailboxes. | ✅ Production |
| **Azure AD B2C** | Secure single sign-on authentication with MFA support. | ✅ Production |
| **Azure Communication Services** | SMS notifications and verification. | 🔄 In Progress |

---

## 2. User Experience & Design Philosophy

### 2.1 Design Philosophy: "Warm Professional Fairy Godmother"

Bloom's design philosophy balances warmth with clinical credibility:

- **30% Personality**: Warm, encouraging, human-centered interactions
- **70% Competence**: Professional, trustworthy, clinically appropriate
- **Aesthetic Inspiration**: Studio Ghibli meets Linear—organic beauty with precision

### 2.2 Visual Identity

| Element | Implementation |
|---------|----------------|
| **Primary Color** | Sage Green (#4a7c5d) — Trust, growth, healing |
| **Secondary Color** | Terracotta (#c7826d) — Humanity, approachability |
| **Accent Color** | Soft Gold (#d4a574) — Quality, gentle optimism |
| **Typography** | Poppins (headings), Inter (body) |
| **Iconography** | Custom botanical illustrations, animated flower SVGs |

### 2.3 Accessibility Excellence (WCAG AAA)

Designed for healthcare professionals aged 40-70+:

| Standard | Requirement | Bloom Implementation |
|----------|-------------|---------------------|
| **Font Size** | 16px minimum | 18px base (desktop), 17px (mobile) |
| **Contrast** | 7:1 (AAA) | 19:1 ratio achieved |
| **Touch Targets** | 44px (AA) | 48px minimum |
| **Focus Indicators** | 2px visible | 3px with offset |
| **Motion** | Respect preferences | `prefers-reduced-motion` support |
| **Screen Readers** | ARIA compliance | Radix UI primitives |

### 2.4 Signature UI Elements

- **Blossom Tree Visualization**: Practitioner dashboard features an animated tree where each blossom represents a patient session, creating a visual "garden" of their practice growth
- **Ambient Backgrounds**: Studio Ghibli-inspired animated backgrounds with floating particles and gradient skies
- **Tier Flowers**: Custom animated SVG flowers representing practitioner tier levels (Tier 1/2/3)
- **Personalized Touches**: Favourite flower collected during application, revealed as a surprise during onboarding

---

## 3. Platform Features

### 3.1 Public Website

| Feature | Description |
|---------|-------------|
| **Landing Page** | Animated "garden" design showcasing services and practitioner network |
| **Service Pages** | Individual Therapy, Couples Therapy, Trauma & PTSD, NDIS, and more |
| **Join Us Application** | Multi-step application form for psychologists with document upload |
| **Booking Integration** | Real-time availability from Halaxy practice management |

### 3.2 Practitioner Portal

| Feature | Description |
|---------|-------------|
| **Practice Dashboard** | Visual representation of practice growth with blossom tree |
| **Business Coach** | Analytics and growth metrics for practitioners |
| **Calendar Integration** | Synced with Halaxy appointments |
| **Session Management** | Patient session tracking and notes |

### 3.3 Admin Portal

| Feature | Description |
|---------|-------------|
| **Application Review** | Queue-based workflow for reviewing practitioner applications |
| **Approval Workflow** | Accept → Onboard → Provision email → Activate pipeline |
| **A/B Testing Dashboard** | Real-time experiment management with statistical significance |
| **System Health** | Smoke tests and monitoring dashboard |

### 3.4 Automated Onboarding Pipeline

When a practitioner is approved:

1. **Application Accepted** → Practitioner record created
2. **Onboarding Email** → Unique token-based onboarding link sent
3. **Onboarding Completion** → Practitioner sets password, accepts contract
4. **Account Provisioning** → Real @life-psychology.com.au email created automatically
5. **M365 License** → Full Microsoft 365 access (Outlook, Teams)
6. **Halaxy Sync** → Practitioner data synced to practice management

---

## 4. Technical Differentiators

### 4.1 Cost-Efficient Architecture

| Resource | Monthly Cost | Notes |
|----------|-------------|-------|
| Azure Static Web Apps | $0 | Free tier (3 environments) |
| Azure Functions | ~$0.20 | Consumption plan, pay-per-execution |
| Azure SQL Database | ~$5 | Basic tier, auto-scaling available |
| Blob Storage | ~$1 | Hot tier with CDN |
| Cosmos DB | ~$0 | Free tier (400 RU/s) |
| **Current Total** | **~$6.20/month** | At development scale |

**Scaling Projections:**
- 100 applications/month: ~$12/month
- 500 applications/month: ~$35/month
- 1,000+ practitioners: ~$150/month (with premium tiers)

### 4.2 DevOps Excellence

| Capability | Implementation |
|------------|----------------|
| **Source Control** | Git with branch protection, PR reviews |
| **CI/CD Pipeline** | GitHub Actions with automated testing |
| **Environments** | Development → Staging → Production |
| **Infrastructure as Code** | Bicep templates for all Azure resources |
| **Database Migrations** | Flyway-style versioned migrations |
| **Secrets Management** | Azure Key Vault with managed identity |
| **Monitoring** | Application Insights, Log Analytics |

### 4.3 Security Posture

- ✅ Azure AD B2C with MFA support
- ✅ Role-based access control (Admin, Practitioner, Patient)
- ✅ Private blob storage with pre-signed URLs
- ✅ SQL injection protection (parameterized queries)
- ✅ Input validation with Zod schemas
- ✅ HTTPS/TLS everywhere
- ✅ CORS configured per environment
- ✅ Key Vault for all secrets

---

## 5. Development Roadmap

### 5.1 Immediate Priorities (Q1 2026)

| Initiative | Description | Impact |
|------------|-------------|--------|
| **Unified Clinician Interface** | Combined video, booking, AI assistant, and calendar view | High - Practitioner efficiency |
| **Multi-Practitioner Website** | Auto-extend website when new clinicians added | High - Scalability |
| **SMS Notifications** | Azure Communication Services for appointment reminders | Medium - Patient engagement |

### 5.2 Near-Term Roadmap (Q2-Q3 2026)

| Initiative | Description | Impact |
|------------|-------------|--------|
| **AI Session Intelligence** | GPT-powered session note analysis and insights | High - Clinical value |
| **Group Therapy Platform** | Multi-participant session support | Medium - Service expansion |
| **Mobile Native App** | React Native iOS/Android app for practitioners | High - Accessibility |
| **Client Portal MVP** | Patient-facing portal for appointments and records | High - Patient experience |

### 5.3 Future Vision (2027+)

| Initiative | Description |
|------------|-------------|
| **Referrer Network** | GP referral tracking and integration |
| **Medicare Integration** | Automated bulk billing and claims |
| **AI Knowledge System** | LLM-powered clinical decision support |
| **Progress Tracking** | PHQ-9/GAD-7 outcome visualization |
| **Telehealth Platform** | Native video conferencing (replace third-party) |

---

## 6. Business Context

### 6.1 Market Position

Life Psychology Australia operates in the growing Australian mental health services market:

- **Mental health services** is one of Australia's fastest-growing healthcare sectors
- **Telehealth adoption** accelerated post-COVID, now a permanent fixture
- **Practitioner shortage** creates demand for efficient practice management
- **NDIS expansion** provides additional revenue streams

### 6.2 Target Users

| User Type | Current Status | Growth Potential |
|-----------|---------------|------------------|
| **Psychologists** | Active recruitment via Bloom | Primary focus |
| **Counsellors** | Secondary recruitment | Expansion opportunity |
| **Practice Admins** | Internal team | Platform tools |
| **Patients** | Via Halaxy booking | Client portal planned |

### 6.3 Competitive Advantages

1. **Technology-First Approach**: Modern architecture vs. legacy competitors
2. **Practitioner Experience**: Beautiful, accessible design for healthcare professionals
3. **Halaxy Integration**: Seamless sync with Australia's leading practice management
4. **Cost Efficiency**: Serverless architecture minimizes operational overhead
5. **Scalability**: Architecture designed for national expansion
6. **AI-Ready**: Foundation for AI-powered clinical tools

---

## 7. Key Metrics & KPIs

### 7.1 Platform Health

| Metric | Current | Target |
|--------|---------|--------|
| **Uptime** | 99.9% | 99.95% |
| **Page Load (LCP)** | <2.5s | <2.0s |
| **API Response Time** | <200ms | <150ms |
| **Error Rate** | <0.1% | <0.05% |

### 7.2 Business Metrics (Tracked)

- Practitioner applications received
- Application-to-approval conversion rate
- Onboarding completion rate
- Active practitioner count
- Patient booking volume
- A/B test conversion improvements

---

## 8. Team & Development Process

### 8.1 Development Methodology

- **Agile/Kanban** workflow with GitHub Issues
- **Feature branches** with PR reviews
- **Automated testing** in CI pipeline
- **Staged deployments** (Dev → Staging → Production)
- **Infrastructure as Code** for reproducibility

### 8.2 Technology Investment

The Bloom platform represents significant technology investment:

- **Frontend codebase**: 50,000+ lines of TypeScript/React
- **Backend services**: 15+ Azure Functions
- **Database schema**: 20+ tables with migrations
- **Infrastructure**: Fully codified in Bicep
- **Documentation**: Comprehensive technical and user docs

---

## Summary

Bloom represents a modern, scalable platform for Life Psychology Australia's practitioner network. Built on cloud-native Azure architecture with a focus on user experience and accessibility, the platform is positioned for growth while maintaining operational efficiency.

**Key Investment Highlights:**

1. **Proven Technology**: Production platform serving real users
2. **Scalable Architecture**: Serverless design scales from startup to enterprise
3. **Cost Efficient**: ~$6/month operational cost at current scale
4. **Modern Stack**: React 18/19, TypeScript, Azure—attractive for developer talent
5. **Clear Roadmap**: Defined path to AI integration and mobile expansion
6. **Market Timing**: Mental health services sector experiencing strong growth

---

*For technical demonstrations or additional information, please contact Life Psychology Australia.*

**Document Version:** 1.0  
**Last Updated:** January 3, 2026
