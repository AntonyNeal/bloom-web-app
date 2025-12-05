/**
 * Halaxy Sync Service
 * 
 * Core synchronization logic for keeping Bloom database in sync with Halaxy.
 * Supports both full reconciliation (scheduled) and incremental updates (webhooks).
 */

import * as sql from 'mssql';
import { getDbConnection } from '../database';
import { HalaxyClient, getHalaxyClient, HalaxyApiError } from './client';
import {
  transformPractitioner,
  transformPatient,
  transformAppointment,
  getPatientIdFromAppointment,
  getPractitionerIdFromAppointment,
} from './transformers';
import {
  FHIRPractitioner,
  FHIRPatient,
  FHIRAppointment,
  FHIRSlot,
  Practitioner,
  Client,
  Session,
  SyncResult,
  SyncError,
  SyncLogEntry,
  HalaxyWebhookEvent,
} from './types';

/**
 * Extract error message with API response details if available
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof HalaxyApiError) {
    // Include response body for API errors
    const bodyPreview = error.responseBody.slice(0, 200);
    return `${error.message}: ${bodyPreview}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

/**
 * Extract numeric ID from Halaxy practitioner ID.
 * Halaxy FHIR IDs have prefixes like "PR-" for practitioners, "EP-" for employees.
 * For FHIR references (e.g., Practitioner/123), we need just the numeric part.
 * 
 * @param halaxyId - Full Halaxy ID like "PR-1439411" or "EP-16680221"
 * @returns Numeric ID without prefix, or original ID if no prefix found
 */
function extractNumericId(halaxyId: string): string {
  // Match pattern: 2-3 letter prefix, hyphen, numeric ID
  const match = halaxyId.match(/^[A-Z]{2,3}-(\d+)$/);
  if (match) {
    return match[1];
  }
  // If no prefix pattern, return original (might already be numeric)
  return halaxyId;
}

/**
 * Halaxy Sync Service
 * 
 * Manages synchronization between Halaxy Practice Management System
 * and Bloom's local database.
 */
export class HalaxySyncService {
  private client: HalaxyClient;
  private pool: sql.ConnectionPool | null = null;

  constructor(client?: HalaxyClient) {
    this.client = client || getHalaxyClient();
  }

  /**
   * Initialize database connection
   */
  private async getPool(): Promise<sql.ConnectionPool> {
    if (!this.pool) {
      this.pool = await getDbConnection();
    }
    return this.pool;
  }

  // ===========================================================================
  // Full Sync (Scheduled - runs every 15 minutes)
  // ===========================================================================

  /**
   * Perform a full sync for a practitioner
   * 
   * Reconciles all data: practitioner profile, clients, and sessions
   * within the sync window (30 days past, 90 days future).
   * 
   * @param halaxyPractitionerId - The Halaxy practitioner ID
   * @param fhirPractitioner - Optional FHIR practitioner data (skip API call if provided)
   */
  async fullSync(halaxyPractitionerId: string, fhirPractitioner?: FHIRPractitioner): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    const recordsCreated = 0;
    let recordsUpdated = 0;
    const recordsDeleted = 0;

    console.log(`[HalaxySyncService] Starting full sync for practitioner ${halaxyPractitionerId}`);

    // 1. Sync practitioner profile FIRST to get the GUID
    let practitioner: Practitioner | null = null;
    try {
      practitioner = await this.syncPractitioner(halaxyPractitionerId, fhirPractitioner);
      if (!practitioner) {
        throw new Error(`Practitioner ${halaxyPractitionerId} not found in Halaxy`);
      }
    } catch (error) {
      console.error(`[HalaxySyncService] Failed to sync practitioner ${halaxyPractitionerId}:`, error);
      return {
        success: false,
        syncLogId: '',
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [{
          entityType: 'practitioner',
          entityId: halaxyPractitionerId,
          operation: 'full_sync',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        }],
        duration: Date.now() - startTime,
      };
    }

    // Try to create sync log, but don't fail if table doesn't exist
    let syncLogId: string = '';
    try {
      const syncLog = await this.createSyncLog('full', 'all', practitioner.id);
      syncLogId = syncLog.id;
    } catch (logError) {
      console.warn('[HalaxySyncService] Could not create sync log (table may not exist):', logError);
    }

    try {
      // Practitioner has been synced successfully at this point
      // Count the practitioner as synced (this is the primary success metric)
      recordsUpdated++;
      console.log(`[HalaxySyncService] Practitioner ${practitioner.firstName} ${practitioner.lastName} synced successfully`);
      
      // 2. Try to sync patients (clients) for this practitioner
      // Now using PractitionerRole reference as per Halaxy API documentation
      let patients: FHIRPatient[] = [];
      try {
        patients = await this.client.getPatientsByPractitioner(halaxyPractitionerId);
        console.log(`[HalaxySyncService] Found ${patients.length} patients to sync`);
      } catch (patientError) {
        console.warn(`[HalaxySyncService] Could not fetch patients for ${halaxyPractitionerId}:`, patientError);
        errors.push({
          entityType: 'client',
          entityId: halaxyPractitionerId,
          operation: 'sync',
          message: `Could not fetch patients: ${getErrorMessage(patientError)}`,
          timestamp: new Date(),
        });
      }

      const clientMap = new Map<string, string>(); // halaxyPatientId -> bloomClientId
      
      for (const patient of patients) {
        try {
          const client = await this.syncClient(patient, practitioner.id);
          clientMap.set(patient.id, client.id);
          recordsUpdated++;
        } catch (error) {
          errors.push({
            entityType: 'client',
            entityId: patient.id,
            operation: 'sync',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          });
        }
      }

      // 3. Sync appointments (sessions) - 30 days past to 90 days future
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      // Try to sync appointments - may fail if API query format is invalid
      let appointments: FHIRAppointment[] = [];
      try {
        appointments = await this.client.getAppointmentsByPractitioner(
          halaxyPractitionerId,
          startDate,
          endDate
        );
        console.log(`[HalaxySyncService] Found ${appointments.length} appointments to sync`);
      } catch (appointmentError) {
        console.warn(`[HalaxySyncService] Could not fetch appointments for ${halaxyPractitionerId}:`, appointmentError);
        errors.push({
          entityType: 'session',
          entityId: halaxyPractitionerId,
          operation: 'sync',
          message: `Could not fetch appointments: ${getErrorMessage(appointmentError)}`,
          timestamp: new Date(),
        });
      }

      // Calculate session numbers per client
      const sessionCounters = await this.getSessionCounters(practitioner.id);

      for (const appointment of appointments) {
        try {
          const patientHalaxyId = getPatientIdFromAppointment(appointment);
          if (!patientHalaxyId) {
            console.warn(`[HalaxySyncService] No patient reference in appointment ${appointment.id}`);
            continue;
          }

          const clientId = clientMap.get(patientHalaxyId);
          if (!clientId) {
            console.warn(`[HalaxySyncService] Client not found for patient ${patientHalaxyId}`);
            continue;
          }

          // Get or increment session number for this client
          if (!sessionCounters.has(clientId)) {
            sessionCounters.set(clientId, 0);
          }
          const sessionNumber = sessionCounters.get(clientId)! + 1;
          sessionCounters.set(clientId, sessionNumber);

          await this.syncSession(appointment, practitioner.id, clientId, sessionNumber);
          recordsUpdated++;
        } catch (error) {
          errors.push({
            entityType: 'session',
            entityId: appointment.id,
            operation: 'sync',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          });
        }
      }

      // 4. Sync availability slots - next 90 days
      // Note: Slot endpoint may not be available for all Halaxy API configurations
      // Skipping slot sync for now - can be enabled once endpoint is confirmed working
      console.log(`[HalaxySyncService] Skipping slot sync (endpoint not available)`);
      
      /*
      // Only sync slots for actual practitioners (PR- prefix), not employees (EP- prefix)
      const isPractitioner = halaxyPractitionerId.startsWith('PR-');
      
      if (isPractitioner) {
        // ... slot sync code commented out until endpoint is confirmed
      }
      */

      // Update MHCP used sessions for each client
      await this.updateMhcpSessionCounts(practitioner.id);

      // Complete sync log if it was created
      if (syncLogId) {
        try {
          await this.completeSyncLog(syncLogId, 'success', recordsCreated + recordsUpdated);
        } catch (logError) {
          console.warn('[HalaxySyncService] Could not complete sync log:', logError);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[HalaxySyncService] Full sync completed in ${duration}ms`);

      // Practitioner sync is the primary success metric
      // Patient, appointment, and slot syncs may fail due to API limitations
      // but the practitioner is still successfully synced
      const practitionerSynced = recordsUpdated >= 1 || recordsCreated >= 1;

      return {
        success: practitionerSynced,
        syncLogId,
        recordsProcessed: recordsCreated + recordsUpdated + recordsDeleted,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        errors,
        duration,
      };
    } catch (error) {
      console.error('[HalaxySyncService] Full sync failed:', error);
      
      if (syncLogId) {
        try {
          await this.completeSyncLog(
            syncLogId,
            'error',
            0,
            getErrorMessage(error)
          );
        } catch (logError) {
          console.warn('[HalaxySyncService] Could not complete sync log:', logError);
        }
      }

      return {
        success: false,
        syncLogId,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [{
          entityType: 'all',
          entityId: halaxyPractitionerId,
          operation: 'full_sync',
          message: getErrorMessage(error),
          timestamp: new Date(),
        }],
        duration: Date.now() - startTime,
      };
    }
  }

  // ===========================================================================
  // Incremental Sync (Webhook-triggered)
  // ===========================================================================

  /**
   * Handle incremental sync from webhook events
   */
  async incrementalSync(
    event: HalaxyWebhookEvent,
    resource: FHIRAppointment | FHIRPatient | FHIRPractitioner
  ): Promise<SyncResult> {
    const startTime = Date.now();
    
    // Try to create sync log, but don't fail if table doesn't exist
    let syncLogId: string = '';
    try {
      const syncLog = await this.createSyncLog('webhook', this.getEntityType(event), undefined);
      syncLogId = syncLog.id;
    } catch (logError) {
      console.warn('[HalaxySyncService] Could not create sync log:', logError);
    }

    try {
      console.log(`[HalaxySyncService] Processing webhook event: ${event}`);

      let result: { created: number; updated: number; deleted: number } = {
        created: 0,
        updated: 0,
        deleted: 0,
      };

      switch (event) {
        case 'appointment.created':
        case 'appointment.updated':
          result = await this.handleAppointmentChange(resource as FHIRAppointment);
          break;

        case 'appointment.cancelled':
        case 'appointment.deleted':
          result = await this.handleAppointmentDelete(resource as FHIRAppointment);
          break;

        case 'patient.created':
        case 'patient.updated':
          result = await this.handlePatientChange(resource as FHIRPatient);
          break;

        case 'patient.deleted':
          result = await this.handlePatientDelete(resource as FHIRPatient);
          break;

        case 'practitioner.updated':
          result = await this.handlePractitionerChange(resource as FHIRPractitioner);
          break;

        default:
          console.log(`[HalaxySyncService] Unhandled webhook event: ${event}`);
      }

      if (syncLogId) {
        try {
          await this.completeSyncLog(
            syncLogId,
            'success',
            result.created + result.updated + result.deleted
          );
        } catch (logError) {
          console.warn('[HalaxySyncService] Could not complete sync log:', logError);
        }
      }

      return {
        success: true,
        syncLogId,
        recordsProcessed: result.created + result.updated + result.deleted,
        recordsCreated: result.created,
        recordsUpdated: result.updated,
        recordsDeleted: result.deleted,
        errors: [],
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`[HalaxySyncService] Webhook sync failed:`, error);

      if (syncLogId) {
        try {
          await this.completeSyncLog(
            syncLogId,
            'error',
            0,
            error instanceof Error ? error.message : 'Unknown error'
          );
        } catch (logError) {
          console.warn('[HalaxySyncService] Could not complete sync log:', logError);
        }
      }

      return {
        success: false,
        syncLogId,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [{
          entityType: this.getEntityType(event),
          entityId: resource.id,
          operation: event,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        }],
        duration: Date.now() - startTime,
      };
    }
  }

  // ===========================================================================
  // Entity Sync Methods
  // ===========================================================================

  /**
   * Sync a single practitioner
   * 
   * @param halaxyPractitionerId - The Halaxy practitioner ID
   * @param fhirData - Optional FHIR practitioner data (skip API call if provided)
   */
  async syncPractitioner(halaxyPractitionerId: string, fhirData?: FHIRPractitioner): Promise<Practitioner | null> {
    const pool = await this.getPool();
    
    // Use provided data or fetch from Halaxy
    const fhirPractitioner = fhirData || await this.client.getPractitioner(halaxyPractitionerId);
    if (!fhirPractitioner) return null;

    // Check if exists in Bloom
    const existing = await pool.request()
      .input('halaxyId', sql.NVarChar, halaxyPractitionerId)
      .query<Practitioner>(`
        SELECT * FROM practitioners 
        WHERE halaxy_practitioner_id = @halaxyId
      `);

    const existingId = existing.recordset[0]?.id;
    const practitioner = transformPractitioner(fhirPractitioner, existingId);

    // Map isActive to status column (database uses NVARCHAR status, not BIT is_active)
    const status = practitioner.isActive ? 'active' : 'inactive';

    // Generate placeholder email if empty (to avoid UNIQUE constraint violations)
    const email = practitioner.email || `${halaxyPractitionerId}@placeholder.halaxy.local`;

    if (existingId) {
      // Update - only update fields we have data for
      await pool.request()
        .input('id', sql.UniqueIdentifier, existingId)
        .input('firstName', sql.NVarChar, practitioner.firstName)
        .input('lastName', sql.NVarChar, practitioner.lastName)
        .input('displayName', sql.NVarChar, practitioner.displayName)
        .input('email', sql.NVarChar, email)
        .input('phone', sql.NVarChar, practitioner.phone)
        .input('qualificationType', sql.NVarChar, practitioner.qualifications)
        .input('specializations', sql.NVarChar, practitioner.specialty ? JSON.stringify([practitioner.specialty]) : null)
        .input('status', sql.NVarChar, status)
        .input('lastSyncedAt', sql.DateTime2, practitioner.lastSyncedAt)
        .query(`
          UPDATE practitioners SET
            first_name = @firstName,
            last_name = @lastName,
            display_name = @displayName,
            email = @email,
            phone = @phone,
            qualification_type = COALESCE(@qualificationType, qualification_type),
            specializations = COALESCE(@specializations, specializations),
            status = @status,
            last_synced_at = @lastSyncedAt,
            updated_at = GETUTCDATE()
          WHERE id = @id
        `);
    } else {
      // Insert
      await pool.request()
        .input('id', sql.UniqueIdentifier, practitioner.id)
        .input('halaxyPractitionerId', sql.NVarChar, practitioner.halaxyPractitionerId)
        .input('firstName', sql.NVarChar, practitioner.firstName)
        .input('lastName', sql.NVarChar, practitioner.lastName)
        .input('displayName', sql.NVarChar, practitioner.displayName)
        .input('email', sql.NVarChar, email)
        .input('phone', sql.NVarChar, practitioner.phone)
        .input('qualificationType', sql.NVarChar, practitioner.qualifications)
        .input('specializations', sql.NVarChar, practitioner.specialty ? JSON.stringify([practitioner.specialty]) : null)
        .input('status', sql.NVarChar, status)
        .input('lastSyncedAt', sql.DateTime2, practitioner.lastSyncedAt)
        .query(`
          INSERT INTO practitioners (
            id, halaxy_practitioner_id, first_name, last_name, display_name,
            email, phone, qualification_type, specializations, status, last_synced_at,
            created_at, updated_at
          ) VALUES (
            @id, @halaxyPractitionerId, @firstName, @lastName, @displayName,
            @email, @phone, @qualificationType, @specializations, @status, @lastSyncedAt,
            GETUTCDATE(), GETUTCDATE()
          )
        `);
    }

    return practitioner as Practitioner;
  }

  /**
   * Sync a single client (patient)
   */
  async syncClient(
    fhirPatient: FHIRPatient,
    practitionerId: string
  ): Promise<Client> {
    const pool = await this.getPool();

    // Check if exists
    const existing = await pool.request()
      .input('halaxyId', sql.NVarChar, fhirPatient.id)
      .query<Client>(`
        SELECT * FROM clients 
        WHERE halaxy_patient_id = @halaxyId
      `);

    const existingClient = existing.recordset[0];
    const client = transformPatient(
      fhirPatient,
      practitionerId,
      existingClient?.id,
      existingClient?.mhcpUsedSessions
    );

    // Map isActive to status column (database uses NVARCHAR status, not BIT is_active)
    const status = client.isActive ? 'active' : 'inactive';

    if (existingClient) {
      // Update (preserve MHCP data if not in FHIR)
      await pool.request()
        .input('id', sql.UniqueIdentifier, existingClient.id)
        .input('firstName', sql.NVarChar, client.firstName)
        .input('lastName', sql.NVarChar, client.lastName)
        .input('initials', sql.NVarChar, client.initials)
        .input('email', sql.NVarChar, client.email)
        .input('phone', sql.NVarChar, client.phone)
        .input('dateOfBirth', sql.Date, client.dateOfBirth)
        .input('presentingIssues', sql.NVarChar, client.presentingIssues)
        .input('status', sql.NVarChar, status)
        .input('lastSyncedAt', sql.DateTime2, client.lastSyncedAt)
        .query(`
          UPDATE clients SET
            first_name = @firstName,
            last_name = @lastName,
            initials = @initials,
            email = @email,
            phone = @phone,
            date_of_birth = @dateOfBirth,
            presenting_issues = COALESCE(@presentingIssues, presenting_issues),
            status = @status,
            last_synced_at = @lastSyncedAt,
            updated_at = GETUTCDATE()
          WHERE id = @id
        `);
    } else {
      // Insert
      await pool.request()
        .input('id', sql.UniqueIdentifier, client.id)
        .input('halaxyPatientId', sql.NVarChar, client.halaxyPatientId)
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .input('firstName', sql.NVarChar, client.firstName)
        .input('lastName', sql.NVarChar, client.lastName)
        .input('initials', sql.NVarChar, client.initials)
        .input('email', sql.NVarChar, client.email)
        .input('phone', sql.NVarChar, client.phone)
        .input('dateOfBirth', sql.Date, client.dateOfBirth)
        .input('mhcpTotalSessions', sql.Int, client.mhcpTotalSessions)
        .input('mhcpUsedSessions', sql.Int, client.mhcpUsedSessions)
        .input('presentingIssues', sql.NVarChar, client.presentingIssues)
        .input('status', sql.NVarChar, status)
        .input('lastSyncedAt', sql.DateTime2, client.lastSyncedAt)
        .query(`
          INSERT INTO clients (
            id, halaxy_patient_id, practitioner_id, first_name, last_name,
            initials, email, phone, date_of_birth, mhcp_total_sessions,
            mhcp_used_sessions, presenting_issues, status, last_synced_at,
            created_at, updated_at
          ) VALUES (
            @id, @halaxyPatientId, @practitionerId, @firstName, @lastName,
            @initials, @email, @phone, @dateOfBirth, @mhcpTotalSessions,
            @mhcpUsedSessions, @presentingIssues, @status, @lastSyncedAt,
            GETUTCDATE(), GETUTCDATE()
          )
        `);
    }

    return client as Client;
  }

  /**
   * Sync a single session (appointment)
   */
  async syncSession(
    fhirAppointment: FHIRAppointment,
    practitionerId: string,
    clientId: string,
    sessionNumber: number
  ): Promise<Session> {
    const pool = await this.getPool();

    // Check if exists
    const existing = await pool.request()
      .input('halaxyId', sql.NVarChar, fhirAppointment.id)
      .query<Session>(`
        SELECT * FROM sessions 
        WHERE halaxy_appointment_id = @halaxyId
      `);

    const existingSession = existing.recordset[0];
    const session = transformAppointment(
      fhirAppointment,
      practitionerId,
      clientId,
      existingSession?.sessionNumber || sessionNumber,
      existingSession?.id
    );

    if (existingSession) {
      // Update
      await pool.request()
        .input('id', sql.UniqueIdentifier, existingSession.id)
        .input('scheduledStartTime', sql.DateTime2, session.scheduledStartTime)
        .input('scheduledEndTime', sql.DateTime2, session.scheduledEndTime)
        .input('actualStartTime', sql.DateTime2, session.actualStartTime)
        .input('actualEndTime', sql.DateTime2, session.actualEndTime)
        .input('status', sql.NVarChar, session.status)
        .input('sessionType', sql.NVarChar, session.sessionType)
        .input('notes', sql.NVarChar, session.notes)
        .input('fee', sql.Decimal(10, 2), session.fee)
        .input('isPaid', sql.Bit, session.isPaid)
        .input('lastSyncedAt', sql.DateTime2, session.lastSyncedAt)
        .query(`
          UPDATE sessions SET
            scheduled_start_time = @scheduledStartTime,
            scheduled_end_time = @scheduledEndTime,
            actual_start_time = @actualStartTime,
            actual_end_time = @actualEndTime,
            status = @status,
            session_type = @sessionType,
            notes = @notes,
            fee = @fee,
            is_paid = @isPaid,
            last_synced_at = @lastSyncedAt,
            updated_at = GETUTCDATE()
          WHERE id = @id
        `);
    } else {
      // Insert
      await pool.request()
        .input('id', sql.UniqueIdentifier, session.id)
        .input('halaxyAppointmentId', sql.NVarChar, session.halaxyAppointmentId)
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .input('clientId', sql.UniqueIdentifier, clientId)
        .input('scheduledStartTime', sql.DateTime2, session.scheduledStartTime)
        .input('scheduledEndTime', sql.DateTime2, session.scheduledEndTime)
        .input('actualStartTime', sql.DateTime2, session.actualStartTime)
        .input('actualEndTime', sql.DateTime2, session.actualEndTime)
        .input('sessionNumber', sql.Int, session.sessionNumber)
        .input('status', sql.NVarChar, session.status)
        .input('sessionType', sql.NVarChar, session.sessionType)
        .input('notes', sql.NVarChar, session.notes)
        .input('fee', sql.Decimal(10, 2), session.fee)
        .input('feeCurrency', sql.NVarChar, session.feeCurrency)
        .input('isPaid', sql.Bit, session.isPaid)
        .input('lastSyncedAt', sql.DateTime2, session.lastSyncedAt)
        .query(`
          INSERT INTO sessions (
            id, halaxy_appointment_id, practitioner_id, client_id,
            scheduled_start_time, scheduled_end_time, actual_start_time,
            actual_end_time, session_number, status, session_type, notes,
            fee, fee_currency, is_paid, last_synced_at, created_at, updated_at
          ) VALUES (
            @id, @halaxyAppointmentId, @practitionerId, @clientId,
            @scheduledStartTime, @scheduledEndTime, @actualStartTime,
            @actualEndTime, @sessionNumber, @status, @sessionType, @notes,
            @fee, @feeCurrency, @isPaid, @lastSyncedAt, GETUTCDATE(), GETUTCDATE()
          )
        `);
    }

    return session as Session;
  }

  // ===========================================================================
  // Availability Slot Sync
  // ===========================================================================

  /**
   * Clean up old/past availability slots
   */
  private async cleanupOldSlots(practitionerId: string): Promise<void> {
    const pool = await this.getPool();

    try {
      await pool.request()
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .query(`
          DELETE FROM availability_slots
          WHERE practitioner_id = @practitionerId
            AND slot_start < GETUTCDATE()
        `);
    } catch (error) {
      // Non-critical error, log and continue
      console.warn('[HalaxySyncService] Failed to cleanup old slots:', error);
    }
  }

  /**
   * Sync a single availability slot from Halaxy
   */
  private async syncSlot(slot: FHIRSlot, practitionerId: string): Promise<void> {
    const pool = await this.getPool();

    // Validate slot dates
    if (!slot.start || !slot.end) {
      console.warn(`[HalaxySyncService] Slot ${slot.id} missing start or end time`);
      return;
    }

    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);

    // Validate parsed dates
    if (isNaN(slotStart.getTime()) || isNaN(slotEnd.getTime())) {
      console.warn(`[HalaxySyncService] Slot ${slot.id} has invalid dates: start=${slot.start}, end=${slot.end}`);
      return;
    }

    const durationMinutes = Math.round((slotEnd.getTime() - slotStart.getTime()) / (1000 * 60));

    // Extract schedule ID from reference if available
    const scheduleId = slot.schedule?.reference?.replace('Schedule/', '') || null;

    // Extract service category if available
    const serviceCategory = slot.serviceCategory?.[0]?.text ||
                           slot.serviceCategory?.[0]?.coding?.[0]?.display ||
                           null;

    // Determine location type from service type
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
  }

  /**
   * Extract location type from FHIR Slot resource
   */
  private extractLocationType(slot: FHIRSlot): string | null {
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

    return 'in-person';
  }

  // ===========================================================================
  // Webhook Event Handlers
  // ===========================================================================

  private async handleAppointmentChange(
    fhir: FHIRAppointment
  ): Promise<{ created: number; updated: number; deleted: number }> {
    const pool = await this.getPool();

    // Get patient and practitioner from appointment
    const halaxyPatientId = getPatientIdFromAppointment(fhir);
    const halaxyPractitionerId = getPractitionerIdFromAppointment(fhir);

    if (!halaxyPatientId || !halaxyPractitionerId) {
      throw new Error('Missing patient or practitioner reference in appointment');
    }

    // Look up Bloom IDs
    const practitioner = await pool.request()
      .input('halaxyId', sql.NVarChar, halaxyPractitionerId)
      .query<{ id: string }>(`
        SELECT id FROM practitioners WHERE halaxy_practitioner_id = @halaxyId
      `);

    const client = await pool.request()
      .input('halaxyId', sql.NVarChar, halaxyPatientId)
      .query<{ id: string }>(`
        SELECT id FROM clients WHERE halaxy_patient_id = @halaxyId
      `);

    if (!practitioner.recordset[0] || !client.recordset[0]) {
      // Need to sync the missing entities first
      if (!practitioner.recordset[0]) {
        await this.syncPractitioner(halaxyPractitionerId);
      }
      if (!client.recordset[0]) {
        const fhirPatient = await this.client.getPatient(halaxyPatientId);
        const prac = await pool.request()
          .input('halaxyId', sql.NVarChar, halaxyPractitionerId)
          .query<{ id: string }>(`
            SELECT id FROM practitioners WHERE halaxy_practitioner_id = @halaxyId
          `);
        await this.syncClient(fhirPatient, prac.recordset[0].id);
      }
    }

    // Re-fetch after potential sync
    const pracResult = await pool.request()
      .input('halaxyId', sql.NVarChar, halaxyPractitionerId)
      .query<{ id: string }>(`
        SELECT id FROM practitioners WHERE halaxy_practitioner_id = @halaxyId
      `);

    const clientResult = await pool.request()
      .input('halaxyId', sql.NVarChar, halaxyPatientId)
      .query<{ id: string }>(`
        SELECT id FROM clients WHERE halaxy_patient_id = @halaxyId
      `);

    // Get session number
    const sessionCount = await pool.request()
      .input('clientId', sql.UniqueIdentifier, clientResult.recordset[0].id)
      .query<{ count: number }>(`
        SELECT COUNT(*) as count FROM sessions 
        WHERE client_id = @clientId AND status = 'completed'
      `);

    await this.syncSession(
      fhir,
      pracResult.recordset[0].id,
      clientResult.recordset[0].id,
      sessionCount.recordset[0].count + 1
    );

    return { created: 0, updated: 1, deleted: 0 };
  }

  private async handleAppointmentDelete(
    fhir: FHIRAppointment
  ): Promise<{ created: number; updated: number; deleted: number }> {
    const pool = await this.getPool();

    await pool.request()
      .input('halaxyId', sql.NVarChar, fhir.id)
      .query(`
        UPDATE sessions SET 
          status = 'cancelled',
          updated_at = GETUTCDATE()
        WHERE halaxy_appointment_id = @halaxyId
      `);

    return { created: 0, updated: 0, deleted: 1 };
  }

  private async handlePatientChange(
    fhir: FHIRPatient
  ): Promise<{ created: number; updated: number; deleted: number }> {
    const pool = await this.getPool();

    // Find practitioner for this patient
    const practitioner = await pool.request()
      .input('halaxyPatientId', sql.NVarChar, fhir.id)
      .query<{ practitioner_id: string }>(`
        SELECT practitioner_id FROM clients WHERE halaxy_patient_id = @halaxyPatientId
      `);

    let practitionerId = practitioner.recordset[0]?.practitioner_id;

    // If not found, try to get from FHIR reference
    if (!practitionerId && fhir.generalPractitioner?.[0]?.reference) {
      const halaxyPracId = fhir.generalPractitioner[0].reference.split('/')[1];
      const prac = await pool.request()
        .input('halaxyId', sql.NVarChar, halaxyPracId)
        .query<{ id: string }>(`
          SELECT id FROM practitioners WHERE halaxy_practitioner_id = @halaxyId
        `);
      practitionerId = prac.recordset[0]?.id;
    }

    if (!practitionerId) {
      throw new Error(`Cannot find practitioner for patient ${fhir.id}`);
    }

    await this.syncClient(fhir, practitionerId);

    return { created: 0, updated: 1, deleted: 0 };
  }

  private async handlePatientDelete(
    fhir: FHIRPatient
  ): Promise<{ created: number; updated: number; deleted: number }> {
    const pool = await this.getPool();

    await pool.request()
      .input('halaxyId', sql.NVarChar, fhir.id)
      .query(`
        UPDATE clients SET 
          status = 'inactive',
          updated_at = GETUTCDATE()
        WHERE halaxy_patient_id = @halaxyId
      `);

    return { created: 0, updated: 0, deleted: 1 };
  }

  private async handlePractitionerChange(
    fhir: FHIRPractitioner
  ): Promise<{ created: number; updated: number; deleted: number }> {
    await this.syncPractitioner(fhir.id);
    return { created: 0, updated: 1, deleted: 0 };
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Get existing session counts per client for session numbering
   */
  private async getSessionCounters(
    practitionerId: string
  ): Promise<Map<string, number>> {
    const pool = await this.getPool();

    const result = await pool.request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query<{ client_id: string; count: number }>(`
        SELECT client_id, COUNT(*) as count 
        FROM sessions 
        WHERE practitioner_id = @practitionerId AND status = 'completed'
        GROUP BY client_id
      `);

    const counters = new Map<string, number>();
    for (const row of result.recordset) {
      counters.set(row.client_id, row.count);
    }

    return counters;
  }

  /**
   * Update MHCP session counts for all clients of a practitioner
   */
  private async updateMhcpSessionCounts(practitionerId: string): Promise<void> {
    const pool = await this.getPool();

    await pool.request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        UPDATE c
        SET c.mhcp_used_sessions = COALESCE(s.completed_count, 0),
            c.updated_at = GETUTCDATE()
        FROM clients c
        LEFT JOIN (
          SELECT client_id, COUNT(*) as completed_count
          FROM sessions
          WHERE practitioner_id = @practitionerId AND status = 'completed'
          GROUP BY client_id
        ) s ON c.id = s.client_id
        WHERE c.practitioner_id = @practitionerId
      `);
  }

  /**
   * Create a sync log entry
   */
  private async createSyncLog(
    syncType: SyncLogEntry['syncType'],
    entityType: SyncLogEntry['entityType'],
    practitionerId?: string
  ): Promise<SyncLogEntry> {
    const pool = await this.getPool();
    const id = crypto.randomUUID();

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('syncType', sql.NVarChar, syncType)
      .input('entityType', sql.NVarChar, entityType)
      .input('operation', sql.NVarChar, 'sync')
      .input('status', sql.NVarChar, 'in_progress')
      .input('startedAt', sql.DateTime2, new Date())
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        INSERT INTO sync_log (
          id, sync_type, entity_type, operation, status, started_at, practitioner_id
        ) VALUES (
          @id, @syncType, @entityType, @operation, @status, @startedAt, @practitionerId
        )
      `);

    return {
      id,
      syncType,
      entityType,
      operation: 'sync',
      status: 'in_progress',
      startedAt: new Date(),
      recordsProcessed: 0,
      practitionerId,
    };
  }

  /**
   * Complete a sync log entry
   */
  private async completeSyncLog(
    id: string,
    status: 'success' | 'error',
    recordsProcessed: number,
    errorMessage?: string
  ): Promise<void> {
    const pool = await this.getPool();

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('status', sql.NVarChar, status)
      .input('completedAt', sql.DateTime2, new Date())
      .input('recordsProcessed', sql.Int, recordsProcessed)
      .input('errorMessage', sql.NVarChar, errorMessage)
      .query(`
        UPDATE sync_log SET
          status = @status,
          completed_at = @completedAt,
          records_processed = @recordsProcessed,
          error_message = @errorMessage
        WHERE id = @id
      `);
  }

  /**
   * Get entity type from webhook event
   */
  private getEntityType(event: HalaxyWebhookEvent): SyncLogEntry['entityType'] {
    if (event.startsWith('appointment')) return 'session';
    if (event.startsWith('patient')) return 'client';
    if (event.startsWith('practitioner')) return 'practitioner';
    return 'all';
  }

  /**
   * Get sync status for a practitioner
   */
  async getSyncStatus(practitionerId: string): Promise<{
    lastFullSync: string | null;
    lastIncrementalSync: string | null;
    status: 'healthy' | 'stale' | 'error';
    errorMessage: string | null;
  }> {
    const pool = await this.getPool();

    const result = await pool.request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query<{
        sync_type: string;
        status: string;
        completed_at: Date;
        error_message: string | null;
      }>(`
        SELECT TOP 10 sync_type, status, completed_at, error_message
        FROM sync_log
        WHERE practitioner_id = @practitionerId OR practitioner_id IS NULL
        ORDER BY started_at DESC
      `);

    const lastFull = result.recordset.find(r => r.sync_type === 'full');
    const lastIncremental = result.recordset.find(r => r.sync_type === 'webhook');
    const lastError = result.recordset.find(r => r.status === 'error');

    // Determine health status
    let status: 'healthy' | 'stale' | 'error' = 'healthy';
    
    if (lastError && (!lastFull || lastError.completed_at > lastFull.completed_at)) {
      status = 'error';
    } else if (lastFull) {
      const hoursSinceSync = (Date.now() - lastFull.completed_at.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSync > 1) {
        status = 'stale';
      }
    } else {
      status = 'stale';
    }

    return {
      lastFullSync: lastFull?.completed_at?.toISOString() || null,
      lastIncrementalSync: lastIncremental?.completed_at?.toISOString() || null,
      status,
      errorMessage: status === 'error' ? lastError?.error_message || null : null,
    };
  }
}

// Export singleton instance
let syncServiceInstance: HalaxySyncService | null = null;

export function getHalaxySyncService(): HalaxySyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new HalaxySyncService();
  }
  return syncServiceInstance;
}
