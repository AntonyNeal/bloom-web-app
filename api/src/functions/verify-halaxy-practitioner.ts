import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import sql from 'mssql';
import { getDbConfig } from '../services/database';
import { HalaxyClient } from '../services/halaxy/client';

/**
 * Verify that a practitioner exists in Halaxy
 * Actually searches Halaxy by email to confirm the practitioner exists
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
    
    // Trim whitespace from names (database may have trailing spaces)
    const firstName = application.first_name?.trim() || '';
    const lastName = application.last_name?.trim() || '';

    // Search Halaxy for this practitioner by name
    context.log(`Searching Halaxy for practitioner: "${firstName}" "${lastName}"`);
    
    const halaxyClient = new HalaxyClient();
    const halaxyPractitioner = await halaxyClient.findPractitionerByName(firstName, lastName);
    
    if (!halaxyPractitioner) {
      context.log(`Practitioner NOT found in Halaxy: ${firstName} ${lastName}`);
      await pool.close();
      return {
        status: 404,
        jsonBody: {
          verified: false,
          error: `Practitioner "${firstName} ${lastName}" not found in Halaxy. Please create the practitioner in Halaxy first.`,
        },
      };
    }

    context.log(`✅ Found Halaxy practitioner: ${halaxyPractitioner.id}`);

    // Get the PractitionerRole ID (needed for appointments API) - NO FALLBACKS
    const roles = await halaxyClient.getPractitionerRolesByPractitioner(halaxyPractitioner.id);
    
    if (!roles || roles.length === 0) {
      context.error(`No PractitionerRole found in Halaxy for practitioner ${halaxyPractitioner.id}`);
      await pool.close();
      return {
        status: 500,
        jsonBody: {
          verified: false,
          error: `Practitioner "${firstName} ${lastName}" exists in Halaxy but has no PractitionerRole. Please configure their role in Halaxy first.`,
          practitioner_id: halaxyPractitioner.id,
        },
      };
    }

    const practitionerRoleId = roles[0].id;
    
    if (!practitionerRoleId) {
      context.error(`PractitionerRole has no ID for practitioner ${halaxyPractitioner.id}`);
      await pool.close();
      return {
        status: 500,
        jsonBody: {
          verified: false,
          error: `PractitionerRole found but has no ID. Please check Halaxy configuration.`,
          practitioner_id: halaxyPractitioner.id,
        },
      };
    }

    context.log(`✅ Found PractitionerRole: ${practitionerRoleId}`);

    // Update application record with both the Practitioner ID and PractitionerRole ID
    await pool
      .request()
      .input('applicationId', sql.Int, applicationId)
      .input('verified', sql.Bit, true)
      .input('verifiedAt', sql.DateTime2, new Date())
      .input('halaxyPractitionerId', sql.NVarChar, halaxyPractitioner.id)
      .input('halaxyPractitionerRoleId', sql.NVarChar, practitionerRoleId)
      .query(`
        UPDATE applications 
        SET 
          halaxy_practitioner_verified = @verified,
          halaxy_verified_at = @verifiedAt,
          practitioner_id = @halaxyPractitionerId,
          practitioner_role_id = @halaxyPractitionerRoleId
        WHERE id = @applicationId
      `);

    await pool.close();

    return {
      status: 200,
      jsonBody: {
        verified: true,
        practitioner_id: halaxyPractitioner.id,
        practitioner_role_id: practitionerRoleId,
        practitioner_name: `${application.first_name} ${application.last_name}`,
        verified_at: new Date().toISOString(),
        message: `Found practitioner in Halaxy: ${halaxyPractitioner.id} (Role: ${practitionerRoleId})`,
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
