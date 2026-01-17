/**
 * Onboarding API Endpoint
 * 
 * Handles practitioner onboarding:
 * - GET /api/onboarding/:token - Validate token and get practitioner info
 * - POST /api/onboarding/:token - Complete onboarding (set password, create Azure AD user, create Halaxy clinician)
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { createAzureUser, findAzureUserByEmail } from '../services/azure-ad';
import { HalaxyClient } from '../services/halaxy/client';
import { sendWelcomeEmail } from '../services/email';

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

      // First, get the practitioner info to create Azure AD user and Halaxy clinician
      const practitionerResult = await pool.request()
        .input('token', sql.NVarChar, token)
        .query(`
          SELECT id, email, first_name, last_name, display_name, phone, ahpra_number, specializations
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

      // Create Azure AD account with @life-psychology.com.au email
      // This is REQUIRED - onboarding cannot proceed without it
      let azureObjectId: string | null = null;
      let companyEmail: string | null = null;
      let licenseAssigned = false;
      
      try {
        // Generate their company email based on name
        const username = `${practitionerInfo.first_name.toLowerCase()}.${practitionerInfo.last_name.toLowerCase()}`.replace(/[^a-z.]/g, '');
        const expectedEmail = `${username}@life-psychology.com.au`;
        
        // Check if user already exists (in case of retry)
        azureObjectId = await findAzureUserByEmail(expectedEmail);
        
        if (!azureObjectId) {
          // Create new Azure AD user with their chosen password
          const azureUser = await createAzureUser({
            email: practitionerInfo.email,  // Their personal email stored as contact
            firstName: practitionerInfo.first_name,
            lastName: practitionerInfo.last_name,
            displayName: displayName || practitionerInfo.display_name || `${practitionerInfo.first_name} ${practitionerInfo.last_name}`,
            password,
          });
          azureObjectId = azureUser.id;
          companyEmail = azureUser.userPrincipalName;
          licenseAssigned = azureUser.licenseAssigned;
          context.log(`Created Azure AD user ${companyEmail} (ID: ${azureObjectId}) for ${practitionerInfo.email}, License: ${licenseAssigned ? 'assigned' : 'not assigned'}`);
        } else {
          companyEmail = expectedEmail;
          context.log(`Azure AD user already exists: ${companyEmail} (ID: ${azureObjectId})`);
        }
      } catch (azureError) {
        const errorMessage = azureError instanceof Error ? azureError.message : String(azureError);
        const errorStack = azureError instanceof Error ? azureError.stack : '';
        context.error('Failed to create Azure AD user:', errorMessage);
        context.error('Azure AD error stack:', errorStack);
        // Azure AD user creation is required - fail onboarding
        return {
          status: 500,
          headers,
          jsonBody: { 
            error: 'Unable to create your company email account. Please contact admin@life-psychology.com.au for assistance.',
            code: 'AZURE_AD_CREATION_FAILED',
            details: errorMessage, // Include error details for debugging
          },
        };
      }

      // Try to find existing Halaxy practitioner (created earlier by admin)
      // This is optional - the practitioner should already exist from the admin workflow
      let halaxyPractitionerId: string | null = null;
      let halaxyPractitionerRoleId: string | null = null;
      
      const halaxyClient = new HalaxyClient();
      
      try {
        // Try to find existing practitioner by email using the existing method
        // createOrFindPractitioner will find existing OR create new if not found
        const halaxyPractitioner = await halaxyClient.createOrFindPractitioner({
          firstName: practitionerInfo.first_name,
          lastName: practitionerInfo.last_name,
          email: practitionerInfo.email,
          phone: practitionerInfo.phone,
          ahpraNumber: practitionerInfo.ahpra_number,
        });
        
        halaxyPractitionerId = halaxyPractitioner.id;
        context.log(`✅ Found/created Halaxy practitioner: ${halaxyPractitionerId} for ${practitionerInfo.email}`);
        
        // Try to find their PractitionerRole
        try {
          const roles = await halaxyClient.getPractitionerRolesByPractitioner(halaxyPractitionerId);
          if (roles.length > 0) {
            halaxyPractitionerRoleId = roles[0].id;
            context.log(`✅ Found Halaxy PractitionerRole: ${halaxyPractitionerRoleId}`);
          }
        } catch (roleError) {
          context.warn(`Could not find PractitionerRole for ${halaxyPractitionerId}:`, roleError);
        }
      } catch (halaxyError) {
        const errorMessage = halaxyError instanceof Error ? halaxyError.message : String(halaxyError);
        context.warn('Could not look up/create Halaxy practitioner (non-fatal):', errorMessage);
        // Don't fail onboarding - Halaxy lookup is optional
        // Azure AD account creation is the critical part
      }

      // Update practitioner to mark onboarding complete
      // Note: Dev database has minimal schema - only updating columns that exist
      const result = await pool.request()
        .input('token', sql.NVarChar, token)
        .input('halaxy_practitioner_id', sql.NVarChar, halaxyPractitionerId)
        .query(`
          UPDATE practitioners
          SET 
            halaxy_practitioner_id = COALESCE(@halaxy_practitioner_id, halaxy_practitioner_id),
            onboarding_completed_at = GETDATE(),
            onboarding_token = NULL,
            onboarding_token_expires_at = NULL,
            updated_at = GETDATE()
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.first_name, INSERTED.last_name, INSERTED.halaxy_practitioner_id
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
      context.log(`Onboarding completed for practitioner ${practitioner.id}`);
      context.log(`  Company email: ${companyEmail || 'not created'}`);
      context.log(`  Halaxy Practitioner ID: ${practitioner.halaxy_practitioner_id || 'not created'}`);
      context.log(`  Halaxy PractitionerRole ID: ${halaxyPractitionerRoleId || 'not created'}`);
      
      // Log their new email prominently
      if (companyEmail) {
        context.log(`✅ NEW EMAIL CREATED: ${companyEmail}`);
      }
      
      // Log Halaxy IDs
      if (practitioner.halaxy_practitioner_id) {
        context.log(`✅ HALAXY CLINICIAN CREATED: ${practitioner.halaxy_practitioner_id}`);
      }
      if (halaxyPractitionerRoleId) {
        context.log(`✅ HALAXY ROLE: ${halaxyPractitionerRoleId}`);
      }

      // Notify admin if Azure AD creation failed
      if (!companyEmail) {
        context.warn(`ATTENTION: Practitioner ${practitionerInfo.email} completed onboarding but company email was not created. Manual intervention required.`);
      } else if (!licenseAssigned) {
        context.warn(`ATTENTION: User ${companyEmail} created but M365 license was not assigned. Manual license assignment required.`);
      }

      // Send welcome email to their personal email with login details
      if (companyEmail) {
        try {
          const emailResult = await sendWelcomeEmail({
            firstName: practitionerInfo.first_name,
            personalEmail: practitionerInfo.email,
            companyEmail: companyEmail,
          });
          if (emailResult.success) {
            context.log(`✅ Welcome email sent to ${practitionerInfo.email}`);
          } else {
            context.warn(`⚠️ Failed to send welcome email: ${emailResult.error}`);
          }
        } catch (emailError) {
          context.warn(`⚠️ Error sending welcome email:`, emailError);
          // Don't fail onboarding if email fails - they can still log in
        }
      }

      return {
        status: 200,
        headers,
        jsonBody: {
          success: true,
          message: companyEmail 
            ? `Welcome to Life Psychology! Your new email is ${companyEmail}`
            : 'Onboarding completed! Your email account is being set up.',
          practitioner: {
            id: practitioner.id,
            personalEmail: practitionerInfo.email,
            companyEmail: companyEmail,
            halaxyId: practitioner.halaxy_practitioner_id,
            firstName: practitioner.first_name,
            lastName: practitioner.last_name,
          },
          account: {
            created: !!companyEmail,
            email: companyEmail,
            licenseAssigned,
            halaxyCreated: !!halaxyPractitionerId,
            message: companyEmail 
              ? licenseAssigned
                ? `Your new email is ${companyEmail}. You can sign in to Outlook and Bloom with this address.`
                : `Your new email is ${companyEmail}. Your mailbox is being set up - please wait a few minutes before signing in.`
              : 'Your email account is being set up. An admin will send you login details shortly.',
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
