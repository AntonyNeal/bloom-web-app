/**
 * Halaxy Sync Service - PLACEHOLDER
 * 
 * As of Dec 2024, all sync operations have been disabled.
 * The website now fetches data directly from Halaxy's public APIs at request time.
 * 
 * This service is retained as a placeholder for future sync operations if needed.
 */

import * as sql from 'mssql';
import { DatabaseService } from './database';
import { trackDependency } from '../telemetry';

export interface SyncResult {
  success: boolean;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  errors: SyncError[];
  durationMs: number;
  appointmentsSynced?: number;
  patientsSynced?: number;
  slotsSynced?: number;
}

export interface SyncError {
  entityType: string;
  entityId: string;
  message: string;
}

/**
 * Halaxy Sync Service - PLACEHOLDER
 * 
 * All sync operations are currently disabled. The website fetches data
 * directly from Halaxy's public APIs at request time.
 */
export class HalaxySyncService {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  /**
   * Placeholder sync - no operations performed
   * 
   * NOTE: All sync operations have been disabled as of Dec 2024.
   * - Availability: Fetched directly from Halaxy public API at request time
   * - Practitioner profile: Not currently needed
   * - Patient data: Not currently needed
   * - Appointments: Not currently needed
   * 
   * This method now just logs that the sync was called but takes no action.
   */
  async fullSync(halaxyPractitionerId: string): Promise<SyncResult> {
    const startTime = Date.now();

    console.log(`[SyncService] Sync called for practitioner: ${halaxyPractitionerId}`);
    console.log('[SyncService] NOTE: All sync operations are currently disabled');
    console.log('[SyncService] Data is fetched directly from Halaxy public APIs at request time');

    const durationMs = Date.now() - startTime;

    console.log(`[SyncService] ========== SYNC COMPLETED (NO-OP) ==========`);
    console.log(`[SyncService] Duration: ${durationMs}ms`);
    console.log(`[SyncService] Status: ✓ SUCCESS (placeholder)`);

    return {
      success: true,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      errors: [],
      durationMs,
      slotsSynced: 0,
    };
  }
}

export default HalaxySyncService;
