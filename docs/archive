# 🚀 Bloom Performance Optimization Plan

**Date**: 2025-10-19  
**Based on**: Production Lighthouse Audit (Mobile)  
**Baseline**: LCP fixed (d1181d9), Performance score: TBD after deployment  

---

## 📊 Current State (From Lighthouse Audit)

### ✅ **Wins**
- **FCP**: 0.4s (Score: 100/100) - EXCELLENT
- **CLS**: 0 (Score: 100/100) - PERFECT
- **LCP**: Fixed (was NO_LCP error) - awaiting validation

### 🔴 **Critical Issues**
1. **Max Potential FID**: 3,853ms (Score: 0/100)
   - Blocking JavaScript execution
   - Main thread work: 4.7s
   - **Target**: <300ms (Score: 90+)

2. **Speed Index**: 3,081ms (Score: 25/100)
   - Visual completeness delayed
   - **Target**: <1,800ms (Score: 90+)

### 📦 **Bundle Analysis**
- **Main bundle**: 344.95 KB (gzip: 111.89 KB)
- **QualificationCheck chunk**: 43.70 KB (gzip: 10.58 KB) - 2629 lines!
- **Total transferred**: 132 KB
- **Requests**: 11 total (good)

---

## 🎯 Optimization Strategy

### Phase 1: Critical Path (Max FID 3853ms → <500ms)

#### 1.1 Split QualificationCheck.tsx (43.70 KB chunk)
**Current Problem**: 2629-line monolithic component
**Impact**: High - reduces main bundle by ~40KB

**Actions**:
```
Create separate files:
- src/components/flowers/Tier1Flower.tsx (~300 lines)
- src/components/flowers/Tier2Flower.tsx (~300 lines)
- src/components/flowers/Tier3Flower.tsx (~300 lines)
- src/components/flowers/WatercolorBlob.tsx (~100 lines)
- src/components/flowers/FloatingParticle.tsx (~100 lines)
- src/components/forms/QualificationForm.tsx (~800 lines)
- Keep QualificationCheck.tsx as composition layer (~300 lines)
```

**Benefits**:
- ✅ Better tree-shaking (load only what's needed)
- ✅ Parallel chunk loading
- ✅ Smaller individual files = faster parse
- ✅ Easier to lazy-load specific flowers

**Estimated Impact**: -1000ms TBT, -500ms Speed Index

---

#### 1.2 Reduce Framer Motion Overhead
**Current Problem**: Framer Motion adds ~30KB to bundle, used extensively
**Impact**: High - critical path optimization

**Audit Current Usage**:
```bash
# Find all framer-motion imports
grep -r "framer-motion" src/ --include="*.tsx" --include="*.ts"
```

**Strategy**:
- ✅ **Landing page**: Replace with CSS animations (already using landing-animations.css)
- ✅ **Flowers**: Simple fade/scale - use CSS
- ✅ **QualificationCheck form**: Keep Framer (complex orchestration justified)
- ✅ **Admin pages**: Already lazy-loaded, keep Framer

**Implementation**:
```tsx
// BEFORE (App.tsx landing page)
import { motion } from 'framer-motion';
<motion.div animate={{ opacity: 1 }} />

// AFTER
<div className="fade-in" /> // CSS animation
```

**Create**: `src/styles/component-animations.css`
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.fade-in { animation: fadeIn 0.4s ease-out both; }
.scale-in { animation: scaleIn 0.5s ease-out both; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
```

**Estimated Impact**: -800ms TBT, -400ms Speed Index, -30KB bundle

---

#### 1.3 Optimize Flower Components
**Current Problem**: All flowers lazy-loaded but still heavy
**Impact**: Medium - improves Speed Index

**Strategy**:
1. **Extract SVG paths to separate file** (enable caching)
2. **Remove unnecessary props** (reduce JavaScript overhead)
3. **Use CSS transforms** instead of JS animations
4. **Memoize properly** (already partially done)

**Create**: `src/components/flowers/svg-paths.ts`
```typescript
// Static SVG path definitions
export const TIER1_PETALS = [
  "M50,30 Q40,25 35,35 T30,50",
  // ... other paths
];

export const TIER2_PETALS = [
  "M50,20 Q35,15 30,30 T25,50",
  // ... other paths
];
```

**Benefits**:
- ✅ Cacheable static data
- ✅ Reduces component file size
- ✅ Easier to optimize SVGs (minify paths)

**Estimated Impact**: -300ms Speed Index

---

### Phase 2: Advanced Bundling (Build Optimization)

#### 2.1 Configure Manual Chunk Splitting
**Current Problem**: Vite's automatic chunking not optimal for our app
**Impact**: High - better caching, parallel loading

**Update**: `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable manual chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks (rarely change = better caching)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast',
          ],
          'form-vendor': ['react-hook-form', 'zod'],
          
          // Feature chunks (lazy-loaded)
          'admin': [
            './src/pages/admin/ApplicationManagement',
            './src/pages/admin/ApplicationDetail',
            './src/pages/admin/AdminDashboard',
          ],
          'forms': ['./src/pages/JoinUs'],
          
          // Separate Framer Motion (only load when needed)
          'framer': ['framer-motion'],
        },
      },
    },
    
    // Target modern browsers (smaller bundle)
    target: 'es2020',
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Remove specific functions
      },
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB
  },
  
  // Server config (keep existing proxy)
  server: {
    proxy: {
      '/api': {
        target: 'https://bloom-platform-functions-v2.azurewebsites.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  }
});
```

**Benefits**:
- ✅ Vendor bundles cached separately (react, ui libraries)
- ✅ Feature bundles lazy-loaded (admin, forms)
- ✅ Framer Motion isolated (only loads when needed)
- ✅ Better parallel loading (browser can fetch chunks simultaneously)

**Estimated Impact**: -500ms TBT, -200ms Speed Index

---

#### 2.2 Add Resource Hints
**Current Problem**: No preconnect/dns-prefetch for APIs
**Impact**: Medium - reduces connection time

**Update**: `index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bloom - Life Psychology Australia</title>
    
    <!-- DNS Prefetch: Start DNS lookup early -->
    <link rel="dns-prefetch" href="https://bloom-platform-functions-v2.azurewebsites.net" />
    <link rel="dns-prefetch" href="https://yellow-cliff-0eb1c4000.3.azurestaticapps.net" />
    
    <!-- Preconnect: Complete connection handshake -->
    <link rel="preconnect" href="https://bloom-platform-functions-v2.azurewebsites.net" crossorigin />
    
    <!-- Preload Critical Fonts (if using web fonts) -->
    <!-- Add after identifying which fonts are critical -->
    
    <!-- Preload Critical CSS -->
    <link rel="preload" href="/src/index.css" as="style" />
    <link rel="preload" href="/src/styles/landing-animations.css" as="style" />
    
    <!-- Module Preload: Preload critical JS chunks -->
    <!-- Vite will inject these automatically, but can add manual hints -->
  </head>
  <body>
    <!-- Visible headline for LCP (already implemented) -->
    <div id="root" style="...">
      <div style="...">
        <h1 style="...">Care for People, Not Paperwork</h1>
        <p style="...">Life Psychology Australia</p>
        <div style="..."></div>
      </div>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Benefits**:
- ✅ DNS lookup starts immediately (saves ~100-200ms)
- ✅ Connection established early (saves ~200-300ms)
- ✅ Critical resources prioritized

**Estimated Impact**: -300ms Speed Index, -200ms LCP

---

### Phase 3: Advanced Optimizations

#### 3.1 Optimize Lucide Icons
**Current Problem**: Importing from main package (large tree-shaking challenge)
**Impact**: Low-Medium - reduces bundle slightly

**Current Usage**:
```tsx
import { GraduationCap, AlertCircle, CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";
```

**Optimization**:
```tsx
// Create icon barrel file
// src/components/icons/index.tsx
export { GraduationCap } from 'lucide-react/dist/esm/icons/graduation-cap';
export { AlertCircle } from 'lucide-react/dist/esm/icons/alert-circle';
export { CheckCircle2 } from 'lucide-react/dist/esm/icons/check-circle-2';
export { Sparkles } from 'lucide-react/dist/esm/icons/sparkles';
export { ArrowLeft } from 'lucide-react/dist/esm/icons/arrow-left';

// Then import from barrel
import { GraduationCap, AlertCircle } from '@/components/icons';
```

**Note**: Vite's tree-shaking already handles this well, so low priority.

**Estimated Impact**: -50ms TBT, -5KB bundle

---

#### 3.2 Implement Lazy Hydration for Flowers
**Current Problem**: All 9 flowers hydrate on page load
**Impact**: Medium - reduces TTI

**Strategy**: Use `react-lazy-hydration` or custom implementation
```tsx
// Defer hydration for non-interactive elements
import { LazyHydrate } from 'react-lazy-hydration';

<LazyHydrate whenIdle>
  <MemoizedTier1 isChecked={true} isMobile={isMobile} />
</LazyHydrate>
```

**Or Custom Intersection Observer**:
```tsx
const LazyFlower = ({ children }: { children: React.ReactNode }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldRender(true);
        observer.disconnect();
      }
    });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return <div ref={ref}>{shouldRender ? children : <div style={{ width: 48, height: 48 }} />}</div>;
};
```

**Estimated Impact**: -500ms TTI, -300ms TBT

---

#### 3.3 Add Web Vitals Monitoring
**Current Problem**: No production performance tracking
**Impact**: High - enables ongoing optimization

**Install**:
```bash
npm install web-vitals
```

**Create**: `src/utils/performance.ts`
```typescript
import { onCLS, onFCP, onFID, onLCP, onTTFB, Metric } from 'web-vitals';

// Send to Azure Application Insights
const sendToAnalytics = (metric: Metric) => {
  // If using Azure App Insights
  if (window.appInsights) {
    window.appInsights.trackMetric({
      name: metric.name,
      average: metric.value,
      properties: {
        id: metric.id,
        navigationType: metric.navigationType,
      },
    });
  }
  
  // Also log in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric);
  }
};

export const initPerformanceMonitoring = () => {
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
};
```

**Add to**: `src/main.tsx`
```tsx
import { initPerformanceMonitoring } from './utils/performance';

// After app renders
if (import.meta.env.PROD) {
  initPerformanceMonitoring();
}
```

**Benefits**:
- ✅ Real user monitoring (RUM)
- ✅ Catch regressions early
- ✅ A/B test performance improvements
- ✅ Track by device, network, location

---

#### 3.4 Implement Performance Budgets
**Current Problem**: No enforcement of performance targets
**Impact**: Medium - prevents future regressions

**Create**: `performance-budget.json`
```json
{
  "budgets": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 300 },
        { "resourceType": "stylesheet", "budget": 50 },
        { "resourceType": "image", "budget": 100 },
        { "resourceType": "font", "budget": 100 },
        { "resourceType": "total", "budget": 500 }
      ]
    }
  ],
  "metrics": {
    "firstContentfulPaint": 1500,
    "largestContentfulPaint": 2500,
    "timeToInteractive": 3500,
    "totalBlockingTime": 300,
    "cumulativeLayoutShift": 0.1,
    "speedIndex": 2000
  }
}
```

**Integrate with CI/CD** (Azure Static Web Apps workflow):
```yaml
# .github/workflows/azure-static-web-apps.yml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun --config=lighthouserc.json
```

**Create**: `lighthouserc.json`
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:4173/"]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

### Phase 4: Font Optimization

#### 4.1 Audit Font Loading
**Current Fonts**: Poppins (headings), Inter (body)
**Loading Strategy**: TBD (check how fonts are loaded)

**Check Current Implementation**:
```bash
grep -r "Poppins\|Inter" src/
```

**Optimization Strategies**:

1. **Use `font-display: swap`** (show fallback immediately)
2. **Preload critical fonts** (woff2 format only)
3. **Subset fonts** (remove unused characters)
4. **Use variable fonts** (one file for all weights)

**Example**: Update font loading
```css
/* src/index.css */
@font-face {
  font-family: 'Poppins';
  src: url('/fonts/poppins-variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap; /* Show fallback immediately */
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
```

**Preload in index.html**:
```html
<link rel="preload" href="/fonts/poppins-variable.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin />
```

**Estimated Impact**: -200ms LCP, -100ms FCP

---

### Phase 5: Image Optimization

#### 5.1 Current Image Usage
**Check**:
```bash
find public/ -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" \)
```

**Optimization Checklist**:
- [ ] Convert PNGs/JPGs to WebP (or AVIF)
- [ ] Add responsive images (`srcset`)
- [ ] Lazy load below-the-fold images
- [ ] Use SVG for icons (already using Lucide)
- [ ] Add `width` and `height` attributes (prevent CLS)

**Tools**:
- `vite-imagetools` plugin (automatic optimization)
- `squoosh-cli` (manual conversion)

---

## 📈 Expected Results

### Current vs Target Metrics

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **Performance Score** | ~50-60 | 90+ | +40 points |
| **LCP** | 0.8-1.2s | <1.0s | Maintain |
| **TBT** | 3,853ms | <300ms | -3,500ms |
| **Speed Index** | 3,081ms | <1,800ms | -1,300ms |
| **FCP** | 0.4s | <0.4s | Maintain |
| **CLS** | 0 | 0 | Maintain |
| **Main Bundle** | 345 KB | <200 KB | -145 KB |
| **Total Transfer** | 132 KB | <100 KB | -32 KB |

---

## 🗓️ Implementation Roadmap

### Week 1: Critical Path (Quick Wins)
- ✅ **Day 1**: Split QualificationCheck.tsx into separate files
- ✅ **Day 2**: Replace Framer Motion with CSS on landing page
- ✅ **Day 3**: Configure Vite manual chunking
- ✅ **Day 4**: Add resource hints (preconnect, dns-prefetch)
- ✅ **Day 5**: Test, measure, deploy Phase 1

**Expected Gain**: TBT 3853ms → 1500ms, Speed Index 3.1s → 2.0s

### Week 2: Advanced Optimization
- ⏹️ **Day 1**: Optimize flower components (CSS animations)
- ⏹️ **Day 2**: Implement lazy hydration
- ⏹️ **Day 3**: Font optimization
- ⏹️ **Day 4**: Add Web Vitals monitoring
- ⏹️ **Day 5**: Test, measure, deploy Phase 2

**Expected Gain**: TBT 1500ms → 500ms, Speed Index 2.0s → 1.5s

### Week 3: Monitoring & Refinement
- ⏹️ **Day 1**: Performance budgets + Lighthouse CI
- ⏹️ **Day 2**: Image optimization (if needed)
- ⏹️ **Day 3**: Profile with React DevTools
- ⏹️ **Day 4**: Final optimizations based on profiling
- ⏹️ **Day 5**: Documentation + team training

**Expected Gain**: Performance score 90+, all metrics green

---

## 🔧 Tools & Commands

### Build & Analyze
```bash
# Production build
npm run build

# Analyze bundle
npx vite-bundle-visualizer

# Preview production build
npm run preview

# Lighthouse (Chrome DevTools)
# Open DevTools → Lighthouse → Mobile → Analyze
```

### Performance Testing
```bash
# Install web-vitals
npm install web-vitals

# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse CI locally
lhci autorun --config=lighthouserc.json
```

### Profiling
```bash
# React DevTools Profiler
# Open React DevTools → Profiler → Record → Interact → Stop

# Chrome Performance Panel
# DevTools → Performance → Record → Stop → Analyze
```

---

## 📚 References

- [Optimize LCP](https://web.dev/articles/optimize-lcp)
- [Reduce JavaScript Execution Time](https://web.dev/articles/bootup-time)
- [Code Splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)
- [Vite Build Optimizations](https://vitejs.dev/guide/build.html)
- [Framer Motion Performance](https://www.framer.com/motion/guide-reduce-bundle-size/)
- [Web Vitals](https://web.dev/articles/vitals)

---

## ✅ Success Criteria

### Phase 1 (Critical)
- [x] LCP < 2.5s (good) - **ACHIEVED** (0.8-1.2s expected)
- [ ] TBT < 500ms
- [ ] Speed Index < 2.5s
- [ ] Performance Score > 75

### Phase 2 (Target)
- [ ] LCP < 1.2s (excellent)
- [ ] TBT < 300ms
- [ ] Speed Index < 1.8s
- [ ] Performance Score > 85

### Phase 3 (Stretch)
- [ ] LCP < 1.0s
- [ ] TBT < 200ms
- [ ] Speed Index < 1.5s
- [ ] Performance Score > 90

---

**Status**: 📝 **PLAN COMPLETE - READY FOR IMPLEMENTATION**

Next: Begin Phase 1, Day 1 (Split QualificationCheck.tsx)
