/**
 * Onboarding API Endpoint
 * 
 * Handles practitioner onboarding:
 * - GET /api/onboarding/:token - Validate token and get practitioner info
 * - POST /api/onboarding/:token - Complete onboarding (set password)
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import * as crypto from 'crypto';

// Support both connection string and individual credentials
const getConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) {
    return connectionString;
  }
  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
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
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Onboarding handler
 */
async function onboardingHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
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

  let pool: sql.ConnectionPool | null = null;

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
      const body = await request.json() as {
        password: string;
        displayName?: string;
        bio?: string;
        phone?: string;
      };

      const { password, displayName, bio, phone } = body;

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

      // Hash the password
      const passwordHash = hashPassword(password);

      // Update practitioner
      const result = await pool.request()
        .input('token', sql.NVarChar, token)
        .input('password_hash', sql.NVarChar, passwordHash)
        .input('display_name', sql.NVarChar, displayName || null)
        .input('bio', sql.NVarChar, bio || null)
        .input('phone', sql.NVarChar, phone || null)
        .query(`
          UPDATE practitioners
          SET 
            password_hash = @password_hash,
            display_name = COALESCE(@display_name, display_name),
            bio = COALESCE(@bio, bio),
            phone = COALESCE(@phone, phone),
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
  } catch (error) {
    context.error('Error in onboarding handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return {
      status: 500,
      headers,
      jsonBody: { error: errorMessage },
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

app.http('onboarding', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'onboarding/{token}',
  handler: onboardingHandler,
});

export default onboardingHandler;
