/**
 * Halaxy Sync Service for Container Apps Worker
 * 
 * This is a wrapper around the core sync logic that can run
 * independently of Azure Functions.
 * 
 * NOTE: As of Dec 2024, availability slot sync has been disabled.
 * The website now fetches availability directly from Halaxy's public API
 * at request time (via the get-halaxy-availability Azure Function).
 * 
 * This service is now a placeholder for future sync operations.
 */

import * as sql from 'mssql';
import { DatabaseService } from './database';
import { HalaxyClient, FHIRSlot, FHIRAppointment } from './halaxy-client';
import { trackDependency } from '../telemetry';

// Note: FHIRSlot and FHIRAppointment are imported for the disabled availability sync methods
// They can be removed entirely if those methods are deleted

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

// FHIR-compatible types
interface FhirHumanName {
  given?: string[];
  family?: string;
}

interface FhirTelecom {
  system?: string;
  value?: string;
}

interface FhirPatient {
  id: string;
  name?: FhirHumanName[];
  telecom?: FhirTelecom[];
  birthDate?: string;
}

interface FhirParticipant {
  actor?: {
    reference?: string;
  };
}

interface FhirAppointment {
  id: string;
  start?: string;
  end?: string;
  status?: string;
  description?: string;
  participant?: FhirParticipant[];
}

/**
 * Halaxy Sync Service
 * 
 * Performs full synchronization of practitioners, clients, and sessions
 * from Halaxy to the Bloom database.
 */
export class HalaxySyncService {
  private client: HalaxyClient;
  private db: DatabaseService;

  constructor() {
    this.client = new HalaxyClient();
    this.db = DatabaseService.getInstance();
  }

  /**
   * Perform full sync for a practitioner
   * 
   * NOTE: Availability slot sync has been disabled as of Dec 2024.
   * The website now fetches availability directly from Halaxy's public API
   * at request time (via the get-halaxy-availability Azure Function).
   * 
   * This service is now a placeholder for future sync operations such as:
   * - Patient data sync
   * - Appointment history sync
   * - Other Halaxy data that should be cached in our database
   */
  async fullSync(halaxyPractitionerId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    const recordsCreated = 0;
    let recordsUpdated = 0;
    const recordsDeleted = 0;

    console.log(`[SyncService] Starting sync for practitioner: ${halaxyPractitionerId}`);

    try {
      const pool = await this.db.getSqlPool();

      // 1. Sync practitioner profile
      console.log('[SyncService] Step 1: Syncing practitioner profile');
      const practitioner = await this.syncPractitioner(pool, halaxyPractitionerId);
      if (!practitioner) {
        throw new Error(`Practitioner ${halaxyPractitionerId} not found in Halaxy`);
      }
      recordsUpdated++;

      // 2. Patient sync disabled - not needed at this time
      console.log('[SyncService] Step 2: Skipping patient sync (disabled)');

      // 3. Appointment sync disabled - not needed at this time
      console.log('[SyncService] Step 3: Skipping appointment sync (disabled)');

      // 4. Availability slot sync DISABLED
      // Availability is now fetched directly from Halaxy's public API at request time
      // via the get-halaxy-availability Azure Function. No need to sync to database.
      console.log('[SyncService] Step 4: Skipping availability sync (now using Halaxy public API directly)');

      // 5. Log sync completion
      const durationMs = Date.now() - startTime;
      
      await this.db.logSync({
        practitionerId: practitioner.id,
        syncType: 'full',
        recordsProcessed: recordsCreated + recordsUpdated,
        errors: errors.length,
        duration: durationMs,
        status: errors.length === 0 ? 'success' : 'failure',
      });

      console.log(`[SyncService] ========== SYNC COMPLETED ==========`);
      console.log(`[SyncService] Duration: ${durationMs}ms`);
      console.log(`[SyncService] Records updated: ${recordsUpdated}`);
      console.log(`[SyncService] Errors: ${errors.length}`);
      console.log(`[SyncService] Status: ${errors.length === 0 ? '✓ SUCCESS' : '✗ FAILURE'}`);

      return {
        success: errors.length === 0,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        errors,
        durationMs,
        slotsSynced: 0,
      };

    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('[SyncService] Sync failed:', error);

      return {
        success: false,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        errors: [{
          entityType: 'sync',
          entityId: halaxyPractitionerId,
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
        durationMs,
        slotsSynced: 0,
      };
    }
  }

  // ============================================================================
  // Practitioner Sync
  // ============================================================================

  private async syncPractitioner(
    pool: sql.ConnectionPool,
    halaxyPractitionerId: string
  ): Promise<{ id: string } | null> {
    const startTime = Date.now();

    try {
      const practitioner = await this.client.getPractitioner(halaxyPractitionerId);
      
      // Extract name from FHIR resource
      const name = practitioner.name?.[0];
      const firstName = name?.given?.join(' ') || '';
      const lastName = name?.family || '';
      // Use NULL for missing emails to avoid unique constraint violations on empty strings
      const emailValue = practitioner.telecom?.find(t => t.system === 'email')?.value;
      const email = emailValue && emailValue.trim() ? emailValue.trim() : null;

      // Upsert practitioner using OUTPUT INTO to handle tables with triggers
      const result = await pool.request()
        .input('halaxyId', sql.VarChar, halaxyPractitionerId)
        .input('firstName', sql.NVarChar, firstName)
        .input('lastName', sql.NVarChar, lastName)
        .input('email', sql.VarChar, email)
        .query(`
          DECLARE @OutputTable TABLE (id UNIQUEIDENTIFIER);
          
          MERGE INTO practitioners AS target
          USING (SELECT @halaxyId AS halaxy_practitioner_id) AS source
          ON target.halaxy_practitioner_id = source.halaxy_practitioner_id
          WHEN MATCHED THEN
            UPDATE SET 
              first_name = @firstName,
              last_name = @lastName,
              email = COALESCE(NULLIF(@email, ''), target.email),
              updated_at = GETUTCDATE(),
              last_synced_at = GETUTCDATE()
          WHEN NOT MATCHED THEN
            INSERT (halaxy_practitioner_id, first_name, last_name, display_name, email, status, created_at, updated_at, last_synced_at)
            VALUES (@halaxyId, @firstName, @lastName, CONCAT(@firstName, ' ', @lastName), NULLIF(@email, ''), 'active', GETUTCDATE(), GETUTCDATE(), GETUTCDATE())
          OUTPUT inserted.id INTO @OutputTable;
          
          SELECT id FROM @OutputTable;
        `);

      trackDependency('SQL', 'syncPractitioner', 'MERGE practitioners', Date.now() - startTime, true);

      return result.recordset[0] || null;

    } catch (error) {
      trackDependency('SQL', 'syncPractitioner', 'MERGE practitioners', Date.now() - startTime, false);
      throw error;
    }
  }

  // ============================================================================
  // Client Sync
  // ============================================================================

  private async syncClient(
    pool: sql.ConnectionPool,
    patient: FhirPatient,
    practitionerId: string
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const name = patient.name?.[0];
      const firstName = name?.given?.join(' ') || '';
      const lastName = name?.family || '';
      const email = patient.telecom?.find((t: FhirTelecom) => t.system === 'email')?.value || null;
      const phone = patient.telecom?.find((t: FhirTelecom) => t.system === 'phone')?.value || null;
      const birthDate = patient.birthDate || null;
      // Generate initials from first and last name (required field)
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'XX';

      const result = await pool.request()
        .input('halaxyPatientId', sql.VarChar, patient.id)
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .input('firstName', sql.NVarChar, firstName)
        .input('lastName', sql.NVarChar, lastName)
        .input('initials', sql.NVarChar, initials)
        .input('email', sql.VarChar, email)
        .input('phone', sql.VarChar, phone)
        .input('birthDate', sql.Date, birthDate ? new Date(birthDate) : null)
        .query(`
          DECLARE @OutputTable TABLE (id UNIQUEIDENTIFIER);
          
          MERGE INTO clients AS target
          USING (SELECT @halaxyPatientId AS halaxy_patient_id, @practitionerId AS practitioner_id) AS source
          ON target.halaxy_patient_id = source.halaxy_patient_id
            AND target.practitioner_id = source.practitioner_id
          WHEN MATCHED THEN
            UPDATE SET
              first_name = @firstName,
              last_name = @lastName,
              initials = @initials,
              email = COALESCE(@email, target.email),
              phone = COALESCE(@phone, target.phone),
              date_of_birth = COALESCE(@birthDate, target.date_of_birth),
              updated_at = GETUTCDATE(),
              last_synced_at = GETUTCDATE()
          WHEN NOT MATCHED THEN
            INSERT (halaxy_patient_id, practitioner_id, first_name, last_name, initials, email, phone, date_of_birth, status, created_at, updated_at, last_synced_at)
            VALUES (@halaxyPatientId, @practitionerId, @firstName, @lastName, @initials, @email, @phone, @birthDate, 'active', GETUTCDATE(), GETUTCDATE(), GETUTCDATE())
          OUTPUT inserted.id INTO @OutputTable;
          
          SELECT id FROM @OutputTable;
        `);

      trackDependency('SQL', 'syncClient', 'MERGE clients', Date.now() - startTime, true);

      return result.recordset[0]?.id;

    } catch (error) {
      trackDependency('SQL', 'syncClient', 'MERGE clients', Date.now() - startTime, false);
      throw error;
    }
  }

  // ============================================================================
  // Session Sync
  // ============================================================================

  private async syncSession(
    pool: sql.ConnectionPool,
    appointment: FhirAppointment,
    practitionerId: string,
    clientId: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const startDateTime = appointment.start ? new Date(appointment.start) : null;
      const endDateTime = appointment.end ? new Date(appointment.end) : null;
      const status = this.mapAppointmentStatus(appointment.status || 'pending');
      const description = appointment.description || null;

      await pool.request()
        .input('halaxyAppointmentId', sql.VarChar, appointment.id)
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .input('clientId', sql.UniqueIdentifier, clientId)
        .input('startDateTime', sql.DateTime2, startDateTime)
        .input('endDateTime', sql.DateTime2, endDateTime)
        .input('status', sql.VarChar, status)
        .input('description', sql.NVarChar, description)
        .query(`
          MERGE INTO sessions AS target
          USING (SELECT @halaxyAppointmentId AS halaxy_appointment_id) AS source
          ON target.halaxy_appointment_id = source.halaxy_appointment_id
          WHEN MATCHED THEN
            UPDATE SET
              practitioner_id = @practitionerId,
              client_id = @clientId,
              scheduled_start_time = @startDateTime,
              scheduled_end_time = @endDateTime,
              status = @status,
              notes = COALESCE(@description, target.notes),
              updated_at = GETUTCDATE(),
              last_synced_at = GETUTCDATE()
          WHEN NOT MATCHED THEN
            INSERT (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, status, notes, created_at, updated_at, last_synced_at)
            VALUES (@halaxyAppointmentId, @practitionerId, @clientId, @startDateTime, @endDateTime, @status, @description, GETUTCDATE(), GETUTCDATE(), GETUTCDATE());
        `);

      trackDependency('SQL', 'syncSession', 'MERGE sessions', Date.now() - startTime, true);

    } catch (error) {
      trackDependency('SQL', 'syncSession', 'MERGE sessions', Date.now() - startTime, false);
      throw error;
    }
  }

  // ============================================================================
  // Availability Slot Sync - DISABLED
  // These methods are retained for future use but are not currently called.
  // Availability is now fetched directly from Halaxy's public API at request time.
  // ============================================================================

  /**
   * Subtract booked appointments from availability slots.
   * This splits large availability blocks into smaller free slots by removing
   * time periods that have appointments booked.
   * 
   * For example, if a slot is 8am-5pm but there's a 10am-11am appointment,
   * this returns two slots: 8am-10am and 11am-5pm.
   * 
   * Generated slot IDs use the format: {originalSlotId}_{fragmentIndex}
   * 
   * @deprecated This method is no longer used as availability is fetched directly from Halaxy
   */
  private subtractAppointmentsFromSlots(
    slots: FHIRSlot[],
    appointments: FHIRAppointment[]
  ): FHIRSlot[] {
    const result: FHIRSlot[] = [];
    
    for (const slot of slots) {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      
      // Find appointments that overlap with this slot
      const overlappingApts = appointments.filter(apt => {
        if (!apt.start || !apt.end) return false;
        const aptStart = new Date(apt.start);
        const aptEnd = new Date(apt.end);
        // Overlap if appointment starts before slot ends AND appointment ends after slot starts
        return aptStart < slotEnd && aptEnd > slotStart;
      });
      
      if (overlappingApts.length === 0) {
        // No overlapping appointments, keep the slot as-is
        result.push(slot);
        continue;
      }
      
      // Sort appointments by start time
      overlappingApts.sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime());
      
      // Split the slot around the appointments
      let currentStart = slotStart;
      let fragmentIndex = 0;
      
      for (const apt of overlappingApts) {
        const aptStart = new Date(apt.start!);
        const aptEnd = new Date(apt.end!);
        
        // If there's a gap before this appointment, create a free slot
        if (aptStart > currentStart) {
          const fragmentSlot: FHIRSlot = {
            ...slot,
            id: `${slot.id}_${fragmentIndex}`,
            start: currentStart.toISOString(),
            end: aptStart.toISOString(),
          };
          
          // Only add if the fragment is at least 15 minutes (meaningful slot)
          const fragmentDuration = (aptStart.getTime() - currentStart.getTime()) / (1000 * 60);
          if (fragmentDuration >= 15) {
            result.push(fragmentSlot);
            fragmentIndex++;
          }
        }
        
        // Move current start to end of appointment
        if (aptEnd > currentStart) {
          currentStart = aptEnd;
        }
      }
      
      // If there's time remaining after all appointments, create a final slot
      if (currentStart < slotEnd) {
        const fragmentSlot: FHIRSlot = {
          ...slot,
          id: `${slot.id}_${fragmentIndex}`,
          start: currentStart.toISOString(),
          end: slotEnd.toISOString(),
        };
        
        // Only add if the fragment is at least 15 minutes
        const fragmentDuration = (slotEnd.getTime() - currentStart.getTime()) / (1000 * 60);
        if (fragmentDuration >= 15) {
          result.push(fragmentSlot);
        }
      }
    }
    
    return result;
  }

  /**
   * Clean up old/past availability slots to prevent table bloat
   */
  private async cleanupOldSlots(
    pool: sql.ConnectionPool,
    practitionerId: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await pool.request()
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .query(`
          DELETE FROM availability_slots
          WHERE practitioner_id = @practitionerId
            AND slot_start < GETUTCDATE()
        `);

      trackDependency('SQL', 'cleanupOldSlots', 'DELETE availability_slots', Date.now() - startTime, true);
    } catch (error) {
      trackDependency('SQL', 'cleanupOldSlots', 'DELETE availability_slots', Date.now() - startTime, false);
      // Non-critical error, log and continue
      console.warn('[SyncService] Failed to cleanup old slots:', error);
    }
  }

  /**
   * Reconcile practitioner slots by deleting entries no longer returned by Halaxy.
   * This handles all cleanup including weekend slots (since Halaxy won't return them).
   */
  private async reconcilePractitionerSlots(
    pool: sql.ConnectionPool,
    practitionerId: string,
    slots: FHIRSlot[]
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const slotIdsJson = JSON.stringify(slots.map((slot) => slot.id));

      const result = await pool.request()
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .input('slotIdsJson', sql.NVarChar(sql.MAX), slotIdsJson)
        .query(`
          WITH slot_ids AS (
            SELECT value AS slot_id FROM OPENJSON(@slotIdsJson)
          )
          DELETE a
          FROM availability_slots a
          LEFT JOIN slot_ids s ON a.halaxy_slot_id = s.slot_id
          WHERE a.practitioner_id = @practitionerId
            AND a.slot_start >= GETUTCDATE()
            AND s.slot_id IS NULL;
        `);

      const deletedCount = result.rowsAffected[0] || 0;
      if (deletedCount > 0) {
        console.log(`[SyncService] Deleted ${deletedCount} stale slots for practitioner ${practitionerId}`);

      }

      trackDependency(
        'SQL',
        'reconcilePractitionerSlots',
        'DELETE availability_slots',
        Date.now() - startTime,
        true
      );
    } catch (error) {
      trackDependency(
        'SQL',
        'reconcilePractitionerSlots',
        'DELETE availability_slots',
        Date.now() - startTime,
        false
      );
      console.warn('[SyncService] Failed to reconcile practitioner slots:', error);
    }
  }

  /**
   * Sync a single availability slot from Halaxy
   */
  private async syncSlot(
    pool: sql.ConnectionPool,
    slot: FHIRSlot,
    practitionerId: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      const durationMinutes = Math.round((slotEnd.getTime() - slotStart.getTime()) / (1000 * 60));
      
      // Convert to Unix timestamps (seconds since epoch)
      const slotStartUnix = Math.floor(slotStart.getTime() / 1000);
      const slotEndUnix = Math.floor(slotEnd.getTime() / 1000);
      
      // Extract schedule ID from reference if available
      const scheduleId = slot.schedule?.reference?.replace('Schedule/', '') || null;
      
      // Extract service category if available
      const serviceCategory = slot.serviceCategory?.[0]?.text || 
                             slot.serviceCategory?.[0]?.coding?.[0]?.display || 
                             null;
      
      // Determine location type from service type or extensions
      const locationType = this.extractLocationType(slot);
      
      // Log slot being synced
      const startTimeAU = slotStart.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
      const endTimeAU = slotEnd.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
      console.log(`[SyncService]   → Inserting slot: ${slotStart.toISOString().split('T')[0]} ${startTimeAU}–${endTimeAU} (${durationMinutes}min, ID: ${slot.id})`);

      // Slots from $find don't have status field - they are available by definition
      // Default to 'free' if status is not present
      const slotStatus = slot.status || 'free';
      const isBookable = slotStatus === 'free' ? 1 : 0;

      await pool.request()
        .input('halaxySlotId', sql.NVarChar, slot.id)
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .input('slotStartUnix', sql.BigInt, slotStartUnix)
        .input('slotEndUnix', sql.BigInt, slotEndUnix)
        .input('durationMinutes', sql.Int, durationMinutes)
        .input('status', sql.NVarChar, slotStatus)
        .input('scheduleId', sql.NVarChar, scheduleId)
        .input('locationType', sql.NVarChar, locationType)
        .input('serviceCategory', sql.NVarChar, serviceCategory)
        .input('isBookable', sql.Bit, isBookable)
        .query(`
          MERGE INTO availability_slots AS target
          USING (SELECT @halaxySlotId AS halaxy_slot_id) AS source
          ON target.halaxy_slot_id = source.halaxy_slot_id
          WHEN MATCHED THEN
            UPDATE SET
              practitioner_id = @practitionerId,
              slot_start_unix = @slotStartUnix,
              slot_end_unix = @slotEndUnix,
              duration_minutes = @durationMinutes,
              status = @status,
              halaxy_schedule_id = @scheduleId,
              location_type = @locationType,
              service_category = @serviceCategory,
              is_bookable = @isBookable,
              updated_at = GETUTCDATE(),
              last_synced_at = GETUTCDATE()
          WHEN NOT MATCHED THEN
            INSERT (
              halaxy_slot_id, practitioner_id, slot_start_unix, slot_end_unix, 
              duration_minutes, status, halaxy_schedule_id, location_type, 
              service_category, is_bookable, created_at, updated_at, last_synced_at
            )
            VALUES (
              @halaxySlotId, @practitionerId, @slotStartUnix, @slotEndUnix,
              @durationMinutes, @status, @scheduleId, @locationType,
              @serviceCategory, @isBookable, GETUTCDATE(), GETUTCDATE(), GETUTCDATE()
            );
        `);

      trackDependency('SQL', 'syncSlot', 'MERGE availability_slots', Date.now() - startTime, true);
      console.log(`[SyncService]   ✓ Synced (${Date.now() - startTime}ms)`);

    } catch (error) {
      trackDependency('SQL', 'syncSlot', 'MERGE availability_slots', Date.now() - startTime, false);
      console.error(`[SyncService]   ✗ Failed to sync slot ${slot.id}: ${error}`);
      throw error;
    }
  }

  /**
   * Extract location type from FHIR Slot resource
   */
  private extractLocationType(slot: FHIRSlot): string | null {
    // Check service type for telehealth indicators
    const serviceType = slot.serviceType?.[0];
    if (serviceType) {
      const code = serviceType.coding?.[0]?.code?.toLowerCase() || '';
      const display = serviceType.coding?.[0]?.display?.toLowerCase() || '';
      const text = serviceType.text?.toLowerCase() || '';
      
      if (code.includes('telehealth') || display.includes('telehealth') || 
          text.includes('telehealth') || text.includes('video') || 
          text.includes('online')) {
        return 'telehealth';
      }
    }
    
    // Default to in-person if no telehealth indicators
    return 'in-person';
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private getPatientIdFromAppointment(appointment: FhirAppointment): string | null {
    const participant = appointment.participant?.find((p: FhirParticipant) =>
      p.actor?.reference?.startsWith('Patient/')
    );
    return participant?.actor?.reference?.replace('Patient/', '') || null;
  }

  private mapAppointmentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'proposed': 'pending',
      'pending': 'pending',
      'booked': 'scheduled',
      'arrived': 'scheduled',
      'fulfilled': 'completed',
      'cancelled': 'cancelled',
      'noshow': 'no_show',
      'entered-in-error': 'cancelled',
    };
    return statusMap[status] || 'pending';
  }
}

export default HalaxySyncService;
