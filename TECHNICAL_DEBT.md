# Technical Debt - Bloom Web App

**Last Updated:** November 20, 2025

This document tracks technical debt in the Bloom web application and prioritizes improvements for better maintainability, readability, and AI context efficiency.

## ✅ Completed Improvements

### Documentation Organization (Nov 2025)
- ✅ Moved 80+ old markdown reports to `docs/archive/`
- ✅ Cleaned up root directory to essential docs only
- **Impact:** Improved workspace clarity and AI semantic search accuracy

### Design Token Consolidation (Nov 2025)
- ✅ Added Bloom colors to centralized `src/design-system/tokens.ts`
- ✅ Removed duplicate `bloomStyles` objects from `JoinUs.tsx` and `QualificationCheck.tsx`
- ✅ Added Ghibli-inspired easing curves to animation tokens
- **Impact:** Single source of truth for design values

### Import Consistency (Nov 2025)
- ✅ Fixed 11 files using relative imports (`../../hooks/useAuth`) to use path aliases (`@/hooks/useAuth`)
- ✅ Added ESLint rule to enforce `@/*` import pattern
- **Impact:** Improved consistency and maintainability

### Code Cleanup (Nov 2025)
- ✅ Removed TODO comment from ApplicationManagement.tsx (auth already implemented)
- ✅ Removed console.log statements from adminService.ts
- **Impact:** Cleaner production code

### Reusable Components (Nov 2025)
- ✅ Created `src/components/forms/FormComponents.tsx` with reusable form components:
  - `FormField` - Consistent field wrapper with labels, errors, helpers
  - `TextInput` - Pre-configured text input
  - `TextAreaInput` - Pre-configured textarea
  - `FormSection` - Form section with title and icon
- **Impact:** Foundation for reducing form duplication

---

## 🚨 High Priority Technical Debt

### P0: Inline Styles Overuse
**Status:** 🔴 Not Started  
**Effort:** 2-3 weeks  
**Impact:** Critical for readability and maintainability

**Problem:**
- `JoinUs.tsx` (1,677 lines) has hundreds of inline `style={{}}` objects
- `QualificationCheck.tsx` (2,016 lines) similar issue
- Style objects recreated on every render
- Hard to read component logic buried in style definitions

**Solution:**
1. Convert inline styles to Tailwind classes (already installed)
2. Extract complex styles to CSS modules for specialized animations
3. Use design tokens via CSS variables

**Example Conversion:**
```tsx
// Before:
<h1 style={{
  fontSize: isMobile ? '40px' : '56px',
  fontWeight: 600,
  background: `linear-gradient(135deg, #6B8E7F 0%, #D4A28F 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}}>

// After:
<h1 className="text-4xl md:text-5xl font-semibold bg-gradient-to-br from-bloom-eucalyptusSage to-bloom-softTerracotta bg-clip-text text-transparent">
```

---

### P0: Giant File Decomposition
**Status:** 🔴 Not Started  
**Effort:** 2-3 weeks  
**Impact:** Critical for AI context efficiency and maintainability

**Problem:**
- `JoinUs.tsx`: 1,677 lines (should be <300 lines)
- `QualificationCheck.tsx`: 2,016 lines (should be <400 lines)
- `App.tsx`: 759 lines (should be <200 lines)
- AI tools struggle with context windows
- Hard to navigate and understand

**Solution:**

#### Break down JoinUs.tsx:
```
src/pages/JoinUs/
  ├── index.tsx                    # Main orchestration (150 lines)
  ├── MarketingContent.tsx         # Hero section (250 lines)
  ├── ApplicationForm.tsx          # Form logic (300 lines)
  ├── SuccessState.tsx             # Success animation (100 lines)
  └── components/
      ├── FeatureCard.tsx
      ├── BenefitsList.tsx
      └── ApplicationFormSection.tsx
```

#### Break down QualificationCheck.tsx:
```
src/components/qualification/
  ├── QualificationCheck.tsx       # Main component (300 lines)
  ├── QualificationButton.tsx      # Button interactions (150 lines)
  ├── SuccessAnimation.tsx         # Celebration (200 lines)
  └── QualificationBadges.tsx      # Tier badges (150 lines)
```

---

### P1: Missing Test Coverage
**Status:** 🔴 Not Started  
**Effort:** 2-3 weeks  
**Impact:** High - No safety net for refactoring

**Problem:**
- Zero test files in the codebase
- No way to validate refactoring doesn't break functionality
- Technical debt compounds without tests

**Solution:**
1. Set up testing infrastructure:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   ```

2. Start with critical paths:
   - `useAuth` hook tests
   - `FormComponents` tests
   - `adminService` API tests
   - Flower component render tests

3. Add to CI/CD pipeline

**Target:** 60% code coverage for business logic, 80% for utilities

---

### P1: Refactor Form Duplication in JoinUs.tsx
**Status:** 🟢 Mostly Complete  
**Effort:** 1 week → 2 hours actual  
**Impact:** High - Major code duplication eliminated

**Completed (Nov 20, 2025):**
- ✅ Created reusable `FormComponents.tsx`
- ✅ Refactored Personal Information section (4 fields)
- ✅ Refactored Professional Details section (2 fields)  
- ✅ Refactored Cover Letter section (1 field)
- ✅ Reduced JoinUs.tsx by 205 lines (12.3% reduction)
- ✅ All form fields now use consistent patterns

**Remaining:**
- ⏳ File upload components (Documents section)
- ⏳ Extract qualification badge display to separate component

**Result:**
```tsx
// Before: 20+ lines per field with inline styles
// After: 3-5 lines using FormComponents

<TextInput
  id="first_name"
  label="First Name"
  value={formData.first_name}
  onChange={(val) => setFormData({ ...formData, first_name: val })}
  required
  placeholder="Jane"
/>
```

**Benefit:**
- Much cleaner, more maintainable code
- Consistent form UX
- Easy to add new fields
- Pattern proven for rest of codebase

---

## 🟡 Medium Priority Technical Debt

### P2: Console.log Cleanup
**Status:** 🟡 Partially Complete  
**Effort:** 2-3 days  
**Impact:** Medium - Code hygiene

**Progress:**
- ✅ Removed logs from `adminService.ts`
- ⏳ Remove performance logs from `main.tsx` (20+ logs)
- ⏳ Remove debug logs from `AuthCallback.tsx` (8+ logs)

**Solution:**
- Replace with proper logging library (pino, winston)
- Environment-based logging (dev only)
- Build-time log stripping for production

---

### P2: Ambient Background Duplication
**Status:** 🔴 Not Started  
**Effort:** 1 week  
**Impact:** Medium - Code reuse

**Problem:**
- `JoinUs.tsx` has its own watercolor blob implementation
- `QualificationCheck.tsx` imports from `ambient-helpers.tsx`
- Inconsistent ambient backgrounds across pages

**Solution:**
1. Create single `<AmbientBackground>` component with props:
   ```tsx
   <AmbientBackground
     variant="garden"  // garden | minimal | celebration
     intensity="high"  // low | medium | high
     reduced={shouldReduceMotion}
   />
   ```

2. Use composition pattern for different effects

---

### P2: Improve Component Documentation
**Status:** 🔴 Not Started  
**Effort:** 1 week  
**Impact:** Medium - Developer experience

**Solution:**
- Add JSDoc comments to all exported components
- Document prop interfaces with descriptions
- Create component usage examples
- Consider Storybook for component library documentation

---

## 🟢 Low Priority / Future Improvements

### P3: Bundle Size Optimization
- Analyze bundle with `vite-plugin-visualizer`
- Further lazy loading opportunities
- Remove unused dependencies

### P3: Performance Monitoring
- Add Web Vitals tracking
- Set up performance budgets
- Monitor LCP, FID, CLS

### P3: Accessibility Audit
- Run axe-core audit
- Add comprehensive ARIA labels
- Keyboard navigation testing

### P3: State Management Review
- Consider if Redux is necessary (might be over-engineered)
- Evaluate moving to React Query for server state
- Local state with Context API might suffice

---

## 📊 Metrics

### Current State
- **Total Components:** ~50
- **Average File Size:** 400 lines
- **Largest Files:** JoinUs.tsx (1,677), QualificationCheck.tsx (2,016)
- **Test Coverage:** 0%
- **Inline Styles:** ~80% of styling
- **Documentation:** Minimal JSDoc

### Target State (6 months)
- **Average File Size:** <250 lines
- **Largest File:** <500 lines
- **Test Coverage:** 70%
- **Inline Styles:** <10% (critical animations only)
- **Documentation:** All public APIs documented

---

## 🎯 Recommended Approach

### Phase 1: Foundation (Weeks 1-2)
1. ✅ Archive documentation
2. ✅ Consolidate design tokens
3. ✅ Fix import consistency
4. ✅ Create reusable form components
5. ⏳ Set up testing infrastructure

### Phase 2: Major Refactoring (Weeks 3-6)
1. Refactor JoinUs.tsx to use form components
2. Break down JoinUs.tsx into smaller files
3. Break down QualificationCheck.tsx into smaller files
4. Convert inline styles to Tailwind (batch by file)

### Phase 3: Quality & Testing (Weeks 7-8)
1. Add component tests
2. Add hook tests
3. Add service tests
4. Document all components

### Phase 4: Optimization (Weeks 9-10)
1. Performance audit
2. Accessibility audit
3. Bundle size optimization
4. Final documentation pass

---

## 📝 Notes

### Why This Matters for AI Context
- Large files consume more tokens
- Inline styles bury actual logic
- Duplicate code confuses semantic search
- Poor organization slows down code navigation

### Migration Strategy
- Work incrementally - don't break production
- Test each change in isolation
- Use feature flags if needed for risky changes
- Keep main branch deployable at all times

### Getting Help
- Form components are in `src/components/forms/`
- Design tokens in `src/design-system/tokens.ts`
- All old reports archived in `docs/archive/`
- ESLint will enforce import patterns

---

**Next Review:** January 2026
