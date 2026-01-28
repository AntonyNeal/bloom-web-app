# 🎬 Miyazaki Design Patterns for Bloom Workflow

**Version:** 1.0  
**Author:** Bloom Design System  
**Purpose:** Specific design patterns and microcopy inspired by Hayao Miyazaki's storytelling principles

---

## 🎨 Core Miyazaki Principles Applied

### 1. "Show, Don't Tell"

**Miyazaki Philosophy:**
> "I prefer to express myself in silence. If you talk too much, you're no longer effective." - Hayao Miyazaki

**Application to Bloom:**

Instead of explaining features, show them through visual hierarchy and context.

#### ❌ Don't Do This:
```
INSTRUCTIONS:
Please enter your full legal name as it appears on your professional license. 
This will be verified against state licensing boards to ensure accuracy.
```

#### ✅ Do This:
```
[Input field with label]
Full Name (as on license)

[Help text below, subtle color]
Used to verify your professional credentials
```

**Why:** Users understand context without being lectured. The interface explains itself through thoughtful design.

---

### 2. "Respect the Moment" - Every Step Matters

**Miyazaki Philosophy:**
> "I believe that if we could just get everybody to slow down and focus on quality moments... it could change the world." - Hayao Miyazaki

**Application to Bloom:**

Each form step is a moment to breathe and reflect, not a checkbox to rush through.

#### Step Component Pattern:

```tsx
// src/components/application/FormStep.tsx
interface FormStepProps {
  title: string;           // What is this about?
  subtitle?: string;       // Why does it matter?
  description?: string;    // The story behind it
  estimatedTime: string;   // "3 min" - honest about friction
  icon?: React.ReactNode;  // Visual calm
  children: React.ReactNode;
}

export const FormStep: React.FC<FormStepProps> = ({
  title,
  subtitle,
  description,
  estimatedTime,
  icon,
  children,
}) => {
  return (
    <div className="space-y-6">
      {/* Header - Set context */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          {icon && <span className="text-3xl">{icon}</span>}
          <h2 className="text-h2 text-sage-700">{title}</h2>
        </div>
        
        {subtitle && (
          <p className="text-body-lg text-text-secondary">{subtitle}</p>
        )}
        
        {description && (
          <p className="text-body text-text-tertiary italic">
            {description}
          </p>
        )}
        
        <p className="text-body-sm text-text-tertiary">
          ⏱️ {estimatedTime}
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4 border-t-2 border-sage-200 pt-6">
        {children}
      </div>
    </div>
  );
};
```

#### Example Usage:

```tsx
<FormStep
  icon="📚"
  title="Your Qualifications"
  subtitle="Help us understand your expertise"
  description="Your credentials are what make Bloom trustworthy. We'll verify these with professional boards."
  estimatedTime="10 min"
>
  {/* Form fields here */}
</FormStep>
```

**Key Elements:**
- ✅ Icon (visual calm, quick understanding)
- ✅ Clear title (what is this about?)
- ✅ Subtitle (why it matters)
- ✅ Description (the human story)
- ✅ Time estimate (honesty builds trust)
- ✅ Breathing space (not cramped)

---

### 3. "Small Details Matter" - Micro-interactions

**Miyazaki Philosophy:**
> "Animating is not the art of drawings that move, but the art of movements that are drawn." - Hayao Miyazaki

**Application to Bloom:**

Small, purposeful interactions create delight without distraction.

#### Input Field Focus Animation:

```tsx
// src/components/inputs/BloomInput.tsx
import React from 'react';

interface BloomInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helpText?: string;
  successMessage?: string;
}

export const BloomInput: React.FC<BloomInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  required,
  helpText,
  successMessage,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isValid, setIsValid] = React.useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-body font-semibold text-text-primary">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsValid(e.target.value.length > 0);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3
            border-2 rounded-lg
            transition-all duration-200
            font-body text-lg
            focus:outline-none
            ${isValid
              ? 'border-success-500 bg-success-bg'
              : isFocused
              ? 'border-sage-600 ring-2 ring-sage-300'
              : 'border-sage-200'
            }
          `}
        />

        {/* Success checkmark animation */}
        {isValid && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <span className="text-success-500 text-xl animate-in fade-in spin-in duration-300">
              ✓
            </span>
          </div>
        )}
      </div>

      {/* Help text or success message */}
      {successMessage && isValid ? (
        <p className="text-body-sm text-success-500 animate-in fade-in">
          ✓ {successMessage}
        </p>
      ) : helpText ? (
        <p className="text-body-sm text-text-tertiary">{helpText}</p>
      ) : null}
    </div>
  );
};
```

**Animation Principles:**
- ✅ Focus ring (gentle, not jarring)
- ✅ Success checkmark (celebrate input)
- ✅ Color transitions (smooth, not instant)
- ✅ Helpful feedback (validates user)

---

### 4. "Let Silence Speak" - Thoughtful Negative Space

**Miyazaki Philosophy:**
> "If you've got blocks about something, they generally keep you stuck." - Hayao Miyazaki

**Application to Bloom:**

Generous whitespace reduces cognitive load. Users can breathe.

#### Spacing Pattern:

```tsx
// Component spacing
export const formLayout = {
  section: 'mb-8',        // 32px between sections
  fieldGroup: 'mb-6',     // 24px between field groups
  field: 'mb-4',          // 16px between fields
  helpText: 'mt-1',       // 4px below field
};

// Example form:
<div className="space-y-8">
  {/* Section 1 */}
  <div className={formLayout.section}>
    <h3 className="text-h4 text-sage-700 mb-6">Personal Information</h3>
    
    <div className={formLayout.fieldGroup}>
      <BloomInput label="First Name" />
    </div>
    <div className={formLayout.fieldGroup}>
      <BloomInput label="Last Name" />
    </div>
  </div>

  {/* Section 2 */}
  <div className={formLayout.section}>
    <h3 className="text-h4 text-sage-700 mb-6">Contact Details</h3>
    
    <div className={formLayout.fieldGroup}>
      <BloomInput label="Email" type="email" />
    </div>
  </div>
</div>
```

**Benefits:**
- ✅ Scannable form (eyes rest between sections)
- ✅ Mobile-friendly (scales naturally)
- ✅ Less overwhelming (one thing at a time)
- ✅ Professional appearance

---

### 5. "Human Connection" - Warm Microcopy

**Miyazaki Philosophy:**
> "Many people nurture the idea that, with the help of machines, they will be able to create perfect working conditions and then everything else will go well. But that is a mistake." - Hayao Miyazaki

**Application to Bloom:**

Reject corporate speak. Write like a caring human.

#### Microcopy Guide:

```tsx
// MICROCOPY PATTERNS FOR BLOOM

// Form labels (clear, respectful)
"Your Professional License Number"
NOT: "License # (required)"

// Help text (warm, explanatory)
"We'll verify this with the relevant board to ensure you're qualified to practice."
NOT: "License verification required."

// Success messages (celebrate)
"Thanks! Your qualifications look great."
NOT: "Form validated successfully."

// Error messages (helpful, not blaming)
"We couldn't verify that license number. Can you double-check it?"
NOT: "Invalid license number. Error 400."

// Loading states (honest, encouraging)
"Checking your credentials... this usually takes a minute or so."
NOT: "Loading..."

// Empty states (helpful, not sad)
"No qualifications added yet. Add your first degree to get started."
NOT: "No items to display."

// Confirmation (affirming)
"You're all set! Your application will be reviewed within 5-7 days."
NOT: "Application submitted."

// Button text (action-oriented, not generic)
"Continue to Next Step" OR "Save & Continue"
NOT: "Next" OR "Submit"
```

#### Implementation:

```tsx
// src/constants/microcopy.ts
export const microcopy = {
  form: {
    qualifications: {
      label: 'Your Professional Qualifications',
      help: 'Add each degree or certification. We\'ll verify these with relevant professional bodies.',
      placeholder: 'e.g., Master\'s in Clinical Psychology',
      successMessage: 'Great qualifications! We\'ll verify these for you.',
    },
    practice: {
      label: 'How You Practice',
      help: 'Tell us about your expertise and approach. This helps clients find the right fit.',
      placeholder: 'e.g., Individual therapy, adolescent work',
      successMessage: 'Thanks for sharing! This helps clients understand your practice.',
    },
    availability: {
      label: 'When You\'re Available',
      help: 'Let clients know when they can book with you.',
      placeholder: 'e.g., Monday-Thursday, 9am-5pm',
      successMessage: 'Perfect! Clients will see your availability.',
    },
  },
  messages: {
    underReview: 'Your application is being reviewed. We'll be in touch soon!',
    approved: 'Welcome to Bloom! You\'re approved and can now accept clients.',
    needsInfo: 'We need a bit more information. Can you help us out?',
  },
};
```

---

### 6. "Anticipation & Surprise" - Delightful Moments

**Miyazaki Philosophy:**
> "I thought, if I could create a world that's safe and warm, I could place the story of a young girl in it." - Hayao Miyazaki

**Application to Bloom:**

Create small moments of delight in the user journey.

#### Delight Patterns:

```tsx
// Success Screen - Celebration
<div className="text-center py-12">
  <div className="text-8xl animate-bounce mb-6">🌸</div>
  <h1 className="text-h1 text-sage-700 mb-4">
    We got your application!
  </h1>
  <p className="text-body-lg text-text-secondary mb-8">
    Welcome to the Bloom community. We're excited to review your qualifications.
  </p>
</div>

// Progress Milestone
{currentStep === 2 && (
  <div className="mb-6 p-4 bg-success-bg border-l-4 border-success-500 rounded">
    <p className="text-success-700 font-semibold">
      🎉 You're halfway there! Just 3 more steps.
    </p>
  </div>
)}

// Empty states - Helpful & warm
{qualifications.length === 0 && (
  <div className="text-center py-8 text-text-tertiary">
    <p className="text-3xl mb-4">📚</p>
    <p className="text-body">No qualifications yet. Ready to add your first one?</p>
    <button className="mt-4 text-sage-600 font-semibold">
      Add Your First Qualification →
    </button>
  </div>
)}

// Field completion celebration
{email && email.includes('@') && (
  <p className="text-success-600 text-sm mt-2 animate-in fade-in">
    ✓ Email looks good!
  </p>
)}
```

**Delight Checklist:**
- ✅ Celebrate milestones ("You're 50% done!")
- ✅ Use encouraging emojis (but sparingly)
- ✅ Show progress visually
- ✅ Give immediate feedback
- ✅ Create anticipation ("What's next?")

---

## 📝 Complete Form Example: Miyazaki Style

```tsx
// src/components/application/QualificationsStep.tsx
import React from 'react';
import { FormStep } from './FormStep';
import { BloomInput } from '@/components/inputs/BloomInput';
import { microcopy } from '@/constants/microcopy';

export const QualificationsStep: React.FC = () => {
  const [qualifications, setQualifications] = React.useState([]);
  const [currentQual, setCurrentQual] = React.useState({
    degree: '',
    institution: '',
    year: new Date().getFullYear(),
  });

  const addQualification = () => {
    if (currentQual.degree && currentQual.institution) {
      setQualifications([...qualifications, currentQual]);
      setCurrentQual({ degree: '', institution: '', year: new Date().getFullYear() });
    }
  };

  return (
    <FormStep
      icon="📚"
      title="Your Qualifications"
      subtitle="Help us understand your expertise and credentials"
      description="Your qualifications are what makes Bloom trustworthy. We'll verify these with relevant professional boards to ensure you're qualified to practice. This takes 2-3 days."
      estimatedTime="10 min"
    >
      {/* Instruction - brief, warm */}
      <p className="text-body text-text-secondary bg-lavender-50 p-4 rounded-lg border-l-4 border-lavender-300">
        {microcopy.form.qualifications.help}
      </p>

      {/* Current qualifications list */}
      {qualifications.length > 0 && (
        <div className="space-y-3">
          {qualifications.map((qual, i) => (
            <div
              key={i}
              className="p-4 bg-sage-50 rounded-lg border-l-4 border-sage-600 flex justify-between items-start"
            >
              <div>
                <p className="font-semibold text-text-primary">
                  {qual.degree}
                </p>
                <p className="text-body-sm text-text-secondary">
                  {qual.institution} • {qual.year}
                </p>
              </div>
              <button
                onClick={() =>
                  setQualifications(qualifications.filter((_, idx) => idx !== i))
                }
                className="text-error-500 hover:text-error-700"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Success feedback */}
          <p className="text-success-600 text-sm animate-in fade-in">
            ✓ {microcopy.form.qualifications.successMessage}
          </p>
        </div>
      )}

      {/* Form to add new qualification */}
      <fieldset className="space-y-4 p-4 bg-cream-100 rounded-lg border-2 border-cream-200">
        <legend className="text-body font-semibold text-text-primary mb-2">
          Add a Qualification
        </legend>

        <BloomInput
          label="Degree or Certification"
          placeholder="e.g., Master's in Clinical Psychology"
          value={currentQual.degree}
          onChange={(degree) => setCurrentQual({ ...currentQual, degree })}
          helpText="Your main qualification or degree"
        />

        <BloomInput
          label="Institution"
          placeholder="e.g., University of Melbourne"
          value={currentQual.institution}
          onChange={(institution) =>
            setCurrentQual({ ...currentQual, institution })
          }
          helpText="Where you studied"
        />

        <div>
          <label className="block text-body font-semibold text-text-primary mb-2">
            Year Completed
          </label>
          <input
            type="number"
            value={currentQual.year}
            onChange={(e) =>
              setCurrentQual({ ...currentQual, year: parseInt(e.target.value) })
            }
            className="w-full px-4 py-3 border-2 border-sage-200 rounded-lg focus:border-sage-600 focus:outline-none focus:ring-2 focus:ring-sage-300"
          />
        </div>

        <button
          onClick={addQualification}
          className="w-full py-3 bg-sage-600 text-white rounded-lg font-semibold hover:bg-sage-700 transition-colors"
        >
          Add This Qualification
        </button>
      </fieldset>

      {/* Encourage adding more */}
      {qualifications.length > 0 && (
        <p className="text-body text-text-secondary text-center">
          Added all your qualifications? Continue to the next step. 👉
        </p>
      )}
    </FormStep>
  );
};
```

---

## 🎯 Summary: Miyazaki Principles in Bloom

| Principle | Application | Result |
|-----------|-------------|--------|
| **Show, Don't Tell** | Visual hierarchy, minimal instructions | Users understand without being lectured |
| **Respect the Moment** | Generous spacing, clear progression | Users feel calm, not rushed |
| **Small Details Matter** | Micro-interactions, smooth animations | Delight in interactions |
| **Silence Speaks** | Whitespace, minimal visual noise | Reduced cognitive load |
| **Human Connection** | Warm microcopy, celebration, empathy | Users feel understood |
| **Anticipation & Surprise** | Milestone celebrations, helpful feedback | Joy in progress |

---

## 📐 Implementation Checklist

For every form component:
- [ ] Clear, single purpose
- [ ] Warm, encouraging label
- [ ] Helpful, brief hint text
- [ ] Immediate validation feedback
- [ ] Success celebration
- [ ] Accessible focus indicators
- [ ] No visual waste
- [ ] Proper spacing (breathing room)
- [ ] Mobile responsive
- [ ] Tested with screen readers

---

This guide works alongside:
- `BLOOM_DESIGN_SYSTEM_AND_WORKFLOW_PHILOSOPHY.md` - Overall philosophy
- `APPLICATION_WORKFLOW_IMPLEMENTATION_GUIDE.md` - Technical implementation
- `tailwind.config.js` - Color tokens and typography

**Remember:** Every interaction is an opportunity to show practitioners they're valued, understood, and part of something meaningful.
