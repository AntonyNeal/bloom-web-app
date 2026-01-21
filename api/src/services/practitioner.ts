/**
 * Practitioner Service
 * 
 * Handles practitioner creation from accepted applications
 * and onboarding token management.
 */

import * as sql from 'mssql';
import * as crypto from 'crypto';
import { getDbConnection } from './database';

// Onboarding configuration
const ONBOARDING_TOKEN_EXPIRY_DAYS = 7;
const ONBOARDING_BASE_URL = process.env.ONBOARDING_BASE_URL || 'https://staging.bloom.life-psychology.com.au';

interface ApplicationData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  favorite_flower?: string; // Zoe's secret intel for onboarding surprise
  // Halaxy IDs (set during verification)
  practitioner_id?: string;
  practitioner_role_id?: string;
}

interface CreatePractitionerResult {
  success: boolean;
  practitionerId?: string;
  onboardingToken?: string;
  onboardingLink?: string;
  error?: string;
}

/**
 * Generate a secure onboarding token
 */
function generateOnboardingToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a practitioner record from an accepted application
 */
export async function createPractitionerFromApplication(
  pool: sql.ConnectionPool,
  application: ApplicationData
): Promise<CreatePractitionerResult> {
  try {
    console.log(`[PractitionerService] Creating practitioner from application ${application.id}`);

    // Check if practitioner already exists for this email
    const emailCheck = await pool.request()
      .input('email', sql.NVarChar, application.email)
      .query(`
        SELECT id FROM practitioners WHERE email = @email
      `);

    if (emailCheck.recordset.length > 0) {
      console.log(`[PractitionerService] Email ${application.email} already exists`);
      return {
        success: false,
        error: 'A practitioner with this email already exists',
      };
    }

    // Generate onboarding token
    const onboardingToken = generateOnboardingToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + ONBOARDING_TOKEN_EXPIRY_DAYS);

    // Use verified Halaxy IDs from application, or generate placeholder if not verified
    const halaxyPractitionerId = application.practitioner_id || `app-${application.id}`;
    const halaxyPractitionerRoleId = application.practitioner_role_id || null;
    
    console.log(`[PractitionerService] Using Halaxy IDs: practitioner=${halaxyPractitionerId}, role=${halaxyPractitionerRoleId}`);

    // Create practitioner record
    const result = await pool.request()
      .input('halaxy_practitioner_id', sql.NVarChar, halaxyPractitionerId)
      .input('halaxy_practitioner_role_id', sql.NVarChar, halaxyPractitionerRoleId)
      .input('first_name', sql.NVarChar, application.first_name)
      .input('last_name', sql.NVarChar, application.last_name)
      .input('email', sql.NVarChar, application.email)
      .input('phone', sql.NVarChar, application.phone || null)
      .input('favorite_flower', sql.NVarChar, application.favorite_flower || null)
      .input('onboarding_token', sql.NVarChar, onboardingToken)
      .input('onboarding_token_expires_at', sql.DateTime2, tokenExpiresAt)
      .query(`
        INSERT INTO practitioners (
          halaxy_practitioner_id,
          halaxy_practitioner_role_id,
          first_name,
          last_name,
          email,
          phone,
          favorite_flower,
          onboarding_token,
          onboarding_token_expires_at,
          is_active,
          created_at,
          updated_at
        ) OUTPUT INSERTED.id
        VALUES (
          @halaxy_practitioner_id,
          @halaxy_practitioner_role_id,
          @first_name,
          @last_name,
          @email,
          @phone,
          @favorite_flower,
          @onboarding_token,
          @onboarding_token_expires_at,
          1,
          GETDATE(),
          GETDATE()
        )
      `);

    const practitionerId = result.recordset[0].id;
    console.log(`[PractitionerService] Created practitioner ${practitionerId}`);

    // Update application with practitioner_id
    await pool.request()
      .input('practitioner_id', sql.UniqueIdentifier, practitionerId)
      .input('application_id', sql.Int, application.id)
      .query(`
        UPDATE applications 
        SET practitioner_id = @practitioner_id 
        WHERE id = @application_id
      `);

    const onboardingLink = `${ONBOARDING_BASE_URL}/onboarding/${onboardingToken}`;

    console.log(`[PractitionerService] Onboarding link: ${onboardingLink}`);

    return {
      success: true,
      practitionerId,
      onboardingToken,
      onboardingLink,
    };
  } catch (error) {
    console.error('[PractitionerService] Error creating practitioner:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create practitioner',
    };
  }
}

/**
 * Validate an onboarding token
 */
interface PractitionerOnboardingData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;

  onboarding_token_expires_at: Date;
  onboarding_completed_at?: Date;
}

export async function validateOnboardingToken(
  pool: sql.ConnectionPool,
  token: string
): Promise<{ valid: boolean; practitioner?: PractitionerOnboardingData; error?: string }> {
  try {
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT 
          id, first_name, last_name, email, phone,
          onboarding_token_expires_at,
          onboarding_completed_at
        FROM practitioners 
        WHERE onboarding_token = @token
      `);

    if (result.recordset.length === 0) {
      return { valid: false, error: 'Invalid token' };
    }

    const practitioner = result.recordset[0];

    // Check if already completed
    if (practitioner.onboarding_completed_at) {
      return { valid: false, error: 'Onboarding already completed' };
    }

    // Check if expired
    if (new Date() > new Date(practitioner.onboarding_token_expires_at)) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, practitioner };
  } catch (error) {
    console.error('[PractitionerService] Error validating token:', error);
    return { valid: false, error: 'Validation failed' };
  }
}

/**
 * Complete onboarding - set password and mark complete
 */
export async function completeOnboarding(
  pool: sql.ConnectionPool,
  token: string,
  passwordHash: string,
  profileUpdates?: {
    display_name?: string;
    bio?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const request = pool.request()
      .input('token', sql.NVarChar, token)
      .input('password_hash', sql.NVarChar, passwordHash)
      .input('display_name', sql.NVarChar, profileUpdates?.display_name || null)
      .input('bio', sql.NVarChar, profileUpdates?.bio || null);

    const result = await request.query(`
      UPDATE practitioners
      SET 
        password_hash = @password_hash,
        display_name = COALESCE(@display_name, display_name),
        bio = COALESCE(@bio, bio),
        onboarding_completed_at = GETDATE(),
        onboarding_token = NULL,
        onboarding_token_expires_at = NULL,
        updated_at = GETDATE()
      WHERE onboarding_token = @token
        AND onboarding_completed_at IS NULL
        AND onboarding_token_expires_at > GETDATE()
    `);

    if (result.rowsAffected[0] === 0) {
      return { success: false, error: 'Invalid or expired token' };
    }

    console.log('[PractitionerService] Onboarding completed successfully');
    return { success: true };
  } catch (error) {
    console.error('[PractitionerService] Error completing onboarding:', error);
    return { success: false, error: 'Failed to complete onboarding' };
  }
}

export const practitionerService = {
  createPractitionerFromApplication,
  validateOnboardingToken,
  completeOnboarding,
  getPractitionerByAzureId,
};

export default practitionerService;

// ============================================================================
// Database Lookup Functions
// ============================================================================

/**
 * Look up a practitioner by their Azure AD Object ID
 * Used for dashboard authentication
 */
export async function getPractitionerByAzureId(azureAdObjectId: string): Promise<{
  id: string;
  halaxy_practitioner_id: string;
  halaxy_practitioner_role_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string;
  company_email: string | null;
} | null> {
  try {
    // Use shared connection pool instead of creating new connection per request
    const pool = await getDbConnection();
    
    const result = await pool.request()
      .input('azureAdObjectId', sql.NVarChar, azureAdObjectId)
      .query(`
        SELECT 
          id,
          halaxy_practitioner_id,
          halaxy_practitioner_role_id,
          first_name,
          last_name,
          display_name,
          email,
          company_email
        FROM practitioners
        WHERE azure_ad_object_id = @azureAdObjectId
          AND is_active = 1
          AND onboarding_completed_at IS NOT NULL
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return result.recordset[0];
  } catch (error) {
    console.error('[getPractitionerByAzureId] Database error:', error);
    throw error;
  }
  // Note: Don't close pool - it's a shared singleton managed by database.ts
}
