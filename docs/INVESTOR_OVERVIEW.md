# Bloom Platform — Investor Overview

**Life Psychology Australia**  
*January 2026*

---

## The Honest Summary

Bloom is the technology backbone we've built to run Life Psychology Australia — a psychology practice currently operating in Newcastle with plans to expand across the Hunter region and eventually Australia.

This isn't a pitch for the next unicorn. It's a practical, working system that solves real problems we encountered trying to scale a psychology practice. We built it because the existing solutions (Cliniko, Halaxy alone, etc.) weren't designed for what we needed: a modern, tech-forward practice that could onboard practitioners efficiently and give them tools to grow.

---

## What Problem Are We Solving?

**The Mental Health Supply Crisis**

Australia has a severe shortage of psychologists. Wait times for appointments are 6-8 weeks in cities, often months in regional areas. There's enormous demand but fragmented supply — most psychologists work solo, struggle with admin, and have no path to scale.

**Our Thesis**

We believe the solution is creating a **practitioner-friendly network** with:
1. Low friction onboarding (not 3-month credentialing nightmares)
2. Modern tools that make running a practice easier, not harder
3. A brand that attracts both practitioners AND clients
4. Technology that handles the boring stuff so clinicians can focus on therapy

---

## What We've Built (Honestly)

### The Practitioner Pipeline

A complete system for recruiting and onboarding psychologists:

| Stage | What Happens |
|-------|--------------|
| **Application** | Multi-step form validating AHPRA registration, qualifications, and fit |
| **Review** | Admin dashboard with workflow states (reviewing, waitlisted, interview, accepted) |
| **Verification** | Integration with Halaxy to confirm practitioner identity |
| **Onboarding** | Contract signing, profile setup, dashboard access |

**What's working:** The pipeline is live. We've processed applications and onboarded practitioners through it.

**What's honest:** It's still manual in places. An admin reviews each application. That's fine for now, but won't scale past ~50 practitioners without more automation.

### The Marketing Website

A full client-facing website at **life-psychology.com.au** with:

- Service pages (Anxiety, Couples, NDIS, Neurodiversity, Trauma)
- Online booking connected to real practitioner availability
- SEO optimization for Newcastle/Hunter region searches
- Conversion tracking and analytics

**What's working:** The site ranks, drives traffic, and converts visitors to bookings.

**What's honest:** We're one practice in one city. The SEO moat is regional, not national.

### Analytics & Marketing Integration

| Platform | What We Track |
|----------|---------------|
| **Google Analytics 4** | Full funnel: page views → booking intent → completed bookings |
| **Google Ads** | Conversion tracking with $250 booking value attribution |
| **Application Insights** | Infrastructure monitoring, API performance |
| **A/B Testing** | Custom infrastructure for testing booking flows, hero images, copy |

**Conversion ID:** `AW-11563740075`

We track the entire journey:
```
Page View → View Service → Book Now Click → Start Booking → Complete Details → Select Time → Confirm Booking
```

Each step has a conversion value. We know our CAC.

### The Practitioner Dashboard

Once onboarded, practitioners get:

- **Blossom Tree** — A visual representation of practice growth (clients as flowers, sessions as blooms)
- **Business Coach** — Analytics showing revenue, sessions, client retention
- **Today View** — Upcoming sessions with client context
- **Client Timeline** — Relationship history, MHCP sessions remaining

**What's working:** The dashboard exists and displays real data synced from Halaxy.

**What's honest:** Most practitioners still primarily use Halaxy directly. We need to add more value to make Bloom their default interface.

### Halaxy Integration

We integrate with Halaxy (our clinical practice management system) via their FHIR-R4 API:

- **Sync practitioners, patients, appointments** every 15 minutes
- **Real-time webhooks** for instant updates
- **Availability slots** pulled for booking system

**What's working:** The sync is reliable. Bookings made on our site appear in Halaxy.

**What's honest:** We're dependent on Halaxy. If they change their API or pricing, we have a problem. This is intentional — they handle clinical compliance, we handle growth.

---

## Technical Architecture

### Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | React + TypeScript + Vite | Fast, modern, type-safe |
| **Styling** | Tailwind + shadcn/ui | Rapid UI development |
| **Backend** | Azure Functions (Node.js) | Serverless, pay-per-use |
| **Database** | Azure SQL | Reliable, managed |
| **Files** | Azure Blob Storage | CV uploads, contracts |
| **Auth** | Azure AD B2C | Enterprise-grade auth |
| **Hosting** | Azure Static Web Apps | CDN, auto-scaling |

### Why Azure?

Honest answer: I knew Azure better than AWS. It's also slightly cheaper for our scale and has good compliance certifications for healthcare-adjacent applications.

### Infrastructure Cost

Current monthly Azure spend: **~$150-200 AUD**

This covers:
- Static Web Apps (frontend hosting)
- Functions (serverless API)
- SQL Database (basic tier)
- Blob Storage
- Container Apps (Halaxy sync worker)

It'll increase as we scale, but serverless architecture means we only pay for what we use.

---

## What's NOT Built Yet

Being honest about gaps:

| Feature | Status | Why It Matters |
|---------|--------|----------------|
| **Client Portal** | Planned | Clients can't self-manage bookings/payments |
| **Mobile App** | Planned | Most users are on mobile |
| **Multi-Location** | Planned | Only set up for one practice location |
| **AI Features** | Researching | Session notes assistance, client insights |
| **Automated Scheduling** | Partial | Still relies on Halaxy for complex scheduling |

---

## The Business Model

**Current:**
- Practitioners pay us 30-40% of session fees (industry standard)
- We provide: Brand, marketing, admin systems, client acquisition
- They get: Clients, zero admin headaches, flexibility

**Future Vision:**
- Scale to 20-50 practitioners in Hunter region
- Expand model to other regions via licensing or acquisition
- Technology platform potentially licensable to other practices

---

## Competitive Landscape

| Competitor | What They Do | Our Differentiation |
|------------|--------------|---------------------|
| **Headspace** | Corporate mental health | We're clinical, Medicare-focused |
| **BetterHelp** | Online-only | We're hybrid (telehealth + in-person) |
| **Solo practices** | Fragmented | We're networked, branded, tech-enabled |
| **Hospital outpatient** | Long waits, limited hours | We're flexible, modern |

**Honest assessment:** We're a small regional practice with good technology. The moat is execution and culture, not proprietary tech.

---

## Traction

**Current State (January 2026):**
- Marketing website live and ranking for regional keywords
- Practitioner application pipeline processing applicants
- Admin dashboard managing applications
- Halaxy integration syncing real data
- GA4 + Google Ads tracking full conversion funnel

**What We Need:**
- More practitioners (supply)
- More client bookings (demand)
- Proof that the model works before expanding

---

## Use of Funds (If Applicable)

If we were seeking investment, it would go to:

| Category | Allocation | Purpose |
|----------|------------|---------|
| **Marketing** | 40% | Google Ads, SEO, brand awareness |
| **Hiring** | 30% | Admin support, potentially another dev |
| **Tech** | 20% | Mobile app, AI features, scale infrastructure |
| **Buffer** | 10% | Healthcare is unpredictable |

We're not burning cash to grow. The model is designed to be unit-economic positive from day one.

---

## Risks (The Honest Part)

| Risk | Mitigation |
|------|------------|
| **Halaxy dependency** | Could migrate to Cliniko or build our own clinical system, but costly |
| **Solo founder tech risk** | Core functionality works; could hire if needed |
| **Regulatory changes** | Medicare rebates could change; NDIS is politically volatile |
| **Practitioner churn** | Culture and tooling need to be genuinely better than going solo |
| **Competition** | Big players could enter regional markets |

---

## Why Might This Work?

1. **The demand is real** — Mental health crisis isn't going away
2. **The tech is working** — Not vaporware; it's deployed and processing real applications
3. **The model is proven** — Practice networks exist; we're just adding better tech
4. **Regional focus** — Less competition, strong community ties
5. **Practitioner-centric** — If practitioners love it, they'll stay and refer others

---

## Contact

Life Psychology Australia  
Newcastle, NSW  
Website: [life-psychology.com.au](https://life-psychology.com.au)  
Bloom Platform: [bloom.life-psychology.com.au](https://bloom.life-psychology.com.au)

---

*This document was prepared to be honest, not impressive. If you want glossy projections and hockey-stick graphs, we can produce those too — but they'd be fiction. What we have is a working system solving a real problem in a market with genuine demand.*
