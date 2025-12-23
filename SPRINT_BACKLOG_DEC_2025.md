# Sprint Backlog: December 22, 2025 - January 4, 2026

> **Last Updated**: December 22, 2025
> **Sprint Goal**: Application Review Workflow + Practitioner Onboarding
> **Release Date**: January 4, 2026

---

## Context

This sprint focuses on building a proper **application lifecycle** for psychologists applying to join Bloom/Life Psychology Australia. Currently, applications are submitted but admin review is limited to basic status changes. We need:

1. **Richer admin review actions** (deny, waitlist, schedule interview, accept)
2. **Automated emails** for each status change
3. **Onboarding flow** for accepted practitioners (create account, set password)
4. **Active flag** that controls visibility on LPA website and availability for bookings

---

## Application Lifecycle Flow

```
┌─────────────┐     ┌──────────────────────────────────────────────────────┐
│  SUBMITTED  │────►│                   ADMIN REVIEW                        │
└─────────────┘     │                                                        │
                    │  ┌─────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐│
                    │  │  DENY   │  │ WAITLIST  │  │ INTERVIEW │  │ ACCEPT ││
                    │  └────┬────┘  └─────┬─────┘  └─────┬─────┘  └───┬────┘│
                    └───────┼─────────────┼─────────────┼─────────────┼─────┘
                            │             │             │             │
                            ▼             ▼             ▼             ▼
                       Email:        Email:        Email:        Email:
                       Sorry,        On file       Interview     ONBOARDING
                       not accepted  for now       booking link  INVITATION
                                                                      │
                                                                      ▼
                                                         ┌─────────────────────┐
                                                         │  /onboarding/:token │
                                                         │  • Create username  │
                                                         │  • Create password  │
                                                         │  • Set up profile   │
                                                         │  • Platform tour    │
                                                         └──────────┬──────────┘
                                                                    │
                                                                    ▼
                                                         ┌─────────────────────┐
                                                         │  PRACTITIONER       │
                                                         │  • Can login        │
                                                         │  • is_active=false  │
                                                         └──────────┬──────────┘
                                                                    │
                                                                    ▼
                                                         ┌─────────────────────┐
                                                         │  Admin sets ACTIVE  │
                                                         │  → Shows on website │
                                                         │  → Available to book│
                                                         └─────────────────────┘
```

---

## Epic 1: Application Review Workflow ⭐ P1

**Goal**: Give admins proper workflow tools with real consequences

| Story | Description | Points | Status |
|-------|-------------|--------|--------|
| 1.1 | **DB Migration**: Add statuses `denied`, `waitlisted`, `interview_scheduled`, `accepted` to applications table | 2 | ✅ Complete |
| 1.2 | **Admin UI**: Add action buttons for each status (Deny, Waitlist, Schedule Interview, Accept) | 3 | Not Started |
| 1.3 | **Email Templates**: Create templates for deny, waitlist, interview request | 3 | Not Started |
| 1.4 | **Interview Scheduling**: Add date/time picker, send email with booking link | 2 | Not Started |
| 1.5 | **Admin Notes**: Add notes/comments field for admin to record review decisions | 2 | Not Started |

**Total**: 12 points

### Technical Details - Epic 1

**1.1 Database Migration**
```sql
-- Update status constraint
ALTER TABLE applications DROP CONSTRAINT [check_status];
ALTER TABLE applications ADD CONSTRAINT [check_status] 
  CHECK (status IN ('submitted', 'reviewing', 'denied', 'waitlisted', 'interview_scheduled', 'accepted'));

-- Add new columns
ALTER TABLE applications ADD admin_notes NVARCHAR(MAX) NULL;
ALTER TABLE applications ADD interview_scheduled_at DATETIME2 NULL;
ALTER TABLE applications ADD interview_notes NVARCHAR(MAX) NULL;
```

**1.2 Admin UI Location**: `src/features/admin/ApplicationDetail.tsx`
- Add action buttons: Deny, Waitlist, Schedule Interview, Accept
- Each button triggers status update + email

**1.3 Email Service**: Create `api/src/services/email.ts`
- Use Azure Communication Services or SendGrid
- Templates for each status change

---

## Epic 2: Acceptance + Onboarding ⭐ P1

**Goal**: Accepted applications become practitioners with login credentials

| Story | Description | Points | Status |
|-------|-------------|--------|--------|
| 2.1 | **DB Migration**: Create `practitioners` table with profile fields, `is_active`, `password_hash`, `onboarding_token` | 3 | Not Started |
| 2.2 | **Accept Action**: Creates practitioner record + generates onboarding token + sends invite email | 3 | Not Started |
| 2.3 | **Onboarding Page**: `/onboarding/:token` - set username/password, complete profile | 5 | Not Started |
| 2.4 | **Platform Tour**: Walkthrough/tour on first login | 3 | Not Started |
| 2.5 | **Admin Active Toggle**: Toggle `is_active` in admin practitioner view | 2 | Not Started |

**Total**: 16 points

### Technical Details - Epic 2

**2.1 Practitioners Table**
```sql
CREATE TABLE practitioners (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  application_id INT REFERENCES applications(id),
  
  -- From application
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  phone NVARCHAR(50),
  ahpra_number NVARCHAR(50),
  specializations NVARCHAR(MAX), -- JSON array
  
  -- Profile (editable)
  display_name NVARCHAR(200),
  bio NVARCHAR(MAX),
  profile_photo_url NVARCHAR(500),
  
  -- Auth
  password_hash NVARCHAR(255),
  onboarding_token NVARCHAR(100),
  onboarding_token_expires_at DATETIME2,
  onboarding_completed_at DATETIME2,
  
  -- Status
  is_active BIT DEFAULT 0, -- Controls visibility on website + bookings
  
  -- Timestamps
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_practitioners_email ON practitioners(email);
CREATE INDEX idx_practitioners_active ON practitioners(is_active);
CREATE INDEX idx_practitioners_onboarding_token ON practitioners(onboarding_token);
```

**2.3 Onboarding Page Location**: `src/pages/Onboarding.tsx`
- Route: `/onboarding/:token`
- Steps:
  1. Validate token (not expired)
  2. Create password (with confirmation)
  3. Complete/verify profile info
  4. Platform tour/walkthrough
  5. Redirect to login

---

## Epic 3: LPA Website Team Page ⭐ P2 (Next Sprint)

**Goal**: Auto-generated team page from active practitioners

| Story | Description | Points | Status |
|-------|-------------|--------|--------|
| 3.1 | **API Endpoint**: `GET /api/public/practitioners` returns active practitioners only | 2 | Not Started |
| 3.2 | **Team Page**: Build `/our-team` page in `apps/website` | 5 | Not Started |
| 3.3 | **Performance**: Ensure CLS=0, LCP < 2.5s | 1 | Not Started |

**Total**: 8 points

---

## Epic 4: Multi-Clinician Booking 🔮 Future Sprint

**Goal**: Update booking flow to support multiple clinicians

| Story | Description | Points | Status |
|-------|-------------|--------|--------|
| 4.1 | Update booking CTA to show clinician selector | 5 | Not Started |
| 4.2 | Filter availability by selected clinician | 5 | Not Started |
| 4.3 | Update Halaxy integration for multi-practitioner | 5 | Not Started |
| 4.4 | Update booking confirmation with clinician details | 2 | Not Started |

**Total**: 17 points

---

## Sprint Scope

### This Sprint (Dec 22 - Jan 4)
- ✅ **Epic 1**: Application Review Workflow (12 points)
- ✅ **Epic 2**: Acceptance + Onboarding (16 points)
- **Total**: 28 points

### Next Sprint (Jan 4+)
- Epic 3: Team Page
- Epic 4: Multi-Clinician Booking

---

## Current System State

### Existing Files
- **Application Form**: `src/pages/JoinUs.tsx` (1673 lines)
- **Application API**: `api/src/functions/applications.ts`
- **Admin Portal**: `src/features/admin/`
- **Design Tokens**: `src/design-system/tokens.ts`
- **Types**: `src/types/bloom.ts`

### Existing Application Statuses
Current statuses in DB: `submitted`, `reviewing`, `approved`, `rejected`

### Database
- Azure SQL Database
- Applications table exists with basic fields
- No practitioners table yet

### Authentication
- Azure AD B2C for admin portal
- MSAL for frontend auth
- Practitioners will need separate auth (username/password via onboarding)

---

## Email Templates Needed

### 1. Denial Email
```
Subject: Your Bloom Application

Dear {first_name},

Thank you for your interest in joining Bloom.

After careful review, we regret to inform you that we are unable to proceed 
with your application at this time.

We wish you all the best in your professional journey.

Warm regards,
The Bloom Team
```

### 2. Waitlist Email
```
Subject: Your Bloom Application - On Waitlist

Dear {first_name},

Thank you for your application to join Bloom.

While we were impressed with your credentials, we don't currently have 
positions available. We've added you to our waitlist and will reach out 
when opportunities arise.

Warm regards,
The Bloom Team
```

### 3. Interview Request Email
```
Subject: Bloom Application - Interview Invitation

Dear {first_name},

Great news! We'd love to learn more about you.

Zoe would like to schedule a brief interview to discuss your application.

Interview Details:
Date: {interview_date}
Time: {interview_time}

Please confirm your availability by replying to this email.

Warm regards,
The Bloom Team
```

### 4. Acceptance + Onboarding Email
```
Subject: Welcome to Bloom! 🌸

Dear {first_name},

Congratulations! Your application to join Bloom has been accepted.

To get started, please complete your onboarding:

{onboarding_link}

This link will expire in 7 days.

During onboarding, you'll:
• Create your login credentials
• Set up your professional profile
• Take a quick tour of the platform

We're excited to have you join us!

Warm regards,
The Bloom Team
```

---

## Performance Requirements

All new pages must meet:
- **Performance Score**: ≥ 90
- **LCP**: < 2.5s
- **CLS**: 0
- **TBT**: < 200ms

---

## Notes

- **Active flag**: Single flag controls both website visibility AND booking availability
- **No visible flag**: Removed per user feedback - simpler model
- **Onboarding creates credentials**: Practitioners set their own password during onboarding
- **Admin controls activation**: After onboarding, admin must explicitly activate practitioner
