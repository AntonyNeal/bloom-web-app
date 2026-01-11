# 🎛️ Admin Application Management UI - Implementation Guide

**Version:** 1.0  
**Date:** January 11, 2026  
**Purpose:** Detailed UI/UX specification for the admin applications dashboard

---

## 📋 Overview

The admin applications dashboard allows administrators to:
1. View all practitioner applications
2. Review qualifications and details
3. Approve or reject applications
4. **Add clinicians to Halaxy** (required before onboarding)
5. Send onboarding emails (only after Halaxy validation)
6. Track practitioner status

---

## 🏗️ Page Structure

### Applications List View

**URL:** `/admin/applications`

```
┌─────────────────────────────────────────────────────────────┐
│ Application Management                              [Filter] │
├─────────────────────────────────────────────────────────────┤
│ Status Filter: [All] [Pending] [Approved] [Rejected]        │
│ Sort By: [Newest] [Oldest] [Name]                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────┐  ┌──────────────────────┐ │
│  │ Julian Della Rocca           │  │ Phone: +61412345678  │ │
│  │ julian.della@gmail.com       │  │ AHPRA: 1234567       │ │
│  │ AHPRA: 1234567               │  │ Experience: 1 year   │ │
│  │ Location: AEST               │  │ Status: renewed      │ │
│  │                              │  │                      │ │
│  │ [Click to view details] →    │  │ [View] [Edit]        │ │
│  └──────────────────────────────┘  └──────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────┐  ┌──────────────────────┐ │
│  │ [Next applicant card...]     │  │ ...                  │ │
│  │                              │  │                      │ │
│  │ [Click to view details] →    │  │ [View] [Edit]        │ │
│  └──────────────────────────────┘  └──────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Application Detail View

**URL:** `/admin/applications/:applicationId`

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Back to Applications                                      […]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ PRACTITIONER INFORMATION                                         │
├──────────────────────────────────────────────────────────────────┤
│ Name:        Julian Della Rocca                                  │
│ Email:       julian.della@gmail.com                              │
│ Phone:       +61412345678                                        │
│ Location:    Victoria, Australia                                 │
│ AHPRA Reg:   1234567 (Valid)                                     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ QUALIFICATIONS                                                   │
├──────────────────────────────────────────────────────────────────┤
│ ✓ Master's in Clinical Psychology                               │
│   University of Melbourne • 2015                                 │
│                                                                  │
│ ✓ Bachelor of Science (Psychology)                              │
│   University of Melbourne • 2012                                 │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ PRACTICE DETAILS                                                 │
├──────────────────────────────────────────────────────────────────┤
│ Services:      Individual therapy, Couples therapy              │
│ Modalities:    CBT, Psychodynamic, ACT                          │
│ Populations:   Adults, Adolescents, Families                    │
│ Accepting:     Yes - 20 hours/week                              │
│ Consultation:  Video & Phone                                    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ APPLICATION STATUS                                               │
├──────────────────────────────────────────────────────────────────┤
│ Bloom Status:         ✓ APPROVED                                 │
│ Submitted:            01/07/2026                                 │
│ Reviewed:             01/08/2026                                 │
│                                                                  │
│ HALAXY STATUS (REQUIRED FOR ONBOARDING)                         │
├──────────────────────────────────────────────────────────────────┤
│ Current Status:  ✓ VALIDATED & ACTIVE                            │
│ Added to Halaxy: 01/08/2026                                      │
│ Validated:       01/08/2026                                      │
│                                                                  │
│ [→ Manage in Halaxy Admin]   [Check Status]                     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ DOCUMENTS                                                        │
├──────────────────────────────────────────────────────────────────┤
│ ✓ AHPRA Certificate [View PDF]                                   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ ADMIN ACTIONS                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ [🎉 Send Onboarding Tools]  [📝 Add Admin Notes]                │
│                                                                  │
│ OR                                                               │
│                                                                  │
│ [❌ Reject Application]     [🔄 Move Back to Reviewing]          │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ ADMIN NOTES                                                      │
├──────────────────────────────────────────────────────────────────┤
│ [Text area for internal notes visible only to admins]           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Implementation

### 1. Application List Component

**File:** `src/components/admin/ApplicationsList.tsx`

```tsx
interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  ahpraNumber: string;
  experience: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs-info';
  halaxyValidated: boolean;
  createdAt: Date;
}

interface ApplicationsListProps {
  applications: Application[];
  onSelectApplication: (id: string) => void;
  filters?: {
    status?: string;
    search?: string;
  };
}

export const ApplicationsList: React.FC<ApplicationsListProps> = ({
  applications,
  onSelectApplication,
  filters,
}) => {
  const [filteredApps, setFilteredApps] = React.useState(applications);

  React.useEffect(() => {
    let filtered = applications;

    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(app =>
        `${app.firstName} ${app.lastName}`.toLowerCase().includes(search)
      );
    }

    setFilteredApps(filtered);
  }, [applications, filters]);

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex gap-4 mb-6">
        <select className="px-4 py-2 border-2 border-sage-200 rounded-lg">
          <option value="all">All Applications</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="needs-info">Needs Info</option>
        </select>

        <input
          type="search"
          placeholder="Search by name..."
          className="flex-1 px-4 py-2 border-2 border-sage-200 rounded-lg"
        />
      </div>

      {/* Applications grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredApps.map(app => (
          <div
            key={app.id}
            onClick={() => onSelectApplication(app.id)}
            className="p-4 border-2 border-sage-200 rounded-lg cursor-pointer hover:border-sage-600 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-h5 text-sage-700 font-semibold">
                  {app.firstName} {app.lastName}
                </h3>
                <p className="text-body-sm text-text-secondary">
                  {app.email}
                </p>
              </div>

              {/* Status badge */}
              <div className={`
                px-3 py-1 rounded-full text-sm font-semibold
                ${app.status === 'approved'
                  ? 'bg-success-bg text-success-700'
                  : app.status === 'pending'
                  ? 'bg-warning-bg text-warning-700'
                  : 'bg-error-bg text-error-700'
                }
              `}>
                {app.status === 'approved' ? '✓' : '⏳'} {app.status}
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2 text-body-sm mb-3">
              <div>
                <span className="text-text-tertiary">Phone:</span>
                <p className="text-text-primary font-medium">{app.phone}</p>
              </div>
              <div>
                <span className="text-text-tertiary">AHPRA:</span>
                <p className="text-text-primary font-medium">
                  {app.ahpraNumber}
                </p>
              </div>
              <div>
                <span className="text-text-tertiary">Experience:</span>
                <p className="text-text-primary font-medium">
                  {app.experience} year{app.experience !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <span className="text-text-tertiary">Location:</span>
                <p className="text-text-primary font-medium">{app.location}</p>
              </div>
            </div>

            {/* Halaxy status if approved */}
            {app.status === 'approved' && (
              <div className={`
                text-body-sm p-2 rounded
                ${app.halaxyValidated
                  ? 'bg-success-bg text-success-700'
                  : 'bg-warning-bg text-warning-700'
                }
              `}>
                {app.halaxyValidated
                  ? '✓ Halaxy Validated - Ready for onboarding'
                  : '⏳ Waiting for Halaxy validation'
                }
              </div>
            )}

            {/* Footer */}
            <button className="mt-3 text-sage-600 font-semibold text-sm hover:text-sage-700">
              View Details →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. Application Detail Component

**File:** `src/components/admin/ApplicationDetail.tsx`

```tsx
interface ApplicationDetailProps {
  application: Application;
  onBack: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSendOnboarding: (id: string) => void;
}

export const ApplicationDetail: React.FC<ApplicationDetailProps> = ({
  application,
  onBack,
  onApprove,
  onReject,
  onSendOnboarding,
}) => {
  const [showingOnboardingConfirm, setShowingOnboardingConfirm] =
    React.useState(false);

  const canSendOnboarding =
    application.status === 'approved' && application.halaxyValidated;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="text-sage-600 font-semibold hover:text-sage-700"
        >
          ← Back to Applications
        </button>
      </div>

      {/* Practitioner Info */}
      <section>
        <h2 className="text-h2 text-sage-700 mb-6">Practitioner Information</h2>
        <div className="grid grid-cols-2 gap-4 p-6 bg-cream-100 rounded-lg">
          <div>
            <p className="text-body-sm text-text-tertiary">Name</p>
            <p className="text-body-lg font-semibold text-text-primary">
              {application.firstName} {application.lastName}
            </p>
          </div>
          <div>
            <p className="text-body-sm text-text-tertiary">Email</p>
            <p className="text-body-lg font-semibold text-text-primary">
              {application.email}
            </p>
          </div>
          <div>
            <p className="text-body-sm text-text-tertiary">Phone</p>
            <p className="text-body-lg font-semibold text-text-primary">
              {application.phone}
            </p>
          </div>
          <div>
            <p className="text-body-sm text-text-tertiary">AHPRA Number</p>
            <p className="text-body-lg font-semibold text-text-primary">
              {application.ahpraNumber}
            </p>
          </div>
        </div>
      </section>

      {/* Qualifications */}
      <section>
        <h2 className="text-h3 text-sage-700 mb-4">Qualifications</h2>
        <div className="space-y-3">
          {application.qualifications.map((qual, i) => (
            <div key={i} className="p-4 bg-sage-50 rounded-lg border-l-4 border-sage-600">
              <p className="font-semibold text-text-primary">
                {qual.degree}
              </p>
              <p className="text-body-sm text-text-secondary">
                {qual.institution} • {qual.year}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Application Status */}
      <section className="p-6 bg-white border-2 border-sage-200 rounded-lg">
        <h2 className="text-h3 text-sage-700 mb-4">Application Status</h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-body font-semibold text-text-primary">
              Bloom Status:
            </span>
            <div className={`
              px-4 py-2 rounded-lg font-semibold
              ${application.status === 'approved'
                ? 'bg-success-bg text-success-700'
                : 'bg-warning-bg text-warning-700'
              }
            `}>
              {application.status === 'approved' ? '✓ APPROVED' : '⏳ PENDING'}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t-2 border-sage-200">
            <span className="text-body font-semibold text-text-primary">
              Halaxy Status (Required):
            </span>
            <div className={`
              px-4 py-2 rounded-lg font-semibold
              ${application.halaxyValidated
                ? 'bg-success-bg text-success-700'
                : 'bg-warning-bg text-warning-700'
              }
            `}>
              {application.halaxyValidated
                ? '✓ VALIDATED'
                : '⏳ PENDING'
              }
            </div>
          </div>

          {!application.halaxyValidated && application.status === 'approved' && (
            <div className="p-4 bg-warning-bg rounded-lg border-l-4 border-warning-500">
              <p className="text-body font-semibold text-warning-700 mb-3">
                ⏳ Waiting for Halaxy Validation
              </p>
              <p className="text-body-sm text-warning-700 mb-4">
                Before sending the onboarding email, this clinician must be 
                added to Halaxy and their credentials verified.
              </p>
              <button className="px-4 py-2 bg-sage-600 text-white rounded-lg font-semibold hover:bg-sage-700">
                → Manage in Halaxy Admin
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Onboarding Actions */}
      {application.status === 'approved' && (
        <section className="p-6 bg-sage-50 border-2 border-sage-600 rounded-lg">
          <h2 className="text-h3 text-sage-700 mb-4">Send Onboarding</h2>

          {canSendOnboarding ? (
            <>
              <p className="text-body text-text-primary mb-4">
                ✓ This clinician is ready! Send the onboarding email to
                activate their account.
              </p>
              {!showingOnboardingConfirm ? (
                <button
                  onClick={() => setShowingOnboardingConfirm(true)}
                  className="px-6 py-3 bg-sage-600 text-white rounded-lg font-semibold hover:bg-sage-700"
                >
                  🎉 Send Onboarding Tools
                </button>
              ) : (
                <div className="p-4 bg-white rounded-lg border-2 border-sage-300">
                  <p className="text-body font-semibold text-text-primary mb-4">
                    Confirm: Send onboarding email to{' '}
                    <span className="font-bold">{application.email}</span>?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        onSendOnboarding(application.id);
                        setShowingOnboardingConfirm(false);
                      }}
                      className="px-6 py-2 bg-sage-600 text-white rounded-lg font-semibold hover:bg-sage-700"
                    >
                      Yes, Send Email
                    </button>
                    <button
                      onClick={() => setShowingOnboardingConfirm(false)}
                      className="px-6 py-2 border-2 border-sage-300 text-sage-600 rounded-lg font-semibold hover:bg-sage-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-warning-bg rounded-lg">
              <p className="text-body-sm text-warning-700">
                🔒 The "Send Onboarding" button is disabled until:
              </p>
              <ul className="text-body-sm text-warning-700 mt-2 space-y-1 ml-4">
                <li>
                  {application.status === 'approved' ? '✓' : '○'} Application
                  is approved
                </li>
                <li>
                  {application.halaxyValidated ? '✓' : '○'} Clinician is added
                  to Halaxy
                </li>
                <li>
                  {application.halaxyValidated ? '✓' : '○'} Halaxy validates
                  their credentials
                </li>
              </ul>
              <p className="text-body-sm text-warning-700 mt-3">
                See HALAXY_INTEGRATION_AND_CLINICIAN_VALIDATION.md for
                instructions.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Other Actions */}
      {application.status !== 'approved' && application.status !== 'rejected' && (
        <section className="flex gap-3">
          <button
            onClick={() => onApprove(application.id)}
            className="px-6 py-3 bg-success-500 text-white rounded-lg font-semibold hover:bg-success-700"
          >
            ✓ Approve Application
          </button>
          <button
            onClick={() => onReject(application.id)}
            className="px-6 py-3 bg-error-500 text-white rounded-lg font-semibold hover:bg-error-700"
          >
            ✗ Reject Application
          </button>
        </section>
      )}
    </div>
  );
};
```

---

## 🎯 UI State Matrix

| State | Button State | Tooltip | Color |
|-------|-------------|---------|-------|
| Application Pending | Disabled | "Approve first" | Gray |
| Approved, No Halaxy | Disabled | "Add to Halaxy first" | Gray |
| Approved, Halaxy Pending | Disabled | "Halaxy validating..." | Yellow |
| Approved, Halaxy Validated | **ENABLED** | "Ready to send onboarding" | Green |
| Email Sent | Disabled | "Email already sent" | Gray |

---

## 📋 Implementation Checklist

### Frontend Components
- [ ] ApplicationsList component
- [ ] ApplicationDetail component
- [ ] HalaxyStatus badge component
- [ ] StatusFilters component
- [ ] OnboardingConfirmation modal

### Admin Page
- [ ] `/admin/applications` list view
- [ ] `/admin/applications/:id` detail view
- [ ] Filter by status (pending, approved, rejected, needs-info)
- [ ] Search by name/email
- [ ] Sorting (newest, oldest, name)

### API Integration
- [ ] Fetch applications list
- [ ] Fetch application detail
- [ ] Approve application endpoint
- [ ] Reject application endpoint
- [ ] Get Halaxy status endpoint
- [ ] Send onboarding email endpoint
- [ ] Add to Halaxy endpoint

### Features
- [ ] Real-time status updates
- [ ] Bulk operations (approve multiple)
- [ ] Admin notes for each application
- [ ] Email sending confirmation
- [ ] Error handling & retry
- [ ] Loading states & spinners

---

**See Also:**
- `HALAXY_INTEGRATION_AND_CLINICIAN_VALIDATION.md` - Halaxy workflow
- `APPLICATION_WORKFLOW_IMPLEMENTATION_GUIDE.md` - Full workflow
- `IMPLEMENTATION_CHECKLIST.md` - Development tracking
