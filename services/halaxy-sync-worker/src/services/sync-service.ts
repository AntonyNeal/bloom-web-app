/**
 * Halaxy Sync Service for Container Apps Worker
 * 
 * This is a wrapper around the core sync logic that can run
 * independently of Azure Functions.
 */

import * as sql from 'mssql';
import { DatabaseService } from './database';
import { HalaxyClient } from './halaxy-client';
import { trackDependency } from '../telemetry';

export interface SyncResult {
  success: boolean;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  errors: SyncError[];
  durationMs: number;
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

      // 4. Log sync completion
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

      // Upsert practitioner
      const result = await pool.request()
        .input('halaxyId', sql.VarChar, halaxyPractitionerId)
        .input('firstName', sql.NVarChar, firstName)
        .input('lastName', sql.NVarChar, lastName)
        .input('email', sql.VarChar, email)
        .query(`
          MERGE INTO practitioners AS target
          USING (SELECT @halaxyId AS halaxy_practitioner_id) AS source
          ON target.halaxy_practitioner_id = source.halaxy_practitioner_id
          WHEN MATCHED THEN
            UPDATE SET 
              first_name = @firstName,
              last_name = @lastName,
              email = COALESCE(@email, target.email),
              updated_at = GETUTCDATE()
          WHEN NOT MATCHED THEN
            INSERT (halaxy_practitioner_id, first_name, last_name, email, is_active, created_at, updated_at)
            VALUES (@halaxyId, @firstName, @lastName, @email, 1, GETUTCDATE(), GETUTCDATE())
          OUTPUT inserted.id;
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

      const result = await pool.request()
        .input('halaxyPatientId', sql.VarChar, patient.id)
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .input('firstName', sql.NVarChar, firstName)
        .input('lastName', sql.NVarChar, lastName)
        .input('email', sql.VarChar, email)
        .input('phone', sql.VarChar, phone)
        .input('birthDate', sql.Date, birthDate ? new Date(birthDate) : null)
        .query(`
          MERGE INTO clients AS target
          USING (SELECT @halaxyPatientId AS halaxy_patient_id, @practitionerId AS practitioner_id) AS source
          ON target.halaxy_patient_id = source.halaxy_patient_id
            AND target.practitioner_id = source.practitioner_id
          WHEN MATCHED THEN
            UPDATE SET
              first_name = @firstName,
              last_name = @lastName,
              email = COALESCE(@email, target.email),
              phone = COALESCE(@phone, target.phone),
              date_of_birth = COALESCE(@birthDate, target.date_of_birth),
              updated_at = GETUTCDATE()
          WHEN NOT MATCHED THEN
            INSERT (halaxy_patient_id, practitioner_id, first_name, last_name, email, phone, date_of_birth, is_active, created_at, updated_at)
            VALUES (@halaxyPatientId, @practitionerId, @firstName, @lastName, @email, @phone, @birthDate, 1, GETUTCDATE(), GETUTCDATE())
          OUTPUT inserted.id;
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
              start_time = @startDateTime,
              end_time = @endDateTime,
              status = @status,
              notes = COALESCE(@description, target.notes),
              updated_at = GETUTCDATE()
          WHEN NOT MATCHED THEN
            INSERT (halaxy_appointment_id, practitioner_id, client_id, start_time, end_time, status, notes, created_at, updated_at)
            VALUES (@halaxyAppointmentId, @practitionerId, @clientId, @startDateTime, @endDateTime, @status, @description, GETUTCDATE(), GETUTCDATE());
        `);

      trackDependency('SQL', 'syncSession', 'MERGE sessions', Date.now() - startTime, true);

    } catch (error) {
      trackDependency('SQL', 'syncSession', 'MERGE sessions', Date.now() - startTime, false);
      throw error;
    }
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
