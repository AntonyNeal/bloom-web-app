/**
 * Practitioners Admin API
 * 
 * GET /api/practitioners - List all practitioners for admin management
 * POST /api/practitioners/:id/activate - Activate or deactivate a practitioner
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';

const getConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) return connectionString;

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

async function practitionersAdminHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Practitioners admin request: ${request.method} ${request.url}`);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getConfig());

    // GET /api/practitioners - List all practitioners
    if (request.method === 'GET') {
      const result = await pool.request().query(`
        SELECT 
          p.id,
          p.first_name,
          p.last_name,
          p.email,
          p.company_email,
          p.ahpra_number,
          COALESCE(p.is_active, 0) as is_active,
          p.onboarding_completed_at,
          p.activated_at,
          p.created_at,
          p.application_id,
          p.favorite_flower,
          p.display_name
        FROM practitioners p
        WHERE p.application_id IS NOT NULL
        ORDER BY p.created_at DESC
      `);

      return {
        status: 200,
        headers,
        jsonBody: result.recordset,
      };
    }

    return {
      status: 405,
      headers,
      jsonBody: { error: 'Method not allowed' },
    };

  } catch (error) {
    context.error('Error in practitioners-admin handler:', error);
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

async function activatePractitionerHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Activate practitioner request: ${request.method} ${request.url}`);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  const practitionerId = request.params.id;

  if (!practitionerId) {
    return {
      status: 400,
      headers,
      jsonBody: { error: 'Practitioner ID is required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getConfig());

    const body = await request.json() as { is_active: boolean };
    const isActive = body.is_active;

    if (typeof isActive !== 'boolean') {
      return {
        status: 400,
        headers,
        jsonBody: { error: 'is_active must be a boolean' },
      };
    }

    // Check if practitioner exists and has completed onboarding
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT id, onboarding_completed_at, first_name, last_name
        FROM practitioners
        WHERE id = @id
      `);

    if (checkResult.recordset.length === 0) {
      return {
        status: 404,
        headers,
        jsonBody: { error: 'Practitioner not found' },
      };
    }

    const practitioner = checkResult.recordset[0];

    // Don't allow activation if onboarding not complete
    if (isActive && !practitioner.onboarding_completed_at) {
      return {
        status: 400,
        headers,
        jsonBody: { error: 'Cannot activate practitioner who has not completed onboarding' },
      };
    }

    // Update activation status
    const activatedAt = isActive ? new Date() : null;
    
    await pool.request()
      .input('id', sql.UniqueIdentifier, practitionerId)
      .input('is_active', sql.Bit, isActive)
      .input('activated_at', sql.DateTime2, activatedAt)
      .input('activated_by', sql.NVarChar, 'Admin') // TODO: Use actual admin user
      .query(`
        UPDATE practitioners
        SET is_active = @is_active,
            activated_at = CASE WHEN @is_active = 1 THEN @activated_at ELSE activated_at END,
            activated_by = CASE WHEN @is_active = 1 THEN @activated_by ELSE activated_by END
        WHERE id = @id
      `);

    const action = isActive ? 'activated' : 'deactivated';
    context.log(`Practitioner ${practitionerId} ${action}`);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        message: `Practitioner ${practitioner.first_name} ${practitioner.last_name} has been ${action}`,
        is_active: isActive,
      },
    };

  } catch (error) {
    context.error('Error in activate-practitioner handler:', error);
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

/**
 * PATCH /api/practitioners/:id - Update practitioner details
 * Used for admin tasks like linking Azure AD accounts, setting company email, etc.
 */
async function updatePractitionerHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Update practitioner request: ${request.method} ${request.url}`);

  if (request.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  const practitionerId = request.params.id;
  if (!practitionerId) {
    return {
      status: 400,
      headers,
      jsonBody: { error: 'Practitioner ID is required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as {
      azure_ad_object_id?: string;
      company_email?: string;
      halaxy_practitioner_id?: string;
      halaxy_practitioner_role_id?: string;
      display_name?: string;
    };

    pool = await sql.connect(getConfig());

    // Check practitioner exists
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, practitionerId)
      .query(`SELECT id, email, first_name, last_name FROM practitioners WHERE id = @id`);

    if (checkResult.recordset.length === 0) {
      return {
        status: 404,
        headers,
        jsonBody: { error: 'Practitioner not found' },
      };
    }

    const practitioner = checkResult.recordset[0];

    // Build dynamic update query
    const updates: string[] = ['updated_at = GETDATE()'];
    const request2 = pool.request().input('id', sql.UniqueIdentifier, practitionerId);

    if (body.azure_ad_object_id) {
      updates.push('azure_ad_object_id = @azure_ad_object_id');
      request2.input('azure_ad_object_id', sql.NVarChar, body.azure_ad_object_id);
    }
    if (body.company_email) {
      updates.push('company_email = @company_email');
      request2.input('company_email', sql.NVarChar, body.company_email);
    }
    if (body.halaxy_practitioner_id) {
      updates.push('halaxy_practitioner_id = @halaxy_practitioner_id');
      request2.input('halaxy_practitioner_id', sql.NVarChar, body.halaxy_practitioner_id);
    }
    if (body.halaxy_practitioner_role_id) {
      updates.push('halaxy_practitioner_role_id = @halaxy_practitioner_role_id');
      request2.input('halaxy_practitioner_role_id', sql.NVarChar, body.halaxy_practitioner_role_id);
    }
    if (body.display_name) {
      updates.push('display_name = @display_name');
      request2.input('display_name', sql.NVarChar, body.display_name);
    }

    // If azure_ad_object_id is being set, also mark onboarding as complete
    if (body.azure_ad_object_id) {
      updates.push('onboarding_completed_at = COALESCE(onboarding_completed_at, GETDATE())');
    }

    await request2.query(`UPDATE practitioners SET ${updates.join(', ')} WHERE id = @id`);

    context.log(`Updated practitioner ${practitionerId}: ${Object.keys(body).join(', ')}`);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        message: `Practitioner ${practitioner.first_name} ${practitioner.last_name} updated`,
        updated: Object.keys(body),
      },
    };

  } catch (error) {
    context.error('Error in update-practitioner handler:', error);
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

// Register endpoints
app.http('practitioners-admin', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'practitioners',
  handler: practitionersAdminHandler,
});

app.http('activate-practitioner', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'practitioners/{id}/activate',
  handler: activatePractitionerHandler,
});

app.http('update-practitioner', {
  methods: ['PATCH', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'practitioners/{id}',
  handler: updatePractitionerHandler,
});
