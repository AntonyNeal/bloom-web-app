/**
 * Admin Register Practitioner Endpoint
 * 
 * POST /api/admin/register-practitioner
 * 
 * Registers a practitioner's Azure AD Object ID in the database.
 * Used for:
 * - Setting up test accounts
 * - Manually linking existing practitioners
 * - Recovering from failed onboarding
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { getDbConfig } from '../services/database';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
};

interface RegisterRequest {
  email: string;                    // Personal or company email to match
  azureAdObjectId: string;          // Azure AD Object ID from MSAL
  halaxyPractitionerId?: string;    // Halaxy Practitioner ID (optional, can use existing)
  halaxyPractitionerRoleId?: string; // Halaxy PractitionerRole ID (optional)
  firstName?: string;               // For new practitioners
  lastName?: string;                // For new practitioners
  displayName?: string;             // For display
}

async function adminRegisterPractitionerHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Admin register practitioner request');

  if (request.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  // Simple admin key check (you should use proper auth in production)
  const adminKey = request.headers.get('X-Admin-Key');
  const expectedKey = process.env.ADMIN_API_KEY || 'dev-admin-key';
  
  if (adminKey !== expectedKey) {
    return {
      status: 401,
      headers,
      jsonBody: { error: 'Unauthorized. Admin key required.' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as RegisterRequest;

    if (!body.email || !body.azureAdObjectId) {
      return {
        status: 400,
        headers,
        jsonBody: { error: 'email and azureAdObjectId are required' },
      };
    }

    pool = await sql.connect(getDbConfig());

    // Check if practitioner already exists by email
    const existingResult = await pool.request()
      .input('email', sql.NVarChar, body.email)
      .query(`
        SELECT id, email, first_name, last_name, azure_ad_object_id, halaxy_practitioner_id
        FROM practitioners
        WHERE email = @email OR company_email = @email
      `);

    if (existingResult.recordset.length > 0) {
      // Update existing practitioner with Azure AD Object ID
      const existing = existingResult.recordset[0];
      
      await pool.request()
        .input('id', sql.UniqueIdentifier, existing.id)
        .input('azureAdObjectId', sql.NVarChar, body.azureAdObjectId)
        .input('halaxyPractitionerId', sql.NVarChar, body.halaxyPractitionerId || existing.halaxy_practitioner_id)
        .input('halaxyPractitionerRoleId', sql.NVarChar, body.halaxyPractitionerRoleId)
        .input('displayName', sql.NVarChar, body.displayName)
        .query(`
          UPDATE practitioners
          SET 
            azure_ad_object_id = @azureAdObjectId,
            halaxy_practitioner_id = COALESCE(@halaxyPractitionerId, halaxy_practitioner_id),
            halaxy_practitioner_role_id = COALESCE(@halaxyPractitionerRoleId, halaxy_practitioner_role_id),
            display_name = COALESCE(@displayName, display_name),
            onboarding_completed_at = COALESCE(onboarding_completed_at, GETDATE()),
            updated_at = GETDATE()
          WHERE id = @id
        `);

      context.log(`Updated existing practitioner ${existing.email} with Azure AD ID ${body.azureAdObjectId}`);

      return {
        status: 200,
        headers,
        jsonBody: {
          success: true,
          message: 'Updated existing practitioner',
          practitioner: {
            id: existing.id,
            email: existing.email,
            name: `${existing.first_name} ${existing.last_name}`,
            azureAdObjectId: body.azureAdObjectId,
            halaxyPractitionerId: body.halaxyPractitionerId || existing.halaxy_practitioner_id,
          },
        },
      };
    }

    // Create new practitioner
    if (!body.firstName || !body.lastName || !body.halaxyPractitionerId) {
      return {
        status: 400,
        headers,
        jsonBody: { 
          error: 'For new practitioners, firstName, lastName, and halaxyPractitionerId are required',
        },
      };
    }

    const result = await pool.request()
      .input('halaxyPractitionerId', sql.NVarChar, body.halaxyPractitionerId)
      .input('halaxyPractitionerRoleId', sql.NVarChar, body.halaxyPractitionerRoleId)
      .input('azureAdObjectId', sql.NVarChar, body.azureAdObjectId)
      .input('firstName', sql.NVarChar, body.firstName)
      .input('lastName', sql.NVarChar, body.lastName)
      .input('email', sql.NVarChar, body.email)
      .input('displayName', sql.NVarChar, body.displayName || `${body.firstName} ${body.lastName}`)
      .query(`
        INSERT INTO practitioners (
          halaxy_practitioner_id,
          halaxy_practitioner_role_id,
          azure_ad_object_id,
          first_name,
          last_name,
          email,
          display_name,
          is_active,
          onboarding_completed_at,
          created_at,
          updated_at
        ) OUTPUT INSERTED.id
        VALUES (
          @halaxyPractitionerId,
          @halaxyPractitionerRoleId,
          @azureAdObjectId,
          @firstName,
          @lastName,
          @email,
          @displayName,
          1,
          GETDATE(),
          GETDATE(),
          GETDATE()
        )
      `);

    const practitionerId = result.recordset[0].id;
    context.log(`Created new practitioner ${body.email} (ID: ${practitionerId})`);

    return {
      status: 201,
      headers,
      jsonBody: {
        success: true,
        message: 'Created new practitioner',
        practitioner: {
          id: practitionerId,
          email: body.email,
          name: `${body.firstName} ${body.lastName}`,
          azureAdObjectId: body.azureAdObjectId,
          halaxyPractitionerId: body.halaxyPractitionerId,
        },
      },
    };
  } catch (error) {
    context.error('Error registering practitioner:', error);
    return {
      status: 500,
      headers,
      jsonBody: {
        error: 'Failed to register practitioner',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

app.http('admin-register-practitioner', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'admin/register-practitioner',
  handler: adminRegisterPractitionerHandler,
});

export default adminRegisterPractitionerHandler;
