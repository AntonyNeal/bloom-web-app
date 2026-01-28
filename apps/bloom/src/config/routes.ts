/**
 * Route Configuration
 * 
 * Centralized route definitions for the Bloom application.
 * This file documents all routes and their properties for easy navigation.
 * 
 * @example
 * import { ROUTES, getRoute } from '@/config/routes';
 * 
 * // Navigate to a route
 * navigate(ROUTES.ADMIN.DASHBOARD);
 * 
 * // Get route with params
 * navigate(getRoute(ROUTES.ONBOARDING, { token: 'abc123' }));
 */

// =============================================================================
// Route Constants
// =============================================================================

/**
 * All application routes organized by feature area
 */
export const ROUTES = {
  // ─────────────────────────────────────────────────────────────────────────
  // Public Routes (no auth required)
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Home page - Dashboard (protected) */
  HOME: '/',
  
  /** Garden Gate - Original landing page */
  GARDEN: '/garden',
  
  /** Join Us - Application form for practitioners */
  JOIN_US: '/join-us',
  
  /** Auth callback - Azure AD redirect handler */
  AUTH_CALLBACK: '/auth/callback',
  
  /** Login redirect - Triggers Azure AD authentication */
  LOGIN: '/login',
  
  /** Design system test page */
  DESIGN_TEST: '/design-test',
  
  // Token-based public routes (no auth, use URL token)
  /** Onboarding - Token-based access for accepted practitioners */
  ONBOARDING: '/onboarding/:token',
  
  /** Accept Offer - Token-based offer acceptance */
  ACCEPT_OFFER: '/accept-offer/:token',
  
  /** Schedule Interview - Token-based interview scheduling */
  SCHEDULE_INTERVIEW: '/schedule-interview/:token',
  
  /** Interview Room - Token-based video interview */
  INTERVIEW: '/interview/:token',
  
  /** Patient Join Session - Token-based session join */
  PATIENT_JOIN: '/join/:token',
  
  /** Patient Join Session (query param variant) */
  PATIENT_JOIN_QUERY: '/join',
  
  // ─────────────────────────────────────────────────────────────────────────
  // Authenticated Routes (require Azure AD login)
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Bloom Homepage - Main authenticated home */
  BLOOM_HOME: '/bloom-home',
  
  /** Business Coach - AI-assisted business guidance */
  BUSINESS_COACH: '/business-coach',
  
  /** Notes History - Past session notes */
  NOTES: '/notes',
  
  /** Note Detail - Single note view */
  NOTE_DETAIL: '/notes/:id',
  
  /** Client Profile - Client details and history */
  CLIENT_PROFILE: '/client/:clientId',
  
  /** Clinician Calendar - Week view schedule */
  CALENDAR: '/calendar',
  
  /** Practice Management - Standalone clinic dashboard */
  PRACTICE: '/practice',
  
  /** Session Router - Entry point for telehealth */
  SESSION: '/session',
  
  /** Telehealth Session - Active video call */
  SESSION_ACTIVE: '/session/:appointmentId',
  
  // ─────────────────────────────────────────────────────────────────────────
  // Admin Routes (require admin role)
  // ─────────────────────────────────────────────────────────────────────────
  
  ADMIN: {
    /** Admin root - Redirects to dashboard */
    ROOT: '/admin',
    
    /** Admin Dashboard - Main admin view */
    DASHBOARD: '/admin/dashboard',
    
    /** Legacy Dashboard - Old admin dashboard */
    LEGACY_DASHBOARD: '/admin/legacy-dashboard',
    
    /** Application Management - List all applications */
    APPLICATIONS: '/admin/applications',
    
    /** Application Detail - Single application view */
    APPLICATION_DETAIL: '/admin/applications/:id',
    
    /** Interview Management - Manage interviews */
    INTERVIEWS: '/admin/interviews',
    
    /** A/B Test Dashboard - Experiment management */
    AB_TESTS: '/admin/ab-tests',
    
    /** Smoke Tests - API health checks */
    SMOKE_TESTS: '/admin/smoke-tests',
    
    /** Practitioner Management - Manage practitioners */
    PRACTITIONERS: '/admin/practitioners',
  },
  
  /** Bloom portal - Existing practitioners (redirects to admin dashboard) */
  BLOOM: '/bloom',
} as const;

// =============================================================================
// Route Metadata
// =============================================================================

/**
 * Route metadata for documentation and validation
 */
export interface RouteConfig {
  path: string;
  title: string;
  description: string;
  authRequired: boolean;
  adminOnly?: boolean;
  tokenRequired?: boolean;
}

/**
 * Route metadata registry
 * Used for generating navigation, breadcrumbs, and documentation
 */
export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  [ROUTES.HOME]: {
    path: ROUTES.HOME,
    title: 'Welcome to Bloom',
    description: 'Landing page for Life Psychology Australia\'s practitioner platform',
    authRequired: false,
  },
  [ROUTES.JOIN_US]: {
    path: ROUTES.JOIN_US,
    title: 'Join Bloom',
    description: 'Apply to become a practitioner in the Bloom network',
    authRequired: false,
  },
  [ROUTES.BLOOM_HOME]: {
    path: ROUTES.BLOOM_HOME,
    title: 'Bloom Home',
    description: 'Clinician dashboard home',
    authRequired: true,
  },
  [ROUTES.ADMIN.DASHBOARD]: {
    path: ROUTES.ADMIN.DASHBOARD,
    title: 'Admin Dashboard',
    description: 'Administrative overview and management',
    authRequired: true,
    adminOnly: true,
  },
  [ROUTES.ADMIN.APPLICATIONS]: {
    path: ROUTES.ADMIN.APPLICATIONS,
    title: 'Application Management',
    description: 'Review and manage practitioner applications',
    authRequired: true,
    adminOnly: true,
  },
  [ROUTES.CALENDAR]: {
    path: ROUTES.CALENDAR,
    title: 'Calendar',
    description: 'Weekly schedule view',
    authRequired: true,
  },
  [ROUTES.SESSION]: {
    path: ROUTES.SESSION,
    title: 'Session',
    description: 'Telehealth session entry point',
    authRequired: true,
  },
};

// =============================================================================
// Route Helpers
// =============================================================================

/**
 * Generate a route with parameters
 * 
 * @param route - Route template with :param placeholders
 * @param params - Object with parameter values
 * @returns Formatted route string
 * 
 * @example
 * getRoute('/onboarding/:token', { token: 'abc123' })
 * // Returns: '/onboarding/abc123'
 */
export function getRoute(
  route: string,
  params: Record<string, string | number>
): string {
  let result = route;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, String(value));
  }
  return result;
}

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  const config = ROUTE_CONFIG[path];
  return config?.authRequired ?? false;
}

/**
 * Check if a route is admin-only
 */
export function isAdminRoute(path: string): boolean {
  const config = ROUTE_CONFIG[path];
  return config?.adminOnly ?? false;
}

/**
 * Get breadcrumb trail for a route
 */
export function getBreadcrumbs(path: string): Array<{ label: string; path: string }> {
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; path: string }> = [
    { label: 'Home', path: '/' },
  ];
  
  let currentPath = '';
  for (const part of parts) {
    currentPath += `/${part}`;
    const config = ROUTE_CONFIG[currentPath];
    if (config) {
      breadcrumbs.push({ label: config.title, path: currentPath });
    }
  }
  
  return breadcrumbs;
}
