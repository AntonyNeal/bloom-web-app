/**
 * Common Components - Barrel Export
 * 
 * Shared components used across multiple features in the Bloom application.
 * These components handle cross-cutting concerns like loading states,
 * error boundaries, and protected routes.
 * 
 * @example
 * import { ProtectedRoute, ErrorBoundary, LoadingState } from '@/components/common';
 */

// Route Protection
export { ProtectedRoute } from './ProtectedRoute';

// Error Handling
export { default as ErrorBoundary } from './ErrorBoundary';

// Loading & Empty States
export { default as LoadingState } from './LoadingState';
export { default as EmptyState } from './EmptyState';

// Error States
export { default as NetworkErrorState } from './NetworkErrorState';
export { default as ServerErrorState } from './ServerErrorState';

// UI Elements
export { BloomButton } from './BloomButton';
export { GardenGateButton } from './GardenGateButton';
export { TokenBalance } from './TokenBalance';
export { RevenueSplitIndicator } from './RevenueSplitIndicator';

// Qualification
export { QualificationCheck } from './QualificationCheck';
export type { QualificationData } from './QualificationCheck';

// Ambient Visuals
export { FloatingParticle, WatercolorBlob } from './ambient-helpers';
export type { FloatingParticleProps, WatercolorBlobProps } from './ambient-helpers';

// Page Transitions
export { PageTransition } from './PageTransition';
