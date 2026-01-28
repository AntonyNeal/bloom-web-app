/**
 * Config - Barrel Export
 * 
 * Centralized exports for all configuration files.
 * Import config from this file for cleaner imports.
 * 
 * @example
 * import { 
 *   API_ENDPOINTS, 
 *   ROUTES, 
 *   BLOOM_COLORS, 
 *   APP_STATUS 
 * } from '@/config';
 */

// =============================================================================
// API Configuration
// =============================================================================
export { API_BASE_URL, API_ENDPOINTS } from './api';

// =============================================================================
// Authentication Configuration
// =============================================================================
export { 
  msalConfig, 
  loginRequest, 
  isAuthEnabled,
  graphConfig 
} from './authConfig';

// =============================================================================
// Route Configuration
// =============================================================================
export { 
  ROUTES, 
  ROUTE_CONFIG,
  getRoute, 
  isProtectedRoute, 
  isAdminRoute, 
  getBreadcrumbs 
} from './routes';
export type { RouteConfig } from './routes';

// =============================================================================
// Application Constants
// =============================================================================
export { 
  // Status constants
  APP_STATUS,
  SESSION_STATUS,
  QUALIFICATION_TYPE,
  LOCATION_TYPE,
  
  // Design system
  BLOOM_COLORS,
  
  // Messages
  ERROR_MESSAGES,
  LOADING_MESSAGES,
  
  // Animation
  ANIMATION_DURATION,
  
  // Responsive
  BREAKPOINTS,
  
  // Feature flags
  FEATURE_FLAGS,
} from './constants';

export type { 
  AppStatus, 
  SessionStatus, 
  QualificationType, 
  LocationType 
} from './constants';
