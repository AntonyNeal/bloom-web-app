/\*\*

- REFACTORING GUIDE
-
- Step-by-step guide to implement architectural improvements
  \*/

# Phase 1: Immediate Improvements (Week 1)

## 1. Integrate BookingService

### Files to Update:

- `src/components/UnifiedHeader.tsx`
- `src/components/MinimalHeader.tsx`
- `src/components/MobileCTABar.tsx`

### Steps:

```typescript
// 1. Import the hook
import { useBookingService } from '../hooks/useBookingService';

// 2. Replace local state
const { isModalOpen, handleBookingClick, closeModal } = useBookingService();

// 3. Update button handlers
<button onClick={(e) => handleBookingClick(e, {
  buttonLocation: 'header_cta',
  pageSection: 'hero',
  variant: 'healthcare-optimized'
})}>
  Book Now
</button>

// 4. Replace modal state
{isModalOpen && <BookingModal onClose={closeModal} />}
```

### Testing:

- [ ] Verify booking clicks tracked correctly
- [ ] Confirm modal opens/closes
- [ ] Check Halaxy integration works
- [ ] Validate A/B test tracking

---

## 2. Migrate to ApiService

### Files to Update:

- `src/utils/halaxyAvailability.ts`
- `src/utils/halaxyBookingTracker.ts`
- `src/components/ABTestProvider.tsx`

### Steps:

```typescript
// 1. Import ApiService
import { apiService } from '../services/ApiService';
import { API_ENDPOINTS } from '../config/constants';

// 2. Replace fetch calls
// OLD:
const response = await fetch(url, {
  method: 'POST',
  body: JSON.stringify(data),
});
const result = await response.json();

// NEW:
const result = await apiService.post(API_ENDPOINTS.BOOKING_SESSION, data);

// 3. Handle typed responses
if (result.success && result.data) {
  // Use result.data with type safety
}
```

### Benefits:

- ✓ Automatic retry logic
- ✓ Consistent error handling
- ✓ Type-safe responses
- ✓ Centralized timeout configuration

---

## 3. Implement Centralized Logging

### Files to Update:

- Replace `console.log/error/warn` throughout codebase

### Steps:

```typescript
// 1. Import logger
import { log } from '../utils/logger';

// 2. Replace console calls
// OLD:
console.log('User logged in:', userData);
console.error('API failed:', error);

// NEW:
log.info('User logged in', 'Auth', userData);
log.error('API failed', 'API', error);

// 3. Use context parameter
log.debug('Variant allocated', 'ABTest', { variant, userId });
```

### Search & Replace:

```bash
# Find all console.log
grep -r "console\." src/

# Systematic replacement
# console.log → log.debug (development info)
# console.info → log.info (user actions)
# console.warn → log.warn (recoverable issues)
# console.error → log.error (critical errors)
```

---

## 4. Add Validation Utilities

### Files to Update:

- `src/components/ContactForm.tsx` (when created)
- Any form components

### Steps:

```typescript
// 1. Import validation
import { validateForm, isValidEmail, isValidPhone } from '../utils/validation';

// 2. Define validation rules
const rules = {
  email: {
    required: true,
    custom: isValidEmail,
    message: 'Please enter a valid email address'
  },
  phone: {
    required: true,
    custom: isValidPhone,
    message: 'Please enter a valid Australian phone number'
  }
};

// 3. Validate form
const { isValid, errors } = validateForm(formData, rules);

// 4. Show errors
{errors.email && <span className="error">{errors.email}</span>}
```

---

# Phase 2: Component Refactoring (Week 2)

## 5. Extract Common Header Logic

### Create Base Header Component:

```typescript
// src/components/headers/BaseHeader.tsx
interface BaseHeaderProps {
  variant: 'healthcare' | 'minimal';
  showCTA?: boolean;
}

export function BaseHeader({ variant, showCTA = true }: BaseHeaderProps) {
  const { handleBookingClick } = useBookingService();

  return (
    <header className={`header header--${variant}`}>
      {/* Common navigation */}
      {showCTA && <CTAButton onClick={handleBookingClick} />}
    </header>
  );
}
```

### Refactor Existing Headers:

- UnifiedHeader extends BaseHeader
- MinimalHeader extends BaseHeader
- Eliminates 200+ lines of duplication

---

## 6. Standardize API Response Handling

### Create API Hooks:

```typescript
// src/hooks/useApi.ts
export function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = async (options?: RequestConfig) => {
    setLoading(true);
    try {
      const result = await apiService.get<T>(endpoint, options);
      if (result.success) {
        setData(result.data || null);
      } else {
        setError(result.error || null);
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
}
```

---

# Phase 3: Advanced Improvements (Week 3-4)

## 7. Implement Feature Flag UI

### Create Developer Panel:

```typescript
// src/components/DeveloperPanel.tsx
import { featureFlags } from '../services/FeatureFlagService';

export function DeveloperPanel() {
  const flags = featureFlags.getAllFlags();

  return (
    <div className="dev-panel">
      {Object.entries(flags).map(([key, value]) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) =>
              featureFlags.setOverride(key, e.target.checked)
            }
          />
          {key}
        </label>
      ))}
    </div>
  );
}
```

---

## 8. Add Performance Monitoring

### Create Performance Hook:

```typescript
// src/hooks/usePerformance.ts
export function usePerformance(componentName: string) {
  useEffect(() => {
    const mark = `${componentName}-mount`;
    performance.mark(mark);

    return () => {
      const measure = `${componentName}-duration`;
      performance.measure(measure, mark);
      const entry = performance.getEntriesByName(measure)[0];

      if (entry.duration > 1000) {
        log.warn(`Slow component: ${componentName}`, 'Performance', {
          duration: entry.duration,
        });
      }
    };
  }, [componentName]);
}
```

---

# Testing Checklist

## Unit Tests

- [ ] BookingService methods
- [ ] ApiService retry logic
- [ ] Validation functions
- [ ] Storage service
- [ ] Logger functionality

## Integration Tests

- [ ] Booking flow end-to-end
- [ ] A/B test allocation
- [ ] API error handling
- [ ] Feature flag overrides

## Performance Tests

- [ ] Component render times
- [ ] API response times
- [ ] Bundle size impact

---

# Rollout Plan

1. **Week 1**: Core services (Booking, API, Logger)
2. **Week 2**: Component refactoring (Headers, Forms)
3. **Week 3**: Advanced features (Feature flags, Monitoring)
4. **Week 4**: Testing and optimization

# Success Metrics

- [ ] 50% reduction in duplicate code
- [ ] 100% API calls use ApiService
- [ ] All console.\* replaced with logger
- [ ] 0 lint errors
- [ ] All tests passing
- [ ] Bundle size < 500KB (main chunk)
