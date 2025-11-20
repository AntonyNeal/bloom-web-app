# @shared/utils

Common utility functions for the Life Psychology monorepo.

## Installation

Automatically linked in the workspace. To use in an app:

```bash
pnpm --filter your-app add @shared/utils
```

## Usage

```typescript
import { cn } from '@shared/utils';

const className = cn(
  "base-class",
  condition && "conditional-class",
  { "variant-class": variant === 'primary' }
);
```

## Available Utilities

### cn (Class Name Utility)

Combines Tailwind CSS classes intelligently, handling conflicts and conditionals.

```typescript
import { cn } from '@shared/utils';

// Basic usage
cn("text-red-500", "bg-blue-500")
// → "text-red-500 bg-blue-500"

// Conditional classes
cn(
  "base-class",
  isActive && "active-class",
  !isActive && "inactive-class"
)

// Object syntax
cn({
  "visible": isVisible,
  "hidden": !isVisible
})

// Override Tailwind classes (last one wins)
cn("text-red-500", "text-blue-500")
// → "text-blue-500"
```

## Adding New Utilities

Create utility files in `src/`:

```typescript
// src/formatters.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-AU');
}

export function formatPhone(phone: string): string {
  // Format phone number (AU format)
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
}
```

Export from `src/index.ts`:

```typescript
export { cn } from './cn';
export { formatCurrency, formatDate, formatPhone } from './formatters';
```

## Planned Utilities

### Logger
Structured logging utility (currently in apps, should be moved here):

```typescript
import { log } from '@shared/utils';

log.debug('Debug message', 'ComponentName', data);
log.info('Info message', 'ComponentName', data);
log.warn('Warning message', 'ComponentName', data);
log.error('Error message', 'ComponentName', error);
```

### Validators
Common validation functions:

```typescript
import { isValidEmail, isValidPhone, isValidABN } from '@shared/utils';

if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}
```

### Formatters
Data formatting utilities:

```typescript
import { formatCurrency, formatDate, formatPhone } from '@shared/utils';

const price = formatCurrency(99.95); // "$99.95"
const date = formatDate(new Date()); // "20/11/2025"
const phone = formatPhone('0412345678'); // "0412 345 678"
```

### Constants
Shared constants:

```typescript
import { API_TIMEOUT, MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from '@shared/utils';

const config = {
  timeout: API_TIMEOUT,
  maxUploadSize: MAX_FILE_SIZE,
};
```

## Dependencies

- `clsx` - Class name utility
- `tailwind-merge` - Tailwind class merging

## Development

```bash
# Type check
pnpm --filter @shared/utils type-check

# No build needed - imported directly from source
```

## Guidelines

- **Pure functions**: No side effects
- **Typed**: Full TypeScript support
- **Tested**: Add unit tests for complex logic
- **Documented**: JSDoc comments for all exports
- **Tree-shakeable**: Export individual functions

## Example: Adding Validation Utils

```typescript
// src/validators.ts

/**
 * Validates Australian email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates Australian mobile phone number
 */
export function isValidMobilePhone(phone: string): boolean {
  const phoneRegex = /^(?:\+?61|0)4\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validates Australian Business Number (ABN)
 */
export function isValidABN(abn: string): boolean {
  const cleaned = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(cleaned)) return false;
  
  // ABN validation algorithm
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = cleaned.split('').map(Number);
  digits[0] -= 1;
  
  const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  return sum % 89 === 0;
}

/**
 * Validates AHPRA registration number
 */
export function isValidAHPRA(number: string): boolean {
  // AHPRA format: 3 letters + 10 digits
  const ahpraRegex = /^[A-Z]{3}\d{10}$/;
  return ahpraRegex.test(number.replace(/\s/g, ''));
}
```

Export and use:

```typescript
// src/index.ts
export * from './validators';

// In your app
import { isValidEmail, isValidABN } from '@shared/utils';

if (!isValidEmail(email)) {
  setError('Invalid email address');
}
```

---

**Version**: 1.0.0  
**Status**: Active Development
