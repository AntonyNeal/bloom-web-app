/**
 * Bloom Design System - Design Tokens
 * 
 * TypeScript constants for use in JavaScript/TypeScript files.
 * For CSS usage, refer to Tailwind config or CSS variables in index.css.
 */

export const colors = {
  primary: {
    900: '#1a3d2e',
    700: '#2d5a47',
    500: '#4a7c5d',
    300: '#7ba88e',
    100: '#d4e7dc',
    50: '#f0f7f3',
  },
  secondary: {
    700: '#9d5a4a',
    500: '#c7826d',
    300: '#daa89a',
    100: '#f3e0d9',
    50: '#faf5f3',
  },
  accent: {
    700: '#b8860b',
    500: '#d4a574',
    300: '#e6c9a8',
    100: '#f5ebdc',
  },
  success: {
    700: '#2d6a4f',
    500: '#52b788',
    300: '#95d5b2',
    100: '#d8f3dc',
  },
  warning: {
    700: '#d97706',
    500: '#f59e0b',
    300: '#fbbf24',
    100: '#fef3c7',
  },
  error: {
    700: '#be123c',
    500: '#e11d48',
    300: '#fb7185',
    100: '#ffe4e6',
  },
  info: {
    700: '#0369a1',
    500: '#0ea5e9',
    300: '#7dd3fc',
    100: '#e0f2fe',
  },
  neutral: {
    950: '#1c1917',
    800: '#44403c',
    600: '#78716c',
    400: '#a8a29e',
    300: '#d6d3d1',
    200: '#e7e5e4',
    100: '#f5f5f4',
    50: '#fafaf9',
  },
  white: '#ffffff',
} as const;

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

export const borderRadius = {
  none: '0px',
  sm: '4px',
  default: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(68, 64, 60, 0.05)',
  default: '0 1px 3px 0 rgba(68, 64, 60, 0.08), 0 1px 2px 0 rgba(68, 64, 60, 0.06)',
  md: '0 4px 6px -1px rgba(68, 64, 60, 0.08), 0 2px 4px -1px rgba(68, 64, 60, 0.06)',
  lg: '0 10px 15px -3px rgba(68, 64, 60, 0.08), 0 4px 6px -2px rgba(68, 64, 60, 0.05)',
  xl: '0 20px 25px -5px rgba(68, 64, 60, 0.08), 0 10px 10px -5px rgba(68, 64, 60, 0.04)',
  '2xl': '0 25px 50px -12px rgba(68, 64, 60, 0.12)',
} as const;

export const typography = {
  fontFamily: {
    sans: "system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
    display: "system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
  },
  fontSize: {
    displayLg: '48px',
    displayMd: '40px',
    displaySm: '32px',
    h1: '32px',
    h2: '28px',
    h3: '24px',
    h4: '20px',
    h5: '18px',
    h6: '16px',
    bodyLg: '18px',
    body: '16px',
    bodySm: '14px',
    bodyXs: '12px',
  },
  lineHeight: {
    displayLg: '56px',
    displayMd: '48px',
    displaySm: '40px',
    h1: '40px',
    h2: '36px',
    h3: '32px',
    h4: '28px',
    h5: '24px',
    h6: '24px',
    bodyLg: '28px',
    body: '24px',
    bodySm: '20px',
    bodyXs: '16px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
  },
} as const;

export const animation = {
  duration: {
    instant: '100ms',
    fast: '150ms',
    normal: '200ms',
    moderate: '300ms',
    slow: '400ms',
    slower: '600ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Type exports for TypeScript autocomplete
export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
