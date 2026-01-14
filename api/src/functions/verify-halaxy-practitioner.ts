import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import sql from 'mssql';
import { getDbConfig } from '../services/database';

/**
 * Verify that a practitioner has been created in Halaxy
 * This is triggered by admin confirmation - when the admin clicks verify,
 * we update the application record to mark Halaxy verification as complete
 */
export async function verifyHalaxyPractitioner(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed verify-halaxy-practitioner request.');

  try {
    const applicationId = request.params.applicationId;

    if (!applicationId) {
      return {
        status: 400,
        jsonBody: { error: 'Application ID is required' },
      };
    }

    // Connect to database
    const pool = await sql.connect(getDbConfig());

    // Get application details
    const appResult = await pool
      .request()
      .input('applicationId', sql.Int, applicationId)
      .query(`
        SELECT 
          id, first_name, last_name, email, 
          practitioner_id, halaxy_practitioner_verified
        FROM applications 
        WHERE id = @applicationId
      `);

    if (appResult.recordset.length === 0) {
      return {
        status: 404,
        jsonBody: { error: 'Application not found' },
      };
    }

    const application = appResult.recordset[0];

    // Admin has manually verified the clinician in Halaxy
    // Mark as verified in our database
    const verified = true;
    const practitionerId = application.practitioner_id || '';

    context.log(`Marking application ${applicationId} as Halaxy verified`);

    // Update application record
    await pool
      .request()
      .input('applicationId', sql.Int, applicationId)
      .input('verified', sql.Bit, verified)
      .input('verifiedAt', sql.DateTime2, new Date())
      .query(`
        UPDATE applications 
        SET 
          halaxy_practitioner_verified = @verified,
          halaxy_verified_at = @verifiedAt
        WHERE id = @applicationId
      `);

    await pool.close();

    return {
      status: 200,
      jsonBody: {
        verified: true,
        practitioner_id: practitionerId,
        verified_at: new Date().toISOString(),
        message: 'Clinician marked as verified in Halaxy',
      },
    };
  } catch (error) {
    context.error('Error in verify-halaxy-practitioner:', error);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to verify practitioner',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

app.http('verify-halaxy-practitioner', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'verify-halaxy-practitioner/{applicationId}',
  handler: verifyHalaxyPractitioner,
});
