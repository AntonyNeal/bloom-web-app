/**
 * Custom Hooks - Barrel Export
 * 
 * Centralized exports for all custom React hooks.
 * Import hooks from this file for cleaner imports.
 * 
 * @example
 * // Instead of multiple imports:
 * import { useAuth } from '@/hooks/useAuth';
 * import { useToast } from '@/hooks/use-toast';
 * import { useDashboard } from '@/hooks/useDashboard';
 * 
 * // Use:
 * import { useAuth, useToast, useDashboard, useWeather } from '@/hooks';
 */

// =============================================================================
// Authentication
// =============================================================================
export { useAuth } from './useAuth';

// =============================================================================
// UI & Feedback
// =============================================================================
export { useToast, toast } from './use-toast';
export type { Toast } from './use-toast';

// =============================================================================
// Data Fetching
// =============================================================================
export { useDashboard } from './useDashboard';
export { useWeather, getWeatherEffects } from './useWeather';
export type { WeatherData } from './useWeather';

// =============================================================================
// Session Recording
// =============================================================================
export { useSessionRecording } from './useSessionRecording';

// =============================================================================
// Responsive & Device
// =============================================================================
export { useIsMobile } from './use-is-mobile';

// =============================================================================
// Accessibility & Animation
// =============================================================================
export { useReducedMotion } from './useReducedMotion';
export { useScrollAnimation } from './useScrollAnimation';
