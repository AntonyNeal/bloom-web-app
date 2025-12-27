"use strict";
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
// Support both connection string and individual credentials
const getConfig = () => {
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (connectionString) {
        return connectionString;
    }
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
async function applicationsHandler(req, context) {
    const method = req.method;
    const id = req.params.id;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
    if (method === 'OPTIONS') {
        return { status: 204, headers };
    }
    try {
        const config = getConfig();
        const pool = await sql.connect(config);
        if (method === 'GET' && !id) {
            context.log('Fetching all applications');
            const result = await pool
                .request()
                .query('SELECT * FROM applications ORDER BY created_at DESC');
            return {
                status: 200,
                headers,
                jsonBody: result.recordset,
            };
        }
        if (method === 'GET' && id) {
            context.log(`Fetching application ${id}`);
            const result = await pool
                .request()
                .input('id', sql.Int, id)
                .query('SELECT * FROM applications WHERE id = @id');
            if (result.recordset.length === 0) {
                return {
                    status: 404,
                    headers,
                    jsonBody: { error: 'Application not found' },
                };
            }
            return {
                status: 200,
                headers,
                jsonBody: result.recordset[0],
            };
        }
        if (method === 'POST') {
            context.log('Creating new application');
            const body = (await req.json());
            const { first_name, last_name, email, phone, ahpra_registration, specializations, experience_years, cv_url, certificate_url, photo_url, cover_letter, qualification_type, qualification_check, } = body;
            // Log the qualification data for debugging (will be stored once DB is updated)
            if (qualification_type || qualification_check) {
                context.log('Qualification data received (not stored yet):', {
                    qualification_type,
                    qualification_check,
                });
            }
            if (!first_name || !last_name || !email || !ahpra_registration) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: 'Missing required fields' },
                };
            }
            const result = await pool
                .request()
                .input('first_name', sql.NVarChar, first_name)
                .input('last_name', sql.NVarChar, last_name)
                .input('email', sql.NVarChar, email)
                .input('phone', sql.NVarChar, phone || null)
                .input('ahpra_registration', sql.NVarChar, ahpra_registration)
                .input('specializations', sql.NVarChar, specializations ? JSON.stringify(specializations) : null)
                .input('experience_years', sql.Int, experience_years || 0)
                .input('cv_url', sql.NVarChar, cv_url || null)
                .input('certificate_url', sql.NVarChar, certificate_url || null)
                .input('photo_url', sql.NVarChar, photo_url || null)
                .input('cover_letter', sql.NVarChar, cover_letter || null)
                .input('qualification_type', sql.NVarChar, qualification_type || null)
                .input('qualification_check', sql.NVarChar, qualification_check ? JSON.stringify(qualification_check) : null).query(`
          INSERT INTO applications (
            first_name, last_name, email, phone, ahpra_registration,
            specializations, experience_years, cv_url, certificate_url,
            photo_url, cover_letter, qualification_type, qualification_check
          )
          OUTPUT INSERTED.*
          VALUES (
            @first_name, @last_name, @email, @phone, @ahpra_registration,
            @specializations, @experience_years, @cv_url, @certificate_url,
            @photo_url, @cover_letter, @qualification_type, @qualification_check
          )
        `);
            return {
                status: 201,
                headers,
                jsonBody: result.recordset[0],
            };
        }
        if (method === 'PUT' && id) {
            context.log(`Updating application ${id}`);
            const body = (await req.json());
            const { status, reviewed_by, admin_notes, interview_scheduled_at, interview_notes, decision_reason } = body;
            if (!status) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: 'Status is required' },
                };
            }
            // Valid statuses for the application workflow
            const validStatuses = [
                'submitted',
                'reviewing',
                'denied',
                'waitlisted',
                'interview_scheduled',
                'accepted',
                'approved', // Legacy
                'rejected', // Legacy
            ];
            if (!validStatuses.includes(status)) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                };
            }
            // Build dynamic update query based on provided fields
            const request = pool.request()
                .input('id', sql.Int, id)
                .input('status', sql.NVarChar, status)
                .input('reviewed_by', sql.NVarChar, reviewed_by || null)
                .input('admin_notes', sql.NVarChar, admin_notes || null)
                .input('interview_scheduled_at', sql.DateTime2, interview_scheduled_at ? new Date(interview_scheduled_at) : null)
                .input('interview_notes', sql.NVarChar, interview_notes || null)
                .input('decision_reason', sql.NVarChar, decision_reason || null);
            // Set timestamp columns based on status change
            let additionalColumns = '';
            if (status === 'waitlisted') {
                additionalColumns = ', waitlisted_at = GETDATE()';
            }
            else if (status === 'accepted') {
                additionalColumns = ', accepted_at = GETDATE()';
            }
            const result = await request.query(`
          UPDATE applications
          SET status = @status, 
              reviewed_by = @reviewed_by, 
              reviewed_at = GETDATE(),
              admin_notes = COALESCE(@admin_notes, admin_notes),
              interview_scheduled_at = COALESCE(@interview_scheduled_at, interview_scheduled_at),
              interview_notes = COALESCE(@interview_notes, interview_notes),
              decision_reason = COALESCE(@decision_reason, decision_reason)
              ${additionalColumns}
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
            if (result.recordset.length === 0) {
                return {
                    status: 404,
                    headers,
                    jsonBody: { error: 'Application not found' },
                };
            }
            context.log(`Application ${id} updated to status: ${status}`);
            return {
                status: 200,
                headers,
                jsonBody: result.recordset[0],
            };
        }
        return {
            status: 405,
            headers,
            jsonBody: { error: 'Method not allowed' },
        };
    }
    catch (error) {
        context.error('Error in applications handler:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return {
            status: 500,
            headers,
            jsonBody: { error: errorMessage },
        };
    }
}
functions_1.app.http('applications', {
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'applications/{id?}',
    handler: applicationsHandler,
});
//# sourceMappingURL=applications.js.map