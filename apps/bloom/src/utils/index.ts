/**
 * Utility Functions - Barrel Export
 * 
 * Common utility functions used throughout the Bloom application.
 * 
 * @example
 * import { formatDate, formatCurrency, classNames } from '@/utils';
 */

// =============================================================================
// Date Formatting
// =============================================================================

/**
 * Format a date string for display
 * @param date - ISO date string or Date object
 * @param options - Intl.DateTimeFormat options
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', options);
}

/**
 * Format a time string for display
 * @param date - ISO date string or Date object
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a datetime for display
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return formatDate(d);
}

// =============================================================================
// Currency Formatting
// =============================================================================

/**
 * Format a number as Australian currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

// =============================================================================
// String Utilities
// =============================================================================

/**
 * Get initials from a name
 */
export function getInitials(name: string, maxLength = 2): string {
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, maxLength)
    .join('')
    .toUpperCase();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert string to title case
 */
export function toTitleCase(text: string): string {
  return text.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Australian phone number
 */
export function isValidAusPhone(phone: string): boolean {
  const phoneRegex = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate AHPRA registration number
 */
export function isValidAhpra(ahpra: string): boolean {
  const ahpraRegex = /^PSY\d{10}$/i;
  return ahpraRegex.test(ahpra);
}

// =============================================================================
// Object Utilities
// =============================================================================

/**
 * Remove undefined/null values from object
 */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null)
  ) as Partial<T>;
}

/**
 * Pick specific keys from object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {} as Pick<T, K>);
}

/**
 * Omit specific keys from object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const keysSet = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keysSet.has(key as K))
  ) as Omit<T, K>;
}

// =============================================================================
// Async Utilities
// =============================================================================

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
