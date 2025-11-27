/**
 * Halaxy Sync Service - Main Export
 * 
 * Real-time synchronization between Halaxy Practice Management System
 * and Bloom's local database for fast dashboard rendering.
 * 
 * Architecture:
 * - Primary: Webhooks (real-time, ~1-5 second latency)
 * - Backup: Scheduled sync (every 15 minutes, catches missed events)
 * 
 * @see docs/HALAXY_SYNC_SERVICE.md - Full architecture specification
 * @see docs/HALAXY_SYNC_COMPLIANCE_GUIDE.md - Compliance requirements
 */

// Types
export * from './types';

// Token Management
export { 
  getAccessToken, 
  invalidateToken, 
  hasCredentials,
  getTokenStatus,
  getHalaxyConfig,
} from './token-manager';

// API Client
export { 
  HalaxyClient, 
  getHalaxyClient,
  HalaxyApiError,
} from './client';

// Entity Transformers
export {
  transformPractitioner,
  transformPatient,
  transformAppointment,
  mapAppointmentStatus,
  isCompletedStatus,
  isActiveStatus,
  extractIdFromReference,
  getPatientIdFromAppointment,
  getPractitionerIdFromAppointment,
} from './transformers';

// Sync Service
export { 
  HalaxySyncService, 
  getHalaxySyncService,
} from './sync-service';
