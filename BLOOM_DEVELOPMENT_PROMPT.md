# Bloom Development Prompt
## Comprehensive Design System & Implementation Guide

**Project:** Proto-Bloom - Life Psychology Australia's Practitioner Onboarding Portal  
**Design Philosophy:** "Warm Professional Fairy Godmother" (30% personality, 70% competence)  
**Aesthetic:** Studio Ghibli meets Linear - warm, inviting professionalism  
**Last Updated:** October 16, 2025

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Patterns](#component-patterns)
6. [Error Handling](#error-handling)
7. [Technical Stack](#technical-stack)
8. [Implementation Examples](#implementation-examples)

---

## Design Philosophy

### Core Principle: "Warm Professional"
Bloom balances warmth and competence to create an environment where clinical psychologists feel both welcomed and respected. We're the fairy godmother who believes in you while maintaining professional standards.

**Personality Mix:**
- **30% Personality:** Warm, encouraging, human
- **70% Competence:** Professional, trustworthy, clinical

### Voice & Tone
- **Encouraging, not patronizing:** "Let's get you set up" not "Don't worry, this is easy"
- **Clear, not clinical:** "We couldn't find that" not "Error 404: Resource not found"
- **Warm, not casual:** "Welcome back!" not "Hey there!"
- **Professional, not corporate:** "Your application is being reviewed" not "Your request has been processed"

### Visual Metaphor
Think of a well-lit therapy room with plants, natural light, and comfortable furniture. Everything has its place, nothing feels sterile, but it's clearly a professional space.

---

## Color System

### Primary: Sage Green
**Purpose:** Trust, growth, clinical professionalism  
**Usage:** Primary actions, headers, active states (60% of UI)

```javascript
sage: {
  50: '#F7F9F7',   // Backgrounds, hover states
  100: '#EFF3EE',  // Light backgrounds
  200: '#D9E4D7',  // Borders, dividers
  300: '#B8CDBA',  // Disabled states
  400: '#8FB48E',  // Secondary text
  500: '#6B8066',  // Icons, secondary buttons
  600: '#5A6C55',  // Primary buttons, links - MAIN BRAND COLOR
  700: '#4A5846',  // Hover states
  800: '#3A4437',  // Pressed states
  900: '#2C3329',  // Deep accents
}
```

### Secondary: Lavender
**Purpose:** Creativity, empathy, psychological care  
**Usage:** Accents, success states, highlights (30% of UI)

```javascript
lavender: {
  50: '#F9F8FB',   // Light backgrounds
  100: '#F2F0F7',  // Hover states
  200: '#E5E1EF',  // Borders
  300: '#CFC5DC',  // Icons
  400: '#B4A7D6',  // Secondary accents - MAIN SECONDARY COLOR
  500: '#9D8BC7',  // Active states
  600: '#8672B8',  // Hover states
}
```

### Neutral: Warm Charcoal & Cream
**Purpose:** Readability, hierarchy, backgrounds  
**Usage:** Text, surfaces, structure (10% of UI)

```javascript
// Cream - Backgrounds
cream: {
  50: '#FDFCFB',   // Pure backgrounds
  100: '#F5F3EE',  // Main background color
  200: '#EBE8E0',  // Card backgrounds
  300: '#DDD9CE',  // Subtle dividers
}

// Text - Warm Charcoal
text: {
  primary: '#3D3D3A',     // Headings, body text (90% opacity)
  secondary: '#5C5C57',   // Supporting text (70% opacity)
  tertiary: '#7A7A73',    // Placeholder text (50% opacity)
}
```

### Semantic Colors
**Purpose:** System feedback and state communication

```javascript
success: {
  DEFAULT: '#6B8066',      // Sage-600 (approved, completed)
  bg: '#EFF3EE',          // Sage-100 backgrounds
}
warning: {
  DEFAULT: '#D4A373',      // Warm amber (needs attention)
  bg: '#FDF6EC',          // Light amber backgrounds
}
error: {
  DEFAULT: '#C86B6B',      // Warm red (rejected, errors)
  bg: '#FDEAEA',          // Light red backgrounds
}
info: {
  DEFAULT: '#6B9BC8',      // Warm blue (notifications)
  bg: '#EBF3F9',          // Light blue backgrounds
}
```

---

## Typography

### Font Families

**Display Font: Poppins**
```css
font-family: 'Poppins', system-ui, -apple-system, sans-serif;
```
- **Usage:** Headings, labels, buttons, important UI elements
- **Weights:** 600 (Semibold), 700 (Bold)
- **Personality:** Friendly, approachable, modern

**Body Font: Inter**
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```
- **Usage:** Body text, paragraphs, descriptions
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold)
- **Personality:** Clean, readable, professional

**Monospace: IBM Plex Mono**
```css
font-family: 'IBM Plex Mono', 'Courier New', monospace;
```
- **Usage:** Code snippets, technical data, IDs
- **Weights:** 400 (Regular), 500 (Medium)
- **Personality:** Technical but warm

### Type Scale

```javascript
fontSize: {
  // Utility sizes
  xs: ['0.75rem', { lineHeight: '1rem' }],        // 12px - Tiny labels
  sm: ['0.875rem', { lineHeight: '1.25rem' }],    // 14px - Small text
  base: ['1rem', { lineHeight: '1.5rem' }],       // 16px - Body text
  lg: ['1.125rem', { lineHeight: '1.75rem' }],    // 18px - Large body
  xl: ['1.25rem', { lineHeight: '1.75rem' }],     // 20px - Emphasized
  '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px - Subheadings
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px - Section headers
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px - Page titles
  
  // Display sizes (Poppins)
  'display-lg': ['3.75rem', { lineHeight: '1.2', fontWeight: '700' }], // 60px - Hero
  'display-md': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],    // 48px - Page hero
  'display-sm': ['2.25rem', { lineHeight: '1.3', fontWeight: '600' }], // 36px - Section hero
  
  // Heading sizes (Poppins)
  'h1': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],     // 32px
  'h2': ['1.75rem', { lineHeight: '1.4', fontWeight: '600' }],  // 28px
  'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],   // 24px
  'h4': ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }],  // 20px
  'h5': ['1.125rem', { lineHeight: '1.5', fontWeight: '600' }], // 18px
  'h6': ['1rem', { lineHeight: '1.5', fontWeight: '600' }],     // 16px
  
  // Body sizes (Inter)
  'body-lg': ['1.125rem', { lineHeight: '1.75' }],  // 18px - Large body
  'body-base': ['1rem', { lineHeight: '1.625' }],   // 16px - Regular body
  'body-sm': ['0.875rem', { lineHeight: '1.5' }],   // 14px - Small body
  'body-xs': ['0.75rem', { lineHeight: '1.5' }],    // 12px - Tiny body
}
```

### Typography Usage Examples

```tsx
// Page hero
<h1 className="font-display text-display-md text-text-primary">
  Join Our Team
</h1>

// Section heading
<h2 className="font-display text-h2 text-text-primary">
  Application Details
</h2>

// Body paragraph
<p className="font-body text-body-base text-text-secondary leading-loose">
  We're looking for exceptional psychologists...
</p>

// Label
<Label className="font-display text-body-sm text-text-primary">
  AHPRA Registration Number
</Label>

// Help text
<p className="font-body text-body-xs text-text-tertiary">
  Enter your 16-digit registration number
</p>
```

---

## Spacing & Layout

### Spacing System (8px Grid)
All spacing follows an 8px base unit for visual consistency.

```javascript
spacing: {
  0: '0px',
  1: '0.5rem',   // 8px
  2: '1rem',     // 16px
  3: '1.5rem',   // 24px
  4: '2rem',     // 32px
  5: '2.5rem',   // 40px
  6: '3rem',     // 48px
  8: '4rem',     // 64px
  10: '5rem',    // 80px
  12: '6rem',    // 96px
  16: '8rem',    // 128px
  20: '10rem',   // 160px
  24: '12rem',   // 192px
}
```

### Border Radius
Creates soft, approachable corners without looking childish.

```javascript
borderRadius: {
  sm: '0.5rem',   // 8px - Small elements (badges)
  DEFAULT: '0.75rem', // 12px - Inputs, buttons
  md: '0.75rem',  // 12px - Cards
  lg: '1rem',     // 16px - Large cards
  xl: '1.5rem',   // 24px - Modals, hero sections
  full: '9999px', // Pills, avatars
}
```

### Shadows
Subtle depth that feels natural, not heavy.

```javascript
boxShadow: {
  sm: '0 1px 2px 0 rgba(61, 61, 58, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(61, 61, 58, 0.1), 0 1px 2px 0 rgba(61, 61, 58, 0.06)',
  md: '0 4px 6px -1px rgba(61, 61, 58, 0.1), 0 2px 4px -1px rgba(61, 61, 58, 0.06)',
  lg: '0 10px 15px -3px rgba(61, 61, 58, 0.1), 0 4px 6px -2px rgba(61, 61, 58, 0.05)',
  xl: '0 20px 25px -5px rgba(61, 61, 58, 0.1), 0 10px 10px -5px rgba(61, 61, 58, 0.04)',
}
```

### Transitions
Smooth, natural animations that feel responsive.

```javascript
transitionDuration: {
  fast: '150ms',    // Micro-interactions (hover, focus)
  normal: '200ms',  // Standard transitions
  slow: '300ms',    // Complex state changes
  page: '400ms',    // Page transitions
}

transitionTimingFunction: {
  DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-in-out
}
```

---

## Component Patterns

### Buttons

**Primary Button (Sage)**
```tsx
<Button className="bg-sage-600 hover:bg-sage-700 text-white font-display font-semibold py-6 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-normal">
  Submit Application
</Button>
```

**Secondary Button (Lavender)**
```tsx
<Button className="bg-lavender-400 hover:bg-lavender-500 text-white font-display font-semibold py-6 px-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-normal">
  View Details
</Button>
```

**Outline Button**
```tsx
<Button className="bg-white border-2 border-sage-600 text-sage-600 hover:bg-sage-50 font-display font-semibold py-6 px-8 rounded-lg transition-all duration-normal">
  Cancel
</Button>
```

### Form Inputs

**Text Input**
```tsx
<div className="space-y-2">
  <Label className="font-display text-body-sm text-text-primary">
    AHPRA Registration <span className="text-error">*</span>
  </Label>
  <Input
    type="text"
    placeholder="Enter registration number"
    className="border-sage-200 focus:border-sage-600 focus:ring-sage-600 rounded-lg"
  />
  <p className="font-body text-body-xs text-text-tertiary">
    Your 16-digit AHPRA registration number
  </p>
</div>
```

**Textarea**
```tsx
<Textarea
  rows={6}
  placeholder="Tell us about yourself..."
  className="resize-none border-sage-200 focus:border-sage-600 font-body leading-loose rounded-lg"
/>
```

**File Upload**
```tsx
<Input
  type="file"
  accept=".pdf,.jpg,.jpeg,.png"
  className="border-sage-200 focus:border-sage-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-sage-50 file:text-sage-700 file:font-display file:font-semibold hover:file:bg-sage-100"
/>
```

### Cards

**Standard Card**
```tsx
<Card className="border-sage-200 shadow-lg bg-white rounded-lg">
  <CardHeader>
    <CardTitle className="font-display text-h2 text-text-primary">
      Application Details
    </CardTitle>
    <CardDescription className="font-body text-body-base text-text-secondary">
      Review the information below
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content */}
  </CardContent>
</Card>
```

**Highlighted Card (Lavender accent)**
```tsx
<Card className="border-lavender-200 bg-lavender-50 shadow-md rounded-lg">
  <CardContent className="p-6">
    <div className="flex items-start gap-4">
      <Sparkles className="w-6 h-6 text-lavender-400 flex-shrink-0" />
      <div>
        <h3 className="font-display text-h4 text-text-primary mb-2">
          Success!
        </h3>
        <p className="font-body text-body-base text-text-secondary">
          Your application has been submitted.
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

### Icons
Use **lucide-react** for all icons. Maintain consistent sizing:
- Small: `w-4 h-4` (16px)
- Medium: `w-5 h-5` (20px)
- Large: `w-6 h-6` (24px)
- Hero: `w-8 h-8` (32px) or larger

**Common Icons:**
- `CheckCircle2` - Success states
- `AlertCircle` - Warnings
- `XCircle` - Errors
- `Info` - Information
- `Sparkles` - Celebration/success
- `WifiOff` - Network errors
- `GraduationCap` - Education/qualifications
- `Shield` - Security/verification

---

## Error Handling

### Philosophy
Errors should feel like a helpful colleague tapping your shoulder, not a system failing. Use warm, encouraging language and always provide next steps.

### Error State Components

**Network Error**
```tsx
<NetworkErrorState
  onRetry={() => fetchData()}
  customMessage="We're having trouble loading your applications"
/>
```

**Server Error**
```tsx
<ServerErrorState
  errorCode="500"
  customMessage="Something went wrong on our end"
/>
```

**Empty State**
```tsx
<EmptyState
  icon={<FileText className="w-12 h-12 text-lavender-300" />}
  title="No Applications Yet"
  description="When psychologists apply to join, you'll see them here."
/>
```

### Loading States
Use skeleton screens with sage tint rather than spinners:

```tsx
<LoadingState
  rows={5}
  className="bg-sage-50"
/>
```

### Error Messages

**Good Examples:**
- ✅ "We couldn't find that application. It may have been removed."
- ✅ "Your session expired. Let's get you logged back in."
- ✅ "This file is too large. Please upload a file under 10MB."

**Bad Examples:**
- ❌ "Error 404: Resource not found"
- ❌ "Unauthorized access"
- ❌ "Invalid input"

---

## Technical Stack

### Frontend
- **Framework:** React 18.3.24 with TypeScript 5.5
- **Build Tool:** Vite 7.1.3
- **Styling:** Tailwind CSS 3.4.18
- **Components:** shadcn/ui (custom Bloom-themed)
- **State:** Redux Toolkit 2.5
- **Routing:** React Router 7.1
- **Icons:** lucide-react 0.468

### Backend
- **Runtime:** Azure Functions v4 (Node.js 18)
- **Language:** TypeScript
- **Database:** Azure SQL Database
- **Storage:** Azure Blob Storage
- **API:** RESTful endpoints

### Deployment
- **Platform:** Azure Static Web Apps
- **Environment:** https://witty-ground-01f9d5100.3.azurestaticapps.net
- **CI/CD:** GitHub Actions
- **Branch Strategy:** main → staging → develop

---

## Implementation Examples

### Example 1: Qualification Check Component

```tsx
import { useState } from 'react';
import { GraduationCap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const QualificationCheck = ({ onEligible }: { onEligible: () => void }) => {
  const [isRegisteredPsychologist, setIsRegisteredPsychologist] = useState(false);
  const [hasPhd, setHasPhd] = useState(false);
  const [yearsRegistered, setYearsRegistered] = useState(0);

  const handleCheckEligibility = () => {
    const eligible = isRegisteredPsychologist || hasPhd || yearsRegistered >= 8;
    
    if (eligible) {
      setTimeout(() => onEligible(), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-sage-200 shadow-xl bg-white rounded-lg">
        <div className="p-8">
          {/* Icon Header */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-sage-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-display-sm text-text-primary text-center mb-3">
            Qualification Check
          </h1>
          <p className="font-body text-body-base text-text-secondary text-center mb-8 leading-loose">
            To ensure quality of care, we require applicants to meet at least one of the following criteria:
          </p>

          {/* Criteria List */}
          <div className="bg-lavender-50 border border-lavender-200 rounded-lg p-6 mb-8">
            <h2 className="font-display text-body font-semibold text-text-primary mb-4">
              Minimum Requirements
            </h2>
            <p className="font-body text-body-sm text-text-secondary mb-4">
              To apply, you must meet at least <strong className="text-sage-600">ONE</strong> of these criteria:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5" />
                <span className="font-body text-body-sm text-text-secondary">
                  <strong className="text-text-primary">Registered Clinical Psychologist</strong> with AHPRA
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5" />
                <span className="font-body text-body-sm text-text-secondary">
                  <strong className="text-text-primary">8+ years</strong> as a registered psychologist with AHPRA
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5" />
                <span className="font-body text-body-sm text-text-secondary">
                  <strong className="text-text-primary">PhD in Psychology</strong> with current AHPRA registration
                </span>
              </li>
            </ul>
          </div>

          {/* Input Fields */}
          <div className="space-y-6">
            {/* Checkbox inputs... */}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleCheckEligibility}
            className="w-full bg-sage-600 hover:bg-sage-700 text-white font-display text-body font-semibold py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-normal mt-8"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Check Eligibility
          </Button>
        </div>
      </Card>
    </div>
  );
};
```

### Example 2: Application Form with Bloom Styling

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  <Card className="border-sage-200 shadow-lg bg-white rounded-lg">
    <CardHeader>
      <CardTitle className="font-display text-h2 text-text-primary">
        Application Form
      </CardTitle>
      <CardDescription className="font-body text-body-base text-text-secondary">
        Tell us about yourself and your practice
      </CardDescription>
    </CardHeader>
    
    <CardContent className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="font-display text-h4 text-text-primary">
          Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-display text-body-sm text-text-primary">
              First Name <span className="text-error">*</span>
            </Label>
            <Input
              name="first_name"
              required
              className="border-sage-200 focus:border-sage-600 focus:ring-sage-600"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="font-display text-body-sm text-text-primary">
              Last Name <span className="text-error">*</span>
            </Label>
            <Input
              name="last_name"
              required
              className="border-sage-200 focus:border-sage-600 focus:ring-sage-600"
            />
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="space-y-4">
        <h3 className="font-display text-h4 text-text-primary">
          Professional Information
        </h3>
        
        <div className="space-y-2">
          <Label className="font-display text-body-sm text-text-primary">
            Cover Letter <span className="text-error">*</span>
          </Label>
          <Textarea
            name="cover_letter"
            required
            rows={6}
            placeholder="Tell us why you'd like to join our team..."
            className="resize-none border-sage-200 focus:border-sage-600 font-body leading-loose"
          />
          <p className="font-body text-body-xs text-text-tertiary">
            Share your experience and what draws you to our practice
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={uploading}
        className="w-full bg-sage-600 hover:bg-sage-700 text-white font-display text-body font-semibold py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-normal"
      >
        {uploading ? "Submitting..." : "Submit Application"}
      </Button>
    </CardContent>
  </Card>
</form>
```

### Example 3: Success State

```tsx
<div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
  <Card className="max-w-md w-full border-sage-200 shadow-xl bg-white rounded-lg">
    <CardContent className="p-8 text-center">
      {/* Icon with gradient */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-sage-100 to-lavender-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-sage-600" />
        </div>
      </div>

      {/* Title */}
      <h2 className="font-display text-display-sm text-text-primary mb-3">
        Application Submitted!
      </h2>

      {/* Description */}
      <p className="font-body text-body-lg text-text-secondary mb-8 leading-loose">
        Thank you for applying. We'll review your application and get back to you within 3-5 business days.
      </p>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={() => window.location.href = '/'}
          className="w-full bg-sage-600 hover:bg-sage-700 text-white font-display font-semibold py-6 rounded-lg"
        >
          Return Home
        </Button>
        <Button
          onClick={() => setSubmitted(false)}
          variant="outline"
          className="w-full border-2 border-sage-200 text-sage-600 hover:bg-sage-50 font-display font-semibold py-6 rounded-lg"
        >
          Submit Another Application
        </Button>
      </div>
    </CardContent>
  </Card>
</div>
```

---

## Design Checklist

When implementing new features, ensure:

### Visual Design
- [ ] Uses sage green (#6B8066) for primary actions
- [ ] Uses lavender (#B4A7D6) for secondary accents
- [ ] Uses cream (#F5F3EE) for backgrounds
- [ ] Text uses warm charcoal colors (not pure black)
- [ ] All spacing follows 8px grid
- [ ] Border radius is 8-16px (not sharp, not overly round)
- [ ] Shadows are subtle (rgba with low opacity)

### Typography
- [ ] Headings use Poppins (font-display)
- [ ] Body text uses Inter (font-body)
- [ ] Labels use semibold weight (600)
- [ ] Body text has generous line-height (1.625-1.75)
- [ ] Font sizes follow the defined scale

### Interaction
- [ ] Transitions are 150-300ms
- [ ] Hover states are clear but subtle
- [ ] Focus states use sage-600 ring
- [ ] Buttons have appropriate padding (py-6 minimum)
- [ ] Loading states use skeleton screens, not spinners

### Content
- [ ] Error messages are warm and helpful
- [ ] Success messages celebrate the user
- [ ] Help text provides context, not just rules
- [ ] Placeholders guide without commanding
- [ ] Labels are clear and conversational

### Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Interactive elements have focus states
- [ ] Error states are announced to screen readers
- [ ] Form fields have proper labels
- [ ] Keyboard navigation works throughout

---

## File Structure

```
bloom-web-app/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── NetworkErrorState.tsx
│   │   │   ├── ServerErrorState.tsx
│   │   │   └── QualificationCheck.tsx
│   │   ├── ui/                    # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── label.tsx
│   │   └── [feature]/
│   ├── pages/
│   │   ├── Homepage.tsx
│   │   ├── JoinUs.tsx
│   │   └── admin/
│   ├── design-system/
│   │   └── tokens.ts             # Design tokens
│   ├── styles/
│   │   ├── index.css             # Tailwind imports
│   │   └── typography.css        # Custom typography
│   └── lib/
│       └── utils.ts              # Utility functions
├── tailwind.config.js            # Bloom design system config
└── BLOOM_DEVELOPMENT_PROMPT.md   # This file
```

---

## Common Patterns

### Form Validation Error
```tsx
{errors.email && (
  <p className="font-body text-body-xs text-error flex items-center gap-1">
    <AlertCircle className="w-3 h-3" />
    {errors.email}
  </p>
)}
```

### Status Badge
```tsx
const statusColors = {
  pending: 'bg-warning-bg text-warning border-warning',
  approved: 'bg-success-bg text-success border-success',
  rejected: 'bg-error-bg text-error border-error',
};

<Badge className={`${statusColors[status]} font-display text-body-xs px-3 py-1 rounded-full`}>
  {status}
</Badge>
```

### Data Table Header
```tsx
<div className="bg-sage-50 border-b border-sage-200 px-6 py-4">
  <h2 className="font-display text-h3 text-text-primary">
    Applications
  </h2>
  <p className="font-body text-body-sm text-text-secondary mt-1">
    {applications.length} total applications
  </p>
</div>
```

---

## Quick Reference: Color Usage

| Element | Primary Color | Alternative | Text |
|---------|---------------|-------------|------|
| Primary Button | sage-600 | hover:sage-700 | white |
| Secondary Button | lavender-400 | hover:lavender-500 | white |
| Page Background | cream-100 | cream-50 | - |
| Card Background | white | sage-50 | - |
| Input Border | sage-200 | focus:sage-600 | text-primary |
| Heading | - | - | text-primary |
| Body Text | - | - | text-secondary |
| Help Text | - | - | text-tertiary |
| Success | success | success-bg | text-primary |
| Warning | warning | warning-bg | text-primary |
| Error | error | error-bg | white |

---

## Version History

- **v1.0** - October 16, 2025 - Initial comprehensive design system
  - Established color palette (sage, lavender, cream)
  - Defined typography system (Poppins/Inter/IBM Plex Mono)
  - Created spacing and layout standards
  - Documented component patterns
  - Implemented error handling philosophy

---

## Additional Resources

- **Figma Design System:** [Coming soon]
- **Component Storybook:** [Coming soon]
- **API Documentation:** `/api/README.md`
- **Deployment Guide:** `README.md`

---

## Questions & Support

When in doubt, ask:
1. **Does this feel warm and professional?**
2. **Would a clinical psychologist feel respected and welcomed?**
3. **Is the action clear without being bossy?**
4. **Does this follow our 8px grid and color system?**

**Bloom is a hug and a handshake. Both matter equally.** 🌸

---

*"We're the fairy godmother who believes in you while maintaining professional standards."*
