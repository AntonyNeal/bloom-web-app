/**
 * Manual Halaxy Sync Trigger
 * 
 * HTTP endpoint to manually trigger a full Halaxy sync.
 * Useful for testing and immediate sync needs.
 * 
 * POST /api/halaxy/sync
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getHalaxySyncService } from '../services/halaxy/sync-service';
import { getDbConnection } from '../services/database';
import * as sql from 'mssql';
import crypto from 'crypto';

/**
 * Get all active practitioners that need syncing
 * If none exist, bootstrap from HALAXY_PRACTITIONER_ID env var
 */
async function getActivePractitioners(context: InvocationContext): Promise<Array<{ id: string; halaxy_practitioner_id: string }>> {
  try {
    const pool = await getDbConnection();
    
    const result = await pool.request()
      .query<{ id: string; halaxy_practitioner_id: string }>(`
        SELECT id, halaxy_practitioner_id 
        FROM practitioners 
        WHERE is_active = 1
      `);

    // If we have practitioners, return them
    if (result.recordset.length > 0) {
      return result.recordset;
    }

    // Bootstrap: Create practitioner from env var if none exist
    const halaxyPractitionerId = process.env.HALAXY_PRACTITIONER_ID;
    if (halaxyPractitionerId) {
      context.log(`[TriggerSync] No practitioners found, bootstrapping from HALAXY_PRACTITIONER_ID: ${halaxyPractitionerId}`);
      
      const newId = crypto.randomUUID();
      await pool.request()
        .input('id', sql.UniqueIdentifier, newId)
        .input('halaxyPractitionerId', sql.NVarChar, halaxyPractitionerId)
        .query(`
          INSERT INTO practitioners (
            id, halaxy_practitioner_id, first_name, last_name, display_name,
            is_active, created_at, updated_at
          ) VALUES (
            @id, @halaxyPractitionerId, 'Pending', 'Sync', 'Pending Sync',
            1, GETUTCDATE(), GETUTCDATE()
          )
        `);
      
      context.log(`[TriggerSync] Bootstrapped practitioner ${newId} with Halaxy ID ${halaxyPractitionerId}`);
      return [{ id: newId, halaxy_practitioner_id: halaxyPractitionerId }];
    }

    return [];
  } catch (error) {
    console.log('[TriggerSync] Could not fetch practitioners:', error);
    return [];
  }
}

async function triggerHalaxySyncHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const startTime = Date.now();
  
  context.log('[TriggerSync] Manual sync triggered');

  // Check if Halaxy credentials are configured
  if (!process.env.HALAXY_CLIENT_ID || !process.env.HALAXY_CLIENT_SECRET) {
    return {
      status: 503,
      jsonBody: { 
        error: 'Halaxy credentials not configured',
        configured: {
          HALAXY_CLIENT_ID: !!process.env.HALAXY_CLIENT_ID,
          HALAXY_CLIENT_SECRET: !!process.env.HALAXY_CLIENT_SECRET,
        }
      }
    };
  }

  try {
    const practitioners = await getActivePractitioners(context);
    
    if (practitioners.length === 0) {
      return {
        status: 200,
        jsonBody: { 
          message: 'No active practitioners found. Set HALAXY_PRACTITIONER_ID to bootstrap.',
          practitioners: 0,
          duration: Date.now() - startTime
        }
      };
    }

    context.log(`[TriggerSync] Syncing ${practitioners.length} practitioner(s)`);

    const syncService = getHalaxySyncService();
    const results: Array<{ 
      practitionerId: string; 
      halaxyId: string;
      success: boolean; 
      recordsProcessed?: number;
      duration?: number;
      error?: string 
    }> = [];

    for (const practitioner of practitioners) {
      try {
        const result = await syncService.fullSync(practitioner.halaxy_practitioner_id);
        
        results.push({
          practitionerId: practitioner.id,
          halaxyId: practitioner.halaxy_practitioner_id,
          success: result.success,
          recordsProcessed: result.recordsProcessed,
          duration: result.duration,
        });

        context.log(
          `[TriggerSync] Synced practitioner ${practitioner.id}: ` +
          `${result.recordsProcessed} records in ${result.duration}ms`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        results.push({
          practitionerId: practitioner.id,
          halaxyId: practitioner.halaxy_practitioner_id,
          success: false,
          error: errorMessage,
        });

        context.error(
          `[TriggerSync] Failed to sync practitioner ${practitioner.id}:`,
          error
        );
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    return {
      status: 200,
      jsonBody: {
        message: `Sync completed: ${successCount}/${practitioners.length} successful`,
        totalDuration: duration,
        practitioners: results
      }
    };

  } catch (error) {
    context.error('[TriggerSync] Sync failed:', error);
    return {
      status: 500,
      jsonBody: { 
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Register the Azure Function HTTP trigger
app.http('triggerHalaxySync', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'halaxy/sync',
  handler: triggerHalaxySyncHandler,
});

export default triggerHalaxySyncHandler;
