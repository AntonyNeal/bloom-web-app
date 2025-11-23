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
9. [Australian Compliance & Formatting](#australian-compliance--formatting)
10. [Multi-Step Form Patterns](#multi-step-form-patterns)
11. [Document Upload & Management](#document-upload--management)
12. [Admin Portal Patterns](#admin-portal-patterns)
13. [Mobile-First Responsive Patterns](#mobile-first-responsive-patterns)
14. [Animation & Micro-interactions](#animation--micro-interactions)
15. [Visual Warmth & Personality](#visual-warmth--personality)
16. [Comprehensive Copywriting Patterns](#comprehensive-copywriting-patterns)
17. [Implementation Phases & Priorities](#implementation-phases--priorities)
18. [Testing & Quality Assurance](#testing--quality-assurance)
19. [Performance & Optimization](#performance--optimization)

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

- **v2.1** - October 16, 2025 - Visual Warmth & Personality Enhancement
  - Added Section 15: Visual Warmth & Personality (1000+ lines)
  - Studio Ghibli-inspired enhancements: organic shapes, subtle animations, depth
  - Screen-specific improvements: QualificationCheck, Landing Page, Error States
  - Enhanced button patterns with gradients, shine effects, hover animations
  - Icon patterns with personality (gradients, sparkles, decorative accents)
  - Success state celebrations with Framer Motion
  - Background ambient blobs and texture patterns
  - Component enhancement checklist and implementation priorities
  - Total: 3900+ lines of warm, professional implementation guidance

- **v2.0** - October 16, 2025 - Comprehensive production-ready guide
  - Added Implementation Phases & Priorities (Proto-Bloom roadmap)
  - Added Testing & Quality Assurance (unit, integration, E2E)
  - Added Performance & Optimization (bundle size, caching, Lighthouse targets)
  - Added Australian Compliance & Formatting (dates, AHPRA, privacy)
  - Added Multi-Step Form Patterns (progress indicators, validation)
  - Added Document Upload & Management (Azure Blob, SAS tokens)
  - Added Admin Portal Patterns (review interface, status badges)
  - Added Mobile-First Responsive Patterns (breakpoints, touch targets)
  - Added Animation & Micro-interactions (Framer Motion)
  - Added Comprehensive Copywriting Patterns (voice, tone, messaging)
  - Total: 3100+ lines of production-ready implementation guidance

- **v1.0** - October 16, 2025 - Initial comprehensive design system
  - Established color palette (sage, lavender, cream)
  - Defined typography system (Poppins/Inter/IBM Plex Mono)
  - Created spacing and layout standards
  - Documented component patterns
  - Implemented error handling philosophy

---

## Australian Compliance & Formatting

### Philosophy
As an Australian healthcare platform, Bloom must respect local conventions, regulatory requirements, and cultural expectations. Every date, phone number, and registration detail should feel locally appropriate.

### Date & Time Formatting

**Australian Date Format (DD/MM/YYYY)**
```typescript
// Always use DD/MM/YYYY, never MM/DD/YYYY
const formatAustralianDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

// Example usage
const submitted = new Date('2025-10-16');
formatAustralianDate(submitted); // Returns: "16/10/2025"
```

**Date with Time (AEST/AEDT)**
```typescript
const formatAustralianDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Australia/Sydney',
    hour12: true
  }).format(date);
};

// Example
formatAustralianDateTime(new Date()); // "16/10/2025, 2:30 pm"
```

**Relative Time Formatting**
```typescript
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return formatAustralianDate(date);
};

// Usage in components
<p className="font-body text-body-xs text-text-tertiary">
  Submitted {getRelativeTime(application.submittedAt)}
</p>
```

### Phone Number Formatting

**Australian Phone Patterns**
```typescript
// Mobile: +61 4XX XXX XXX or 04XX XXX XXX
// Landline: (02) XXXX XXXX or +61 2 XXXX XXXX

const formatAustralianPhone = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle international format (+61)
  if (cleaned.startsWith('61')) {
    const localPart = cleaned.slice(2);
    if (localPart.startsWith('4')) {
      // Mobile: +61 4XX XXX XXX
      return `+61 ${localPart.slice(0, 3)} ${localPart.slice(3, 6)} ${localPart.slice(6)}`;
    } else {
      // Landline: +61 X XXXX XXXX
      return `+61 ${localPart.slice(0, 1)} ${localPart.slice(1, 5)} ${localPart.slice(5)}`;
    }
  }
  
  // Handle local format
  if (cleaned.startsWith('04')) {
    // Mobile: 04XX XXX XXX
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else {
    // Landline: (0X) XXXX XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  }
};

// Component usage
<Input
  type="tel"
  name="phone"
  placeholder="0412 345 678"
  onChange={(e) => {
    const formatted = formatAustralianPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  }}
  className="border-sage-200 focus:border-sage-600"
/>
```

### AHPRA Registration Validation

**AHPRA Format: 3 Letters + 10 Digits**
```typescript
// AHPRA psychologist numbers: PSY + 10 digits
// Example: PSY0001234567

const validateAHPRA = (number: string): boolean => {
  const pattern = /^[A-Z]{3}[0-9]{10}$/;
  return pattern.test(number.toUpperCase().replace(/\s/g, ''));
};

const formatAHPRA = (value: string): string => {
  // Remove spaces and convert to uppercase
  const cleaned = value.toUpperCase().replace(/\s/g, '');
  
  // Add space after letters for readability
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  return cleaned;
};

// Component with real-time validation
export const AHPRAInput = ({ value, onChange, error }: Props) => {
  const [localError, setLocalError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAHPRA(e.target.value);
    onChange(formatted);
    
    if (formatted.length > 0 && !validateAHPRA(formatted)) {
      setLocalError('AHPRA numbers start with 3 letters (e.g., PSY) followed by 10 digits');
    } else {
      setLocalError('');
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="font-display text-body-sm text-text-primary">
        AHPRA Registration Number <span className="text-error">*</span>
      </Label>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="PSY 0001234567"
        maxLength={14} // 3 letters + space + 10 digits
        className={cn(
          "border-sage-200 focus:border-sage-600 font-mono",
          (error || localError) && "border-error focus:border-error"
        )}
      />
      {(error || localError) && (
        <p className="font-body text-body-xs text-error flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error || localError}
        </p>
      )}
      <p className="font-body text-body-xs text-text-tertiary">
        Find your number at{' '}
        <a 
          href="https://www.ahpra.gov.au/registration/registers-of-practitioners.aspx"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sage-600 hover:text-sage-700 underline"
        >
          ahpra.gov.au
        </a>
      </p>
    </div>
  );
};
```

### Privacy Act Compliance

**Consent Patterns**
```typescript
// Privacy Act 1988 requires explicit, informed consent
export const PrivacyConsent = ({ checked, onChange }: Props) => {
  return (
    <div className="bg-cream-100 border border-sage-200 rounded-lg p-6 space-y-4">
      <h3 className="font-display text-h4 text-text-primary">
        Privacy & Data Collection
      </h3>
      
      <p className="font-body text-body-sm text-text-secondary leading-loose">
        Life Psychology Australia collects your personal information to assess your
        application and, if successful, manage your engagement as a practitioner.
        We handle all information in accordance with the Privacy Act 1988 and
        Australian Privacy Principles.
      </p>
      
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-sage-300 text-sage-600 focus:ring-sage-600"
          />
          <span className="font-body text-body-sm text-text-primary">
            I consent to Life Psychology Australia collecting, storing, and using
            my personal information for the purposes of assessing this application.
            I understand I can withdraw this consent at any time by emailing{' '}
            <a href="mailto:privacy@life-psychology.com.au" className="text-sage-600 underline">
              privacy@life-psychology.com.au
            </a>
          </span>
        </label>
      </div>
      
      <div className="flex gap-4 text-body-xs">
        <a 
          href="/privacy-policy" 
          className="font-body text-sage-600 hover:text-sage-700 underline"
        >
          Read Privacy Policy
        </a>
        <a 
          href="/data-handling" 
          className="font-body text-sage-600 hover:text-sage-700 underline"
        >
          How We Handle Your Data
        </a>
      </div>
    </div>
  );
};
```

**Right to Withdraw Consent**
```typescript
// Must provide easy way to withdraw consent
export const WithdrawConsentButton = () => {
  const handleWithdraw = async () => {
    const confirmed = window.confirm(
      'Withdrawing consent will delete your application and all associated data. This cannot be undone. Continue?'
    );
    
    if (confirmed) {
      await fetch('/api/applications/withdraw-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: current.id })
      });
      
      // Show confirmation
      toast.success('Your data has been deleted. You may close this window.');
    }
  };
  
  return (
    <Button
      onClick={handleWithdraw}
      variant="outline"
      className="border-error text-error hover:bg-error-bg"
    >
      Withdraw Consent & Delete Data
    </Button>
  );
};
```

### AHPRA Advertising Compliance

**Critical Restrictions**
```typescript
// AHPRA prohibits certain claims in advertising
// Source: National Law Section 133, Advertising Guidelines

const PROHIBITED_CONTENT = {
  testimonials: {
    forbidden: true,
    reason: 'Cannot use patient testimonials or reviews',
    alternative: 'Use practitioner qualifications and experience instead'
  },
  
  beforeAfter: {
    forbidden: true,
    reason: 'Cannot show before/after or promise specific outcomes',
    alternative: 'Describe treatment approaches, not guaranteed results'
  },
  
  guarantees: {
    forbidden: true,
    reason: 'Cannot guarantee cure or treatment success',
    alternative: 'Use "may help" or "designed to support" language'
  },
  
  comparisons: {
    forbidden: true,
    reason: 'Cannot compare to other practitioners negatively',
    alternative: 'Focus on unique approaches without comparison'
  }
};

// Compliant practitioner bio template
export const PractitionerBioTemplate = {
  sections: {
    qualifications: 'PhD in Clinical Psychology, AHPRA Registration: PSY0001234567',
    experience: '12 years experience working with anxiety and depression',
    approach: 'Uses evidence-based approaches including CBT and ACT',
    specialties: 'Specializes in adult mental health and trauma-informed care',
    availability: 'Currently accepting new clients on weekdays'
  },
  
  // FORBIDDEN phrases
  avoid: [
    '100% success rate',
    '"Best psychologist in Sydney"',
    'Guaranteed results',
    'See our 5-star reviews',
    'Before and after client stories'
  ],
  
  // SAFE phrases
  use: [
    'Evidence-based treatment approaches',
    'Experienced in treating...',
    'Registered clinical psychologist with...',
    'Available for consultations',
    'Trained in...'
  ]
};
```

**Warning Component for Admin**
```typescript
export const AHPRAComplianceWarning = () => {
  return (
    <div className="bg-warning-bg border-l-4 border-warning p-6 rounded-r-lg mb-6">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-display text-body font-semibold text-text-primary mb-2">
            AHPRA Advertising Compliance
          </h4>
          <ul className="font-body text-body-sm text-text-secondary space-y-1 list-disc list-inside">
            <li>Do not publish patient testimonials or reviews</li>
            <li>Do not guarantee outcomes or use "cure" language</li>
            <li>Do not show before/after examples</li>
            <li>Only use verified qualifications and registrations</li>
            <li>Do not make comparisons to other practitioners</li>
          </ul>
          <a 
            href="https://www.ahpra.gov.au/Publications/Advertising-hub.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 font-display text-body-sm text-sage-600 hover:text-sage-700"
          >
            Read AHPRA Guidelines
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
```

---

## Multi-Step Form Patterns

### Philosophy
Long forms intimidate. Multi-step forms guide. Break the 7-section application into digestible chunks with clear progress, validation per step, and the ability to save progress.

### Step Progress Indicator

**Desktop Implementation**
```typescript
import { CheckCircle2, Circle } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  completed: boolean;
  current: boolean;
}

export const StepProgress = ({ steps, currentStep }: { steps: Step[], currentStep: number }) => {
  return (
    <div className="hidden md:block mb-12">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-normal",
                step.completed && "bg-sage-600 text-white",
                step.current && !step.completed && "bg-lavender-400 text-white ring-4 ring-lavender-100",
                !step.completed && !step.current && "bg-cream-200 text-text-tertiary"
              )}>
                {step.completed ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <span className="font-display text-body-sm font-semibold">{step.id}</span>
                )}
              </div>
              
              {/* Step Label */}
              <span className={cn(
                "font-display text-body-xs mt-3 text-center max-w-[100px]",
                step.current ? "text-text-primary font-semibold" : "text-text-tertiary"
              )}>
                {step.label}
              </span>
            </div>
            
            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className={cn(
                "h-1 flex-1 mx-4 rounded-full transition-all duration-normal",
                step.completed ? "bg-sage-600" : "bg-cream-200"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Mobile Implementation (Vertical)**
```typescript
export const MobileStepProgress = ({ steps, currentStep }: Props) => {
  return (
    <div className="md:hidden mb-8">
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-4">
            {/* Step Indicator */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                step.completed && "bg-sage-600 text-white",
                step.current && "bg-lavender-400 text-white",
                !step.completed && !step.current && "bg-cream-200 text-text-tertiary"
              )}>
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="font-display text-body-xs font-semibold">{step.id}</span>
                )}
              </div>
              
              {/* Vertical Line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-1 h-12 rounded-full my-1",
                  step.completed ? "bg-sage-600" : "bg-cream-200"
                )} />
              )}
            </div>
            
            {/* Step Content */}
            <div className="flex-1 pt-2">
              <h3 className={cn(
                "font-display text-body-sm",
                step.current ? "text-text-primary font-semibold" : "text-text-tertiary"
              )}>
                {step.label}
              </h3>
              {step.current && (
                <p className="font-body text-body-xs text-text-secondary mt-1">
                  Current step
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Form State Management

**useMultiStepForm Hook**
```typescript
import { useState, useEffect } from 'react';

interface FormData {
  // Step 1: Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Step 2: Professional
  ahpra: string;
  yearsExperience: number;
  qualifications: string[];
  
  // Step 3: Experience
  specialties: string[];
  approaches: string[];
  
  // Step 4: Documents
  cvUrl?: string;
  certificateUrl?: string;
  photoUrl?: string;
  
  // Step 5: Availability
  preferredDays: string[];
  hoursPerWeek: number;
  
  // Step 6: Cover Letter
  coverLetter: string;
  
  // Step 7: Review
  privacyConsent: boolean;
}

export const useMultiStepForm = () => {
  const STORAGE_KEY = 'bloom_application_draft';
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : getInitialFormData();
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);
  
  // Validation rules per step
  const validateStep = (step: number): boolean => {
    const newErrors: typeof errors = {};
    
    switch (step) {
      case 1: // Personal
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.email || !isValidEmail(formData.email)) {
          newErrors.email = 'Valid email is required';
        }
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        break;
        
      case 2: // Professional
        if (!formData.ahpra || !validateAHPRA(formData.ahpra)) {
          newErrors.ahpra = 'Valid AHPRA registration is required';
        }
        if (!formData.yearsExperience || formData.yearsExperience < 5) {
          newErrors.yearsExperience = 'Minimum 5 years experience required';
        }
        break;
        
      // ... other steps
      
      case 7: // Review
        if (!formData.privacyConsent) {
          newErrors.privacyConsent = 'Privacy consent is required';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(getInitialFormData());
  };
  
  return {
    currentStep,
    formData,
    errors,
    nextStep,
    previousStep,
    updateFormData,
    validateStep,
    clearDraft,
    totalSteps: 7
  };
};
```

### Navigation Component

**Step Navigation Buttons**
```typescript
export const StepNavigation = ({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext, 
  onSubmit,
  isLastStep 
}: Props) => {
  return (
    <div className="flex items-center justify-between gap-4 pt-8 border-t border-sage-200">
      {/* Previous Button */}
      {currentStep > 1 && (
        <Button
          type="button"
          onClick={onPrevious}
          variant="outline"
          className="border-2 border-sage-200 text-sage-600 hover:bg-sage-50 font-display font-semibold px-8 py-6 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Previous
        </Button>
      )}
      
      {/* Skip / Save Draft */}
      <div className="flex-1 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            localStorage.setItem('draft_saved_at', new Date().toISOString());
            toast.success('Progress saved! You can continue later.');
          }}
          className="text-text-tertiary hover:text-text-primary font-body text-body-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          Save & Continue Later
        </Button>
      </div>
      
      {/* Next / Submit Button */}
      <Button
        type="button"
        onClick={isLastStep ? onSubmit : onNext}
        className="bg-sage-600 hover:bg-sage-700 text-white font-display font-semibold px-8 py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-normal"
      >
        {isLastStep ? 'Submit Application' : 'Continue'}
        {!isLastStep && <ChevronRight className="w-5 h-5 ml-2" />}
      </Button>
    </div>
  );
};
```

### Auto-Save & Resume

**Draft Recovery Component**
```typescript
export const DraftRecovery = ({ onRestore, onDiscard }: Props) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  
  useEffect(() => {
    const draft = localStorage.getItem('bloom_application_draft');
    const savedAt = localStorage.getItem('draft_saved_at');
    
    if (draft && savedAt) {
      setDraftDate(new Date(savedAt));
      setShowPrompt(true);
    }
  }, []);
  
  if (!showPrompt || !draftDate) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-lavender-50 border border-lavender-200 rounded-lg p-6 mb-8"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-lavender-100 rounded-full flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-lavender-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-display text-h4 text-text-primary mb-2">
            Continue Your Application?
          </h3>
          <p className="font-body text-body-base text-text-secondary mb-4 leading-loose">
            We found a draft you started {getRelativeTime(draftDate)}. 
            Would you like to continue where you left off?
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={() => {
                onRestore();
                setShowPrompt(false);
              }}
              className="bg-sage-600 hover:bg-sage-700 text-white font-display font-semibold py-3 px-6 rounded-lg"
            >
              Continue Draft
            </Button>
            <Button
              onClick={() => {
                onDiscard();
                setShowPrompt(false);
              }}
              variant="outline"
              className="border-2 border-sage-200 text-sage-600 hover:bg-sage-50 font-display font-semibold py-3 px-6 rounded-lg"
            >
              Start Fresh
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
```

---

## Document Upload & Management

### Philosophy
Document uploads should feel confident and clear. Show progress, validate early, and give immediate feedback. Use Azure Blob Storage with SAS tokens for secure, direct uploads without routing sensitive files through our servers.

### Azure Blob Upload Pattern

**Three-Step Upload Flow**
```typescript
// Step 1: Request SAS token from backend
const getSasToken = async (fileType: 'cv' | 'certificate' | 'photo'): Promise<SasTokenResponse> => {
  const response = await fetch(`${API_BASE}/api/applications/get-sas-token?fileType=${fileType}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get upload token');
  }
  
  return response.json(); // { sasUrl, blobName, container }
};

// Step 2: Upload directly to Azure Blob
const uploadToBlob = async (file: File, sasUrl: string, onProgress?: (percent: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    
    xhr.open('PUT', sasUrl);
    xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};

// Step 3: Complete upload flow
const handleDocumentUpload = async (file: File, type: 'cv' | 'certificate' | 'photo') => {
  try {
    // Validate file first
    const validation = validateFile(file, type);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Get SAS token
    const { sasUrl, blobName } = await getSasToken(type);
    
    // Upload to blob
    await uploadToBlob(file, sasUrl, (percent) => {
      setUploadProgress(prev => ({ ...prev, [type]: percent }));
    });
    
    // Store blob reference for form submission
    updateFormData({ [`${type}Url`]: blobName });
    
    toast.success(`${type === 'cv' ? 'CV' : type === 'certificate' ? 'Certificate' : 'Photo'} uploaded successfully!`);
  } catch (error) {
    toast.error(error.message);
  }
};
```

### File Validation

**Comprehensive Validation Rules**
```typescript
interface FileValidation {
  valid: boolean;
  error?: string;
}

const FILE_RULES = {
  cv: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    displayName: 'CV/Resume'
  },
  certificate: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    displayName: 'AHPRA Certificate'
  },
  photo: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    displayName: 'Professional Photo',
    minDimensions: { width: 400, height: 400 }
  }
};

const validateFile = async (file: File, type: keyof typeof FILE_RULES): Promise<FileValidation> => {
  const rules = FILE_RULES[type];
  
  // Check file size
  if (file.size > rules.maxSize) {
    return {
      valid: false,
      error: `${rules.displayName} must be under ${Math.round(rules.maxSize / 1024 / 1024)}MB. Your file is ${Math.round(file.size / 1024 / 1024)}MB.`
    };
  }
  
  // Check file type
  if (!rules.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `${rules.displayName} must be one of: ${rules.allowedExtensions.join(', ')}`
    };
  }
  
  // For images, check dimensions
  if (type === 'photo' && rules.minDimensions) {
    const dimensions = await getImageDimensions(file);
    if (dimensions.width < rules.minDimensions.width || dimensions.height < rules.minDimensions.height) {
      return {
        valid: false,
        error: `Photo must be at least ${rules.minDimensions.width}x${rules.minDimensions.height}px. Your photo is ${dimensions.width}x${dimensions.height}px.`
      };
    }
  }
  
  return { valid: true };
};

// Helper to get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};
```

### Document Upload Component

**Full-Featured Upload Component**
```typescript
export const DocumentUpload = ({ 
  type,
  label,
  required = false,
  helpText,
  value,
  onChange 
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (file: File) => {
    setError(null);
    setUploading(true);
    setProgress(0);
    
    try {
      // Validate
      const validation = await validateFile(file, type);
      if (!validation.valid) {
        setError(validation.error!);
        setUploading(false);
        return;
      }
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
      }
      
      // Upload
      const { sasUrl, blobName } = await getSasToken(type);
      await uploadToBlob(file, sasUrl, setProgress);
      
      onChange(blobName);
      toast.success(`${label} uploaded successfully!`);
    } catch (err) {
      setError(err.message);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };
  
  const handleDelete = () => {
    onChange(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="font-display text-body-sm text-text-primary">
        {label} {required && <span className="text-error">*</span>}
      </Label>
      
      {/* Upload Area */}
      {!value && !uploading && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-normal",
            error ? "border-error bg-error-bg" : "border-sage-200 hover:border-sage-400 hover:bg-sage-50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={cn(
            "w-12 h-12 mx-auto mb-4",
            error ? "text-error" : "text-sage-400"
          )} />
          <p className="font-display text-body font-semibold text-text-primary mb-2">
            Drop file here or click to browse
          </p>
          <p className="font-body text-body-xs text-text-tertiary">
            {helpText}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_RULES[type].allowedExtensions.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />
        </div>
      )}
      
      {/* Upload Progress */}
      {uploading && (
        <div className="border-2 border-sage-200 rounded-lg p-6 bg-sage-50">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-sage-600 animate-spin" />
            <span className="font-display text-body-sm text-text-primary">
              Uploading... {progress}%
            </span>
          </div>
          <div className="w-full bg-cream-200 rounded-full h-2">
            <div 
              className="bg-sage-600 h-2 rounded-full transition-all duration-normal"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Preview / Success State */}
      {value && !uploading && (
        <div className="border-2 border-sage-200 rounded-lg p-4 bg-white">
          <div className="flex items-center gap-4">
            {/* Preview Thumbnail */}
            {preview ? (
              <img 
                src={preview} 
                alt="Preview"
                className="w-16 h-16 rounded object-cover border border-sage-200"
              />
            ) : (
              <div className="w-16 h-16 bg-sage-100 rounded flex items-center justify-center">
                <FileText className="w-8 h-8 text-sage-600" />
              </div>
            )}
            
            {/* File Info */}
            <div className="flex-1">
              <p className="font-display text-body-sm font-semibold text-text-primary">
                {label} uploaded
              </p>
              <p className="font-body text-body-xs text-text-tertiary">
                Ready to submit
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => window.open(`/api/files/${value}`, '_blank')}
                variant="outline"
                size="sm"
                className="border-sage-200 text-sage-600"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="border-error text-error"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <p className="font-body text-body-xs text-error flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};
```

### PDF Preview Component

**Thumbnail Generation**
```typescript
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const PDFPreview = ({ url }: { url: string }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  return (
    <div className="bg-white rounded-lg border border-sage-200 overflow-hidden">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          setLoading(false);
        }}
        onLoadError={(error) => {
          console.error('PDF load error:', error);
          setLoading(false);
        }}
        loading={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 text-sage-600 animate-spin" />
          </div>
        }
      >
        <Page 
          pageNumber={1} 
          width={400}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
      
      {!loading && (
        <div className="bg-sage-50 px-4 py-3 border-t border-sage-200 flex items-center justify-between">
          <span className="font-body text-body-xs text-text-secondary">
            {numPages} {numPages === 1 ? 'page' : 'pages'}
          </span>
          <Button
            onClick={() => window.open(url, '_blank')}
            variant="ghost"
            size="sm"
            className="text-sage-600 hover:text-sage-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Full PDF
          </Button>
        </div>
      )}
    </div>
  );
};
```

---

## Admin Portal Patterns

### Philosophy
The admin portal is for Life Psychology staff to review applications efficiently. Prioritize clarity, speed, and decision-making support. Surface key information immediately, provide context, and make approval/rejection workflows smooth.

### Application List Table

**Sortable, Filterable Table**
```typescript
export const ApplicationsTable = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter and sort logic
  const filteredApplications = applications
    .filter(app => {
      if (filterStatus !== 'all' && app.status !== filterStatus) return false;
      if (searchQuery && !app.fullName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'date':
          return (new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()) * order;
        case 'name':
          return a.fullName.localeCompare(b.fullName) * order;
        case 'status':
          return a.status.localeCompare(b.status) * order;
        default:
          return 0;
      }
    });
  
  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-sage-200 focus:border-sage-600"
            />
          </div>
        </div>
        
        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ApplicationStatus | 'all')}
          className="px-4 py-3 rounded-lg border-2 border-sage-200 focus:border-sage-600 focus:ring-sage-600 font-display text-body-sm"
        >
          <option value="all">All Applications</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-lg shadow-lg border border-sage-200 overflow-hidden">
        <table className="min-w-full divide-y divide-sage-200">
          <thead className="bg-sage-50">
            <tr>
              <TableHeader 
                label="Applicant"
                sortable
                active={sortBy === 'name'}
                order={sortOrder}
                onClick={() => handleSort('name')}
              />
              <TableHeader 
                label="Submitted"
                sortable
                active={sortBy === 'date'}
                order={sortOrder}
                onClick={() => handleSort('date')}
              />
              <TableHeader 
                label="Status"
                sortable
                active={sortBy === 'status'}
                order={sortOrder}
                onClick={() => handleSort('status')}
              />
              <TableHeader label="AHPRA" />
              <TableHeader label="Experience" />
              <TableHeader label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-100">
            {filteredApplications.map((app) => (
              <tr 
                key={app.id}
                onClick={() => navigate(`/admin/applications/${app.id}`)}
                className="hover:bg-cream-50 cursor-pointer transition-colors duration-fast"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {app.photoUrl ? (
                      <img 
                        src={app.photoUrl} 
                        alt={app.fullName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-sage-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                        <span className="font-display text-body-sm font-semibold text-sage-600">
                          {app.firstName[0]}{app.lastName[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-display text-body-sm font-semibold text-text-primary">
                        {app.fullName}
                      </p>
                      <p className="font-body text-body-xs text-text-tertiary">
                        {app.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-body text-body-sm text-text-secondary">
                    {formatAustralianDate(new Date(app.submittedAt))}
                  </p>
                  <p className="font-body text-body-xs text-text-tertiary">
                    {getRelativeTime(new Date(app.submittedAt))}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={app.status} />
                </td>
                <td className="px-6 py-4">
                  <p className="font-mono text-body-xs text-text-secondary">
                    {app.ahpra}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-body text-body-sm text-text-secondary">
                    {app.yearsExperience} years
                  </p>
                </td>
                <td className="px-6 py-4">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/applications/${app.id}`);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-sage-600 hover:text-sage-700"
                  >
                    Review
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Empty State */}
        {filteredApplications.length === 0 && (
          <div className="p-12">
            <EmptyState
              icon={<FileText className="w-12 h-12 text-lavender-300" />}
              title="No Applications Found"
              description={searchQuery ? "Try adjusting your search or filters" : "When psychologists apply, they'll appear here"}
            />
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {filteredApplications.length > 10 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={Math.ceil(filteredApplications.length / 10)}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
```

**Status Badge Component**
```typescript
const statusConfig = {
  pending: {
    bg: 'bg-warning-bg',
    text: 'text-warning',
    border: 'border-warning',
    label: 'Pending Review'
  },
  approved: {
    bg: 'bg-success-bg',
    text: 'text-success',
    border: 'border-success',
    label: 'Approved'
  },
  rejected: {
    bg: 'bg-error-bg',
    text: 'text-error',
    border: 'border-error',
    label: 'Rejected'
  }
};

export const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-display text-body-xs font-semibold",
      config.bg,
      config.text,
      config.border
    )}>
      {status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'pending' && <Clock className="w-3 h-3" />}
      {status === 'rejected' && <XCircle className="w-3 h-3" />}
      {config.label}
    </span>
  );
};
```

---

## Visual Warmth & Personality

### Philosophy: Make Bloom Feel Alive
Current Bloom screens are technically correct (proper colors, spacing, typography) but feel **too monotonous and corporate**. They lack the warmth and personality that the "fairy godmother" philosophy promises.

**The Problem:**
- Too much empty cream/white space with no visual anchors
- Everything perfectly centered (predictable, corporate)
- No illustrations or botanical elements
- No depth or layering (flat design taken too far)
- No micro-delights or personality touches
- Icons are generic (standard Lucide icons)
- No asymmetry or organic flow

**The Solution:**
Think: "What would Miyazaki add to make this feel more alive?" Ghibli films breathe—there's always gentle movement, organic asymmetry, nature peeking through, depth through layering.

**Design Principles:**
1. **Asymmetry is your friend** - Not everything needs to be perfectly centered
2. **Gradients add warmth** - Use subtle sage-to-lavender gradients
3. **Depth through layering** - Shadows, blurs, overlapping elements
4. **Organic shapes** - Blobs, rounded forms, not perfect circles/squares
5. **Nature whispers** - Small plant/leaf/growth elements as accents
6. **Movement suggests life** - Gentle animations, pulsing, breathing
7. **Warm light** - Think afternoon sun, not fluorescent office

---

### General Enhancements (Apply to All Screens)

#### 1. Subtle Background Texture
Instead of flat cream backgrounds:

```tsx
// Add to root component or layout
<div className="textured-background min-h-screen">
  {children}
</div>
```

```css
/* Add to your CSS or Tailwind config */
.textured-background {
  background-color: #F5F3EE;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(107, 128, 102, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(180, 167, 214, 0.03) 0%, transparent 50%);
}
```

#### 2. Ambient Background Blobs
Soft, organic shapes in the background:

```tsx
// Add to page layouts
<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
  {/* Large organic blob - top right */}
  <div className="absolute -top-40 -right-40 w-96 h-96 
                  bg-gradient-to-br from-sage-100 to-transparent 
                  rounded-full blur-3xl opacity-40" />
  
  {/* Medium organic blob - bottom left */}
  <div className="absolute -bottom-32 -left-32 w-80 h-80 
                  bg-gradient-to-tr from-lavender-100 to-transparent 
                  rounded-full blur-3xl opacity-30" />
  
  {/* Small accent - middle right */}
  <div className="absolute top-1/3 right-16 w-32 h-32 
                  bg-gradient-to-br from-blush-200 to-transparent 
                  rounded-full blur-2xl opacity-20" />
</div>
```

#### 3. Enhanced Card Depth
Instead of flat shadows:

```tsx
<Card className="bg-white rounded-lg 
                 shadow-[0_4px_24px_-2px_rgba(107,128,102,0.1),0_2px_8px_-2px_rgba(107,128,102,0.05)]
                 border border-sage-100/50">
  {/* Card content */}
</Card>
```

#### 4. Animated Loading States
Skeleton screens that feel alive:

```tsx
<motion.div
  className="h-4 bg-gradient-to-r from-sage-100 via-sage-200 to-sage-100 rounded"
  animate={{ 
    backgroundPosition: ['0% 0%', '200% 0%']
  }}
  transition={{ 
    duration: 1.5, 
    repeat: Infinity, 
    ease: 'linear' 
  }}
  style={{ 
    backgroundSize: '200% 100%' 
  }}
/>
```

#### 5. Subtle Logo/Wordmark
In the top-left corner of each page:

```tsx
<div className="absolute top-8 left-8 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
  <Sprout className="w-6 h-6 text-sage-600" />
  <span className="font-display text-body-sm text-sage-700">Bloom</span>
</div>
```

---

### Screen-Specific Enhancements

#### Qualification Check Screen (JoinUs.tsx)

**Current Issues:**
- Large white card floating in cream void
- Icon circle is flat, no personality
- Requirements box feels sterile
- Too much symmetry

**Enhancement 1: Organic Background Decorations**

```tsx
export const QualificationCheck = ({ onEligible }: Props) => {
  return (
    <div className="min-h-screen bg-cream-100 relative overflow-hidden">
      {/* Organic shape decorations in corners (very subtle) */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path 
            d="M50,100 Q30,120 50,140 T90,160 Q110,170 130,160 T170,130 Q190,110 170,90 T130,60 Q110,50 90,60 T50,100" 
            fill="#D1DCD1" 
          />
        </svg>
      </div>
      
      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path 
            d="M40,80 Q20,100 40,120 T80,140 Q100,150 120,140 T160,110 Q180,90 160,70 T120,50 Q100,40 80,50 T40,80" 
            fill="#E5E1EF" 
          />
        </svg>
      </div>
      
      {/* Rest of content */}
    </div>
  );
};
```

**Enhancement 2: Illustrated Icon with Depth**

```tsx
{/* Replace flat icon circle */}
<div className="w-20 h-20 rounded-full flex items-center justify-center mb-6
                bg-gradient-to-br from-sage-500 to-sage-600 
                shadow-lg shadow-sage-200
                relative mx-auto">
  
  {/* Subtle decorative arc behind icon */}
  <div className="absolute inset-0 rounded-full opacity-20 
                  bg-gradient-to-tr from-transparent via-white to-transparent" />
  
  {/* Main icon */}
  <GraduationCap className="w-10 h-10 text-white relative z-10" />
  
  {/* Tiny sparkle accent (personality touch) */}
  <motion.div
    className="absolute -top-1 -right-1"
    animate={{ 
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  >
    <Sparkles className="w-4 h-4 text-lavender-300" />
  </motion.div>
</div>
```

**Enhancement 3: Inviting Requirements Box**

```tsx
{/* Make requirements box more inviting */}
<div className="relative bg-gradient-to-br from-lavender-50 via-white to-sage-50 
                border-2 border-lavender-200 rounded-lg p-6 mb-8
                shadow-sm hover:shadow-md transition-shadow duration-300">
  
  {/* Decorative corner element */}
  <div className="absolute -top-3 -left-3 w-6 h-6 bg-lavender-400 rounded-full 
                  opacity-20 blur-sm" />
  
  <div className="relative z-10">
    <h2 className="font-display text-body font-semibold text-text-primary mb-4 
                   flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-sage-600" />
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
      {/* More criteria */}
    </ul>
  </div>
</div>
```

**Enhancement 4: Gentle Page Entrance**

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
  className="max-w-2xl w-full"
>
  <Card className="border-sage-200 shadow-xl bg-white rounded-lg">
    {/* Card content */}
  </Card>
</motion.div>
```

---

#### Landing Page (Homepage.tsx)

**Current Issues:**
- Extremely sparse (just text and buttons)
- No visual interest whatsoever
- Could be any generic SaaS landing page
- Massive missed opportunity for brand expression

**Enhancement 1: Decorative Elements Around Title**

```tsx
<div className="relative inline-block">
  {/* Small botanical illustrations around the title */}
  <motion.div 
    className="absolute -top-12 left-1/4 opacity-30"
    animate={{ 
      y: [0, -10, 0],
      rotate: [12, 15, 12]
    }}
    transition={{ 
      duration: 4, 
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  >
    <Leaf className="w-16 h-16 text-sage-300" />
  </motion.div>
  
  <motion.div 
    className="absolute -top-8 right-1/4 opacity-30"
    animate={{ 
      y: [0, -8, 0],
      rotate: [-12, -15, -12]
    }}
    transition={{ 
      duration: 3.5, 
      repeat: Infinity,
      ease: 'easeInOut',
      delay: 0.5
    }}
  >
    <Flower2 className="w-12 h-12 text-lavender-300" />
  </motion.div>
  
  <h1 className="font-display text-display-lg text-text-primary relative z-10">
    Welcome to Bloom
  </h1>
</div>
```

**Enhancement 2: Visually Distinct Buttons**

```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
  {/* Primary button with subtle shine effect */}
  <motion.button 
    className="relative group bg-sage-600 hover:bg-sage-700 
               text-white font-display font-semibold 
               px-8 py-4 rounded-lg shadow-md hover:shadow-lg 
               transition-all duration-200
               overflow-hidden"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    {/* Subtle shine effect on hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent 
                    via-white to-transparent opacity-0 group-hover:opacity-10 
                    translate-x-[-100%] group-hover:translate-x-[100%] 
                    transition-transform duration-700" />
    
    <span className="relative z-10 flex items-center gap-2">
      <Sprout className="w-5 h-5" />
      Join Our Team
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </span>
  </motion.button>
  
  {/* Secondary button with gradient */}
  <motion.button 
    className="bg-gradient-to-br from-lavender-400 to-lavender-500 
               hover:from-lavender-500 hover:to-lavender-600
               text-white font-display font-semibold 
               px-8 py-4 rounded-lg shadow-md hover:shadow-lg 
               transition-all duration-200"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <span className="flex items-center gap-2">
      <Shield className="w-5 h-5" />
      Admin Portal
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </span>
  </motion.button>
</div>
```

**Enhancement 3: Decorative Tagline**

```tsx
<div className="relative max-w-2xl mx-auto">
  {/* Small decorative quotes */}
  <span className="text-lavender-300 opacity-50 absolute -left-6 -top-2 
                   text-4xl font-serif select-none pointer-events-none">
    "
  </span>
  
  <p className="font-body text-body-lg text-text-secondary leading-loose px-8">
    Life Psychology Australia's Practitioner Onboarding Portal
  </p>
  
  <span className="text-lavender-300 opacity-50 absolute -right-6 -bottom-2 
                   text-4xl font-serif select-none pointer-events-none">
    "
  </span>
</div>
```

**Enhancement 4: Ambient Background Blobs**
*(Use the general enhancement code from above)*

---

#### Admin Error State (NetworkErrorState.tsx)

**Current Issues:**
- Most boring error state possible
- No empathy or warmth
- Flat icon, centered text, basic button
- Missed opportunity to be helpful AND delightful

**Enhancement 1: Illustrated "Reconnecting" Scene**

```tsx
export const NetworkErrorState = ({ onRetry, customMessage }: Props) => {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      {/* Illustrated "disconnected" scene */}
      <div className="relative w-32 h-32 mb-6">
        {/* Base circle with gradient */}
        <div className="w-full h-full rounded-full 
                        bg-gradient-to-br from-sage-100 to-sage-200 
                        flex items-center justify-center
                        relative overflow-hidden">
          
          {/* Decorative "searching" waves */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute inset-0 border-2 border-sage-400 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1.5], 
                opacity: [0.6, 0, 0] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeOut'
              }}
            />
            <motion.div
              className="absolute inset-0 border-2 border-sage-400 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1.5], 
                opacity: [0.6, 0, 0] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeOut',
                delay: 0.7
              }}
            />
          </div>
          
          {/* Icon with personality */}
          <div className="relative z-10 text-sage-600">
            <WifiOff className="w-12 h-12" />
            
            {/* Small plant/sprout waiting patiently */}
            <motion.div
              className="absolute -bottom-2 -right-2"
              animate={{ 
                y: [0, -3, 0],
                rotate: [-5, 5, -5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Sprout className="w-6 h-6 text-sage-500" />
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Empathetic, warm copy */}
      <h2 className="font-display text-h2 text-text-primary mb-3 text-center">
        Taking a Moment to Reconnect
      </h2>
      
      <p className="font-body text-body-lg text-text-secondary leading-loose max-w-md mb-2 text-center">
        {customMessage || "We're having a brief moment of connection trouble. Like a deep breath between sessions, sometimes we need to pause and reset."}
      </p>
      
      <p className="font-body text-body-sm text-text-tertiary mb-8 text-center">
        This typically resolves in less than a minute.
      </p>
      
      {/* Inviting button with animation */}
      <motion.button
        onClick={handleRetry}
        disabled={isRetrying}
        className="relative group bg-sage-600 hover:bg-sage-700 
                   disabled:bg-sage-400 disabled:cursor-not-allowed
                   text-white font-display font-semibold 
                   px-8 py-4 rounded-lg shadow-md hover:shadow-lg 
                   transition-all duration-200"
        whileHover={{ scale: isRetrying ? 1 : 1.02 }}
        whileTap={{ scale: isRetrying ? 1 : 0.98 }}
      >
        <span className="flex items-center gap-2">
          <motion.div
            animate={{ 
              rotate: isRetrying ? 360 : 0 
            }}
            transition={{ 
              duration: 1, 
              repeat: isRetrying ? Infinity : 0, 
              ease: 'linear' 
            }}
          >
            <RefreshCw className="w-5 h-5" />
          </motion.div>
          {isRetrying ? "Reconnecting..." : "Try Again"}
        </span>
      </motion.button>
      
      {/* Reassuring message */}
      <motion.div 
        className="mt-8 text-body-xs text-text-tertiary flex items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div 
          className="w-2 h-2 rounded-full bg-sage-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span>Your work is safe</span>
      </motion.div>
    </div>
  );
};
```

---

### Enhanced Button Patterns

**Primary Button with Personality**

```tsx
<motion.button
  className="relative group bg-sage-600 hover:bg-sage-700 
             text-white font-display font-semibold 
             px-8 py-4 rounded-lg shadow-md hover:shadow-lg 
             transition-all duration-200
             overflow-hidden"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  {/* Subtle animated shine */}
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
    initial={{ x: '-100%', opacity: 0 }}
    whileHover={{ x: '100%', opacity: 0.1 }}
    transition={{ duration: 0.6 }}
  />
  
  <span className="relative z-10 flex items-center gap-2">
    <Sparkles className="w-5 h-5" />
    Submit Application
  </span>
</motion.button>
```

**Secondary Button with Gradient**

```tsx
<motion.button
  className="bg-gradient-to-br from-lavender-400 to-lavender-500 
             hover:from-lavender-500 hover:to-lavender-600
             text-white font-display font-semibold 
             px-8 py-4 rounded-lg shadow-md hover:shadow-lg 
             transition-all duration-200"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  <span className="flex items-center gap-2">
    View Details
    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
  </span>
</motion.button>
```

---

### Enhanced Icon Patterns

**Replace Generic Icons with Personality**

```tsx
// Instead of: <CheckCircle2 className="w-6 h-6 text-sage-600" />
// Use gradient and subtle animation:

<div className="relative w-6 h-6">
  <svg className="w-full h-full" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="check-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6B8066" />
        <stop offset="100%" stopColor="#8FB48E" />
      </linearGradient>
    </defs>
    <motion.path
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke="url(#check-gradient)"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5 }}
    />
    <motion.path
      d="M22 4L12 14.01l-3-3"
      stroke="url(#check-gradient)"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    />
  </svg>
</div>
```

---

### Success State Enhancements

**Celebration with Personality**

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  className="text-center"
>
  {/* Icon with gradient and animation */}
  <motion.div 
    className="flex justify-center mb-6"
    animate={{ 
      y: [0, -10, 0],
    }}
    transition={{ 
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  >
    <div className="relative w-20 h-20 bg-gradient-to-br from-sage-100 to-lavender-100 
                    rounded-full flex items-center justify-center
                    shadow-lg shadow-sage-200/50">
      
      {/* Decorative particles */}
      <motion.div
        className="absolute"
        animate={{ 
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut'
        }}
      >
        <Sparkles className="w-20 h-20 text-lavender-400 opacity-30" />
      </motion.div>
      
      <Sparkles className="w-10 h-10 text-sage-600 relative z-10" />
    </div>
  </motion.div>
  
  <motion.h2 
    className="font-display text-display-sm text-text-primary mb-3"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
  >
    Application Submitted!
  </motion.h2>
  
  <motion.p 
    className="font-body text-body-lg text-text-secondary leading-loose mb-8"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.4 }}
  >
    Thank you for applying. We'll review your application and get back to you within 3-5 business days.
  </motion.p>
</motion.div>
```

---

### Implementation Priority

**Phase 1: Quick Wins (Do First)**
1. ✅ Add ambient background blobs to all screens
2. ✅ Enhance button styling with gradients and hover effects
3. ✅ Add gentle page entrance animations
4. ✅ Improve icon circles with gradients and depth
5. ✅ Add background texture to cream surfaces

**Phase 2: Visual Interest (Next Session)**
1. ⏳ Add decorative botanical elements around headings
2. ⏳ Create illustrated error state scenes
3. ⏳ Add decorative corner elements to cards
4. ⏳ Implement micro-animations for icons
5. ⏳ Add animated "searching" waves for loading states

**Phase 3: Polish (Future)**
1. ⏳ Custom botanical illustrations for hero sections
2. ⏳ Animated success celebrations
3. ⏳ Advanced animation sequences
4. ⏳ Character-driven illustrations (optional)

---

### What NOT to Do

**❌ Don't:**
- Add too many decorative elements (still professional, not busy)
- Use bright, saturated colors (keep soft and muted)
- Add cartoon characters (warm ≠ childish)
- Make animations distracting (subtle, purposeful)
- Lose hierarchy (visual interest should enhance, not obscure)
- Center everything perfectly (asymmetry adds life)
- Use flat colors everywhere (gradients add warmth)
- Ignore depth (layering makes things feel real)

**✅ Do:**
- Add subtle organic shapes in corners
- Use soft gradients (sage to lavender)
- Include gentle animations (breathing, pulsing)
- Layer elements with shadows and blur
- Add personality through small details (sparkles, leaves)
- Create visual interest without distraction
- Maintain professional credibility throughout

---

### Component Enhancement Checklist

Before considering a component "Bloom-ready," ensure:

**Visual Warmth:**
- [ ] Has depth through layering (shadows, gradients, overlays)
- [ ] Uses warm colors (sage/lavender gradients, not flat)
- [ ] Includes subtle personality touches (sparkles, botanical accents)
- [ ] Has organic shapes (rounded, blob-like, not perfect geometry)

**Animation:**
- [ ] Gentle entrance animation (fade-up, scale)
- [ ] Hover states are smooth and inviting
- [ ] Loading states feel alive (pulsing, flowing)
- [ ] Success states celebrate the user

**Typography & Space:**
- [ ] Not everything is perfectly centered
- [ ] Adequate breathing room around elements
- [ ] Visual hierarchy through size and weight
- [ ] Warm copy that matches visual warmth

**Technical:**
- [ ] Animations use Framer Motion
- [ ] Performance optimized (GPU-accelerated)
- [ ] Accessible (keyboard, screen reader friendly)
- [ ] Mobile-responsive animations

---

**Remember: Miyazaki's films feel alive because nothing is perfectly still or symmetrical. There's always gentle movement, nature peeking through, organic asymmetry, and depth through layering. Apply these same principles to Bloom, but keep it professional. The goal: User opens Bloom and feels "Oh, this is different. This cares about me." 🌱**

---

## Implementation Phases & Priorities

### Philosophy: Build for Today, Design for Tomorrow
Proto-Bloom is intentionally minimal. We're building only what's needed to hire psychologist #2, while laying the foundation for future scale.

### Proto-Bloom (Current - Q4 2025)

**Build NOW - MVP Features:**
```markdown
✅ Application form (7-step multi-step form)
✅ Document upload with Azure Blob Storage
✅ Admin review interface (approve/reject applications)
✅ Email notifications (application received, status updates)
✅ Basic error handling with Bloom design
✅ Qualification check gatekeeper
✅ Mobile-responsive design
```

**Explicitly SKIP for Proto-Bloom:**
```markdown
❌ Token economy system (needs 5+ practitioners to matter)
❌ Practitioner dashboard (Halaxy handles this)
❌ Client profile management (Halaxy owns this)
❌ Revenue split automation (simple spreadsheet works for <5 people)
❌ Advanced analytics & reporting
❌ Multi-location support
❌ Role-based permissions (only 1 admin for now)
❌ Audit logging
❌ Advanced search/filters
```

### Bloom v1.0 (Q1-Q2 2026)

**Add WHEN first hire happens (clinic at 80% capacity):**
```markdown
🎯 Practitioner onboarding workflow
  - Welcome email sequence
  - Profile auto-generation for website
  - Email @life-psychology.com.au setup
  - Halaxy account creation

🎯 Basic scheduling coordination
  - View practitioner availability
  - Block out PD days
  - Holiday requests

🎯 Halaxy integration (Phase 1)
  - Webhook for new bookings
  - Daily booking summary email
  - Client waitlist management
```

### Bloom v2.0 (2027+ with 5-10 practitioners)

**Scale AFTER proven business model:**
```markdown
🚀 Token economy
  - PD credit tracking
  - Community contribution rewards
  - Token marketplace

🚀 Revenue split automation
  - Automatic calculations
  - Monthly reports
  - Tax documentation

🚀 Advanced reporting
  - Practitioner performance
  - Client outcomes tracking
  - Financial analytics

🚀 AI-assisted admin
  - Application screening
  - Schedule optimization
  - Client matching
```

### Decision Framework

**Before building ANY feature, ask these questions:**

```typescript
interface FeatureDecision {
  name: string;
  requiredForProtoBloom: boolean;  // Blocks hiring psychologist #2?
  isLowComplexity: boolean;         // Can build in <2 weeks?
  requiresScaleToMatter: boolean;   // Only useful with 5+ practitioners?
  validatesBusinessModel: boolean;  // Tests core assumptions?
  canUseManualWorkaround: boolean;  // Spreadsheet/email suffices?
}

const shouldBuildNow = (feature: FeatureDecision): boolean => {
  // Must be required AND low complexity
  if (!feature.requiredForProtoBloom || !feature.isLowComplexity) {
    return false;
  }
  
  // Skip if it needs scale to matter
  if (feature.requiresScaleToMatter) {
    return false;
  }
  
  // Skip if manual workaround exists
  if (feature.canUseManualWorkaround && !feature.validatesBusinessModel) {
    return false;
  }
  
  return true;
};

// Example: Token Economy
const tokenEconomy: FeatureDecision = {
  name: "Token Economy System",
  requiredForProtoBloom: false,     // Can hire without it
  isLowComplexity: false,            // 2-3 months of work
  requiresScaleToMatter: true,       // Meaningless with 2-3 practitioners
  validatesBusinessModel: false,     // Doesn't test hiring process
  canUseManualWorkaround: true       // Spreadsheet tracks PD credits
};

shouldBuildNow(tokenEconomy); // ❌ false - build in v2.0

// Example: Application Review
const applicationReview: FeatureDecision = {
  name: "Admin Application Review",
  requiredForProtoBloom: true,      // Can't hire without reviewing applications!
  isLowComplexity: true,             // ~1 week of work
  requiresScaleToMatter: false,      // Works with 1st applicant
  validatesBusinessModel: true,      // Tests if psychologists apply
  canUseManualWorkaround: false      // Email review is unprofessional
};

shouldBuildNow(applicationReview); // ✅ true - build in Proto-Bloom
```

### Current Sprint Priorities (October 2025)

**Week 1-2:**
1. ✅ Multi-step application form
2. ✅ Document upload (CV, AHPRA certificate, photo)
3. ✅ Form validation with Bloom error handling

**Week 3-4:**
4. Admin review interface
5. Approve/reject workflow with email notifications
6. Application status tracking

**Week 5-6:**
7. Mobile responsiveness testing
8. Error handling polish
9. Performance optimization
10. User acceptance testing with Anthony

### Feature Backlog (Post-Launch)

**Nice-to-Have for Proto-Bloom (if time permits):**
- [ ] Auto-save form progress
- [ ] Email confirmation when application received
- [ ] Admin dashboard with application statistics
- [ ] Export applications to CSV
- [ ] Application search by name/email

**Blocked Until First Hire:**
- [ ] Practitioner profile page generation
- [ ] Welcome email automation
- [ ] Halaxy webhook setup
- [ ] Booking notification system

**Blocked Until 5+ Practitioners:**
- [ ] Token economy
- [ ] Revenue split calculator
- [ ] Advanced analytics
- [ ] Role-based permissions

---

## Testing & Quality Assurance

### Testing Philosophy
Bloom is a healthcare platform handling sensitive personal information and regulatory documents. Testing isn't optional—it's essential for trust.

### Testing Pyramid

```
        /\
       /E2E\        2-3 critical user flows
      /______\
     /        \
    /Integration\   Key API and component interactions
   /____________\
  /              \
 /  Unit Tests    \  Component logic and utilities
/__________________\
```

### Component Testing

**Button Component Test**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('applies Bloom sage styling for primary variant', () => {
    render(<Button variant="primary">Submit</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('bg-sage-600');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('font-display');
  });
  
  it('shows loading state when disabled', () => {
    render(<Button disabled>Submitting...</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
  });
  
  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Form Validation Testing

**AHPRA Validation Test**
```typescript
import { validateAHPRA } from '@/lib/validation';

describe('AHPRA Validation', () => {
  it('accepts valid AHPRA format (3 letters + 10 digits)', () => {
    expect(validateAHPRA('PSY0001234567')).toBe(true);
    expect(validateAHPRA('OCC9876543210')).toBe(true);
  });
  
  it('rejects invalid formats', () => {
    expect(validateAHPRA('PSY123')).toBe(false);           // Too short
    expect(validateAHPRA('12PSY0001234567')).toBe(false);  // Numbers first
    expect(validateAHPRA('PSYCH0001234567')).toBe(false);  // 5 letters
    expect(validateAHPRA('psy0001234567')).toBe(false);    // Lowercase
  });
  
  it('provides helpful error message', () => {
    const result = validateAHPRA('PSY123');
    expect(result.error).toBe('AHPRA numbers must start with 3 letters followed by 10 digits');
  });
});
```

**File Upload Validation Test**
```typescript
describe('Document Upload Validation', () => {
  it('accepts valid file types', () => {
    const pdfFile = new File(['content'], 'cv.pdf', { type: 'application/pdf' });
    expect(validateDocument(pdfFile, 'cv')).toBe(true);
    
    const jpgFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateDocument(jpgFile, 'photo')).toBe(true);
  });
  
  it('rejects files over size limit', () => {
    const largeFile = new File(['x'.repeat(11_000_000)], 'cv.pdf');
    const result = validateDocument(largeFile, 'cv');
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('CV must be under 10MB');
  });
  
  it('rejects invalid file types', () => {
    const exeFile = new File(['content'], 'virus.exe');
    const result = validateDocument(exeFile, 'cv');
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PDF, JPG, or PNG');
  });
});
```

### Integration Testing

**Application Submission Flow Test**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinUs } from '@/pages/JoinUs';
import { server } from '@/mocks/server';

describe('Application Submission Flow', () => {
  it('completes full application journey', async () => {
    render(<JoinUs />);
    
    // Step 1: Qualification Check
    const clinicalPsychCheckbox = screen.getByLabelText(/Registered Clinical Psychologist/i);
    await userEvent.click(clinicalPsychCheckbox);
    
    const checkEligibilityBtn = screen.getByRole('button', { name: /Check Eligibility/i });
    await userEvent.click(checkEligibilityBtn);
    
    // Step 2: Fill Application Form
    await waitFor(() => {
      expect(screen.getByText(/Application Form/i)).toBeInTheDocument();
    });
    
    await userEvent.type(screen.getByLabelText(/First Name/i), 'Sarah');
    await userEvent.type(screen.getByLabelText(/Last Name/i), 'Johnson');
    await userEvent.type(screen.getByLabelText(/Email/i), 'sarah@example.com');
    await userEvent.type(screen.getByLabelText(/AHPRA/i), 'PSY0001234567');
    
    // Upload documents
    const cvInput = screen.getByLabelText(/Upload CV/i);
    const cvFile = new File(['cv content'], 'cv.pdf', { type: 'application/pdf' });
    await userEvent.upload(cvInput, cvFile);
    
    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Application/i });
    await userEvent.click(submitBtn);
    
    // Step 3: Success State
    await waitFor(() => {
      expect(screen.getByText(/Application Submitted!/i)).toBeInTheDocument();
    });
  });
});
```

### Accessibility Testing

**Keyboard Navigation Test**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationForm } from '@/components/ApplicationForm';

describe('Accessibility', () => {
  it('supports full keyboard navigation', async () => {
    render(<ApplicationForm />);
    
    const firstNameInput = screen.getByLabelText(/First Name/i);
    const lastNameInput = screen.getByLabelText(/Last Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    // Tab through form fields
    await userEvent.tab();
    expect(firstNameInput).toHaveFocus();
    
    await userEvent.tab();
    expect(lastNameInput).toHaveFocus();
    
    await userEvent.tab();
    expect(emailInput).toHaveFocus();
  });
  
  it('announces errors to screen readers', () => {
    render(<ApplicationForm />);
    
    const ahpraInput = screen.getByLabelText(/AHPRA/i);
    const errorMessage = screen.queryByRole('alert');
    
    expect(ahpraInput).toHaveAttribute('aria-invalid', 'false');
    expect(ahpraInput).toHaveAttribute('aria-describedby');
    
    // After validation error
    fireEvent.blur(ahpraInput);
    expect(ahpraInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
  
  it('has sufficient color contrast', () => {
    const { container } = render(<Button variant="primary">Submit</Button>);
    
    // Sage-600 text on white background meets WCAG AA
    const styles = window.getComputedStyle(container.firstChild);
    expect(getContrastRatio(styles.color, styles.backgroundColor)).toBeGreaterThan(4.5);
  });
});
```

### Visual Regression Testing

**Setup with Chromatic (Recommended)**
```bash
# Install Chromatic
npm install --save-dev chromatic

# Build Storybook
npm run build-storybook

# Run visual tests
npx chromatic --project-token=<token>
```

**Key Screens to Test:**
- Application form (all 7 steps)
- Admin portal (list view, detail view)
- Error states (network, server, validation)
- Success states
- Empty states
- Loading states

**Mobile vs Desktop Views:**
Test at breakpoints:
- Mobile: 375px width
- Tablet: 768px width
- Desktop: 1440px width

### End-to-End Testing

**Critical User Flows (Playwright)**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Applicant Journey', () => {
  test('psychologist can submit application', async ({ page }) => {
    // Navigate to join page
    await page.goto('/join-us');
    
    // Complete qualification check
    await page.check('text=Registered Clinical Psychologist');
    await page.click('button:has-text("Check Eligibility")');
    
    // Fill application
    await page.fill('input[name="first_name"]', 'Emily');
    await page.fill('input[name="last_name"]', 'Chen');
    await page.fill('input[name="email"]', 'emily.chen@example.com');
    await page.fill('input[name="ahpra"]', 'PSY0001234567');
    
    // Upload CV
    await page.setInputFiles('input[type="file"][id="cv"]', 'tests/fixtures/sample-cv.pdf');
    
    // Submit
    await page.click('button:has-text("Submit Application")');
    
    // Verify success
    await expect(page.locator('text=Application Submitted!')).toBeVisible();
  });
});

test.describe('Admin Journey', () => {
  test('admin can review and approve application', async ({ page }) => {
    // Login as admin
    await page.goto('/admin');
    await page.fill('input[name="email"]', 'admin@life-psychology.com.au');
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD);
    await page.click('button:has-text("Sign In")');
    
    // View applications
    await expect(page.locator('h1:has-text("Application Management")')).toBeVisible();
    
    // Click first pending application
    await page.click('tr:has-text("Pending") >> nth=0');
    
    // Review documents
    await expect(page.locator('text=AHPRA Certificate')).toBeVisible();
    
    // Approve
    await page.fill('textarea[name="review_notes"]', 'Excellent qualifications');
    await page.click('button:has-text("Approve Application")');
    
    // Confirm
    await page.click('button:has-text("Confirm Approval")');
    
    // Verify success
    await expect(page.locator('text=Application approved successfully')).toBeVisible();
  });
});
```

### Test Coverage Goals

**Minimum Coverage Targets:**
- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

**Critical Paths (100% Coverage Required):**
- AHPRA validation
- File upload validation
- Application submission
- Admin approval/rejection
- Email notification sending

### Manual Testing Checklist

**Before Each Release:**
```markdown
## Functional Testing
- [ ] Complete application submission (all steps)
- [ ] Document upload (CV, certificate, photo)
- [ ] Qualification check (all 3 criteria paths)
- [ ] Admin login and review
- [ ] Approve application workflow
- [ ] Reject application workflow
- [ ] Email notifications sent correctly

## Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 15+)
- [ ] Mobile Chrome (Android 12+)

## Responsive Testing
- [ ] iPhone 13 (390x844)
- [ ] iPad (810x1080)
- [ ] Desktop (1440x900)
- [ ] Large desktop (1920x1080)

## Accessibility Testing
- [ ] Screen reader (NVDA/VoiceOver)
- [ ] Keyboard navigation only
- [ ] Color contrast (Chrome DevTools)
- [ ] Focus indicators visible
- [ ] Form labels announced correctly

## Performance Testing
- [ ] Lighthouse score 90+ (performance)
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] Total bundle size <300KB
- [ ] Images optimized (WebP format)

## Security Testing
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] File upload size limits enforced
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized inputs)
```

---

## Performance & Optimization

### Performance Philosophy
Bloom should feel instant. Psychologists are busy—every second of loading time erodes trust. Aim for <2 seconds to interactive on 3G.

### Bundle Size Optimization

**Current Target: <250KB gzipped**
```bash
# Monitor bundle size
npm run build

# Analyze bundle
npm run build -- --stats
npx vite-bundle-visualizer

# Current size (as of Oct 2025): 259.56 KB (76.72 KB gzipped) ✅
```

**Code Splitting Strategy:**
```typescript
// Lazy load admin portal (not needed by applicants)
const AdminPortal = lazy(() => import('./pages/admin/ApplicationManagement'));
const ApplicationDetail = lazy(() => import('./pages/admin/ApplicationDetail'));

// Lazy load heavy components
const PDFViewer = lazy(() => import('./components/PDFViewer'));
const DocumentUpload = lazy(() => import('./components/DocumentUpload'));

// Use React.lazy with Suspense
<Suspense fallback={<LoadingState />}>
  <AdminPortal />
</Suspense>
```

**Tree Shaking:**
```typescript
// ✅ Good - only imports what you need
import { CheckCircle2, AlertCircle } from 'lucide-react';

// ❌ Bad - imports entire library
import * as Icons from 'lucide-react';
```

### Image Optimization

**Use WebP with Fallback:**
```tsx
<picture>
  <source srcSet="/profile-photo.webp" type="image/webp" />
  <img src="/profile-photo.jpg" alt="Practitioner photo" className="rounded-full" />
</picture>
```

**Resize Profile Photos:**
```typescript
// Client-side resize before upload
import { resizeImage } from '@/lib/image-utils';

const handlePhotoUpload = async (file: File) => {
  // Resize to 400x400 max
  const resized = await resizeImage(file, 400, 400);
  
  // Convert to WebP if browser supports
  const webp = await convertToWebP(resized);
  
  // Upload optimized version
  await uploadToBlob(webp);
};
```

**Lazy Load Images:**
```tsx
<img 
  src="/profile-photo.jpg" 
  loading="lazy"  // Native lazy loading
  className="rounded-full w-32 h-32"
/>
```

### Database Optimization

**Index Strategy (Azure SQL):**
```sql
-- Index on frequently queried columns
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at DESC);
CREATE INDEX idx_applications_email ON applications(email);

-- Composite index for filtered queries
CREATE INDEX idx_applications_status_submitted 
ON applications(status, submitted_at DESC);
```

**Query Optimization:**
```typescript
// ✅ Good - only fetch needed columns
const applications = await sql`
  SELECT id, first_name, last_name, email, status, submitted_at
  FROM applications
  WHERE status = 'pending'
  ORDER BY submitted_at DESC
`;

// ❌ Bad - fetches all columns including BLOBs
const applications = await sql`
  SELECT *
  FROM applications
`;
```

### API Response Optimization

**Use Compression:**
```typescript
// Azure Functions - enable compression in host.json
{
  "extensions": {
    "http": {
      "routePrefix": "api",
      "compression": {
        "enabled": true,
        "level": "optimal"
      }
    }
  }
}
```

**Paginate Large Responses:**
```typescript
// Return paginated data
interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

app.get('/api/applications', async (req: Request) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  
  const [applications, total] = await Promise.all([
    getApplications(offset, pageSize),
    getApplicationsCount()
  ]);
  
  return {
    data: applications,
    page,
    pageSize,
    total,
    hasMore: offset + pageSize < total
  };
});
```

### Frontend Performance

**Use React.memo for Expensive Components:**
```typescript
export const ApplicationCard = React.memo(({ application }: Props) => {
  return (
    <Card className="border-sage-200">
      {/* Render application */}
    </Card>
  );
}, (prevProps, nextProps) => {
  // Only re-render if application ID changes
  return prevProps.application.id === nextProps.application.id;
});
```

**Debounce Search Input:**
```typescript
import { useDebounce } from '@/hooks/useDebounce';

export const ApplicationSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  useEffect(() => {
    if (debouncedQuery) {
      searchApplications(debouncedQuery);
    }
  }, [debouncedQuery]);
  
  return (
    <Input 
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search applications..."
    />
  );
};
```

**Virtualize Long Lists:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export const ApplicationList = ({ applications }: Props) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: applications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Row height
  });
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <ApplicationCard 
            key={applications[virtualRow.index].id}
            application={applications[virtualRow.index]}
          />
        ))}
      </div>
    </div>
  );
};
```

### Caching Strategy

**Service Worker for Static Assets:**
```typescript
// Register service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// sw.js - Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('bloom-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/styles.css',
        '/main.js',
        '/fonts/poppins.woff2',
        '/fonts/inter.woff2'
      ]);
    })
  );
});
```

**SWR for Data Fetching:**
```typescript
import useSWR from 'swr';

export const useApplications = () => {
  const { data, error, mutate } = useSWR('/api/applications', fetcher, {
    revalidateOnFocus: false,  // Don't refetch on window focus
    dedupingInterval: 60000,   // Dedupe requests within 1 minute
  });
  
  return {
    applications: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
};
```

### Lighthouse Score Targets

**Minimum Scores (Mobile):**
- **Performance:** 90+
- **Accessibility:** 100
- **Best Practices:** 95+
- **SEO:** 100

**Performance Metrics:**
- **First Contentful Paint (FCP):** <1.5s
- **Largest Contentful Paint (LCP):** <2.5s
- **Time to Interactive (TTI):** <3.0s
- **Total Blocking Time (TBT):** <200ms
- **Cumulative Layout Shift (CLS):** <0.1

### Monitoring & Analytics

**Setup Vercel Analytics (or similar):**
```typescript
// Track key metrics
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <Router />
      <Analytics />
    </>
  );
}
```

**Track Custom Events:**
```typescript
// Track application submissions
import { track } from '@vercel/analytics';

const handleSubmit = async (data: FormData) => {
  await submitApplication(data);
  
  track('application_submitted', {
    qualification_type: data.qualification_type,
    years_experience: data.years_experience
  });
};
```

**Performance Budget:**
```json
{
  "budgets": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 200 },
        { "resourceType": "style", "budget": 50 },
        { "resourceType": "image", "budget": 100 },
        { "resourceType": "font", "budget": 100 }
      ]
    }
  ]
}
```

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
