/**
 * Services - Barrel Export
 * 
 * Centralized exports for all API services and clients.
 * Import services from this file for cleaner imports.
 * 
 * @example
 * import { api, adminService, abTestTracker } from '@/services';
 */

// =============================================================================
// Core API Client
// =============================================================================
export { default as api } from './api';

// =============================================================================
// Feature Services
// =============================================================================
export { adminService } from './adminService';
export { abTestTracker } from './abTestTracker';

// =============================================================================
// API Types
// =============================================================================
export * from './api/types';
