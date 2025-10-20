# Color Contrast Analysis - Bloom Design System

## Current Color Usage Audit

### Text Colors Currently Used
1. **`#3A3A3A`** - Dark gray (primary headings/important text)
2. **`#4A4A4A`** - Medium-dark gray (body text)
3. **`#5A5A5A`** - Medium gray (secondary text)
4. **`#6B8E7F`** - Muted sage green (decorative text)
5. **`#FEFDFB`** - Off-white (text on dark backgrounds)

## WCAG Contrast Ratio Analysis

### On White Background (#FFFFFF)

| Color | Usage | Contrast Ratio | WCAG AA | WCAG AAA | Recommendation |
|-------|-------|---------------|---------|----------|----------------|
| `#3A3A3A` | Headings | **11.2:1** | ✅ Pass | ✅ Pass | **Keep** - Excellent |
| `#4A4A4A` | Body text | **8.6:1** | ✅ Pass | ✅ Pass | **Keep** - Excellent |
| `#5A5A5A` | Secondary | **6.4:1** | ✅ Pass | ⚠️ Marginal | **Improve** to `#4A4A4A` |
| `#6B8E7F` | Decorative | **3.9:1** | ⚠️ Marginal | ❌ Fail | **Only for large text 18px+** |

### Key Findings

#### ✅ GOOD - Keep These
- **`#3A3A3A`** (11.2:1) - Perfect for all text sizes
- **`#4A4A4A`** (8.6:1) - Perfect for body text
- **Global CSS now uses `#1A1A1A`** (19:1) - Even better!

#### ⚠️ NEEDS IMPROVEMENT
- **`#5A5A5A`** (6.4:1) - Just below AAA for small text
  - **Fix:** Change to `#4A4A4A` (8.6:1) for better readability
  - **Impact:** Minimal visual change, significant readability improvement

#### ❌ DECORATIVE ONLY
- **`#6B8E7F`** (3.9:1) - Fails AAA, barely passes AA
  - **Current use:** Footer/decorative elements
  - **Fix:** Only use for 18px+ text or decorative purposes
  - **Alternative:** `#4a7c5d` from design tokens (4.8:1) for interactive elements

## Recommended Color Palette (WCAG AAA Compliant)

### For Light Backgrounds (White/#FFFFFF)

```typescript
export const accessibleTextColors = {
  // Primary text - maximum readability
  primary: '#1A1A1A',      // 19:1 contrast (NEW - already in global CSS)
  
  // Secondary text - slightly softer but still AAA
  secondary: '#3A3A3A',    // 11.2:1 contrast (EXISTING - good)
  
  // Body text - comfortable reading
  body: '#4A4A4A',         // 8.6:1 contrast (EXISTING - good)
  
  // Muted text - for hints/captions (18px+ only)
  muted: '#5A5A5A',        // 6.4:1 contrast (use sparingly)
  
  // Decorative/non-essential (18px+ bold recommended)
  tertiary: '#6B6B6B',     // 4.6:1 contrast
}
```

### For Bloom Primary (Sage Green Backgrounds)

The sage green primary colors need checking when used as backgrounds:

| Background | Text Color | Contrast | Status |
|------------|-----------|----------|--------|
| `#4a7c5d` (Primary-500) | `#FFFFFF` | 4.1:1 | ✅ AA Large text |
| `#4a7c5d` (Primary-500) | `#FEFDFB` | 4.0:1 | ✅ AA Large text |
| `#2d5a47` (Primary-700) | `#FFFFFF` | 7.2:1 | ✅ AAA All text |
| `#1a3d2e` (Primary-900) | `#FFFFFF` | 12.1:1 | ✅ AAA All text |

**Recommendation:** For buttons/CTAs with primary colors:
- Use Primary-700 or Primary-900 for small text
- Primary-500 is fine for large text (18px+, bold)

## Specific Improvements by Component

### 1. JoinUs.tsx Application Form

**Current Issues:**
- `color: '#5A5A5A'` appears 3 times (lines 490, 850, 1035)
- `color: '#4A4A4A'` appears 6 times (lines 129, 217, 359, 633)

**Recommendation:**
Replace `#5A5A5A` with `#4A4A4A` for consistency and better contrast.

```typescript
// BEFORE (6.4:1 contrast)
color: '#5A5A5A'

// AFTER (8.6:1 contrast)  
color: '#4A4A4A'
```

**Impact:**
- 34% improvement in contrast ratio
- Minimal visual difference (slightly darker)
- Better readability for 60+ users

### 2. Landing Page (App.tsx)

**Current:**
- Line 311: `color: '#3A3A3A'` - ✅ Good (11.2:1)
- Line 350: `color: '#5A5A5A'` - ⚠️ Improve to `#4A4A4A`

**Action:** Change one instance from `#5A5A5A` to `#4A4A4A`

### 3. Footer/Decorative Text

**Current:** `color: '#6B8E7F'` (line 909 JoinUs.tsx)

**Recommendation:**
- If text is 18px+ → Keep as is (passes AA for large text)
- If text is <18px → Change to `#4a7c5d` (4.8:1) or `#4A4A4A` (8.6:1)

### 4. Form Labels

**Current state:** Mix of `#3A3A3A` and `#4A4A4A`

**Recommendation:** Standardize to `#1A1A1A` (now default in global CSS)
- Strongest contrast for quick scanning
- Especially important for users 60+

## Design System Token Updates

Update `src/design-system/tokens.ts` to include accessible text colors:

```typescript
export const accessibleText = {
  // On light backgrounds
  onLight: {
    primary: '#1A1A1A',    // 19:1 - Maximum readability
    secondary: '#3A3A3A',  // 11.2:1 - Headings
    body: '#4A4A4A',       // 8.6:1 - Body text
    muted: '#5A5A5A',      // 6.4:1 - Use for 18px+ only
  },
  
  // On dark backgrounds  
  onDark: {
    primary: '#FFFFFF',    // Pure white
    secondary: '#FEFDFB',  // Warm white
    muted: '#E5E5E5',      // Light gray (use for 18px+ only)
  },
  
  // On colored backgrounds (Bloom primary)
  onPrimary: {
    light: '#FFFFFF',      // For Primary-500 and darker
    dark: '#1A1A1A',       // For Primary-100 and lighter
  },
}
```

## Quick Wins (Minimal Visual Impact, Maximum Readability)

### Priority 1: Secondary Text Color
**Change:** `#5A5A5A` → `#4A4A4A` (8 occurrences across the app)
- **Files:** JoinUs.tsx (3), App.tsx (1), QualificationCheck.tsx (4)
- **Visual impact:** Very subtle darkening
- **Readability impact:** 34% improvement
- **Time:** 5 minutes

### Priority 2: Ensure Form Labels Use Darkest Color
**Change:** Ensure all labels use `#1A1A1A` (already in global CSS)
- **Files:** Global CSS applies automatically to new content
- **Existing inline styles:** Need manual update
- **Visual impact:** Slightly darker, more authoritative
- **Readability impact:** Maximum contrast for quick scanning

### Priority 3: Audit Button Text
**Check:** All buttons on colored backgrounds have 4.5:1+ contrast
- Primary buttons with sage green → Use white text
- Secondary buttons → Ensure sufficient contrast

## Non-Intrusive Changes Only

Since you want to preserve the Bloom aesthetic, these changes are **surgical**:

1. **One shade darker:** `#5A → #4A` (barely noticeable)
2. **Maintain color temperature:** All grays stay neutral/warm
3. **Preserve hierarchy:** Heading/body/secondary relationships remain
4. **No dramatic changes:** Just 10-20% darker where needed

## Testing Recommendations

### Visual Comparison
Before making changes, take screenshots at:
- 100% zoom
- 150% zoom (common for 60+ users)
- Various lighting conditions

### Contrast Checkers
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools → Lighthouse → Accessibility audit
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

### Real User Testing
Test with clinicians 60+ in:
- Bright office lighting (fluorescent)
- Dim room lighting (evening work)
- Outdoor / natural light
- Computer glasses / bifocals

## Implementation Strategy

### Phase 1: Global Defaults (Already Done! ✅)
- `src/index.css` now uses `#1A1A1A` for body text
- All new content automatically gets better contrast

### Phase 2: Update Secondary Text (Recommended)
Find and replace `#5A5A5A` with `#4A4A4A`:
- JoinUs.tsx: 3 instances
- App.tsx: 1 instance
- Other files as needed

### Phase 3: Audit (Optional)
- Check all buttons on colored backgrounds
- Verify links have sufficient contrast
- Test focus indicators are visible

## Summary

**Good news:** Your current colors are mostly excellent!
- `#3A3A3A` and `#4A4A4A` already pass WCAG AAA
- Global CSS now uses even better `#1A1A1A`
- Only minor adjustments needed

**One change needed:** 
- Replace `#5A5A5A` with `#4A4A4A` (8 instances)
- This is the lowest-hanging fruit with biggest impact

**Bloom aesthetic preserved:**
- Changes are subtle (one hex shade)
- Warm, natural color palette maintained
- Visual hierarchy unchanged
- Just slightly darker for better readability

---

## Contrast Ratios Explained

- **4.5:1** = WCAG AA for normal text
- **3:1** = WCAG AA for large text (18px+)
- **7:1** = WCAG AAA for normal text
- **4.5:1** = WCAG AAA for large text

Your users 60+ will especially appreciate AAA compliance (7:1+)!
