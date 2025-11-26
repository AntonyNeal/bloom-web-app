/**
 * Database Version Control System - Module Index
 * 
 * Re-exports all DBVC components for easy importing.
 * 
 * @example
 * import { migrationService, MigrationService, Environment } from './db-version-control';
 */

// Types
export * from './types';

// Configuration
export * from './config';

// Services
export { MigrationService, migrationService } from './migration-service';
