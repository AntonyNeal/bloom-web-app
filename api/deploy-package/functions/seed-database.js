"use strict";
/**
 * Database Seed Function
 *
 * HTTP trigger to seed the database with Dr Sarah Chen mock data.
 * Only available in development/staging environments.
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
const functions_1 = require("@azure/functions");
const sql = __importStar(require("mssql"));
// ============================================================================
// Database Connection
// ============================================================================
const getConfig = () => {
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (connectionString)
        return connectionString;
    return {
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: {
            encrypt: true,
            trustServerCertificate: false,
        },
    };
};
// ============================================================================
// Dr Sarah Chen Seed Data
// ============================================================================
const PRACTITIONER_ID = 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890';
async function seedDrSarahChen(pool) {
    // Check if practitioner already exists
    const existingPractitioner = await pool
        .request()
        .input('id', sql.UniqueIdentifier, PRACTITIONER_ID)
        .query(`SELECT id FROM practitioners WHERE id = @id`);
    if (existingPractitioner.recordset.length > 0) {
        // Clean up existing data for fresh seed
        await pool.request()
            .input('practitionerId', sql.UniqueIdentifier, PRACTITIONER_ID)
            .query(`DELETE FROM sessions WHERE practitioner_id = @practitionerId`);
        await pool.request()
            .input('practitionerId', sql.UniqueIdentifier, PRACTITIONER_ID)
            .query(`DELETE FROM sync_status WHERE practitioner_id = @practitionerId`);
        await pool.request()
            .input('practitionerId', sql.UniqueIdentifier, PRACTITIONER_ID)
            .query(`DELETE FROM clients WHERE practitioner_id = @practitionerId`);
        await pool.request()
            .input('practitionerId', sql.UniqueIdentifier, PRACTITIONER_ID)
            .query(`DELETE FROM practitioners WHERE id = @practitionerId`);
    }
    // Create practitioner
    await pool.request()
        .input('id', sql.UniqueIdentifier, PRACTITIONER_ID)
        .query(`
      INSERT INTO practitioners (
        id, halaxy_practitioner_id, halaxy_practitioner_role_id,
        first_name, last_name, display_name, email, phone,
        ahpra_number, qualification_type, specializations, timezone,
        weekly_session_target, weekly_revenue_target, monthly_revenue_target,
        status, last_synced_at
      ) VALUES (
        @id, 'HAL-PRAC-001', 'HAL-PR-001',
        'Sarah', 'Chen', 'Dr. Sarah Chen', 'sarah.chen@bloom.health', '0412 345 678',
        'PSY0012345', 'clinical', '["Anxiety", "Depression", "PTSD", "Trauma", "Relationship Issues"]', 'Australia/Sydney',
        25, 5500.00, 22000.00,
        'active', GETDATE()
      )
    `);
    // Client data
    const clients = [
        { id: 'C1111111-1111-1111-1111-111111111111', halaxyId: 'HAL-PAT-001', firstName: 'Jessica', lastName: 'Mitchell', initials: 'JM', gender: 'female', presentingIssues: '["Anxiety", "Depression"]', mhcpUsed: 8, relationshipMonths: 14, totalSessions: 32 },
        { id: 'C2222222-2222-2222-2222-222222222222', halaxyId: 'HAL-PAT-002', firstName: 'Alex', lastName: 'Kumar', initials: 'AK', gender: 'male', presentingIssues: '["Work Stress", "Relationship Issues"]', mhcpUsed: 3, relationshipMonths: 2, totalSessions: 3 },
        { id: 'C3333333-3333-3333-3333-333333333333', halaxyId: 'HAL-PAT-003', firstName: 'Rebecca', lastName: 'Liu', initials: 'RL', gender: 'female', presentingIssues: '["PTSD", "Trauma"]', mhcpUsed: 6, relationshipMonths: 18, totalSessions: 45 },
        { id: 'C4444444-4444-4444-4444-444444444444', halaxyId: 'HAL-PAT-004', firstName: 'Benjamin', lastName: 'Taylor', initials: 'BT', gender: 'male', presentingIssues: '["Grief", "Adjustment Disorder"]', mhcpUsed: 0, relationshipMonths: 0, totalSessions: 0 },
        { id: 'C5555555-5555-5555-5555-555555555555', halaxyId: 'HAL-PAT-005', firstName: 'Mia', lastName: 'Williams', initials: 'MW', gender: 'female', presentingIssues: '["Social Anxiety", "Self-esteem"]', mhcpUsed: 9, relationshipMonths: 8, totalSessions: 18 },
        { id: 'C6666666-6666-6666-6666-666666666666', halaxyId: 'HAL-PAT-006', firstName: 'Daniel', lastName: 'Jones', initials: 'DJ', gender: 'male', presentingIssues: '["Burnout", "Career Stress"]', mhcpUsed: 4, relationshipMonths: 5, totalSessions: 12 },
        { id: 'C7777777-7777-7777-7777-777777777777', halaxyId: 'HAL-PAT-007', firstName: 'Sophie', lastName: 'Patel', initials: 'SP', gender: 'female', presentingIssues: '["Panic Disorder", "Agoraphobia"]', mhcpUsed: 7, relationshipMonths: 10, totalSessions: 24 },
        { id: 'C8888888-8888-8888-8888-888888888888', halaxyId: 'HAL-PAT-008', firstName: 'Ethan', lastName: 'Nguyen', initials: 'EN', gender: 'male', presentingIssues: '["OCD", "Anxiety"]', mhcpUsed: 5, relationshipMonths: 6, totalSessions: 14 },
        { id: 'C9999999-9999-9999-9999-999999999999', halaxyId: 'HAL-PAT-009', firstName: 'Charlotte', lastName: 'Hughes', initials: 'CH', gender: 'female', presentingIssues: '["Bipolar Disorder", "Depression"]', mhcpUsed: 15, relationshipMonths: 24, totalSessions: 56 },
        { id: 'CAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', halaxyId: 'HAL-PAT-010', firstName: 'Laura', lastName: 'Garcia', initials: 'LG', gender: 'female', presentingIssues: '["Perinatal Anxiety", "Adjustment"]', mhcpUsed: 2, relationshipMonths: 1, totalSessions: 2 },
        { id: 'CBBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB', halaxyId: 'HAL-PAT-011', firstName: 'Kate', lastName: 'Morrison', initials: 'KM', gender: 'female', presentingIssues: '["Eating Disorder", "Body Image"]', mhcpUsed: 28, relationshipMonths: 12, totalSessions: 36 },
        { id: 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC', halaxyId: 'HAL-PAT-012', firstName: 'Thomas', lastName: 'Wright', initials: 'TW', gender: 'male', presentingIssues: '["Insomnia", "Stress Management"]', mhcpUsed: 0, relationshipMonths: 4, totalSessions: 8 },
    ];
    // Insert clients
    for (const client of clients) {
        const firstSessionDate = client.relationshipMonths > 0
            ? new Date(Date.now() - client.relationshipMonths * 30 * 24 * 60 * 60 * 1000)
            : null;
        await pool.request()
            .input('id', sql.UniqueIdentifier, client.id)
            .input('halaxyId', sql.NVarChar, client.halaxyId)
            .input('practitionerId', sql.UniqueIdentifier, PRACTITIONER_ID)
            .input('firstName', sql.NVarChar, client.firstName)
            .input('lastName', sql.NVarChar, client.lastName)
            .input('initials', sql.NVarChar, client.initials)
            .input('gender', sql.NVarChar, client.gender)
            .input('presentingIssues', sql.NVarChar, client.presentingIssues)
            .input('mhcpActive', sql.Bit, client.mhcpUsed > 0 ? 1 : 0)
            .input('mhcpUsed', sql.Int, client.mhcpUsed)
            .input('totalSessions', sql.Int, client.totalSessions)
            .input('firstSessionDate', sql.Date, firstSessionDate)
            .query(`
        INSERT INTO clients (
          id, halaxy_patient_id, practitioner_id,
          first_name, last_name, initials, gender,
          presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
          total_sessions, first_session_date, status
        ) VALUES (
          @id, @halaxyId, @practitionerId,
          @firstName, @lastName, @initials, @gender,
          @presentingIssues, @mhcpActive, 10, @mhcpUsed,
          @totalSessions, @firstSessionDate, 'active'
        )
      `);
    }
    // Today's date for sessions
    const today = new Date();
    // Session data helper
    const createSession = async (clientId, dayOffset, hourMinute, sessionNumber, status, billingType = 'medicare') => {
        const sessionDate = new Date(today);
        sessionDate.setDate(sessionDate.getDate() + dayOffset);
        const [hour, minute] = hourMinute.split(':').map(Number);
        sessionDate.setHours(hour, minute, 0, 0);
        const endTime = new Date(sessionDate);
        endTime.setMinutes(endTime.getMinutes() + 50);
        const invoiceAmount = billingType === 'private' ? 280.00 : 220.00;
        await pool.request()
            .input('halaxyId', sql.NVarChar, `HAL-APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
            .input('practitionerId', sql.UniqueIdentifier, PRACTITIONER_ID)
            .input('clientId', sql.UniqueIdentifier, clientId)
            .input('startTime', sql.DateTime2, sessionDate)
            .input('endTime', sql.DateTime2, endTime)
            .input('sessionNumber', sql.Int, sessionNumber)
            .input('status', sql.NVarChar, status)
            .input('billingType', sql.NVarChar, billingType)
            .input('invoiceAmount', sql.Decimal(10, 2), invoiceAmount)
            .query(`
        INSERT INTO sessions (
          halaxy_appointment_id, practitioner_id, client_id,
          scheduled_start_time, scheduled_end_time, duration_minutes,
          session_number, session_type, status, location_type,
          billing_type, invoice_amount
        ) VALUES (
          @halaxyId, @practitionerId, @clientId,
          @startTime, @endTime, 50,
          @sessionNumber, 'standard_consultation', @status, 'in-person',
          @billingType, @invoiceAmount
        )
      `);
    };
    // Today's sessions (5)
    await createSession(clients[0].id, 0, '09:00', 33, 'scheduled');
    await createSession(clients[1].id, 0, '10:30', 4, 'confirmed');
    await createSession(clients[2].id, 0, '13:00', 46, 'scheduled');
    await createSession(clients[3].id, 0, '14:30', 1, 'confirmed');
    await createSession(clients[4].id, 0, '16:00', 19, 'scheduled');
    // Yesterday's sessions (completed)
    await createSession(clients[5].id, -1, '09:00', 13, 'completed');
    await createSession(clients[6].id, -1, '10:30', 25, 'completed');
    await createSession(clients[7].id, -1, '13:00', 15, 'completed');
    await createSession(clients[8].id, -1, '15:00', 57, 'completed');
    // Two days ago (3 completed, 1 no-show)
    await createSession(clients[9].id, -2, '10:00', 3, 'completed');
    await createSession(clients[10].id, -2, '11:00', 37, 'completed');
    await createSession(clients[11].id, -2, '14:00', 9, 'completed', 'private');
    await createSession(clients[0].id, -2, '16:00', 32, 'no_show');
    // Three days ago (4 completed)
    await createSession(clients[1].id, -3, '09:00', 3, 'completed');
    await createSession(clients[4].id, -3, '10:30', 18, 'completed');
    await createSession(clients[6].id, -3, '13:00', 24, 'completed');
    await createSession(clients[8].id, -3, '15:00', 56, 'completed');
    // Four days ago (3 completed, 1 cancelled)
    await createSession(clients[2].id, -4, '09:00', 45, 'completed');
    await createSession(clients[5].id, -4, '10:30', 12, 'completed');
    await createSession(clients[7].id, -4, '13:00', 14, 'cancelled');
    await createSession(clients[10].id, -4, '15:00', 36, 'completed');
    // Tomorrow's sessions
    await createSession(clients[5].id, 1, '09:00', 14, 'confirmed');
    await createSession(clients[7].id, 1, '10:30', 16, 'scheduled');
    await createSession(clients[9].id, 1, '13:00', 4, 'confirmed');
    await createSession(clients[11].id, 1, '15:00', 10, 'scheduled', 'private');
    // Day after tomorrow
    await createSession(clients[0].id, 2, '10:00', 34, 'scheduled');
    await createSession(clients[6].id, 2, '14:00', 26, 'scheduled');
    await createSession(clients[8].id, 2, '16:00', 58, 'scheduled');
    // Earlier in month sessions (weeks 1-3 for monthly stats)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysSinceMonthStart = Math.floor((today.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000));
    // Only add historical sessions if we're past week 1
    if (daysSinceMonthStart > 7) {
        // Week 1 sessions
        await createSession(clients[0].id, -(daysSinceMonthStart - 2), '09:00', 30, 'completed');
        await createSession(clients[1].id, -(daysSinceMonthStart - 2), '10:00', 1, 'completed');
        await createSession(clients[2].id, -(daysSinceMonthStart - 3), '14:00', 43, 'completed');
        await createSession(clients[4].id, -(daysSinceMonthStart - 4), '11:00', 16, 'completed');
        await createSession(clients[5].id, -(daysSinceMonthStart - 5), '15:00', 10, 'completed');
    }
    if (daysSinceMonthStart > 14) {
        // Week 2 sessions
        await createSession(clients[6].id, -(daysSinceMonthStart - 8), '09:00', 22, 'completed');
        await createSession(clients[7].id, -(daysSinceMonthStart - 9), '11:00', 12, 'completed');
        await createSession(clients[8].id, -(daysSinceMonthStart - 9), '14:00', 54, 'completed');
        await createSession(clients[9].id, -(daysSinceMonthStart - 10), '10:00', 1, 'completed');
        await createSession(clients[10].id, -(daysSinceMonthStart - 11), '15:00', 34, 'completed');
        await createSession(clients[11].id, -(daysSinceMonthStart - 11), '16:00', 7, 'completed', 'private');
    }
    if (daysSinceMonthStart > 21) {
        // Week 3 sessions
        await createSession(clients[0].id, -(daysSinceMonthStart - 15), '09:00', 31, 'completed');
        await createSession(clients[2].id, -(daysSinceMonthStart - 16), '11:00', 44, 'completed');
        await createSession(clients[4].id, -(daysSinceMonthStart - 16), '14:00', 17, 'completed');
        await createSession(clients[6].id, -(daysSinceMonthStart - 17), '10:00', 23, 'completed');
        await createSession(clients[8].id, -(daysSinceMonthStart - 18), '15:00', 55, 'completed');
        await createSession(clients[10].id, -(daysSinceMonthStart - 18), '11:00', 35, 'completed');
        await createSession(clients[1].id, -(daysSinceMonthStart - 19), '09:00', 2, 'completed');
    }
    // Create sync status
    await pool.request()
        .input('practitionerId', sql.UniqueIdentifier, PRACTITIONER_ID)
        .query(`
      INSERT INTO sync_status (
        practitioner_id, is_connected, last_successful_sync, last_sync_attempt,
        consecutive_failures, pending_changes
      ) VALUES (
        @practitionerId, 1, GETDATE(), GETDATE(), 0, 0
      )
    `);
    // Count results
    const clientCount = await pool.request()
        .input('practitionerId', sql.UniqueIdentifier, PRACTITIONER_ID)
        .query(`SELECT COUNT(*) as count FROM clients WHERE practitioner_id = @practitionerId`);
    const sessionCount = await pool.request()
        .input('practitionerId', sql.UniqueIdentifier, PRACTITIONER_ID)
        .query(`SELECT COUNT(*) as count FROM sessions WHERE practitioner_id = @practitionerId`);
    return {
        practitionerId: PRACTITIONER_ID,
        clientsCreated: clientCount.recordset[0].count,
        sessionsCreated: sessionCount.recordset[0].count,
        message: 'Dr Sarah Chen practice data seeded successfully',
    };
}
// ============================================================================
// HTTP Handler
// ============================================================================
async function seedDatabaseHandler(req, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    };
    if (req.method === 'OPTIONS') {
        return { status: 204, headers };
    }
    // Only allow in development/staging
    const env = process.env.AZURE_FUNCTIONS_ENVIRONMENT || 'Development';
    if (env === 'Production') {
        return {
            status: 403,
            headers,
            jsonBody: { success: false, error: 'Seeding is not allowed in production' },
        };
    }
    try {
        context.log('Starting database seed...');
        const config = getConfig();
        const pool = await sql.connect(config);
        context.log('Connected to database, seeding Dr Sarah Chen data...');
        const result = await seedDrSarahChen(pool);
        context.log(`Seed complete: ${result.clientsCreated} clients, ${result.sessionsCreated} sessions`);
        await pool.close();
        return {
            status: 200,
            headers,
            jsonBody: { success: true, data: result },
        };
    }
    catch (error) {
        context.error('Seed error:', error);
        return {
            status: 500,
            headers,
            jsonBody: {
                success: false,
                error: error instanceof Error ? error.message : 'Seed failed',
            },
        };
    }
}
// ============================================================================
// Register Function
// ============================================================================
functions_1.app.http('seedDatabase', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'admin/seed',
    handler: seedDatabaseHandler,
});
exports.default = seedDatabaseHandler;
//# sourceMappingURL=seed-database.js.map