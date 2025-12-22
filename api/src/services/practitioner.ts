/**
 * Practitioner Service
 * 
 * Handles practitioner creation from accepted applications
 * and onboarding token management.
 */

import * as sql from 'mssql';
import * as crypto from 'crypto';

// Onboarding configuration
const ONBOARDING_TOKEN_EXPIRY_DAYS = 7;
const ONBOARDING_BASE_URL = process.env.ONBOARDING_BASE_URL || 'https://staging.bloom.life-psychology.com.au';

interface ApplicationData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  ahpra_registration?: string;
  specializations?: string;
  experience_years?: number;
  photo_url?: string;
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

    // Check if practitioner already exists for this application
    const existingCheck = await pool.request()
      .input('application_id', sql.Int, application.id)
      .query(`
        SELECT id FROM practitioners WHERE application_id = @application_id
      `);

    if (existingCheck.recordset.length > 0) {
      console.log(`[PractitionerService] Practitioner already exists for application ${application.id}`);
      return {
        success: false,
        error: 'Practitioner already created for this application',
      };
    }

    // Check if email already exists
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

    // Create practitioner record
    const result = await pool.request()
      .input('application_id', sql.Int, application.id)
      .input('first_name', sql.NVarChar, application.first_name)
      .input('last_name', sql.NVarChar, application.last_name)
      .input('email', sql.NVarChar, application.email)
      .input('phone', sql.NVarChar, application.phone || null)
      .input('ahpra_number', sql.NVarChar, application.ahpra_registration || null)
      .input('specializations', sql.NVarChar, application.specializations || null)
      .input('experience_years', sql.Int, application.experience_years || null)
      .input('profile_photo_url', sql.NVarChar, application.photo_url || null)
      .input('onboarding_token', sql.NVarChar, onboardingToken)
      .input('onboarding_token_expires_at', sql.DateTime2, tokenExpiresAt)
      .query(`
        INSERT INTO practitioners (
          application_id,
          first_name,
          last_name,
          email,
          phone,
          ahpra_number,
          specializations,
          experience_years,
          profile_photo_url,
          onboarding_token,
          onboarding_token_expires_at,
          is_active,
          created_at,
          updated_at
        ) OUTPUT INSERTED.id
        VALUES (
          @application_id,
          @first_name,
          @last_name,
          @email,
          @phone,
          @ahpra_number,
          @specializations,
          @experience_years,
          @profile_photo_url,
          @onboarding_token,
          @onboarding_token_expires_at,
          0,
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
export async function validateOnboardingToken(
  pool: sql.ConnectionPool,
  token: string
): Promise<{ valid: boolean; practitioner?: any; error?: string }> {
  try {
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT 
          id, first_name, last_name, email, phone,
          ahpra_number, specializations, experience_years,
          profile_photo_url, onboarding_token_expires_at,
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
    profile_photo_url?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const request = pool.request()
      .input('token', sql.NVarChar, token)
      .input('password_hash', sql.NVarChar, passwordHash)
      .input('display_name', sql.NVarChar, profileUpdates?.display_name || null)
      .input('bio', sql.NVarChar, profileUpdates?.bio || null)
      .input('profile_photo_url', sql.NVarChar, profileUpdates?.profile_photo_url || null);

    const result = await request.query(`
      UPDATE practitioners
      SET 
        password_hash = @password_hash,
        display_name = COALESCE(@display_name, display_name),
        bio = COALESCE(@bio, bio),
        profile_photo_url = COALESCE(@profile_photo_url, profile_photo_url),
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
};

export default practitionerService;
