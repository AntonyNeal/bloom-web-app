# 🌸 Application Workflow Completion - Implementation Guide

**Version:** 1.0  
**Purpose:** Practical steps to complete the practitioner onboarding workflow using Bloom design system and Miyazaki principles.

---

## 📍 Current State

### What We Have
- ✅ Authentication (Azure AD B2C)
- ✅ Design system (Tailwind + tokens)
- ✅ Backend APIs (Azure Functions)
- ✅ Database (Azure Cosmos DB / SQL)

### What We Need
- ⏳ Welcome/Landing page
- ⏳ Multi-step application form
- ⏳ Progress tracking & status dashboard
- ⏳ Email notifications
- ⏳ Admin approval interface
- ⏳ Success journey & community visibility

---

## 🎬 The Complete Application Journey

### User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   PRACTITIONER JOURNEY                       │
└─────────────────────────────────────────────────────────────┘

1. DISCOVERY
   ↓
   [Landing Page]
   "Why join Bloom?" "What you'll get"
   
2. DECISION
   ↓
   [Start Application Button]
   "Ready to join us?"
   
3. AUTHENTICATION
   ↓
   [Sign in with Azure AD]
   "Welcome back!"
   
4. APPLICATION FLOW (Multi-step form)
   ├─ Step 1: Personal Info [5 min]
   │  └─ Name, email, phone, location
   ├─ Step 2: Qualifications [10 min]
   │  └─ Degrees, licenses, specializations
   ├─ Step 3: Practice Details [5 min]
   │  └─ Services offered, modalities, populations served
   ├─ Step 4: Availability [3 min]
   │  └─ Hours, calendar, timezone
   └─ Step 5: Review & Confirm [2 min]
      └─ "Double-check everything looks good"

5. SUBMISSION
   ↓
   [Success Page]
   "We got your application!"
   "Timeline: ~5-7 business days"
   
6. FOLLOW-UP
   ├─ [Email #1] Application received
   ├─ [Email #2] Under review
   ├─ [Email #3] Decision (approved/denied)
   └─ [Dashboard] Status updates anytime

7. APPROVAL
   ↓
   [Welcome Email]
   "You're approved! Here's your dashboard..."
   
8. ACTIVATION
   ├─ [Practitioner Dashboard]
   │  ├─ Schedule clients
   │  ├─ Manage availability
   │  ├─ View bookings
   │  └─ Access resources
   └─ [Community Visibility]
      └─ Profile appears on website directory
```

---

## 🛠️ Implementation Phases

### Phase 1: Welcome & Discovery (Week 1-2)

#### 1.1 Welcome/Landing Page
**File:** `src/pages/ApplicationLanding.tsx`

```tsx
import React from 'react';

export const ApplicationLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-sage-100">
      {/* Hero Section - Bloom Spirit */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-display-lg text-sage-700 mb-4">
          Join Bloom
        </h1>
        <p className="text-body-lg text-text-secondary mb-8 max-w-2xl mx-auto">
          A network of compassionate, qualified practitioners dedicated to 
          supporting mental health and wellbeing.
        </p>
      </section>

      {/* Why Join Section */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-h2 text-sage-700 mb-12 text-center">
            Why Join Bloom?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Client Referrals",
                description: "Access a vetted network of clients seeking quality care",
                icon: "👥"
              },
              {
                title: "Community",
                description: "Connect with 150+ like-minded practitioners",
                icon: "🤝"
              },
              {
                title: "Growth",
                description: "Expand your practice with flexible scheduling",
                icon: "📈"
              }
            ].map((benefit, i) => (
              <div
                key={i}
                className="p-6 rounded-lg bg-sage-50 border-l-4 border-sage-600"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-h4 text-sage-700 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-body text-text-secondary">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="px-6 py-16 bg-lavender-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-h2 text-sage-700 mb-8 text-center">
            What We're Looking For
          </h2>
          
          <div className="space-y-4">
            {[
              "Master's degree in Psychology, Counselling, or related field",
              "Current professional license or registration",
              "Commitment to evidence-based practice",
              "Professional liability insurance",
              "Ethical practice and confidentiality standards"
            ].map((req, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="text-sage-600 text-2xl mt-1">✓</div>
                <p className="text-body-lg text-text-primary">{req}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-h2 text-sage-700 mb-12 text-center">
            Application Timeline
          </h2>
          
          <div className="relative">
            {/* Timeline visualization */}
            <div className="space-y-6">
              {[
                { days: "Now", title: "Submit Application", desc: "Share your qualifications" },
                { days: "1-2", title: "Initial Review", desc: "We verify your credentials" },
                { days: "3-5", title: "Approval Decision", desc: "You'll hear from us" },
                { days: "5-7", title: "Welcome!", desc: "Access your Bloom dashboard" }
              ].map((step, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-sage-600 text-white flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                    {i < 3 && <div className="w-1 h-16 bg-sage-200 my-2" />}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm text-sage-600 font-semibold">{step.days} days</p>
                    <h4 className="text-h5 text-sage-700">{step.title}</h4>
                    <p className="text-body text-text-secondary">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-sage-600 to-sage-700 text-center">
        <h2 className="text-h2 text-white mb-6">
          Ready to make a difference?
        </h2>
        <p className="text-body-lg text-sage-100 mb-8">
          Join a community of practitioners committed to quality mental health care.
        </p>
        <button className="px-8 py-4 bg-white text-sage-700 rounded-lg font-semibold text-lg hover:bg-cream-50 transition-colors">
          Start Application
        </button>
      </section>
    </div>
  );
};
```

---

### Phase 2: Multi-Step Form (Week 2-3)

#### 2.1 Form Context & State Management
**File:** `src/contexts/ApplicationContext.tsx`

```tsx
import React, { createContext, useReducer } from 'react';

export interface ApplicationData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;

  // Step 2: Qualifications
  qualifications: {
    degree: string;
    institution: string;
    year: number;
    license: string;
    licenseNumber: string;
    specializations: string[];
  }[];

  // Step 3: Practice Details
  practiceDetails: {
    services: string[];
    modalities: string[];
    populationsServed: string[];
    acceptingClients: boolean;
  };

  // Step 4: Availability
  availability: {
    timezone: string;
    hoursPerWeek: number;
    daysAvailable: string[];
    hasPhone: boolean;
    hasVideo: boolean;
  };
}

const initialState: ApplicationData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  qualifications: [],
  practiceDetails: {
    services: [],
    modalities: [],
    populationsServed: [],
    acceptingClients: true,
  },
  availability: {
    timezone: 'AEST',
    hoursPerWeek: 0,
    daysAvailable: [],
    hasPhone: false,
    hasVideo: true,
  },
};

export const ApplicationContext = createContext({
  state: initialState,
  dispatch: (action: any) => {},
});

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(
    (state: ApplicationData, action: any) => {
      switch (action.type) {
        case 'UPDATE_FIELD':
          return { ...state, [action.payload.field]: action.payload.value };
        case 'UPDATE_NESTED':
          return {
            ...state,
            [action.payload.parent]: {
              ...state[action.payload.parent as keyof ApplicationData],
              [action.payload.field]: action.payload.value,
            },
          };
        default:
          return state;
      }
    },
    initialState
  );

  return (
    <ApplicationContext.Provider value={{ state, dispatch }}>
      {children}
    </ApplicationContext.Provider>
  );
};
```

#### 2.2 Multi-Step Form Component
**File:** `src/pages/ApplicationForm.tsx`

```tsx
import React, { useState } from 'react';
import { ApplicationContext } from '@/contexts/ApplicationContext';
import { ApplicationForm as Form } from '@/components/application/ApplicationForm';

const steps = [
  { id: 'personal', label: 'Personal Information', duration: '5 min' },
  { id: 'qualifications', label: 'Qualifications', duration: '10 min' },
  { id: 'practice', label: 'Practice Details', duration: '5 min' },
  { id: 'availability', label: 'Availability', duration: '3 min' },
  { id: 'review', label: 'Review & Confirm', duration: '2 min' },
];

export const ApplicationFormPage: React.FC = () => {
  const { state, dispatch } = React.useContext(ApplicationContext);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    // Validate current step
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const handleSubmit = async () => {
    // Submit application
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    
    if (response.ok) {
      // Redirect to success page
      window.location.href = '/application-success';
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, i) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm transition-colors
                    ${i <= currentStep
                      ? 'bg-sage-600 text-white'
                      : 'bg-sage-200 text-text-secondary'
                    }
                  `}
                >
                  {i + 1}
                </div>
                <p className={`
                  mt-2 text-sm font-medium
                  ${i === currentStep ? 'text-sage-700' : 'text-text-tertiary'}
                `}>
                  {step.label}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  {step.duration}
                </p>
                {i < steps.length - 1 && (
                  <div
                    className={`
                      h-1 absolute left-1/2 w-full
                      ${i < currentStep ? 'bg-sage-600' : 'bg-sage-200'}
                    `}
                    style={{
                      top: '20px',
                      left: `calc(50% + 20px)`,
                      width: `calc(${100 / steps.length}% - 40px)`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Progress text */}
          <div className="text-center">
            <p className="text-body text-text-secondary">
              You're {Math.round((currentStep / steps.length) * 100)}% done! Keep going.
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <Form currentStep={currentStep} />
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-3 border-2 border-sage-300 text-sage-600 rounded-lg font-semibold hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-sage-600 text-white rounded-lg font-semibold hover:bg-sage-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-sage-600 text-white rounded-lg font-semibold hover:bg-sage-700"
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

### Phase 3: Success & Status (Week 3-4)

#### 3.1 Success Page
**File:** `src/pages/ApplicationSuccess.tsx`

```tsx
import React from 'react';

export const ApplicationSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-100 to-cream-100 flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        {/* Celebration */}
        <div className="mb-8">
          <div className="text-8xl mb-6">🌸</div>
          <h1 className="text-display-lg text-sage-700 mb-4">
            We got your application!
          </h1>
          <p className="text-body-lg text-text-secondary">
            Thank you for your interest in joining Bloom. We're excited to review your qualifications.
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg p-8 mb-8 shadow-md">
          <h2 className="text-h3 text-sage-700 mb-6">What happens next?</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="text-2xl text-sage-600">✓</div>
              <div className="text-left">
                <h4 className="font-semibold text-text-primary mb-1">
                  Application Received
                </h4>
                <p className="text-body text-text-secondary">
                  We've received your application and sent a confirmation email.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl text-sage-300">⏳</div>
              <div className="text-left">
                <h4 className="font-semibold text-text-primary mb-1">
                  Under Review (3-5 days)
                </h4>
                <p className="text-body text-text-secondary">
                  Our team is verifying your qualifications. We'll keep you updated.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl text-sage-300">⏳</div>
              <div className="text-left">
                <h4 className="font-semibold text-text-primary mb-1">
                  Final Decision (5-7 days)
                </h4>
                <p className="text-body text-text-secondary">
                  You'll receive an email with the approval decision.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl text-sage-300">🎉</div>
              <div className="text-left">
                <h4 className="font-semibold text-text-primary mb-1">
                  Welcome to Bloom!
                </h4>
                <p className="text-body text-text-secondary">
                  Access your practitioner dashboard and start connecting with clients.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-lavender-50 rounded-lg p-6 mb-8">
          <h3 className="text-h4 text-sage-700 mb-3">In the meantime...</h3>
          <p className="text-body text-text-secondary mb-4">
            Check out what you'll have access to as a Bloom practitioner.
          </p>
          <button className="px-6 py-2 bg-lavender-500 text-white rounded-lg font-semibold hover:bg-lavender-600">
            See Practitioner Dashboard
          </button>
        </div>

        {/* Support */}
        <p className="text-body text-text-secondary">
          Have questions? Email <a href="mailto:support@bloom.com" className="text-sage-600 font-semibold hover:underline">
            support@bloom.com
          </a>
        </p>
      </div>
    </div>
  );
};
```

---

### Phase 4: Admin Approval & Halaxy Integration (Week 4)

#### 4.1 Admin Application Dashboard
**File:** `src/pages/AdminApplications.tsx`

The admin dashboard allows:
- Viewing all applications with filtering (status, date, name)
- Reviewing individual applications
- Approving or rejecting applications
- **CRITICAL:** Adding approved clinicians to Halaxy

**Important:** The "Send Onboarding Tools" button is **DISABLED** until:
1. ✅ Application is approved in Bloom
2. ✅ Clinician is added to Halaxy system
3. ✅ Halaxy validates clinician credentials
4. ✅ `halaxy_validated` flag is set to `true`

**See:** `HALAXY_INTEGRATION_AND_CLINICIAN_VALIDATION.md` for complete admin workflow

#### 4.2 Email Template System
**File:** `api/src/functions/sendApplicationEmail.ts`

```typescript
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";

const emailTemplates = {
  applicationReceived: (applicantName: string) => ({
    subject: "Your Bloom Application - We Got It! 🌸",
    html: `
      <h1>Welcome, ${applicantName}!</h1>
      <p>We've received your application to join the Bloom network. Thank you for your interest!</p>
      <p><strong>Timeline:</strong> We'll review your qualifications over the next 5-7 business days.</p>
      <p><strong>What's Next:</strong> We'll send you updates via email. Watch your inbox!</p>
      <p><a href="https://bloom.life-psychology.com.au/dashboard">Check Your Application Status</a></p>
    `
  }),

  underReview: (applicantName: string) => ({
    subject: "Your Bloom Application - Under Review ⏳",
    html: `
      <h1>Update on Your Application</h1>
      <p>Hi ${applicantName},</p>
      <p>Your application is being reviewed by our team. We're verifying your qualifications and will be in touch soon.</p>
      <p><strong>Estimated Decision:</strong> Within 3-5 business days</p>
      <p>We appreciate your patience!</p>
    `
  }),

  approved: (applicantName: string, dashboardUrl: string) => ({
    subject: "Welcome to Bloom! 🎉 You're Approved!",
    html: `
      <h1>Congratulations, ${applicantName}!</h1>
      <p>We're thrilled to welcome you to the Bloom network. Your application has been approved!</p>
      <p><a href="${dashboardUrl}">Access Your Practitioner Dashboard</a></p>
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Complete your practitioner profile</li>
        <li>Set your availability</li>
        <li>Start accepting clients</li>
      </ul>
      <p>Welcome to our community of compassionate practitioners! 🌸</p>
    `
  }),

  needsFollowUp: (applicantName: string) => ({
    subject: "Bloom Application - We Need More Information",
    html: `
      <h1>Application Update</h1>
      <p>Hi ${applicantName},</p>
      <p>Thank you for your application! We need a bit more information to complete our review.</p>
      <p>[List missing information]</p>
      <p><a href="https://bloom.life-psychology.com.au/application/complete">Update Your Application</a></p>
    `
  }),
};

async function sendApplicationEmail(
  req: HttpRequest
): Promise<HttpResponseInit> {
  const { email, name, type } = await req.json();

  const template = emailTemplates[type as keyof typeof emailTemplates];
  if (!template) {
    return { status: 400, body: "Invalid email type" };
  }

  const emailContent = template(name);

  // TODO: Integrate with Azure Communication Services
  // or SendGrid/Mailgun for actual email sending

  return {
    status: 200,
    jsonBody: { success: true, message: "Email sent" },
  };
}

app.http("sendApplicationEmail", {
  methods: ["POST"],
  authLevel: "function",
  handler: sendApplicationEmail,
});
```

---

## 📊 Component Structure

```
src/
├── pages/
│   ├── ApplicationLanding.tsx      (Welcome/discovery)
│   ├── ApplicationForm.tsx          (Multi-step form)
│   └── ApplicationSuccess.tsx       (Confirmation)
├── components/
│   └── application/
│       ├── ApplicationForm.tsx      (Form content for each step)
│       ├── PersonalInfoStep.tsx
│       ├── QualificationsStep.tsx
│       ├── PracticeDetailsStep.tsx
│       ├── AvailabilityStep.tsx
│       ├── ReviewStep.tsx
│       └── ProgressIndicator.tsx
├── contexts/
│   └── ApplicationContext.tsx       (State management)
└── services/
    ├── applicationService.ts        (API calls)
    └── emailService.ts             (Email notifications)

api/
├── src/functions/
│   ├── submitApplication/           (Form submission)
│   ├── sendApplicationEmail/        (Email triggers)
│   ├── getApplicationStatus/        (Status checks)
│   └── approveApplication/          (Admin action)
└── migrations/
    └── [timestamp]_applications_table.sql
```

---

## 🚀 Quick Start Checklist

### Week 1-2: Foundation
- [ ] Create ApplicationLanding page
- [ ] Set up ApplicationContext for state
- [ ] Build form field components (reusable)
- [ ] Design ProgressIndicator component

### Week 2-3: Multi-Step Form
- [ ] Implement each step component
- [ ] Add validation logic
- [ ] Connect to API
- [ ] Test form flow

### Week 3-4: Success & Status
- [ ] Create success page
- [ ] Build status dashboard
- [ ] Integrate email notifications
- [ ] Test end-to-end

### Week 4: Polish & Launch
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] User testing
- [ ] Launch!

---

## 🎨 Bloom Design Checklist

For every component, ensure:
- [ ] Uses Bloom color palette (sage, lavender, cream)
- [ ] Minimum 16px body text
- [ ] Proper spacing from design tokens
- [ ] Accessible focus indicators
- [ ] Warm, encouraging microcopy
- [ ] No visual waste
- [ ] Mobile responsive
- [ ] Tested with assistive tech

---

## 📝 Acceptance Criteria

A complete application workflow will have:
1. ✅ Welcome page explaining Bloom vision
2. ✅ 5-step form (personal, qualifications, practice, availability, review)
3. ✅ Progress indicator showing journey
4. ✅ Success page with timeline
5. ✅ Email notifications at key stages
6. ✅ Application status dashboard
7. ✅ Admin interface for approvals
8. ✅ Approved practitioner profile visibility
9. ✅ All WCAG AA accessibility standards
10. ✅ Warm, encouraging microcopy throughout

---

This guide should be used in conjunction with **BLOOM_DESIGN_SYSTEM_AND_WORKFLOW_PHILOSOPHY.md** for design principles and inspiration.
