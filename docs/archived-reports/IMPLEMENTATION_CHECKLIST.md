# ✅ Bloom Application Workflow - Implementation Checklist

**Version:** 1.0  
**Status:** Ready for Development  
**Target:** Q1 2026

---

## 📋 Pre-Implementation

### Research & Planning
- [ ] Read `BLOOM_DESIGN_SYSTEM_AND_WORKFLOW_PHILOSOPHY.md`
- [ ] Read `MIYAZAKI_DESIGN_PATTERNS_FOR_BLOOM.md`
- [ ] Read `APPLICATION_WORKFLOW_IMPLEMENTATION_GUIDE.md`
- [ ] Review `BLOOM_QUICK_REFERENCE.md` (keep open while coding)
- [ ] Understand the Bloom color system and why each color is chosen
- [ ] Understand Miyazaki principles (respect the moment, show don't tell, etc.)
- [ ] Align team on warm, encouraging tone

### Technical Setup
- [ ] Verify Tailwind config has all Bloom colors
- [ ] Verify design system tokens are exported
- [ ] Set up form state management (Context or Redux)
- [ ] Verify Azure Functions API endpoints
- [ ] Verify email service (Azure Communication Services or SendGrid)
- [ ] Database schema ready for applications table

---

## 🎨 Phase 1: Foundation (Week 1-2)

### Design System Verification
- [ ] Test all sage green shades in real context
- [ ] Test all lavender shades for readability
- [ ] Verify cream backgrounds don't strain eyes
- [ ] Test focus indicators with keyboard navigation
- [ ] Verify accessibility (WCAG AA) with aXe or similar
- [ ] Test on mobile (responsive)

### Component Library
- [ ] Create `BloomInput.tsx` component
  - [ ] Focus ring (sage-300)
  - [ ] Success checkmark animation
  - [ ] Help text below field
  - [ ] Error state styling
  - [ ] Proper spacing

- [ ] Create `BloomButton.tsx` component
  - [ ] Primary variant (sage-600)
  - [ ] Secondary variant (lavender)
  - [ ] Hover states
  - [ ] Focus indicators
  - [ ] Loading state

- [ ] Create `FormStep.tsx` wrapper
  - [ ] Title, subtitle, description
  - [ ] Time estimate display
  - [ ] Icon support
  - [ ] Breathing space

- [ ] Create `ProgressIndicator.tsx`
  - [ ] Visual step indicators
  - [ ] Connection lines
  - [ ] Percentage complete
  - [ ] Current step highlight

- [ ] Create `EmpatheticMessage.tsx`
  - [ ] Lavender background
  - [ ] Left border accent
  - [ ] Warm, encouraging text

### Context & State
- [ ] Create `ApplicationContext.tsx`
- [ ] Set up useApplicationContext hook
- [ ] Test state updates
- [ ] Verify form data persistence (localStorage fallback)

---

## 🚀 Phase 2: Pages (Week 2-3)

### Landing Page
**File:** `src/pages/ApplicationLanding.tsx`

- [ ] Hero section
  - [ ] Compelling headline
  - [ ] Warm subtitle
  - [ ] Call to action

- [ ] Why Join section
  - [ ] 3-4 key benefits
  - [ ] Icons for each
  - [ ] Warm descriptions

- [ ] Requirements section
  - [ ] Clear list of what you need
  - [ ] Checkmark design (sage green)
  - [ ] Not intimidating

- [ ] Timeline section
  - [ ] Visual timeline
  - [ ] Clear stages
  - [ ] Time expectations

- [ ] CTA section
  - [ ] Strong gradient background
  - [ ] Clear button
  - [ ] Sense of opportunity

- [ ] **Miyazaki Check:**
  - [ ] Shows the journey visually
  - [ ] No unnecessary instructions
  - [ ] Warm, inviting tone
  - [ ] Celebrates the opportunity

### Multi-Step Form Page
**File:** `src/pages/ApplicationForm.tsx`

- [ ] Progress indicator
  - [ ] Shows current step
  - [ ] Shows all steps
  - [ ] Shows percentage complete

- [ ] Form container
  - [ ] Max-width centered
  - [ ] Proper spacing
  - [ ] White background

- [ ] Navigation buttons
  - [ ] Back button (disabled on first step)
  - [ ] Next/Submit button
  - [ ] Proper spacing
  - [ ] Clear labels

- [ ] **Miyazaki Check:**
  - [ ] Each step feels intentional
  - [ ] Progress is visible
  - [ ] User can breathe between sections
  - [ ] Encouraging feedback at each step

### Success Page
**File:** `src/pages/ApplicationSuccess.tsx`

- [ ] Celebration
  - [ ] Large emoji (🌸)
  - [ ] Warm congratulations heading
  - [ ] Encouraging subtitle

- [ ] What's Next section
  - [ ] Timeline of approval process
  - [ ] Clear expectations
  - [ ] Honest time estimates

- [ ] Call to action
  - [ ] "View practitioner dashboard" preview
  - [ ] Show what they'll get access to
  - [ ] Build anticipation

- [ ] Support info
  - [ ] Email for questions
  - [ ] Help article links
  - [ ] Clear next steps

- [ ] **Miyazaki Check:**
  - [ ] Celebrates the moment
  - [ ] Shows the journey ahead
  - [ ] Builds community feeling
  - [ ] Warm, supportive tone

---

## 📝 Phase 3: Form Steps (Week 2-3)

### Step 1: Personal Information
**File:** `src/components/application/PersonalInfoStep.tsx`

- [ ] First name input
  - [ ] Label, help text
  - [ ] Validation on blur
  - [ ] Success feedback

- [ ] Last name input
  - [ ] Label, help text
  - [ ] Validation on blur
  - [ ] Success feedback

- [ ] Email input
  - [ ] Label, help text
  - [ ] Email validation
  - [ ] Success feedback

- [ ] Phone input
  - [ ] Label, help text
  - [ ] Optional vs required clarity
  - [ ] Format validation

- [ ] Location input
  - [ ] Label, help text
  - [ ] State/territory selector
  - [ ] Validation

- [ ] **Microcopy:**
  - [ ] "First Name (as it appears professionally)"
  - [ ] "We'll use this to verify your credentials"
  - [ ] "Phone is optional but helpful for clients"
  - [ ] "Which state are you practicing in?"

- [ ] **Miyazaki Check:**
  - [ ] Clear purpose ("Let us know who you are")
  - [ ] Warm help text
  - [ ] Success celebration
  - [ ] Proper spacing

### Step 2: Qualifications
**File:** `src/components/application/QualificationsStep.tsx`

- [ ] Qualifications list
  - [ ] Show each added qualification
  - [ ] Delete button for each
  - [ ] Empty state message

- [ ] Add qualification form
  - [ ] Degree/certification field
  - [ ] Institution field
  - [ ] Year completed field
  - [ ] License number field (optional)
  - [ ] Add button

- [ ] Validation
  - [ ] Require at least one qualification
  - [ ] Year must be reasonable
  - [ ] Institution autocomplete (nice to have)

- [ ] **Microcopy:**
  - [ ] "Your Professional Qualifications"
  - [ ] "We'll verify these with relevant boards"
  - [ ] "Master's in Clinical Psychology"
  - [ ] "Thanks! Your qualifications look great"

- [ ] **Miyazaki Check:**
  - [ ] Respects importance of credentials
  - [ ] Not rushed (can add multiple)
  - [ ] Celebrates each addition
  - [ ] Clear purpose

### Step 3: Practice Details
**File:** `src/components/application/PracticeDetailsStep.tsx`

- [ ] Services offered
  - [ ] Checkboxes for services
  - [ ] "Individual therapy", "Couples", "Group", etc.
  - [ ] Multi-select

- [ ] Modalities/approaches
  - [ ] Checkboxes for modalities
  - [ ] "CBT", "Psychodynamic", "ACT", etc.
  - [ ] Multi-select

- [ ] Populations served
  - [ ] Checkboxes for populations
  - [ ] "Adolescents", "Adults", "Families", etc.
  - [ ] Multi-select

- [ ] Accepting clients
  - [ ] Toggle: "Currently accepting new clients?"
  - [ ] Clear yes/no

- [ ] **Microcopy:**
  - [ ] "How You Practice"
  - [ ] "Tell us about your expertise. This helps clients find the right fit."
  - [ ] "What services do you offer?"
  - [ ] "Which modalities or approaches do you use?"

- [ ] **Miyazaki Check:**
  - [ ] Shows respect for their expertise
  - [ ] Helps build community (matching)
  - [ ] Not overwhelming (clear options)
  - [ ] Warm, professional tone

### Step 4: Availability
**File:** `src/components/application/AvailabilityStep.tsx`

- [ ] Timezone selector
  - [ ] Dropdown with Australian timezones
  - [ ] Default to their state's timezone

- [ ] Hours per week
  - [ ] Number input
  - [ ] Help text ("How many hours/week?")

- [ ] Days available
  - [ ] Checkboxes (Mon-Sun)
  - [ ] Multi-select

- [ ] Consultation types
  - [ ] Toggles for: Phone, Video, In-person
  - [ ] Checkboxes

- [ ] **Microcopy:**
  - [ ] "When You're Available"
  - [ ] "Let clients know when they can book with you"
  - [ ] "Australian Eastern Standard Time (AEST)"
  - [ ] "How many hours per week can you dedicate to clients?"

- [ ] **Miyazaki Check:**
  - [ ] Practical, not philosophical
  - [ ] Clear simple options
  - [ ] Honest about what clients need
  - [ ] Warm, professional tone

### Step 5: Review & Confirm
**File:** `src/components/application/ReviewStep.tsx`

- [ ] Summary of all information
  - [ ] Personal info (read-only)
  - [ ] Qualifications (list view)
  - [ ] Practice details (list view)
  - [ ] Availability (summary)

- [ ] Edit buttons
  - [ ] "Edit" link for each section
  - [ ] Takes user back to that step
  - [ ] Preserves form data

- [ ] Confirmation checkbox
  - [ ] "I confirm this information is accurate"
  - [ ] "I understand this will be verified"
  - [ ] Must check to submit

- [ ] Submit button
  - [ ] Clear, warm label
  - [ ] Disabled until confirmation checked
  - [ ] Shows loading state during submission

- [ ] **Microcopy:**
  - [ ] "Double-check everything looks good"
  - [ ] "Make sure your information is accurate"
  - [ ] "I confirm this information is correct"
  - [ ] "Submit Application"

- [ ] **Miyazaki Check:**
  - [ ] Moment of reflection (not rushed)
  - [ ] Easy to edit if needed
  - [ ] Clear what you're confirming
  - [ ] Warm, supportive tone

---

## 🔄 Phase 4: Backend Integration (Week 3-4)

### Halaxy Integration (CRITICAL FOR ONBOARDING)

**IMPORTANT:** The onboarding workflow depends on Halaxy validation. See `HALAXY_INTEGRATION_AND_CLINICIAN_VALIDATION.md` for complete details.

- [ ] Verify Halaxy API credentials and endpoint
- [ ] Create Halaxy account in Bloom database schema
- [ ] Add fields to Applications table:
  - `halaxy_account_id` (string, nullable)
  - `halaxy_validated` (boolean, default false)
  - `halaxy_sync_date` (timestamp, nullable)
  - `onboarding_email_sent` (timestamp, nullable)

- [ ] Create API endpoint: `GET /api/admin/applications/{id}/halaxy-status`
  - Checks Bloom database for validation status
  - Can also query Halaxy API if needed
  - Returns: `{ validated: boolean, status: string, error?: string }`

- [ ] Create API endpoint: `POST /api/admin/applications/{id}/sync-halaxy`
  - Syncs clinician data from Bloom to Halaxy
  - Calls Halaxy API to create/update account
  - Returns: `{ halaxy_account_id: string, status: string }`

- [ ] Create webhook receiver: `POST /api/webhooks/halaxy-validation`
  - Receives "clinician validated" event from Halaxy
  - Updates Application: `halaxy_validated = true`
  - Triggers UI update to enable "Send Onboarding" button

- [ ] Update `sendOnboardingEmail` function:
  - Add validation checks:
    ```typescript
    if (application.status !== 'approved') return 403;
    if (!application.halaxy_validated) return 403;
    if (!application.halaxy_account_id) return 403;
    ```
  - Send email with Halaxy credentials
  - Update Application: `onboarding_email_sent = now()`

- [ ] Test Halaxy API integration
  - Create test account in Halaxy
  - Verify validation webhook fires
  - Verify Bloom receives and processes webhook
  - Verify button enables in admin UI

### API Endpoints

#### Submit Application
**POST** `/api/applications`

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "qualifications": [
    {
      "degree": "string",
      "institution": "string",
      "year": "number",
      "licenseNumber": "string"
    }
  ],
  "practiceDetails": {
    "services": ["string"],
    "modalities": ["string"],
    "populationsServed": ["string"],
    "acceptingClients": "boolean"
  },
  "availability": {
    "timezone": "string",
    "hoursPerWeek": "number",
    "daysAvailable": ["string"],
    "hasPhone": "boolean",
    "hasVideo": "boolean"
  }
}
```

**Response:**
```json
{
  "id": "application-id",
  "status": "received",
  "createdAt": "timestamp",
  "message": "We got your application!"
}
```

- [ ] Create Azure Function
- [ ] Validate input
- [ ] Store in database
- [ ] Send confirmation email
- [ ] Return success response

#### Get Application Status
**GET** `/api/applications/{applicationId}`

**Response:**
```json
{
  "id": "application-id",
  "status": "received|under-review|approved|needs-info|rejected",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "message": "Current status message",
  "timeline": {
    "received": "timestamp",
    "underReview": "timestamp",
    "decision": "timestamp"
  }
}
```

- [ ] Create Azure Function
- [ ] Query database
- [ ] Return status
- [ ] Return timeline

#### Admin: Get Applications
**GET** `/api/admin/applications?status=&page=&limit=`

- [ ] Create Azure Function
- [ ] Require admin authentication
- [ ] Filter by status
- [ ] Support pagination
- [ ] Return applications list

#### Admin: Update Application
**PATCH** `/api/admin/applications/{applicationId}`

```json
{
  "status": "approved|rejected|needs-info",
  "message": "Optional message to applicant"
}
```

- [ ] Create Azure Function
- [ ] Require admin authentication
- [ ] Validate status
- [ ] Update database
- [ ] Send appropriate email
- [ ] Return updated application

### Email Notifications

- [ ] Set up email service (Azure Communication Services)
- [ ] Create email templates
- [ ] Send on application received
- [ ] Send on status change
- [ ] Send on approval decision
- [ ] Include support contact info

### Database Schema

```sql
CREATE TABLE Applications (
  id NVARCHAR(36) PRIMARY KEY,
  userId NVARCHAR(36) NOT NULL,
  firstName NVARCHAR(100) NOT NULL,
  lastName NVARCHAR(100) NOT NULL,
  email NVARCHAR(255) NOT NULL,
  phone NVARCHAR(20),
  location NVARCHAR(100),
  status NVARCHAR(50) DEFAULT 'received', -- received, under-review, approved, needs-info, rejected
  qualificationsJson NVARCHAR(MAX),
  practiceDetailsJson NVARCHAR(MAX),
  availabilityJson NVARCHAR(MAX),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  approvedAt DATETIME,
  rejectedAt DATETIME,
  notes NVARCHAR(MAX), -- Admin notes
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
);
```

- [ ] Create migration file
- [ ] Run migration
- [ ] Test queries

---

## 🧪 Phase 5: Testing (Week 4)

### Unit Tests

- [ ] `BloomInput.tsx` component
- [ ] `BloomButton.tsx` component
- [ ] `FormStep.tsx` wrapper
- [ ] `ProgressIndicator.tsx` component
- [ ] `ApplicationContext.tsx` reducer

### Integration Tests

- [ ] Form submission flow
- [ ] State persistence
- [ ] API integration
- [ ] Error handling
- [ ] Success page display

### E2E Tests

- [ ] Complete application flow
- [ ] Back/next navigation
- [ ] Edit previous steps
- [ ] Success confirmation
- [ ] Status dashboard
- [ ] Email notifications

### User Testing

- [ ] Test with 3-5 actual psychologists
- [ ] Gather feedback on:
  - [ ] Form clarity
  - [ ] Microcopy tone
  - [ ] Time to complete
  - [ ] Confidence in submission
  - [ ] Visual appeal
- [ ] Iterate based on feedback

### Accessibility Testing

- [ ] Screen reader (NVDA/JAWS)
- [ ] Keyboard navigation
- [ ] Color contrast (aXe)
- [ ] Focus indicators
- [ ] Error announcements
- [ ] Form labels properly associated

### Performance Testing

- [ ] Lighthouse score
- [ ] Page load time
- [ ] Form responsiveness
- [ ] Bundle size impact
- [ ] Mobile performance

---

## 📱 Phase 6: Mobile & Responsive (Week 4)

- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Verify spacing on mobile
- [ ] Verify typography on mobile
- [ ] Verify buttons are tap-friendly (44px minimum)
- [ ] Test form on mobile keyboard
- [ ] Verify email preview on mobile
- [ ] Test landscape mode

---

## 🚀 Phase 7: Launch Preparation (Week 4)

### Documentation

- [ ] Update README with application process
- [ ] Create user guide for practitioners
- [ ] Create admin guide for approvals
- [ ] Document API endpoints
- [ ] Document email templates
- [ ] Create troubleshooting guide

### Monitoring

- [ ] Set up application success tracking
- [ ] Set up error logging
- [ ] Set up email delivery tracking
- [ ] Set up performance monitoring
- [ ] Create admin dashboard for submissions

### Go-Live Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Accessibility audit passed
- [ ] Performance audit passed
- [ ] Email service tested
- [ ] Database backups enabled
- [ ] Admin access configured
- [ ] Support process defined
- [ ] Analytics configured

---

## 🎯 Success Criteria

### User Experience
- [ ] Form completion rate > 80%
- [ ] Average completion time < 15 minutes
- [ ] No form abandonment spikes
- [ ] Positive feedback from practitioners
- [ ] Clear understanding of next steps

### Technical
- [ ] All tests passing
- [ ] Lighthouse score > 90
- [ ] Zero console errors
- [ ] Mobile responsive
- [ ] WCAG AA compliant

### Business
- [ ] Applications being collected
- [ ] Email notifications working
- [ ] Admin approvals functioning
- [ ] Approved practitioners visible
- [ ] Support questions minimal

---

## 📊 Post-Launch

### Week 1
- [ ] Monitor error logs
- [ ] Respond to support requests
- [ ] Gather initial feedback
- [ ] Fix critical bugs

### Week 2-4
- [ ] Analyze completion metrics
- [ ] Identify drop-off points
- [ ] Gather practitioner feedback
- [ ] Plan improvements

### Month 2
- [ ] Implement improvements
- [ ] Optimize form based on data
- [ ] Expand to more recruitment channels
- [ ] Build community features

---

## 📝 Notes

**Remember the Miyazaki Principles:**
1. Show, don't tell (clear visual hierarchy)
2. Respect the moment (generous spacing)
3. Small details matter (micro-interactions)
4. Silence speaks (whitespace)
5. Human connection (warm microcopy)
6. Anticipation (show what's next)

**Remember the Bloom Colors:**
- Sage green = trust, safety
- Lavender = empathy, care
- Cream = comfort, warmth

**Remember the Goal:**
This isn't just a form. It's an invitation to join a community of compassionate practitioners committed to quality mental health care.

---

**Status:** Ready for development  
**Owner:** Design/Development Team  
**Last Updated:** January 11, 2026
