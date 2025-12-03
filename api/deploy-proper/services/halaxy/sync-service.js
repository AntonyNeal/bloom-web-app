"use strict";
/**
 * Halaxy Sync Service
 *
 * Core synchronization logic for keeping Bloom database in sync with Halaxy.
 * Supports both full reconciliation (scheduled) and incremental updates (webhooks).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HalaxySyncService = void 0;
exports.getHalaxySyncService = getHalaxySyncService;
const sql = __importStar(require("mssql"));
const database_1 = require("../database");
const client_1 = require("./client");
const transformers_1 = require("./transformers");
/**
 * Halaxy Sync Service
 *
 * Manages synchronization between Halaxy Practice Management System
 * and Bloom's local database.
 */
class HalaxySyncService {
    constructor(client) {
        this.pool = null;
        this.client = client || (0, client_1.getHalaxyClient)();
    }
    /**
     * Initialize database connection
     */
    async getPool() {
        if (!this.pool) {
            this.pool = await (0, database_1.getDbConnection)();
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
     */
    async fullSync(halaxyPractitionerId) {
        const startTime = Date.now();
        const errors = [];
        const recordsCreated = 0;
        let recordsUpdated = 0;
        const recordsDeleted = 0;
        // Start sync log
        const syncLog = await this.createSyncLog('full', 'all', halaxyPractitionerId);
        try {
            console.log(`[HalaxySyncService] Starting full sync for practitioner ${halaxyPractitionerId}`);
            // 1. Sync practitioner profile
            const practitioner = await this.syncPractitioner(halaxyPractitionerId);
            if (!practitioner) {
                throw new Error(`Practitioner ${halaxyPractitionerId} not found in Halaxy`);
            }
            // 2. Sync all patients (clients) for this practitioner
            const patients = await this.client.getPatientsByPractitioner(halaxyPractitionerId);
            console.log(`[HalaxySyncService] Found ${patients.length} patients to sync`);
            const clientMap = new Map(); // halaxyPatientId -> bloomClientId
            for (const patient of patients) {
                try {
                    const client = await this.syncClient(patient, practitioner.id);
                    clientMap.set(patient.id, client.id);
                    recordsUpdated++;
                }
                catch (error) {
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
            const appointments = await this.client.getAppointmentsByPractitioner(halaxyPractitionerId, startDate, endDate);
            console.log(`[HalaxySyncService] Found ${appointments.length} appointments to sync`);
            // Calculate session numbers per client
            const sessionCounters = await this.getSessionCounters(practitioner.id);
            for (const appointment of appointments) {
                try {
                    const patientHalaxyId = (0, transformers_1.getPatientIdFromAppointment)(appointment);
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
                    const sessionNumber = sessionCounters.get(clientId) + 1;
                    sessionCounters.set(clientId, sessionNumber);
                    await this.syncSession(appointment, practitioner.id, clientId, sessionNumber);
                    recordsUpdated++;
                }
                catch (error) {
                    errors.push({
                        entityType: 'session',
                        entityId: appointment.id,
                        operation: 'sync',
                        message: error instanceof Error ? error.message : 'Unknown error',
                        timestamp: new Date(),
                    });
                }
            }
            // Update MHCP used sessions for each client
            await this.updateMhcpSessionCounts(practitioner.id);
            // Complete sync log
            await this.completeSyncLog(syncLog.id, 'success', recordsCreated + recordsUpdated);
            const duration = Date.now() - startTime;
            console.log(`[HalaxySyncService] Full sync completed in ${duration}ms`);
            return {
                success: errors.length === 0,
                syncLogId: syncLog.id,
                recordsProcessed: recordsCreated + recordsUpdated + recordsDeleted,
                recordsCreated,
                recordsUpdated,
                recordsDeleted,
                errors,
                duration,
            };
        }
        catch (error) {
            console.error('[HalaxySyncService] Full sync failed:', error);
            await this.completeSyncLog(syncLog.id, 'error', 0, error instanceof Error ? error.message : 'Unknown error');
            return {
                success: false,
                syncLogId: syncLog.id,
                recordsProcessed: 0,
                recordsCreated: 0,
                recordsUpdated: 0,
                recordsDeleted: 0,
                errors: [{
                        entityType: 'all',
                        entityId: halaxyPractitionerId,
                        operation: 'full_sync',
                        message: error instanceof Error ? error.message : 'Unknown error',
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
    async incrementalSync(event, resource) {
        const startTime = Date.now();
        const syncLog = await this.createSyncLog('webhook', this.getEntityType(event), undefined);
        try {
            console.log(`[HalaxySyncService] Processing webhook event: ${event}`);
            let result = {
                created: 0,
                updated: 0,
                deleted: 0,
            };
            switch (event) {
                case 'appointment.created':
                case 'appointment.updated':
                    result = await this.handleAppointmentChange(resource);
                    break;
                case 'appointment.cancelled':
                case 'appointment.deleted':
                    result = await this.handleAppointmentDelete(resource);
                    break;
                case 'patient.created':
                case 'patient.updated':
                    result = await this.handlePatientChange(resource);
                    break;
                case 'patient.deleted':
                    result = await this.handlePatientDelete(resource);
                    break;
                case 'practitioner.updated':
                    result = await this.handlePractitionerChange(resource);
                    break;
                default:
                    console.log(`[HalaxySyncService] Unhandled webhook event: ${event}`);
            }
            await this.completeSyncLog(syncLog.id, 'success', result.created + result.updated + result.deleted);
            return {
                success: true,
                syncLogId: syncLog.id,
                recordsProcessed: result.created + result.updated + result.deleted,
                recordsCreated: result.created,
                recordsUpdated: result.updated,
                recordsDeleted: result.deleted,
                errors: [],
                duration: Date.now() - startTime,
            };
        }
        catch (error) {
            console.error(`[HalaxySyncService] Webhook sync failed:`, error);
            await this.completeSyncLog(syncLog.id, 'error', 0, error instanceof Error ? error.message : 'Unknown error');
            return {
                success: false,
                syncLogId: syncLog.id,
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
     */
    async syncPractitioner(halaxyPractitionerId) {
        var _a;
        const pool = await this.getPool();
        // Fetch from Halaxy
        const fhirPractitioner = await this.client.getPractitioner(halaxyPractitionerId);
        if (!fhirPractitioner)
            return null;
        // Check if exists in Bloom
        const existing = await pool.request()
            .input('halaxyId', sql.NVarChar, halaxyPractitionerId)
            .query(`
        SELECT * FROM practitioners 
        WHERE halaxy_practitioner_id = @halaxyId
      `);
        const existingId = (_a = existing.recordset[0]) === null || _a === void 0 ? void 0 : _a.id;
        const practitioner = (0, transformers_1.transformPractitioner)(fhirPractitioner, existingId);
        if (existingId) {
            // Update
            await pool.request()
                .input('id', sql.UniqueIdentifier, existingId)
                .input('firstName', sql.NVarChar, practitioner.firstName)
                .input('lastName', sql.NVarChar, practitioner.lastName)
                .input('displayName', sql.NVarChar, practitioner.displayName)
                .input('email', sql.NVarChar, practitioner.email)
                .input('phone', sql.NVarChar, practitioner.phone)
                .input('qualifications', sql.NVarChar, practitioner.qualifications)
                .input('specialty', sql.NVarChar, practitioner.specialty)
                .input('isActive', sql.Bit, practitioner.isActive)
                .input('lastSyncedAt', sql.DateTime2, practitioner.lastSyncedAt)
                .query(`
          UPDATE practitioners SET
            first_name = @firstName,
            last_name = @lastName,
            display_name = @displayName,
            email = @email,
            phone = @phone,
            qualifications = @qualifications,
            specialty = @specialty,
            is_active = @isActive,
            last_synced_at = @lastSyncedAt,
            updated_at = GETUTCDATE()
          WHERE id = @id
        `);
        }
        else {
            // Insert
            await pool.request()
                .input('id', sql.UniqueIdentifier, practitioner.id)
                .input('halaxyPractitionerId', sql.NVarChar, practitioner.halaxyPractitionerId)
                .input('firstName', sql.NVarChar, practitioner.firstName)
                .input('lastName', sql.NVarChar, practitioner.lastName)
                .input('displayName', sql.NVarChar, practitioner.displayName)
                .input('email', sql.NVarChar, practitioner.email)
                .input('phone', sql.NVarChar, practitioner.phone)
                .input('qualifications', sql.NVarChar, practitioner.qualifications)
                .input('specialty', sql.NVarChar, practitioner.specialty)
                .input('isActive', sql.Bit, practitioner.isActive)
                .input('lastSyncedAt', sql.DateTime2, practitioner.lastSyncedAt)
                .query(`
          INSERT INTO practitioners (
            id, halaxy_practitioner_id, first_name, last_name, display_name,
            email, phone, qualifications, specialty, is_active, last_synced_at,
            created_at, updated_at
          ) VALUES (
            @id, @halaxyPractitionerId, @firstName, @lastName, @displayName,
            @email, @phone, @qualifications, @specialty, @isActive, @lastSyncedAt,
            GETUTCDATE(), GETUTCDATE()
          )
        `);
        }
        return practitioner;
    }
    /**
     * Sync a single client (patient)
     */
    async syncClient(fhirPatient, practitionerId) {
        const pool = await this.getPool();
        // Check if exists
        const existing = await pool.request()
            .input('halaxyId', sql.NVarChar, fhirPatient.id)
            .query(`
        SELECT * FROM clients 
        WHERE halaxy_patient_id = @halaxyId
      `);
        const existingClient = existing.recordset[0];
        const client = (0, transformers_1.transformPatient)(fhirPatient, practitionerId, existingClient === null || existingClient === void 0 ? void 0 : existingClient.id, existingClient === null || existingClient === void 0 ? void 0 : existingClient.mhcpUsedSessions);
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
                .input('isActive', sql.Bit, client.isActive)
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
            is_active = @isActive,
            last_synced_at = @lastSyncedAt,
            updated_at = GETUTCDATE()
          WHERE id = @id
        `);
        }
        else {
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
                .input('isActive', sql.Bit, client.isActive)
                .input('lastSyncedAt', sql.DateTime2, client.lastSyncedAt)
                .query(`
          INSERT INTO clients (
            id, halaxy_patient_id, practitioner_id, first_name, last_name,
            initials, email, phone, date_of_birth, mhcp_total_sessions,
            mhcp_used_sessions, presenting_issues, is_active, last_synced_at,
            created_at, updated_at
          ) VALUES (
            @id, @halaxyPatientId, @practitionerId, @firstName, @lastName,
            @initials, @email, @phone, @dateOfBirth, @mhcpTotalSessions,
            @mhcpUsedSessions, @presentingIssues, @isActive, @lastSyncedAt,
            GETUTCDATE(), GETUTCDATE()
          )
        `);
        }
        return client;
    }
    /**
     * Sync a single session (appointment)
     */
    async syncSession(fhirAppointment, practitionerId, clientId, sessionNumber) {
        const pool = await this.getPool();
        // Check if exists
        const existing = await pool.request()
            .input('halaxyId', sql.NVarChar, fhirAppointment.id)
            .query(`
        SELECT * FROM sessions 
        WHERE halaxy_appointment_id = @halaxyId
      `);
        const existingSession = existing.recordset[0];
        const session = (0, transformers_1.transformAppointment)(fhirAppointment, practitionerId, clientId, (existingSession === null || existingSession === void 0 ? void 0 : existingSession.sessionNumber) || sessionNumber, existingSession === null || existingSession === void 0 ? void 0 : existingSession.id);
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
        }
        else {
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
        return session;
    }
    // ===========================================================================
    // Webhook Event Handlers
    // ===========================================================================
    async handleAppointmentChange(fhir) {
        const pool = await this.getPool();
        // Get patient and practitioner from appointment
        const halaxyPatientId = (0, transformers_1.getPatientIdFromAppointment)(fhir);
        const halaxyPractitionerId = (0, transformers_1.getPractitionerIdFromAppointment)(fhir);
        if (!halaxyPatientId || !halaxyPractitionerId) {
            throw new Error('Missing patient or practitioner reference in appointment');
        }
        // Look up Bloom IDs
        const practitioner = await pool.request()
            .input('halaxyId', sql.NVarChar, halaxyPractitionerId)
            .query(`
        SELECT id FROM practitioners WHERE halaxy_practitioner_id = @halaxyId
      `);
        const client = await pool.request()
            .input('halaxyId', sql.NVarChar, halaxyPatientId)
            .query(`
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
                    .query(`
            SELECT id FROM practitioners WHERE halaxy_practitioner_id = @halaxyId
          `);
                await this.syncClient(fhirPatient, prac.recordset[0].id);
            }
        }
        // Re-fetch after potential sync
        const pracResult = await pool.request()
            .input('halaxyId', sql.NVarChar, halaxyPractitionerId)
            .query(`
        SELECT id FROM practitioners WHERE halaxy_practitioner_id = @halaxyId
      `);
        const clientResult = await pool.request()
            .input('halaxyId', sql.NVarChar, halaxyPatientId)
            .query(`
        SELECT id FROM clients WHERE halaxy_patient_id = @halaxyId
      `);
        // Get session number
        const sessionCount = await pool.request()
            .input('clientId', sql.UniqueIdentifier, clientResult.recordset[0].id)
            .query(`
        SELECT COUNT(*) as count FROM sessions 
        WHERE client_id = @clientId AND status = 'completed'
      `);
        await this.syncSession(fhir, pracResult.recordset[0].id, clientResult.recordset[0].id, sessionCount.recordset[0].count + 1);
        return { created: 0, updated: 1, deleted: 0 };
    }
    async handleAppointmentDelete(fhir) {
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
    async handlePatientChange(fhir) {
        var _a, _b, _c, _d;
        const pool = await this.getPool();
        // Find practitioner for this patient
        const practitioner = await pool.request()
            .input('halaxyPatientId', sql.NVarChar, fhir.id)
            .query(`
        SELECT practitioner_id FROM clients WHERE halaxy_patient_id = @halaxyPatientId
      `);
        let practitionerId = (_a = practitioner.recordset[0]) === null || _a === void 0 ? void 0 : _a.practitioner_id;
        // If not found, try to get from FHIR reference
        if (!practitionerId && ((_c = (_b = fhir.generalPractitioner) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.reference)) {
            const halaxyPracId = fhir.generalPractitioner[0].reference.split('/')[1];
            const prac = await pool.request()
                .input('halaxyId', sql.NVarChar, halaxyPracId)
                .query(`
          SELECT id FROM practitioners WHERE halaxy_practitioner_id = @halaxyId
        `);
            practitionerId = (_d = prac.recordset[0]) === null || _d === void 0 ? void 0 : _d.id;
        }
        if (!practitionerId) {
            throw new Error(`Cannot find practitioner for patient ${fhir.id}`);
        }
        await this.syncClient(fhir, practitionerId);
        return { created: 0, updated: 1, deleted: 0 };
    }
    async handlePatientDelete(fhir) {
        const pool = await this.getPool();
        await pool.request()
            .input('halaxyId', sql.NVarChar, fhir.id)
            .query(`
        UPDATE clients SET 
          is_active = 0,
          updated_at = GETUTCDATE()
        WHERE halaxy_patient_id = @halaxyId
      `);
        return { created: 0, updated: 0, deleted: 1 };
    }
    async handlePractitionerChange(fhir) {
        await this.syncPractitioner(fhir.id);
        return { created: 0, updated: 1, deleted: 0 };
    }
    // ===========================================================================
    // Helper Methods
    // ===========================================================================
    /**
     * Get existing session counts per client for session numbering
     */
    async getSessionCounters(practitionerId) {
        const pool = await this.getPool();
        const result = await pool.request()
            .input('practitionerId', sql.UniqueIdentifier, practitionerId)
            .query(`
        SELECT client_id, COUNT(*) as count 
        FROM sessions 
        WHERE practitioner_id = @practitionerId AND status = 'completed'
        GROUP BY client_id
      `);
        const counters = new Map();
        for (const row of result.recordset) {
            counters.set(row.client_id, row.count);
        }
        return counters;
    }
    /**
     * Update MHCP session counts for all clients of a practitioner
     */
    async updateMhcpSessionCounts(practitionerId) {
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
    async createSyncLog(syncType, entityType, practitionerId) {
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
    async completeSyncLog(id, status, recordsProcessed, errorMessage) {
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
    getEntityType(event) {
        if (event.startsWith('appointment'))
            return 'session';
        if (event.startsWith('patient'))
            return 'client';
        if (event.startsWith('practitioner'))
            return 'practitioner';
        return 'all';
    }
    /**
     * Get sync status for a practitioner
     */
    async getSyncStatus(practitionerId) {
        var _a, _b;
        const pool = await this.getPool();
        const result = await pool.request()
            .input('practitionerId', sql.UniqueIdentifier, practitionerId)
            .query(`
        SELECT TOP 10 sync_type, status, completed_at, error_message
        FROM sync_log
        WHERE practitioner_id = @practitionerId OR practitioner_id IS NULL
        ORDER BY started_at DESC
      `);
        const lastFull = result.recordset.find(r => r.sync_type === 'full');
        const lastIncremental = result.recordset.find(r => r.sync_type === 'webhook');
        const lastError = result.recordset.find(r => r.status === 'error');
        // Determine health status
        let status = 'healthy';
        if (lastError && (!lastFull || lastError.completed_at > lastFull.completed_at)) {
            status = 'error';
        }
        else if (lastFull) {
            const hoursSinceSync = (Date.now() - lastFull.completed_at.getTime()) / (1000 * 60 * 60);
            if (hoursSinceSync > 1) {
                status = 'stale';
            }
        }
        else {
            status = 'stale';
        }
        return {
            lastFullSync: ((_a = lastFull === null || lastFull === void 0 ? void 0 : lastFull.completed_at) === null || _a === void 0 ? void 0 : _a.toISOString()) || null,
            lastIncrementalSync: ((_b = lastIncremental === null || lastIncremental === void 0 ? void 0 : lastIncremental.completed_at) === null || _b === void 0 ? void 0 : _b.toISOString()) || null,
            status,
            errorMessage: status === 'error' ? (lastError === null || lastError === void 0 ? void 0 : lastError.error_message) || null : null,
        };
    }
}
exports.HalaxySyncService = HalaxySyncService;
// Export singleton instance
let syncServiceInstance = null;
function getHalaxySyncService() {
    if (!syncServiceInstance) {
        syncServiceInstance = new HalaxySyncService();
    }
    return syncServiceInstance;
}
//# sourceMappingURL=sync-service.js.map