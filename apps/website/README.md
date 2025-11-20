# Life Psychology Australia - Website

## Overview

The public-facing website for Life Psychology Australia, providing information about therapy services, online booking, and patient resources. Features production A/B testing, comprehensive analytics tracking, and optimized performance.

## Getting Started

### Development

```bash
# From repository root
pnpm dev:website

# Or from this directory
pnpm dev
```

Visit: http://localhost:5173

### Build for Production

```bash
pnpm build:website
```

## Architecture

### Key Technologies
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Analytics**: GA4 + Google Ads + Application Insights
- **Testing**: Playwright (E2E) + Vitest (Unit)
- **Deployment**: Azure Static Web Apps + Azure Functions

### Shared Packages
- `@shared/ui` - Reusable UI components
- `@shared/types` - TypeScript type definitions
- `@shared/utils` - Common utilities

### Project Structure

```
src/
├── components/           # React components
│   ├── ABTestProvider.tsx      # A/B test variant allocation
│   ├── SmartHeader.tsx         # A/B test router
│   ├── UnifiedHeader.tsx       # Healthcare-optimized variant
│   ├── MinimalHeader.tsx       # Minimal header variant
│   └── BookingModal.tsx        # Booking modal UI
├── config/              # App configuration
│   ├── constants.ts    # Application constants
│   └── navigation.ts   # Navigation configuration
├── hooks/               # Custom React hooks
│   ├── useBookingService.ts   # Booking hook
│   └── useABTest.ts           # A/B testing hook
├── pages/               # Page components
├── services/            # Service layer
│   ├── BookingService.ts      # Centralized booking logic
│   ├── ApiService.ts          # HTTP client
│   └── FeatureFlagService.ts  # Feature flags
├── types/               # TypeScript types
│   ├── api.ts          # API types
│   └── tracking.ts     # Analytics types
└── utils/               # Utility functions
    ├── logger.ts               # Structured logging
    ├── trackingCore.ts         # Core tracking primitives
    ├── trackingEvents.ts       # Reusable event tracking
    ├── UnifiedTracker.ts       # High-level analytics orchestration
    └── halaxyBookingTracker.ts # Halaxy integration + GCLID
```

## Key Features

### A/B Testing System ✅ LIVE

**Current Test**: Healthcare-optimized vs Minimal header variants

- **50/50 traffic split** via Azure Function allocation
- **Session-persistent** - variant stored in sessionStorage
- **Analytics integrated** - All events tagged with variant
- **Visual regression tested** - Automated screenshot comparison

**Testing Locally**:
```bash
# Default healthcare-optimized variant
http://localhost:5173

# Force minimal variant
http://localhost:5173?variant=minimal

# Verification page
http://localhost:5173/ab-test-verification
```

### Centralized Services Architecture

#### BookingService (Singleton)
Manages all booking operations and modal state:

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

#### ApiService
Type-safe HTTP client with retry logic:

```typescript
import { apiService } from '../services/ApiService';

const result = await apiService.post<MyResponseType>('/api/endpoint', data);
if (result.success) {
  // Handle success
} else {
  // Handle error
}
```

### Analytics & Tracking

**System**: UnifiedTracker with GA4, Google Ads, and Application Insights

**Architecture**:
- `trackingCore.ts` - Core primitives (gtag wrapper, dataLayer, GCLID)
- `trackingEvents.ts` - Reusable event tracking functions
- `UnifiedTracker.ts` - High-level orchestration

**Usage**:
```typescript
import { trackBookNowClick, trackPageView } from '../utils/trackingEvents';

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
```

### Structured Logging

All logging uses the centralized logger:

```typescript
import { log } from '../utils/logger';

// DEBUG - Development diagnostics
log.debug('State updated', 'ComponentName', { oldState, newState });

// INFO - User actions
log.info('User clicked button', 'ComponentName', { buttonId });

// WARN - Recoverable issues
log.warn('API slow response', 'ComponentName', { duration: 5000 });

// ERROR - Critical failures (sends to Application Insights)
log.error('Payment failed', 'ComponentName', error);
```

## Environment Variables

### Build-time (Vite)

Create `.env.development`:

```env
# Analytics
VITE_GA_MEASUREMENT_ID=G-XGGBRLPBKK
VITE_GOOGLE_ADS_ID=AW-123456789

# Booking
VITE_BOOKING_URL=https://halaxy.com/book/...

# API
VITE_AZURE_FUNCTION_URL=http://localhost:7071/api

# Feature Flags
VITE_ASSESSMENT_ENABLED=false
VITE_CHAT_ENABLED=false
```

### Runtime Configuration

Located at `public/runtime-config.json`, loaded via `runtime-fetch.ts`:

```json
{
  "VITE_GA_MEASUREMENT_ID": "G-XGGBRLPBKK",
  "VITE_ASSESSMENT_ENABLED": "false"
}
```

Allows post-build configuration changes without rebuilding.

## Development Patterns

### Adding a New Page

```typescript
// 1. Create page component
// src/pages/NewPage.tsx
export default function NewPage() {
  return <div>New Page</div>;
}

// 2. Add route in App.tsx
import NewPage from './pages/NewPage';

<Route path="/new-page" element={<NewPage />} />

// 3. Track page view
useEffect(() => {
  trackPageView({
    page_type: 'new_page',
    page_title: 'New Page',
  });
}, []);
```

### Creating a Booking Button

```typescript
import { useBookingService } from '../hooks/useBookingService';

function MyComponent() {
  const { handleBookingClick } = useBookingService();

  return (
    <button onClick={(e) => handleBookingClick(e, {
      buttonLocation: 'service_page_cta',
      pageSection: 'pricing_section',
      variant: 'primary'
    })}>
      Book Now
    </button>
  );
}
```

### Making API Calls

```typescript
import { apiService } from '../services/ApiService';
import { log } from '../utils/logger';

async function submitForm(data: FormData) {
  const result = await apiService.post<{ id: string }>('/api/submit', data);
  
  if (result.success) {
    log.info('Form submitted successfully', 'MyComponent', result.data);
    return result.data.id;
  } else {
    log.error('Form submission failed', 'MyComponent', result.error);
    throw new Error(result.error?.message || 'Submission failed');
  }
}
```

## Testing

### E2E Tests (Playwright)

```bash
# Run all tests
pnpm test

# Run visual regression tests
pnpm test:visual

# Run A/B variant tests
pnpm test:visual:ab

# Update baselines
pnpm test:visual:update

# Interactive mode
pnpm test:ui
```

### Unit Tests (Vitest)

```bash
# Run unit tests
pnpm test:unit

# Watch mode
pnpm test:unit:ui

# Run once
pnpm test:unit:run
```

### Type Checking

```bash
pnpm type-check
```

## Performance

### Optimizations Implemented
- ✅ Critical CSS inlined in `index.html`
- ✅ Lazy loading for non-critical routes
- ✅ Image optimization (WebP + fallback)
- ✅ Bundle size optimization (~580KB gzipped)
- ✅ Service Worker for offline support
- ✅ Analytics tracking optimized (66% reduction)

### Performance Monitoring
- Lighthouse CI in GitHub Actions
- Web Vitals tracking to GA4
- Application Insights for errors

## Deployment

### Automatic (via GitHub Actions)

```bash
# Deploy to staging
git push origin staging

# Deploy to production
git push origin main
```

### Manual Deployment

```bash
# Build for production
pnpm build:website

# Deploy to staging
swa deploy apps/website/dist --env staging --deployment-token $TOKEN

# Deploy to production
swa deploy apps/website/dist --env production --deployment-token $TOKEN
```

### Environments
- **Production**: https://life-psychology.com.au
- **Staging**: https://red-desert-03b29ff00.1.azurestaticapps.net

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
pnpm install
pnpm build
```

### A/B Test Not Working

1. Check `ABTestProvider.tsx` initialization
2. Verify `SmartHeader.tsx` routing
3. Check sessionStorage for `abTestVariant`
4. Review GA4 events for `ab_test_variant_shown`

### Analytics Not Tracking

1. Verify `VITE_GA_MEASUREMENT_ID` is set
2. Check browser console for gtag errors
3. Review `trackingCore.ts` initialization
4. Test with GA4 DebugView

### Booking Modal Not Opening

1. Check `BookingService.ts` initialization
2. Verify `VITE_BOOKING_URL` is set
3. Review console for errors
4. Check `halaxyBookingTracker.ts` setup

## Related Documentation

- [Main README](../../README.md) - Monorepo overview
- [Architecture Analysis](.github/copilot-instructions.md) - Detailed architecture
- [Performance Docs](./docs/performance/) - Performance optimization
- [Analytics Docs](./docs/analytics/) - Analytics setup
- [Deployment Docs](./docs/deployment/) - CI/CD pipeline

## Code Quality

### Linting

```bash
pnpm lint        # Check for errors
pnpm lint:fix    # Auto-fix issues
```

### Formatting

```bash
pnpm format              # Format all files
pnpm format:check        # Check formatting
```

### Pre-commit Checks

```bash
pnpm lint:ci  # Runs format, lint, format:check, and type-check
```

## Recent Changes (November 2025)

✅ **Major Refactoring**:
- Centralized booking logic in `BookingService`
- Migrated all fetch calls to `ApiService`
- Replaced `console.*` with structured logging
- Created reusable tracking functions
- Eliminated 200+ lines of duplicate code

## Support & Contributing

### Code Style
- Use TypeScript strict mode
- Follow existing service patterns
- Use structured logging
- Add type definitions
- Write tests for new features

### Before Committing
```bash
pnpm lint:ci
pnpm test:unit:run
```

---

**Last Updated**: November 20, 2025
**Version**: 1.0.0
**Status**: Production (A/B Testing Active)
