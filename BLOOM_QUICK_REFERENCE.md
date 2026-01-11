# 🌸 Bloom Design System - Quick Reference

**Last Updated:** January 11, 2026

---

## Color Palette Quick Reference

### Primary: Sage Green (60%)
```
#F5F7F5 (50)    #E8EDE8 (100)   #D1DCD1 (200)   #A8B5A1 (300)
#8B9E87 (400)   #89A894 (500)   #6B8066 (600) ⭐ #4A5D4C (700)
#3D4D3F (800)   #2E3B2F (900)
```
**Use:** Primary buttons, focused states, trusted interactions

### Secondary: Lavender (30%)
```
#F7F5FA (50)    #E8E3F0 (100)   #D4C8E3 (200)   #C4B5D6 (300)
#B4A7D6 (400)   #9B8BC4 (500) ⭐ #7D6BA3 (600)
```
**Use:** Secondary actions, empathetic messaging, care-related content

### Backgrounds
- **Cream:** #F5F3EE, #EFEBE5, #E6DDD2 (warm, rest)
- **White:** #FFFFFF (content containers)

### Semantic
- **Success:** #88C399 (validation, approval)
- **Warning:** #F4C27F (caution, review needed)
- **Error:** #F5A097 (problems, issues)
- **Info:** #9BB0A8 (information, guidance)

---

## Typography Scale

### Display & Headings
- **Display:** 48px (Poppins, bold, rare)
- **H1:** 32px (Poppins, bold)
- **H2:** 28px (Poppins, bold)
- **H3:** 24px (Poppins, bold)
- **H4:** 20px (Poppins, bold)
- **H5:** 18px (Poppins, bold)
- **H6:** 16px (Poppins, bold)

### Body Text
- **Large:** 18px (comfortable reading)
- **Regular:** 16px ⭐ (minimum for accessibility)
- **Small:** 14px (secondary info)
- **X-Small:** 12px (rare, labels only)

### Fonts
- **Display:** Poppins, Montserrat (emotional, headings)
- **Body:** Inter, Open Sans (clarity, interface)
- **Mono:** IBM Plex Mono (code, technical)

---

## Spacing System

```
1:  4px     (micro-spacing)
2:  8px     (component gaps)
3:  12px    (field padding)
4:  16px ⭐ (standard)
5:  20px    (medium)
6:  24px    (section padding)
8:  32px    (major divisions)
10: 40px    (breathing room)
12: 48px    (large sections)
16: 64px    (layout gaps)
20: 80px    (full page)
24: 96px    (hero sections)
```

---

## Border Radius

```
none: 0px
sm:      4px
default: 8px ⭐
md:      12px
lg:      16px
xl:      20px
2xl:     24px
full:    9999px (pills, badges)
```

---

## Shadows

```
sm:  0 1px 2px rgba(0,0,0,0.05)
md:  0 4px 6px -1px rgba(0,0,0,0.08) ⭐
lg:  0 10px 15px -3px rgba(0,0,0,0.08)
xl:  0 20px 25px -5px rgba(0,0,0,0.08)
```

---

## Component Patterns

### Input Fields
```
├─ Border: sage-200 (default)
├─ Focus: sage-600 + ring-sage-300
├─ Success: success-500
├─ Error: error-500
└─ Padding: px-4 py-3
```

### Buttons
```
Primary (Sage)
├─ Background: sage-600
├─ Hover: sage-700
├─ Text: white
└─ Padding: px-6 py-3

Secondary (Lavender)
├─ Border: lavender-300
├─ Text: lavender-600
├─ Hover: lavender-50
└─ Padding: px-6 py-3
```

### Cards/Sections
```
├─ Background: white
├─ Border: sage-200
├─ Shadow: md
├─ Border-left: 4px sage-600
└─ Padding: p-6
```

### Empathetic Messages
```
├─ Background: lavender-50
├─ Border-left: 4px lavender-400
├─ Text: text-primary
└─ Padding: p-4
```

---

## Microcopy Quick Rules

### ✅ DO
- Write like a caring human
- Be warm and encouraging
- Celebrate progress ("You're halfway!")
- Use active voice
- Be specific and clear
- Show empathy

### ❌ DON'T
- Use corporate jargon
- Sound like a robot
- Blame users for errors
- Use negative language
- Assume knowledge
- Be vague

### Examples

| Context | ❌ Don't | ✅ Do |
|---------|----------|--------|
| Label | "License #" | "Professional License Number" |
| Help | "Required" | "We'll verify this with the board" |
| Error | "Invalid format" | "Please use MM/DD/YYYY format" |
| Success | "Saved" | "Great! Your info is saved" |
| Loading | "Loading..." | "Checking your credentials..." |
| Empty | "No items" | "No qualifications yet. Ready to add one?" |

---

## Accessibility Checklist

- ✅ **Minimum 16px** body text
- ✅ **Focus indicators** visible (ring-sage-300)
- ✅ **Color contrast** WCAG AA compliant
- ✅ **Semantic HTML** (proper form structure)
- ✅ **ARIA labels** where needed
- ✅ **Keyboard navigation** supported
- ✅ **Error messages** linked to inputs
- ✅ **Tested** with screen readers

---

## Form Best Practices

```
1. One column (mobile-first)
2. Clear labels (above, not inside)
3. Generous padding (breathing room)
4. Helpful hint text (below field)
5. Inline validation (as user types)
6. Success feedback (celebrate!)
7. Error clarity (how to fix it)
8. Progress indicator (where are they?)
9. Save progress (don't lose data)
10. Confirmation (before submit)
```

---

## Multi-Step Form Pattern

```
📊 Progress Indicator
   Step 1 ✓  →  Step 2 (current)  →  Step 3
   
🎯 Current Step
   Title, subtitle, description
   Estimated time (honest!)
   
📝 Form Fields
   Properly labeled, validated, helpful
   
🔘 Navigation
   ← Back  |  Next →  (or Submit)
```

---

## Success Page Pattern

```
🎉 Celebration (emoji, heading)
   "You did it!"

📋 What happens next
   Clear timeline
   What to expect
   When they'll hear from you

💡 Call to action (optional)
   "See your dashboard" or "Learn more"

📧 Support contact
   "Questions? Email support..."
```

---

## Miyazaki Principles Checklist

For every component, ask:

- [ ] **Show, don't tell?** Is it clear without explanation?
- [ ] **Respect the moment?** Does it feel intentional, not rushed?
- [ ] **Small details?** Any micro-interactions for delight?
- [ ] **Silence speaks?** Enough whitespace?
- [ ] **Human connection?** Warm, encouraging language?
- [ ] **Anticipation?** Does the user know what's next?

---

## Common Mistakes to Avoid

❌ Using multiple font sizes/weights (confusing hierarchy)
❌ Mixing warm and cool colors (visual discord)
❌ Small text (<16px) for body content
❌ Cramped spacing (overwhelming)
❌ Corporate microcopy (feels cold)
❌ Unclear affordances (what's clickable?)
❌ No progress feedback (where am I?)
❌ Jargon without explanation (who's your user?)
❌ Color-only validation (not accessible)
❌ No focus indicators (keyboard users confused)

---

## File References

### Core Files
- `tailwind.config.js` - Full color/spacing configuration
- `src/design-system/tokens.ts` - TypeScript design tokens
- `src/design-system/accessibility.ts` - Accessibility utilities

### Documentation
- `BLOOM_DESIGN_SYSTEM_AND_WORKFLOW_PHILOSOPHY.md` - Full philosophy
- `MIYAZAKI_DESIGN_PATTERNS_FOR_BLOOM.md` - Detailed patterns
- `APPLICATION_WORKFLOW_IMPLEMENTATION_GUIDE.md` - Technical implementation

---

## One-Page Component Template

```tsx
import React from 'react';

interface ComponentProps {
  // Props here
}

export const BloomComponent: React.FC<ComponentProps> = (props) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-h2 text-sage-700">
          Clear Title
        </h2>
        <p className="text-body-lg text-text-secondary">
          Warm subtitle explaining why this matters
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Form fields, cards, etc. */}
      </div>

      {/* Help/Info */}
      <div className="p-4 bg-lavender-50 border-l-4 border-lavender-300 rounded">
        <p className="text-body text-text-primary">
          Supporting information in empathetic tone
        </p>
      </div>

      {/* CTA */}
      <button className="w-full py-3 bg-sage-600 text-white rounded-lg font-semibold hover:bg-sage-700">
        Action Button Text
      </button>
    </div>
  );
};
```

---

## 🌸 Remember

**Bloom is about:**
1. Trust (sage green)
2. Empathy (lavender)
3. Clarity (generous spacing)
4. Warmth (cream backgrounds)
5. Intentionality (no waste)

Every design choice should serve the user's emotional journey, not just the functional requirement.

---

**Quick Start:**
1. Use sage green for primary actions
2. Use lavender for empathetic content
3. Use cream backgrounds for comfort
4. Space generously (≥ 16px between sections)
5. Write warm, human microcopy
6. Celebrate milestones
7. Trust the design system

✨ **That's the Bloom spirit!**
