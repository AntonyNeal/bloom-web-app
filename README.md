# Life Psychology Australia - Frontend Application

> **For GitHub Copilot users**: See [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) for AI-assisted development guidance and custom prompt templates.

A modern, performance-optimized React application for Life Psychology Australia's healthcare services with production A/B testing, centralized service architecture, and comprehensive analytics tracking.

## 🚀 Quick Start

### Development

```bash
npm install
npm run dev
# Visit: http://localhost:5176
```

### Production Build

```bash
npm run build:ci
npm run preview
```

## 📖 Documentation

**Complete documentation is now organized in the [`docs/`](./docs/) directory:**

- 🚀 **[Deployment](./docs/deployment/)** - CI/CD pipeline, manual deployment, GitHub setup
- 🏗️ **[Infrastructure](./docs/infrastructure/)** - Azure resources, environment configuration
- 📊 **[Analytics](./docs/analytics/)** - GA4, conversion tracking, UnifiedTracker system
- ⚡ **[Performance](./docs/performance/)** - Optimization strategies, visual regression testing

## 🎯 Current Status

### A/B Testing System ✅ LIVE

- **Healthcare-optimized vs Minimal header variants**
- **50/50 traffic split with Azure Function allocation**
- **Integrated with UnifiedTracker for comprehensive analytics**
- **Staging**: https://red-desert-03b29ff00.1.azurestaticapps.net

### Infrastructure ✅ OPERATIONAL

- **CI/CD Pipeline**: Fixed and streamlined (4 redundant workflows removed)
- **Documentation**: Consolidated from 113+ files into organized structure
- **Testing**: Playwright tests updated for A/B testing compatibility

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS
- **Testing**: Playwright (E2E), Vitest (Unit)
- **Analytics**: GA4 + Google Ads via UnifiedTracker
- **Deployment**: Azure Static Web Apps
- **Functions**: Azure Functions (A/B allocation)

## 🏗️ Architecture (Nov 2025 Refactoring)

### Centralized Services

- **`src/services/BookingService.ts`** - Singleton managing all booking operations and modal state
- **`src/services/ApiService.ts`** - HTTP client with retry logic, timeout handling, type-safe responses
- **`src/services/FeatureFlagService.ts`** - Runtime feature flag management

### Key Patterns

- **Structured Logging**: All components use `src/utils/logger.ts` (DEBUG/INFO/WARN/ERROR)
- **Type-Safe APIs**: All HTTP calls use `ApiService` returning `ApiResponse<T>`
- **Centralized Booking**: Single `BookingService` eliminates 200+ lines of duplicate code
- **No Direct Fetch**: All API calls go through `ApiService` for consistency

**See**: `ARCHITECTURE-ANALYSIS.md` and `REFACTORING-GUIDE.md` for implementation details

## 🧪 A/B Testing

### Testing Variants Locally

```bash
# Default healthcare-optimized variant
http://localhost:5176

# Minimal variant
http://localhost:5176?variant=minimal

# Test verification page
http://localhost:5176/ab-test-verification
```

### Production Testing

- Refresh staging environment to see different variants
- Monitor GA4 events for `ab_test_variant_shown`
- Check conversion tracking via `book_now_click` events

## 📊 Performance

- **Bundle Size**: ~580KB gzipped (optimized from ~850KB)
- **LCP**: <2.5s via critical CSS inlining
- **Analytics**: Reduced tracking overhead by 66% with UnifiedTracker
- **Testing**: Automated visual regression testing via Playwright

## 🚦 Deployment

### Automated (Recommended)

```bash
git push origin staging   # Auto-deploys to staging
git push origin main      # Auto-deploys to production
```

### Manual (Emergency)

```bash
npm run build:ci
swa deploy dist --env staging --deployment-token "YOUR_TOKEN"
```

## 📋 Next Steps

1. **High Priority**: Add `AZURE_STATIC_WEB_APPS_API_TOKEN` to GitHub Secrets
2. **Medium Priority**: Launch A/B test in production after staging validation
3. **Low Priority**: Additional workflow simplification

## 🔗 Links

- **Production**: https://life-psychology.com.au
- **Staging**: https://red-desert-03b29ff00.1.azurestaticapps.net
- **GitHub**: https://github.com/AntonyNeal/life-psychology-frontend
- **Documentation**: [./docs/README.md](./docs/README.md)

---

_Project cleaned up October 2025 - Documentation consolidated, workflows streamlined, A/B testing deployed_
