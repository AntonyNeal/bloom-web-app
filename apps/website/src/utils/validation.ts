/**
 * Validation Utilities
 *
 * Common validation functions used throughout the application
 */

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (Australian format)
export function isValidPhone(phone: string): boolean {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Check for Australian mobile (04xx xxx xxx) or landline formats
  const mobileRegex = /^(\+61|0)4\d{8}$/;
  const landlineRegex = /^(\+61|0)[2378]\d{8}$/;

  return mobileRegex.test(cleaned) || landlineRegex.test(cleaned);
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Date validation
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// NDIS number validation
export function isValidNDISNumber(ndisNumber: string): boolean {
  // NDIS numbers are typically 9 digits
  const cleaned = ndisNumber.replace(/\s/g, '');
  return /^\d{9}$/.test(cleaned);
}

// Medicare number validation
export function isValidMedicareNumber(medicareNumber: string): boolean {
  // Medicare numbers are 10 digits (with optional reference number)
  const cleaned = medicareNumber.replace(/\s/g, '');
  return /^\d{10}$/.test(cleaned);
}

// String length validation
export function isValidLength(
  value: string,
  min: number,
  max?: number
): boolean {
  const length = value.trim().length;
  if (length < min) return false;
  if (max !== undefined && length > max) return false;
  return true;
}

// Required field validation
export function isRequired(value: string | undefined | null): boolean {
  if (value === undefined || value === null) return false;
  return value.trim().length > 0;
}

// Numeric validation
export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

// Alphanumeric validation
export function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value);
}

// Password strength validation
export interface PasswordStrength {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  messages: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const messages: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (password.length < 8) {
    messages.push('Password must be at least 8 characters');
  }

  if (!/[a-z]/.test(password)) {
    messages.push('Include at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    messages.push('Include at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    messages.push('Include at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    messages.push('Include at least one special character');
  }

  const isValid = messages.length === 0;

  if (isValid) {
    // Determine strength based on length and character variety
    const hasAllTypes =
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length >= 12 && hasAllTypes) {
      strength = 'strong';
    } else if (password.length >= 8) {
      strength = 'medium';
    }
  }

  return {
    isValid,
    strength,
    messages,
  };
}

// Form validation helper
export interface ValidationRule<T = string> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => boolean;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateForm<T extends Record<string, unknown>>(
  data: T,
  rules: Record<keyof T, ValidationRule>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const field in rules) {
    const value = String(data[field] || '');
    const rule = rules[field];

    if (rule.required && !isRequired(value)) {
      errors[field] = rule.message || 'This field is required';
      continue;
    }

    if (rule.minLength && !isValidLength(value, rule.minLength)) {
      errors[field] =
        rule.message || `Minimum length is ${rule.minLength} characters`;
      continue;
    }

    if (rule.maxLength && !isValidLength(value, 0, rule.maxLength)) {
      errors[field] =
        rule.message || `Maximum length is ${rule.maxLength} characters`;
      continue;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || 'Invalid format';
      continue;
    }

    if (rule.custom && !rule.custom(data[field] as string)) {
      errors[field] = rule.message || 'Validation failed';
      continue;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
