# GitHub Copilot Instructions for Life Psychology Frontend

## Project Overview

This is a **React 18 + TypeScript + Vite** healthcare web application for Life Psychology Australia with production A/B testing, Azure integration, and comprehensive analytics tracking.

## Key Architecture Patterns

### 1. Centralized Services (Recently Refactored ✅)

- **`src/services/BookingService.ts`** - Singleton for all booking operations and modal state
- **`src/services/ApiService.ts`** - HTTP client with retry logic, timeout handling, type-safe responses
- **`src/services/FeatureFlagService.ts`** - Runtime feature flag management

### 2. Structured Logging

- **Always use `src/utils/logger.ts`** instead of `console.*`
- Pattern: `log.info('Message', 'ComponentName', data)`
- Integrates with Application Insights for ERROR level

### 3. API Integration

- **Always use `ApiService`** for HTTP requests (never raw `fetch`)
- Automatic retry with exponential backoff
- Type-safe responses via `ApiResponse<T>`

### 4. A/B Testing System

- **`src/components/ABTestProvider.tsx`** - Variant allocation (50/50 split)
- **`src/components/SmartHeader.tsx`** - Route to correct variant
- **`src/components/UnifiedHeader.tsx`** - Healthcare-optimized variant
- **`src/components/MinimalHeader.tsx`** - Minimal variant
- **DO NOT modify A/B testing logic without explicit request**

## File Organization

```
src/
├── services/        # Centralized business logic (BookingService, ApiService, FeatureFlagService)
├── hooks/          # Custom React hooks (useBookingService, useErrorBoundary, useABTest)
├── components/     # React components (organized by feature)
├── utils/          # Utilities (logger, validation, storage, tracking)
├── types/          # TypeScript type definitions (api.ts, tracking.ts)
├── config/         # App configuration (constants.ts, navigation.ts)
└── pages/          # Top-level route components
```

## Critical Files to Understand

### Booking Flow

1. `src/services/BookingService.ts` - Central booking logic
2. `src/hooks/useBookingService.ts` - React hook wrapper
3. `src/utils/halaxyBookingTracker.ts` - Halaxy integration + GCLID tracking (uses trackingCore)
4. `src/components/BookingModal.tsx` - Modal UI

### Analytics & Tracking (REFACTORED ✅ Nov 2025)

1. `src/utils/trackingCore.ts` - **Core tracking primitives** (gtag wrapper, dataLayer, session storage, GCLID)
2. `src/utils/trackingEvents.ts` - **Reusable event tracking functions** (trackBookNowClick, trackPageView, etc.)
3. `src/utils/UnifiedTracker.ts` - High-level orchestration (delegates to trackingEvents)
4. `src/utils/microConversions.ts` - ⚠️ DEPRECATED - Use trackingEvents instead
5. `src/utils/gtag-tracking.ts` - ⚠️ DEPRECATED - Use trackingEvents instead

**Preferred Pattern**: Import from `trackingEvents.ts` for direct, reusable tracking functions.

### A/B Testing (CRITICAL - DO NOT BREAK)

1. `src/components/ABTestProvider.tsx` - Variant allocation
2. `src/components/SmartHeader.tsx` - Variant router
3. `functions/src/ab-testing/allocateVariant.ts` - Azure Function for production allocation

### Configuration

1. `public/runtime-config.json` - Runtime environment variables
2. `.env.*` files - Build-time configuration
3. `src/config/constants.ts` - Application constants

## Common Tasks

### Adding a New API Call

```typescript
import { apiService } from '../services/ApiService';
import { log } from '../utils/logger';

const result = await apiService.post<MyResponseType>('/api/endpoint', data);
if (result.success) {
  log.info('API call succeeded', 'ComponentName', result.data);
} else {
  log.error('API call failed', 'ComponentName', result.error);
}
```

### Adding a Booking Button

```typescript
import { useBookingService } from '../hooks/useBookingService';

const { handleBookingClick } = useBookingService();

<button onClick={(e) => handleBookingClick(e, {
  buttonLocation: 'hero_cta',
  pageSection: 'above_fold',
  variant: 'primary'
})}>
  Book Now
</button>
```

### Adding Custom Event Tracking (NEW ✅)

```typescript
import {
  trackBookNowClick,
  trackPageView,
  fireMicroConversion,
} from '../utils/trackingEvents';

// Track a Book Now click
trackBookNowClick({
  page_section: 'hero',
  button_location: 'cta_button',
  service_type: 'individual_therapy',
});

// Track a page view
trackPageView({
  page_type: 'service_page',
  page_title: 'Individual Therapy',
});

// Fire a Google Ads micro-conversion ($2-$10)
fireMicroConversion('service_page', {
  page_path: window.location.pathname,
});
```

### Using UnifiedTracker (High-Level API)

```typescript
import { tracker } from '../utils/UnifiedTracker';

// Track service page with automatic micro-conversion
tracker.trackServicePage();

// Track conversion with full context
tracker.trackConversion({
  conversion_type: 'book_now_click',
  value: 100,
  currency: 'AUD',
  page_section: 'hero',
  button_location: 'cta',
});
```

### Logging Best Practices

```typescript
import { log } from '../utils/logger';

// DEBUG - Development diagnostics
log.debug('State updated', 'ComponentName', { oldState, newState });

// INFO - User actions and significant events
log.info('User clicked button', 'ComponentName', { buttonId });

// WARN - Recoverable issues
log.warn('API slow response', 'ComponentName', { duration: 5000 });

// ERROR - Critical failures (sends to Application Insights)
log.error('Payment failed', 'ComponentName', error);
```

## Architecture Principles

### 1. Centralized State Management

- Use services for cross-component state (e.g., BookingService)
- Keep component-local state minimal
- Leverage React Context for theme/A/B test variant

### 2. Type Safety

- All API responses use `ApiResponse<T>` type
- Define types in `src/types/` directory
- Use TypeScript strict mode

### 3. Performance

- Lazy load routes with React.lazy()
- Critical CSS inlined in `index.html`
- Images optimized (WebP + fallback)
- Bundle analysis via `npm run build:analyze`

### 4. Analytics

- Use `trackingEvents` for direct, reusable event tracking
- Use `UnifiedTracker` for high-level orchestration and state management
- Track micro-conversions for high-intent behavior
- GCLID preserved across booking flow
- All tracking uses shared `trackingCore` primitives

## Environment Variables

### Build-time (Vite)

- `VITE_BOOKING_URL` - Halaxy booking URL
- `VITE_AZURE_FUNCTION_URL` - Azure Functions endpoint
- `VITE_GA_MEASUREMENT_ID` - GA4 measurement ID
- `VITE_GOOGLE_ADS_ID` - Google Ads conversion ID

### Runtime (runtime-config.json)

- Generated by `scripts/select-config.js`
- Loaded via `src/utils/env.ts`
- Allows post-build configuration changes

## Testing

### Unit Tests (Vitest)

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### E2E Tests (Playwright)

```bash
npm run test:e2e           # Full suite
npm run test:visual        # Visual regression
npm run test:ab-visual     # A/B variant screenshots
```

## Deployment

### Automatic

- **Staging**: Push to `staging` branch → auto-deploys
- **Production**: Push to `main` branch → auto-deploys

### Manual

```bash
npm run build:ci
swa deploy dist --env staging
```

## Recent Changes (Nov 2025)

✅ **Major Refactoring Completed**

- Centralized booking logic in `BookingService`
- Migrated all fetch calls to `ApiService`
- Replaced `console.*` with structured logging
- Added validation, storage, and feature flag utilities
- Zero code duplication in booking flow
- All TypeScript errors resolved

See `REFACTORING-IMPLEMENTATION-SUMMARY.md` for details.

## When Making Changes

### DO ✅

- Use existing services (BookingService, ApiService)
- Add structured logging to new components
- Follow TypeScript strict mode
- Test A/B variants with `?variant=minimal`
- Update documentation when adding features

### DON'T ❌

- Use raw `fetch` (use ApiService)
- Use `console.*` (use logger)
- Modify A/B testing without testing both variants
- Add dependencies without updating package.json
- Skip TypeScript types

## Need Help?

### Quick Context Gathering

1. **Architecture**: Read `ARCHITECTURE-ANALYSIS.md`
2. **Refactoring Details**: See `REFACTORING-GUIDE.md`
3. **Deployment**: Check `docs/deployment/`
4. **Analytics**: Review `docs/analytics/`

### Common Debugging

- **Build fails**: Check `get_errors` in src/
- **A/B test issues**: Verify `ABTestProvider.tsx` and `SmartHeader.tsx`
- **Booking broken**: Check `BookingService.ts` and `halaxyBookingTracker.ts`
- **Analytics missing**: Inspect `UnifiedTracker.ts` initialization

## Custom Prompt Templates

Use these in a fresh Copilot chat:

### General Development

> "I'm working on the Life Psychology frontend (React + TypeScript + Vite). The project uses centralized services (BookingService, ApiService), structured logging, and has a production A/B testing system. What do you need to know about my task?"

### Booking System

> "I need to modify the booking flow. The system uses BookingService (singleton) for state management, halaxyBookingTracker for Halaxy integration, and UnifiedTracker for analytics. The flow involves: button click → BookingService → modal open → Halaxy → GCLID capture. What's the task?"

### A/B Testing

> "I'm working with the A/B testing system. We have ABTestProvider (allocation), SmartHeader (routing), UnifiedHeader (healthcare variant), and MinimalHeader (minimal variant). The system is LIVE in production with 50/50 split. I need to preserve all functionality. What do you need?"

### API Integration

> "I need to add a new API endpoint. The project uses ApiService (centralized HTTP client) with automatic retry logic, timeout handling, and type-safe responses. All responses use ApiResponse<T> type. What endpoint am I adding?"

### Analytics/Tracking

> "I'm working on analytics. The system uses UnifiedTracker (centralized) for GA4, Google Ads, and Application Insights. We track micro-conversions ($10 high-intent), booking clicks, and page views. GCLID is preserved across the booking flow. What tracking do I need?"

### Bug Fixing

> "I'm debugging an issue. The codebase uses structured logging (logger.ts with DEBUG/INFO/WARN/ERROR levels) and Application Insights for errors. A/B testing is live with SmartHeader routing to variants. Where should I start?"

### Refactoring

> "I'm refactoring code. Recent major refactoring (Nov 2025) centralized booking logic, migrated fetch to ApiService, replaced console with logger, and eliminated code duplication. Follow these patterns. What code needs refactoring?"

---

**Last Updated**: November 2025  
**Maintainer**: Development Team  
**Related Docs**: ARCHITECTURE-ANALYSIS.md, REFACTORING-GUIDE.md, README.md
