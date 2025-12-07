/**
 * Halaxy Sync Service for Container Apps Worker
 * 
 * This is a wrapper around the core sync logic that can run
 * independently of Azure Functions.
 */

import * as sql from 'mssql';
import { DatabaseService } from './database';
import { HalaxyClient, FHIRSlot, FHIRSlotStatus } from './halaxy-client';
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
   */
  async fullSync(halaxyPractitionerId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    const recordsCreated = 0;
    let recordsUpdated = 0;
    const recordsDeleted = 0;

    console.log(`[SyncService] Starting full sync for practitioner: ${halaxyPractitionerId}`);

    try {
      const pool = await this.db.getSqlPool();

      // 1. Sync practitioner profile
      console.log('[SyncService] Step 1: Syncing practitioner profile');
      const practitioner = await this.syncPractitioner(pool, halaxyPractitionerId);
      if (!practitioner) {
        throw new Error(`Practitioner ${halaxyPractitionerId} not found in Halaxy`);
      }
      recordsUpdated++;

      // 2. Sync patients (clients)
      console.log('[SyncService] Step 2: Syncing patients');
      const patients = await this.client.getPatientsByPractitioner(halaxyPractitionerId);
      console.log(`[SyncService]   Found ${patients.length} patients`);

      const clientMap = new Map<string, string>();

      for (const patient of patients) {
        try {
          const clientId = await this.syncClient(pool, patient, practitioner.id);
          clientMap.set(patient.id, clientId);
          recordsUpdated++;
        } catch (error) {
          errors.push({
            entityType: 'client',
            entityId: patient.id,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // 3. Sync appointments (sessions)
      console.log('[SyncService] Step 3: Syncing appointments');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      const appointments = await this.client.getAppointmentsByPractitioner(
        halaxyPractitionerId,
        startDate,
        endDate
      );
      console.log(`[SyncService]   Found ${appointments.length} appointments`);

      for (const appointment of appointments) {
        try {
          const patientId = this.getPatientIdFromAppointment(appointment);
          if (!patientId) continue;

          const clientId = clientMap.get(patientId);
          if (!clientId) continue;

          await this.syncSession(pool, appointment, practitioner.id, clientId);
          recordsUpdated++;
        } catch (error) {
          errors.push({
            entityType: 'session',
            entityId: appointment.id,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // 4. Sync availability slots
      console.log('[SyncService] Step 4: Syncing availability slots');
      const slotStartDate = new Date();
      const slotEndDate = new Date();
      slotEndDate.setDate(slotEndDate.getDate() + 90); // Sync slots for next 90 days

      let slotsSynced = 0;
      try {
        const allSlots = await this.client.findAvailableSlots(
          halaxyPractitionerId,
          slotStartDate,
          slotEndDate,
          60 // Default 60 min duration
        );
        console.log(`[SyncService]   Found ${allSlots.length} availability slots from Halaxy`);

        // Filter out weekend slots (Saturday = 6, Sunday = 0)
        // Bloom only operates Monday-Friday
        const slots = allSlots.filter((slot) => {
          const slotDate = new Date(slot.start);
          const dayOfWeek = slotDate.getDay();
          return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
        });
        
        const weekendSlotsFiltered = allSlots.length - slots.length;
        if (weekendSlotsFiltered > 0) {
          console.log(`[SyncService]   Filtered out ${weekendSlotsFiltered} weekend slots`);
        }
        console.log(`[SyncService]   Processing ${slots.length} weekday slots`);

        // Clean up old slots before syncing new ones
        await this.cleanupOldSlots(pool, practitioner.id);

        // Reconcile current database state with the snapshot we just fetched
        // This deletes any slots not returned by Halaxy (including weekends)
        await this.reconcilePractitionerSlots(pool, practitioner.id, slots);

        for (const slot of slots) {
          try {
            await this.syncSlot(pool, slot, practitioner.id);
            slotsSynced++;
            recordsUpdated++;
          } catch (error) {
            errors.push({
              entityType: 'slot',
              entityId: slot.id,
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      } catch (error) {
        console.error('[SyncService] Failed to sync availability slots:', error);
        errors.push({
          entityType: 'slots',
          entityId: halaxyPractitionerId,
          message: error instanceof Error ? error.message : 'Unknown error syncing slots',
        });
      }

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

      console.log(`[SyncService] Sync completed in ${durationMs}ms`);

      return {
        success: errors.length === 0,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        errors,
        durationMs,
        slotsSynced,
      };

    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('[SyncService] Full sync failed:', error);

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
      const email = practitioner.telecom?.find(t => t.system === 'email')?.value || '';

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
              email = COALESCE(@email, target.email),
              updated_at = GETUTCDATE(),
              last_synced_at = GETUTCDATE()
          WHEN NOT MATCHED THEN
            INSERT (halaxy_practitioner_id, first_name, last_name, display_name, email, status, created_at, updated_at, last_synced_at)
            VALUES (@halaxyId, @firstName, @lastName, CONCAT(@firstName, ' ', @lastName), @email, 'active', GETUTCDATE(), GETUTCDATE(), GETUTCDATE())
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
  // Availability Slot Sync
  // ============================================================================

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
      
      // Extract schedule ID from reference if available
      const scheduleId = slot.schedule?.reference?.replace('Schedule/', '') || null;
      
      // Extract service category if available
      const serviceCategory = slot.serviceCategory?.[0]?.text || 
                             slot.serviceCategory?.[0]?.coding?.[0]?.display || 
                             null;
      
      // Determine location type from service type or extensions
      const locationType = this.extractLocationType(slot);

      await pool.request()
        .input('halaxySlotId', sql.NVarChar, slot.id)
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .input('slotStart', sql.DateTime2, slotStart)
        .input('slotEnd', sql.DateTime2, slotEnd)
        .input('durationMinutes', sql.Int, durationMinutes)
        .input('status', sql.NVarChar, slot.status)
        .input('scheduleId', sql.NVarChar, scheduleId)
        .input('locationType', sql.NVarChar, locationType)
        .input('serviceCategory', sql.NVarChar, serviceCategory)
        .input('isBookable', sql.Bit, slot.status === 'free' ? 1 : 0)
        .query(`
          MERGE INTO availability_slots AS target
          USING (SELECT @halaxySlotId AS halaxy_slot_id) AS source
          ON target.halaxy_slot_id = source.halaxy_slot_id
          WHEN MATCHED THEN
            UPDATE SET
              practitioner_id = @practitionerId,
              slot_start = @slotStart,
              slot_end = @slotEnd,
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
              halaxy_slot_id, practitioner_id, slot_start, slot_end, 
              duration_minutes, status, halaxy_schedule_id, location_type, 
              service_category, is_bookable, created_at, updated_at, last_synced_at
            )
            VALUES (
              @halaxySlotId, @practitionerId, @slotStart, @slotEnd,
              @durationMinutes, @status, @scheduleId, @locationType,
              @serviceCategory, @isBookable, GETUTCDATE(), GETUTCDATE(), GETUTCDATE()
            );
        `);

      trackDependency('SQL', 'syncSlot', 'MERGE availability_slots', Date.now() - startTime, true);

    } catch (error) {
      trackDependency('SQL', 'syncSlot', 'MERGE availability_slots', Date.now() - startTime, false);
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
