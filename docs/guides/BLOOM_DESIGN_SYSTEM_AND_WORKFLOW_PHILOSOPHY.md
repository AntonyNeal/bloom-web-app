# 🌸 Bloom Design System & Application Workflow Philosophy
## What Would Miyazaki Do?

**Version:** 1.0  
**Date:** January 11, 2026  
**Purpose:** Understanding the Bloom design system through the lens of Miyazaki's creative philosophy, guiding the completion of the application workflow.

---

## 📊 Part 1: The Bloom Design System

### Core Design Palette

The Bloom design system uses a **warm, professional, psychologically-conscious color palette** that reflects care, growth, and healing:

#### Primary Color: Sage Green (60% of interface)
```
Sage-50:  #F5F7F5  (lightest, breathing room)
Sage-100: #E8EDE8  (backgrounds)
Sage-200: #D1DCD1  (borders, subtle dividers)
Sage-300: #A8B5A1  (secondary interactive)
Sage-400: #8B9E87  (hover states)
Sage-500: #89A894  (accent)
Sage-600: #6B8066  (primary interactive, primary text)
Sage-700: #4A5D4C  (strong emphasis)
Sage-800: #3D4D3F  (dark text)
Sage-900: #2E3B2F  (darkest, rarely used)
```

**Psychology:** Sage green evokes trust, balance, growth, and natural healing. It's restful without being passive.

#### Secondary Color: Lavender (30% - Care & Empathy)
```
Lavender-50:  #F7F5FA  (lightest backgrounds)
Lavender-100: #E8E3F0  (secondary backgrounds)
Lavender-200: #D4C8E3  (secondary accents)
Lavender-300: #C4B5D6  
Lavender-400: #B4A7D6  (interactive elements)
Lavender-500: #9B8BC4  (secondary highlights)
Lavender-600: #7D6BA3  (secondary emphasis)
```

**Psychology:** Lavender communicates empathy, understanding, and a gentle professional environment. Used to soften clinical/therapeutic content.

#### Accent Colors

- **Sunset Blush** (#E8C5B5, #F5B89E): Warmth, approachability, human connection
- **Muted Teal** (#7FA9A3, #A3C4C0): Calm, stability, balance
- **Warm Cream** (#F5F3EE, #EFEBE5): Comfort, minimal visual strain
- **Success Green** (#88C399, #F0F9F3): Health, progress
- **Warning Gold** (#F4C27F, #FFF9ED): Caution, attention
- **Error Red** (#F5A097, #FFF5F4): Issues, problems
- **Info Blue** (#9BB0A8, #F2F6F5): Information, clarity

### Typography System

**Display Font:** Poppins/Montserrat (emotional moments, headings)
**Body Font:** Inter/Open Sans (clarity, interface text)
**Monospace:** IBM Plex Mono (technical content)

**Type Scale:**
- **Display:** 48px, 40px, 32px (with letter-spacing)
- **Headings:** H1-H6 from 32px to 16px
- **Body:** Large (18px), Regular (16px), Small (14px), X-Small (12px)
- **Minimum body text:** 16px (accessibility requirement)

### Spacing System

```
0: 0px
1: 4px    (micro-spacing)
2: 8px    (component spacing)
3: 12px   (internal component padding)
4: 16px   (standard padding/gaps)
5: 20px   (medium sections)
6: 24px   (section padding)
8: 32px   (major divisions)
10: 40px  (layout breathing room)
12: 48px  (large section gaps)
16: 64px  (major layout gaps)
20: 80px  (full page spacing)
24: 96px  (hero section spacing)
```

**Philosophy:** Generous spacing creates breathing room, reducing cognitive load for users navigating complex forms and workflows.

### Border Radius

```
none: 0px
sm: 4px       (subtle, minimal attention)
default: 8px  (standard for buttons, cards)
md: 12px      (medium elements)
lg: 16px      (large components)
xl: 20px      (emphasized elements)
2xl: 24px     (maximum radius for major components)
full: 9999px  (pills, badges)
```

### Shadows

```
sm: subtle depth
default: standard elevation
md: moderate elevation (cards, modals)
lg: significant elevation (overlays)
xl: maximum elevation (tooltips, popovers)
```

---

## 🎨 Part 2: Design System Principles

### 1. **Accessibility First**
- Minimum 16px font size for body text
- High contrast ratios (WCAG AA compliance)
- Semantic color usage (not relying on color alone)
- Clear focus indicators
- Keyboard navigation support

### 2. **Psychological Warmth**
- Sage green + Lavender create a professional-yet-caring environment
- Warm neutrals (cream, not cold gray)
- Sufficient spacing reduces anxiety
- Lavender accents on therapeutic/emotional content

### 3. **Clarity & Hierarchy**
- Clear visual hierarchy through color, size, weight, spacing
- Semantic color usage (green=success, red=error, etc.)
- Consistent component styling
- Progressive disclosure (showing information when needed)

### 4. **Performance & Efficiency**
- Minimal motion (reduce cognitive load)
- Fast interactions (< 200ms feedback)
- Clear call-to-action placement
- Reduced visual noise

---

## 🎬 Part 3: What Would Miyazaki Do?

### The Miyazaki Principles

Hayao Miyazaki's filmmaking philosophy can directly guide the Bloom application workflow:

#### 1. **"The Essence of the Moment"**
> "The time of my life when I moved fast and had a lot of energy... I want to spend as much time there as possible." - Miyazaki

**Application:** In the practitioner onboarding workflow:
- ✅ Make **each step feel important and intentional**
- ✅ Never rush users through critical decisions
- ✅ Allow time for reflection (e.g., confirmation pages, progress indicators)
- ✅ Celebrate micro-moments of progress (success states, completion feedback)

**Workflow Design:**
```
Application Flow:
1. Welcome Screen (Why are you here?)
2. Profile Information (Who are you?)
3. Qualifications (What are your credentials?)
4. Practice Details (How do you work?)
5. Availability (When are you available?)
6. Review & Confirm (Are you ready?)
7. Submission Success (You did it! What's next?)
```

Each step should have:
- Clear purpose statement
- Visual progress indicator
- Motivational microcopy
- Option to review/edit previous sections
- Accessibility-first design

#### 2. **"No Wasteful Frames"**
> Every frame should serve a purpose. There should be no unnecessary visual noise.

**Application:** In UI/UX design:
- ✅ Remove visual clutter ruthlessly
- ✅ Each color, shadow, element should have a reason
- ✅ Whitespace is an active design choice, not an accident
- ✅ Generously space form elements (don't compress information)

**How Bloom does this:**
- Sage green used as primary because it's calming (not trendy)
- Lavender accents support empathetic interactions
- Cream background reduces eye strain
- Large spacing reduces cognitive load

#### 3. **"Human Connection Over Efficiency"**
> Miyazaki prioritizes emotional resonance over plot efficiency. Characters feel real.

**Application:** In the application:
- ✅ Practitioner voice/tone should be warm and encouraging
- ✅ Show practitioners they're being seen (e.g., "Your qualifications look great!")
- ✅ Use images/avatars of psychologists to build community
- ✅ Include testimonials: real stories from approved practitioners
- ✅ Create anticipation for joining (show the Bloom clinician dashboard)

**Workflow Enhancement:**
```
Form Input → Validation → Encouragement
Not: "Error: Invalid format"
But: "Thanks for that info! Just need the qualification date in MM/DD/YYYY format."
```

#### 4. **"Beauty in Simplicity"**
> Miyazaki's films feature stunning, minimal backgrounds. He doesn't over-decorate.

**Application:**
- ✅ Forms should be simple, one-column layouts
- ✅ No decorative gradients or excessive animations
- ✅ Consistent component styling across all pages
- ✅ Use the design system colors intentionally

**For Application Forms:**
```
❌ DON'T: Multi-column layouts, nested tabs, complex field dependencies
✅ DO: Linear flow, clear labeling, progressive disclosure, conditional fields

Sage green for primary buttons
Lavender for secondary/empathetic messaging
Cream backgrounds for mental rest
```

#### 5. **"Journey Over Destination"**
> Miyazaki focuses on the journey, not just the endpoint.

**Application:** The onboarding journey is the product:
- ✅ Celebrate progress at each step
- ✅ Show what practitioners can do after approval
- ✅ Build anticipation (email confirmations, status updates)
- ✅ Create a sense of community from the start

**Workflow Stages:**
```
STAGE 1: Welcome & Expectation-Setting
  "Join Bloom - A network of compassionate practitioners"
  Show: What you'll get access to, timeline, requirements

STAGE 2: Information Gathering
  Progressive disclosure: Only ask for what's needed
  Visual: Subtle sage green form fields, lavender labels
  Feedback: Inline validation with encouraging messages

STAGE 3: Review & Reflection
  Summary page: Allow review/editing
  Confirmation: Clear submission action
  Anticipation: "What happens next" section

STAGE 4: Submission Confirmation
  Success state: Celebration (not just "Success!")
  Email: Confirmation + next steps + community preview
  Dashboard: Show application status & timeline
  Bonus: Preview practitioner profile
```

#### 6. **"Respect the Audience's Intelligence"**
> Miyazaki never explains everything. He trusts viewers to understand context.

**Application:** For psychologists:
- ✅ Don't over-explain the process (they're educated professionals)
- ✅ Use professional terminology appropriately
- ✅ Provide context, but trust they understand psychology concepts
- ✅ Allow expert users to skip detailed explanations

**Microcopy Example:**
```
❌ "Therapists must have a degree to practice"
✅ "Professional credentials required for practice"
```

---

## 🚀 Part 4: Completing the Application Workflow

### Current State Analysis

**What exists:**
- Design tokens (colors, spacing, typography)
- Tailwind configuration with Bloom palette
- Azure Functions backend for submission
- Authentication via Azure AD B2C
- Basic form validation

**What's needed to complete the workflow:**
1. ✅ Welcome/onboarding page (journey starts here)
2. ✅ Multi-step form with progress indicator
3. ✅ Qualification verification (API integration)
4. ✅ Practice details & availability
5. ✅ Review & confirmation page
6. ✅ Success page with next steps
7. ✅ Application status dashboard
8. ✅ Email notifications at each stage
9. ✅ Admin dashboard for approving applications
10. ✅ Community visibility (approved practitioners list)

### Miyazaki-Inspired Completion Checklist

#### Phase 1: Visual Foundation (Frames without waste)
- [ ] Confirm all form components use Bloom palette
- [ ] Ensure minimum 16px body text everywhere
- [ ] Remove all unnecessary visual elements
- [ ] Test spacing on mobile & desktop
- [ ] Verify accessibility (WCAG AA)

#### Phase 2: Emotional Journey (Essence of the moment)
- [ ] Write warm, encouraging microcopy for every field
- [ ] Add progress indicators showing "You're 40% done!"
- [ ] Create success celebrations at each milestone
- [ ] Include micro-animations (subtle, purposeful)
- [ ] Show testimonials from approved practitioners

#### Phase 3: Human Connection (Over efficiency)
- [ ] Add practitioner profile previews
- [ ] Show community stats ("Join 150+ practitioners")
- [ ] Create "What you'll get access to" section
- [ ] Include FAQ section answering real concerns
- [ ] Set clear expectations on approval timeline

#### Phase 4: Journey over Destination (What's next)
- [ ] Email after submission with status updates
- [ ] Create practitioner dashboard preview
- [ ] Build email notification sequence:
  - Application received
  - Under review
  - Approved / Follow-up needed
  - Welcome to Bloom
- [ ] Show timeline: "Approval typically takes 5-7 business days"

#### Phase 5: Respect Intelligence (Trust the user)
- [ ] Use professional terminology appropriately
- [ ] Don't over-explain clinical concepts
- [ ] Provide advanced options for experienced users
- [ ] Link to external resources for those needing context
- [ ] Allow skipping optional details

---

## 🎨 Design System Component Guide

### Form Fields (Bloom-styled)

```tsx
// Input field styling
<input 
  className="
    w-full px-4 py-3
    border-2 border-sage-200
    rounded-lg
    bg-white
    text-text-primary font-body text-lg
    placeholder-text-tertiary
    focus:border-sage-600 focus:outline-none
    focus:ring-2 focus:ring-sage-300
    transition-colors duration-200
  "
  placeholder="Your prompt..."
/>

// Label styling
<label className="
  block mb-2
  text-body font-semibold
  text-text-primary
  font-display
">
  Your Field Label
</label>

// Help text
<p className="
  text-body-sm
  text-text-secondary
  mt-1
">
  Supporting text in secondary color
</p>
```

### Button Styling

```tsx
// Primary action (Sage green)
<button className="
  px-6 py-3
  bg-sage-600 text-white
  rounded-lg
  font-display font-semibold
  hover:bg-sage-700
  active:bg-sage-800
  transition-colors duration-200
  focus:ring-2 focus:ring-sage-300 focus:outline-none
">
  Primary Action
</button>

// Secondary action (Lavender)
<button className="
  px-6 py-3
  border-2 border-lavender-300
  text-lavender-600
  rounded-lg
  font-display font-semibold
  hover:bg-lavender-50
  transition-colors duration-200
">
  Secondary Action
</button>
```

### Card/Section Styling

```tsx
// Information card
<div className="
  p-6
  bg-white
  border-l-4 border-sage-600
  rounded-lg
  shadow-md
">
  <h3 className="text-h4 text-text-primary mb-2">
    Section Title
  </h3>
  <p className="text-body-lg text-text-secondary">
    Supporting content
  </p>
</div>

// Empathetic message (lavender)
<div className="
  p-4
  bg-lavender-50
  border-l-4 border-lavender-400
  rounded-lg
">
  <p className="text-body text-text-primary">
    Encouraging message
  </p>
</div>
```

### Progress Indicator

```tsx
// Step indicator (Miyazaki-inspired: show the journey)
<div className="flex items-center justify-between">
  {steps.map((step, index) => (
    <div key={index} className="flex items-center">
      <div className={`
        w-10 h-10 rounded-full
        flex items-center justify-center
        font-semibold text-sm
        ${index <= currentStep 
          ? 'bg-sage-600 text-white' 
          : 'bg-sage-100 text-text-secondary'
        }
      `}>
        {index + 1}
      </div>
      <p className="ml-2 text-body text-text-primary">
        {step.label}
      </p>
      {index < steps.length - 1 && (
        <div className={`
          h-1 flex-1 mx-4
          ${index < currentStep ? 'bg-sage-600' : 'bg-sage-100'}
        `} />
      )}
    </div>
  ))}
</div>
```

---

## 📋 Summary: The Bloom Philosophy

**Bloom's design system embodies:**
1. **Trust** through sage green (safe, professional)
2. **Empathy** through lavender accents (care, understanding)
3. **Clarity** through generous spacing and simple hierarchy
4. **Warmth** through cream backgrounds and human-centric microcopy
5. **Intentionality** in every visual choice (no waste)

**To complete the workflow in the Miyazaki spirit:**
1. Make each step feel important (progress indicators, celebration)
2. Use warm, encouraging language (not clinical)
3. Show the practitioner community (human connection)
4. Focus on the journey (not just submission)
5. Trust the user's intelligence (don't over-explain)

**Result:** A practitioner onboarding experience that feels less like a form, more like an invitation to join a community of compassionate healers.

---

## 🔗 Related Files

- `tailwind.config.js` - Color tokens and typography scale
- `src/design-system/tokens.ts` - Design token exports
- `src/design-system/accessibility.ts` - Accessibility guidelines
- `src/pages/JoinUs.tsx` - Example of Bloom design in action

---

**Next Steps:**
1. Review this document with design/product teams
2. Identify gaps in current workflow implementation
3. Create tickets for missing functionality
4. Apply Miyazaki principles to each component
5. Test with real practitioners for feedback
