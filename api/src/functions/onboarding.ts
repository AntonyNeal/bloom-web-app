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
import { DefaultAzureCredential } from '@azure/identity';
import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';

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
        profile?: {
          registrationType?: string;
          qualificationDetails?: string;
          helpsWith?: string[];
          therapeuticApproaches?: string[];
          ageGroups?: string[];
          yearsExperience?: number;
          languages?: string;
          whyPsychology?: string;
          mostRewarding?: string;
          therapeuticStyle?: string;
          specialExpertise?: string;
          outsideInterests?: string;
          medicareProvider?: boolean;
          ndisRegistered?: boolean;
          sessionTypes?: string[];
        };
      };

      const { password, displayName, bio, phone, profile } = body;

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

      // Find the Halaxy practitioner that was created by admin earlier in the workflow
      // The admin must verify the practitioner exists in Halaxy before sending the onboarding email
      // If the practitioner doesn't exist, that means the workflow wasn't followed correctly
      const halaxyClient = new HalaxyClient();
      
      // First try to find practitioner by email
      let halaxyPractitioner = await halaxyClient.findPractitionerByEmail(practitionerInfo.email.trim());
      
      // If not found by email, try by name (email in Halaxy might be different)
      if (!halaxyPractitioner) {
        context.log(`Practitioner not found by email ${practitionerInfo.email}, trying by name: ${practitionerInfo.first_name} ${practitionerInfo.last_name}`);
        halaxyPractitioner = await halaxyClient.findPractitionerByName(
          practitionerInfo.first_name?.trim() || '',
          practitionerInfo.last_name?.trim() || ''
        );
      }
      
      if (!halaxyPractitioner) {
        context.error(`Halaxy practitioner not found for ${practitionerInfo.first_name} ${practitionerInfo.last_name} (${practitionerInfo.email}). Admin must create the practitioner in Halaxy before sending the onboarding email.`);
        return {
          status: 400,
          jsonBody: {
            error: 'Halaxy practitioner not found. Please contact the admin - the practitioner must be set up in Halaxy before onboarding can complete.'
          }
        };
      }
      
      const halaxyPractitionerId = halaxyPractitioner.id;
      context.log(`✅ Found existing Halaxy practitioner: ${halaxyPractitionerId} for ${practitionerInfo.first_name} ${practitionerInfo.last_name}`);
      
      // Try to find their PractitionerRole (optional)
      let halaxyPractitionerRoleId: string | null = null;
      try {
        const roles = await halaxyClient.getPractitionerRolesByPractitioner(halaxyPractitionerId);
        if (roles.length > 0) {
          halaxyPractitionerRoleId = roles[0].id;
          context.log(`✅ Found Halaxy PractitionerRole: ${halaxyPractitionerRoleId}`);
        }
      } catch (roleError) {
        context.warn(`Could not find PractitionerRole for ${halaxyPractitionerId}:`, roleError);
      }

      // Update practitioner to mark onboarding complete
      // Store Azure AD Object ID and company email for authentication mapping
      // Also store profile questionnaire data for website bio generation
      const result = await pool.request()
        .input('token', sql.NVarChar, token)
        .input('halaxy_practitioner_id', sql.NVarChar, halaxyPractitionerId)
        .input('halaxy_practitioner_role_id', sql.NVarChar, halaxyPractitionerRoleId)
        .input('azure_ad_object_id', sql.NVarChar, azureObjectId)
        .input('company_email', sql.NVarChar, companyEmail)
        // Profile questionnaire fields
        .input('registration_type', sql.NVarChar, profile?.registrationType || null)
        .input('qualification_details', sql.NVarChar, profile?.qualificationDetails || null)
        .input('helps_with', sql.NVarChar, profile?.helpsWith ? JSON.stringify(profile.helpsWith) : null)
        .input('therapeutic_approaches', sql.NVarChar, profile?.therapeuticApproaches ? JSON.stringify(profile.therapeuticApproaches) : null)
        .input('age_groups', sql.NVarChar, profile?.ageGroups ? JSON.stringify(profile.ageGroups) : null)
        .input('experience_years', sql.Int, profile?.yearsExperience || null)
        .input('languages', sql.NVarChar, profile?.languages || null)
        .input('why_psychology', sql.NVarChar, profile?.whyPsychology || null)
        .input('most_rewarding', sql.NVarChar, profile?.mostRewarding || null)
        .input('therapeutic_style', sql.NVarChar, profile?.therapeuticStyle || null)
        .input('special_expertise', sql.NVarChar, profile?.specialExpertise || null)
        .input('outside_interests', sql.NVarChar, profile?.outsideInterests || null)
        .input('medicare_provider', sql.Bit, profile?.medicareProvider ? 1 : 0)
        .input('ndis_registered', sql.Bit, profile?.ndisRegistered ? 1 : 0)
        .input('session_types', sql.NVarChar, profile?.sessionTypes ? JSON.stringify(profile.sessionTypes) : null)
        .query(`
          UPDATE practitioners
          SET 
            halaxy_practitioner_id = COALESCE(@halaxy_practitioner_id, halaxy_practitioner_id),
            halaxy_practitioner_role_id = COALESCE(@halaxy_practitioner_role_id, halaxy_practitioner_role_id),
            azure_ad_object_id = COALESCE(@azure_ad_object_id, azure_ad_object_id),
            company_email = COALESCE(@company_email, company_email),
            -- Profile questionnaire fields
            registration_type = COALESCE(@registration_type, registration_type),
            qualification_details = COALESCE(@qualification_details, qualification_details),
            helps_with = COALESCE(@helps_with, helps_with),
            therapeutic_approaches = COALESCE(@therapeutic_approaches, therapeutic_approaches),
            age_groups = COALESCE(@age_groups, age_groups),
            experience_years = COALESCE(@experience_years, experience_years),
            languages = COALESCE(@languages, languages),
            why_psychology = COALESCE(@why_psychology, why_psychology),
            most_rewarding = COALESCE(@most_rewarding, most_rewarding),
            therapeutic_style = COALESCE(@therapeutic_style, therapeutic_style),
            special_expertise = COALESCE(@special_expertise, special_expertise),
            outside_interests = COALESCE(@outside_interests, outside_interests),
            medicare_provider = COALESCE(@medicare_provider, medicare_provider),
            ndis_registered = COALESCE(@ndis_registered, ndis_registered),
            session_types = COALESCE(@session_types, session_types),
            profile_questionnaire_completed_at = CASE WHEN @registration_type IS NOT NULL THEN GETDATE() ELSE profile_questionnaire_completed_at END,
            onboarding_completed_at = GETDATE(),
            onboarding_token = NULL,
            onboarding_token_expires_at = NULL,
            updated_at = GETDATE()
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.first_name, INSERTED.last_name, INSERTED.halaxy_practitioner_id, INSERTED.azure_ad_object_id, INSERTED.company_email
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

      // Create clinical notes encryption key for this practitioner
      // Creates RSA key in Key Vault + wraps a DEK that's stored in DB
      let notesKeyCreated = false;
      if (azureObjectId) {
        try {
          const KEY_VAULT_NAME = process.env.KEY_VAULT_NAME || 'kv-bloom-notes';
          const KEY_VAULT_URL = `https://${KEY_VAULT_NAME}.vault.azure.net`;
          const keyName = `notes-key-${azureObjectId}`;
          
          const credential = new DefaultAzureCredential();
          const keyClient = new KeyClient(KEY_VAULT_URL, credential);
          
          // Create RSA key in Key Vault
          let rsaKey;
          try {
            rsaKey = await keyClient.createRsaKey(keyName, {
              keySize: 4096,
              keyOps: ['wrapKey', 'unwrapKey'],
              tags: {
                purpose: 'clinical-notes-dek-wrapping',
                practitioner: azureObjectId,
                email: practitioner.email,
                created: new Date().toISOString(),
              },
            });
          } catch (keyError: unknown) {
            const err = keyError as { code?: string; statusCode?: number };
            if (err.code === 'KeyAlreadyExists' || err.statusCode === 409) {
              rsaKey = await keyClient.getKey(keyName);
            } else {
              throw keyError;
            }
          }
          
          // Generate random DEK
          const dekBytes = new Uint8Array(32);
          crypto.getRandomValues(dekBytes);
          
          // Wrap DEK with RSA key
          const cryptoClient = new CryptographyClient(rsaKey.id!, credential);
          const wrapResult = await cryptoClient.wrapKey('RSA-OAEP-256', dekBytes);
          const wrappedDekBase64 = Buffer.from(wrapResult.result).toString('base64');
          
          // Store wrapped DEK in database
          await pool.request()
            .input('practitioner_id', sql.UniqueIdentifier, practitioner.id)
            .input('azure_object_id', sql.NVarChar, azureObjectId)
            .input('key_name', sql.NVarChar, rsaKey.name)
            .input('key_version', sql.NVarChar, rsaKey.properties.version)
            .input('wrapped_dek', sql.NVarChar, wrappedDekBase64)
            .query(`
              INSERT INTO practitioner_encryption_keys (
                practitioner_id, azure_object_id, key_name, key_version, 
                wrapped_dek, is_active, created_at
              ) VALUES (
                @practitioner_id, @azure_object_id, @key_name, @key_version,
                @wrapped_dek, 1, GETDATE()
              );
              
              UPDATE practitioners
              SET notes_enabled = 1, notes_key_created_at = GETDATE()
              WHERE id = @practitioner_id;
            `);
          
          notesKeyCreated = true;
          context.log(`✅ CLINICAL NOTES KEY CREATED for ${companyEmail || practitioner.email}`);
        } catch (keyError) {
          // Don't fail onboarding if key creation fails - can be done manually later
          context.warn(`⚠️ Failed to create clinical notes encryption key:`, keyError);
        }
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
            notesEnabled: notesKeyCreated,
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
