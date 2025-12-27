"use strict";
/**
 * Onboarding API Endpoint
 *
 * Handles practitioner onboarding:
 * - GET /api/onboarding/:token - Validate token and get practitioner info
 * - POST /api/onboarding/:token - Complete onboarding (set password)
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
const crypto = __importStar(require("crypto"));
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
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
/**
 * Hash password using PBKDF2
 */
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}
/**
 * Onboarding handler
 */
async function onboardingHandler(request, context) {
    var _a;
    context.log(`Onboarding request: ${request.method} ${request.url}`);
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return { status: 204, headers };
    }
    const token = request.params.token;
    if (!token) {
        return {
            status: 400,
            headers,
            jsonBody: { error: 'Token is required' },
        };
    }
    let pool = null;
    try {
        pool = await sql.connect(getConfig());
        // GET - Validate token and return practitioner info
        if (request.method === 'GET') {
            const result = await pool.request()
                .input('token', sql.NVarChar, token)
                .query(`
          SELECT 
            id,
            first_name,
            last_name,
            email,
            phone,
            ahpra_number,
            specializations,
            experience_years,
            profile_photo_url,
            display_name,
            bio,
            onboarding_token_expires_at,
            onboarding_completed_at
          FROM practitioners 
          WHERE onboarding_token = @token
        `);
            if (result.recordset.length === 0) {
                return {
                    status: 404,
                    headers,
                    jsonBody: { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
                };
            }
            const practitioner = result.recordset[0];
            // Check if already completed
            if (practitioner.onboarding_completed_at) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: 'Onboarding already completed', code: 'ALREADY_COMPLETED' },
                };
            }
            // Check if expired
            if (new Date() > new Date(practitioner.onboarding_token_expires_at)) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: 'Token has expired', code: 'TOKEN_EXPIRED' },
                };
            }
            // Return practitioner info for onboarding form
            return {
                status: 200,
                headers,
                jsonBody: {
                    valid: true,
                    practitioner: {
                        firstName: practitioner.first_name,
                        lastName: practitioner.last_name,
                        email: practitioner.email,
                        phone: practitioner.phone,
                        ahpraNumber: practitioner.ahpra_number,
                        specializations: practitioner.specializations ? JSON.parse(practitioner.specializations) : [],
                        experienceYears: practitioner.experience_years,
                        profilePhotoUrl: practitioner.profile_photo_url,
                        displayName: practitioner.display_name,
                        bio: practitioner.bio,
                    },
                },
            };
        }
        // POST - Complete onboarding
        if (request.method === 'POST') {
            const body = await request.json();
            const { password, displayName, bio, phone, contractAccepted } = body;
            // Validate password
            if (!password || password.length < 8) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: 'Password must be at least 8 characters' },
                };
            }
            // Check for password complexity
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            if (!hasUppercase || !hasLowercase || !hasNumber) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: 'Password must contain uppercase, lowercase, and a number' },
                };
            }
            // Require contract acceptance
            if (!contractAccepted) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: 'You must accept the Practitioner Agreement to continue' },
                };
            }
            // Get client IP for contract acceptance record
            const clientIp = ((_a = request.headers.get('x-forwarded-for')) === null || _a === void 0 ? void 0 : _a.split(',')[0]) ||
                request.headers.get('x-real-ip') ||
                'unknown';
            // Hash the password
            const passwordHash = hashPassword(password);
            // Update practitioner with contract acceptance
            const result = await pool.request()
                .input('token', sql.NVarChar, token)
                .input('password_hash', sql.NVarChar, passwordHash)
                .input('display_name', sql.NVarChar, displayName || null)
                .input('bio', sql.NVarChar, bio || null)
                .input('phone', sql.NVarChar, phone || null)
                .input('contract_ip_address', sql.NVarChar, clientIp)
                .query(`
          UPDATE practitioners
          SET 
            password_hash = @password_hash,
            display_name = COALESCE(@display_name, display_name),
            bio = COALESCE(@bio, bio),
            phone = COALESCE(@phone, phone),
            contract_accepted_at = GETDATE(),
            contract_version = '1.0',
            contract_ip_address = @contract_ip_address,
            onboarding_completed_at = GETDATE(),
            onboarding_token = NULL,
            onboarding_token_expires_at = NULL,
            updated_at = GETDATE()
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.first_name, INSERTED.last_name
          WHERE onboarding_token = @token
            AND onboarding_completed_at IS NULL
            AND onboarding_token_expires_at > GETDATE()
        `);
            if (result.recordset.length === 0) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: 'Invalid or expired token' },
                };
            }
            const practitioner = result.recordset[0];
            context.log(`Onboarding completed for practitioner ${practitioner.id} (${practitioner.email})`);
            return {
                status: 200,
                headers,
                jsonBody: {
                    success: true,
                    message: 'Onboarding completed successfully',
                    practitioner: {
                        id: practitioner.id,
                        email: practitioner.email,
                        firstName: practitioner.first_name,
                        lastName: practitioner.last_name,
                    },
                },
            };
        }
        return {
            status: 405,
            headers,
            jsonBody: { error: 'Method not allowed' },
        };
    }
    catch (error) {
        context.error('Error in onboarding handler:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return {
            status: 500,
            headers,
            jsonBody: { error: errorMessage },
        };
    }
    finally {
        if (pool) {
            await pool.close();
        }
    }
}
functions_1.app.http('onboarding', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'onboarding/{token}',
    handler: onboardingHandler,
});
exports.default = onboardingHandler;
//# sourceMappingURL=onboarding.js.map