"use strict";
/**
 * Practitioner Service
 *
 * Handles practitioner creation from accepted applications
 * and onboarding token management.
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
exports.practitionerService = void 0;
exports.createPractitionerFromApplication = createPractitionerFromApplication;
exports.validateOnboardingToken = validateOnboardingToken;
exports.completeOnboarding = completeOnboarding;
const sql = __importStar(require("mssql"));
const crypto = __importStar(require("crypto"));
// Onboarding configuration
const ONBOARDING_TOKEN_EXPIRY_DAYS = 7;
const ONBOARDING_BASE_URL = process.env.ONBOARDING_BASE_URL || 'https://staging.bloom.life-psychology.com.au';
/**
 * Generate a secure onboarding token
 */
function generateOnboardingToken() {
    return crypto.randomBytes(32).toString('hex');
}
/**
 * Create a practitioner record from an accepted application
 */
async function createPractitionerFromApplication(pool, application) {
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
        // Generate a placeholder halaxy_practitioner_id for manual practitioners (app-{applicationId})
        const halaxyPractitionerId = `app-${application.id}`;
        // Create practitioner record
        const result = await pool.request()
            .input('application_id', sql.Int, application.id)
            .input('halaxy_practitioner_id', sql.NVarChar, halaxyPractitionerId)
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
          halaxy_practitioner_id,
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
          @halaxy_practitioner_id,
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
    }
    catch (error) {
        console.error('[PractitionerService] Error creating practitioner:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create practitioner',
        };
    }
}
async function validateOnboardingToken(pool, token) {
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
    }
    catch (error) {
        console.error('[PractitionerService] Error validating token:', error);
        return { valid: false, error: 'Validation failed' };
    }
}
/**
 * Complete onboarding - set password and mark complete
 */
async function completeOnboarding(pool, token, passwordHash, profileUpdates) {
    try {
        const request = pool.request()
            .input('token', sql.NVarChar, token)
            .input('password_hash', sql.NVarChar, passwordHash)
            .input('display_name', sql.NVarChar, (profileUpdates === null || profileUpdates === void 0 ? void 0 : profileUpdates.display_name) || null)
            .input('bio', sql.NVarChar, (profileUpdates === null || profileUpdates === void 0 ? void 0 : profileUpdates.bio) || null)
            .input('profile_photo_url', sql.NVarChar, (profileUpdates === null || profileUpdates === void 0 ? void 0 : profileUpdates.profile_photo_url) || null);
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
    }
    catch (error) {
        console.error('[PractitionerService] Error completing onboarding:', error);
        return { success: false, error: 'Failed to complete onboarding' };
    }
}
exports.practitionerService = {
    createPractitionerFromApplication,
    validateOnboardingToken,
    completeOnboarding,
};
exports.default = exports.practitionerService;
//# sourceMappingURL=practitioner.js.map