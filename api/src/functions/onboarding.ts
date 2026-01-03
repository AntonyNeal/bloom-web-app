/**
 * Onboarding API Endpoint
 * 
 * Handles practitioner onboarding:
 * - GET /api/onboarding/:token - Validate token and get practitioner info
 * - POST /api/onboarding/:token - Complete onboarding (set password, create Azure AD user)
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import * as crypto from 'crypto';
import { createAzureUser, findAzureUserByEmail } from '../services/azure-ad';

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
            favorite_flower,
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
            favoriteFlower: practitioner.favorite_flower, // Zoe's surprise 🌸
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
        contractAccepted?: boolean;
      };

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
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-real-ip') || 
                       'unknown';

      // Hash the password for local backup auth (Azure AD is primary)
      const passwordHash = hashPassword(password);

      // First, get the practitioner info to create Azure AD user
      const practitionerResult = await pool.request()
        .input('token', sql.NVarChar, token)
        .query(`
          SELECT id, email, first_name, last_name, display_name
          FROM practitioners 
          WHERE onboarding_token = @token
            AND onboarding_completed_at IS NULL
            AND onboarding_token_expires_at > GETDATE()
        `);

      if (practitionerResult.recordset.length === 0) {
        return {
          status: 400,
          headers,
          jsonBody: { error: 'Invalid or expired token' },
        };
      }

      const practitionerInfo = practitionerResult.recordset[0];

      // Create Azure AD B2C user account
      let azureObjectId: string | null = null;
      try {
        // Check if user already exists (in case of retry)
        azureObjectId = await findAzureUserByEmail(practitionerInfo.email);
        
        if (!azureObjectId) {
          // Create new Azure AD user with their chosen password
          const azureUser = await createAzureUser({
            email: practitionerInfo.email,
            firstName: practitionerInfo.first_name,
            lastName: practitionerInfo.last_name,
            displayName: displayName || practitionerInfo.display_name || `${practitionerInfo.first_name} ${practitionerInfo.last_name}`,
            password,
          });
          azureObjectId = azureUser.id;
          context.log(`Created Azure AD user for ${practitionerInfo.email}: ${azureObjectId}`);
        } else {
          context.log(`Azure AD user already exists for ${practitionerInfo.email}: ${azureObjectId}`);
        }
      } catch (azureError) {
        context.error('Failed to create Azure AD user:', azureError);
        // Don't fail the entire onboarding - we can create the Azure AD user later
        // But log it clearly so we can address it
        context.warn(`Azure AD user creation failed for ${practitionerInfo.email}. User will need manual Azure AD account setup.`);
      }

      // Update practitioner with contract acceptance and Azure AD Object ID
      const result = await pool.request()
        .input('token', sql.NVarChar, token)
        .input('password_hash', sql.NVarChar, passwordHash)
        .input('display_name', sql.NVarChar, displayName || null)
        .input('bio', sql.NVarChar, bio || null)
        .input('phone', sql.NVarChar, phone || null)
        .input('contract_ip_address', sql.NVarChar, clientIp)
        .input('azure_ad_object_id', sql.NVarChar, azureObjectId)
        .query(`
          UPDATE practitioners
          SET 
            password_hash = @password_hash,
            display_name = COALESCE(@display_name, display_name),
            bio = COALESCE(@bio, bio),
            phone = COALESCE(@phone, phone),
            azure_ad_object_id = @azure_ad_object_id,
            contract_accepted_at = GETDATE(),
            contract_version = '1.0',
            contract_ip_address = @contract_ip_address,
            onboarding_completed_at = GETDATE(),
            onboarding_token = NULL,
            onboarding_token_expires_at = NULL,
            updated_at = GETDATE()
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.first_name, INSERTED.last_name, INSERTED.azure_ad_object_id
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
      context.log(`Onboarding completed for practitioner ${practitioner.id} (${practitioner.email}), Azure AD: ${practitioner.azure_ad_object_id || 'not created'}`);

      // Notify admin if Azure AD creation failed
      if (!azureObjectId) {
        context.warn(`ATTENTION: Practitioner ${practitioner.email} completed onboarding but Azure AD user was not created. Manual intervention required.`);
      }

      return {
        status: 200,
        headers,
        jsonBody: {
          success: true,
          message: 'Onboarding completed successfully! You can now sign in with your email address.',
          practitioner: {
            id: practitioner.id,
            email: practitioner.email,
            firstName: practitioner.first_name,
            lastName: practitioner.last_name,
          },
          azureAd: {
            created: !!azureObjectId,
            message: azureObjectId 
              ? 'Your account has been created. You can sign in with your email address.'
              : 'Your account setup is pending. An admin will complete your account setup shortly.',
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
