import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import sql from 'mssql';
import { config } from '../config/database';

/**
 * Verify that a practitioner has been created in Halaxy
 * This checks the Halaxy API to see if the practitioner exists
 * and updates the application record accordingly
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
    const pool = await sql.connect(config);

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

    // Check if practitioner exists in Halaxy
    // This calls the Halaxy API to verify the practitioner
    let verified = false;
    let practitionerId = application.practitioner_id;

    try {
      // Import the Halaxy client
      const { HalaxyClient } = await import('../services/halaxy/client');
      const halaxyClient = new HalaxyClient();

      // Search for practitioner by email
      const practitioners = await halaxyClient.searchPractitionersByEmail(application.email);

      if (practitioners && practitioners.length > 0) {
        // Found practitioner in Halaxy
        verified = true;
        practitionerId = practitioners[0].id.toString();
        
        context.log(`Practitioner found in Halaxy: ${practitionerId}`);
      } else {
        context.log(`Practitioner not found in Halaxy for email: ${application.email}`);
      }
    } catch (halaxyError) {
      context.error('Error checking Halaxy:', halaxyError);
      // Continue - we'll return verified = false
    }

    // Update application record
    await pool
      .request()
      .input('applicationId', sql.Int, applicationId)
      .input('verified', sql.Bit, verified)
      .input('practitionerId', sql.NVarChar(50), practitionerId)
      .input('verifiedAt', sql.DateTime2, verified ? new Date() : null)
      .query(`
        UPDATE applications 
        SET 
          halaxy_practitioner_verified = @verified,
          practitioner_id = @practitionerId,
          halaxy_verified_at = @verifiedAt
        WHERE id = @applicationId
      `);

    await pool.close();

    return {
      status: 200,
      jsonBody: {
        verified,
        practitioner_id: practitionerId,
        verified_at: verified ? new Date().toISOString() : null,
        message: verified
          ? 'Practitioner verified in Halaxy'
          : 'Practitioner not found in Halaxy. Please add them first.',
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
