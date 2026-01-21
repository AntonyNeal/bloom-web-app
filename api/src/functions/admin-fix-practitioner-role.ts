/**
 * Admin: Fix Practitioner Role ID
 * 
 * This endpoint allows admins to:
 * 1. Look up a practitioner's real PractitionerRole ID from Halaxy
 * 2. Update their database record with the correct ID
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import sql from 'mssql';
import { getDbConfig } from '../services/database';
import { HalaxyClient } from '../services/halaxy/client';

async function adminFixPractitionerRole(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  try {
    // Accept email from query param (safer for special chars like @)
    const email = request.query.get('email') || request.params.email;
    
    if (!email) {
      return {
        status: 400,
        headers,
        jsonBody: { success: false, error: 'Email parameter is required. Use ?email=user@example.com' },
      };
    }

    // Step 1: Get practitioner from database
    const pool = await sql.connect(getDbConfig());
    
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT 
          id, first_name, last_name, email, company_email,
          halaxy_practitioner_id, halaxy_practitioner_role_id
        FROM practitioners 
        WHERE email = @email OR company_email = @email
      `);

    if (result.recordset.length === 0) {
      await pool.close();
      return {
        status: 404,
        headers,
        jsonBody: { 
          success: false, 
          error: `Practitioner not found with email: ${email}` 
        },
      };
    }

    const practitioner = result.recordset[0];
    context.log(`Found practitioner: ${practitioner.first_name} ${practitioner.last_name}`);
    context.log(`Current Halaxy ID: ${practitioner.halaxy_practitioner_id}`);
    context.log(`Current Role ID: ${practitioner.halaxy_practitioner_role_id}`);

    // Step 2: Look up the real PractitionerRole from Halaxy
    const client = new HalaxyClient();
    
    // Search by name
    const firstName = practitioner.first_name?.trim() || '';
    const lastName = practitioner.last_name?.trim() || '';
    
    context.log(`Searching Halaxy for: "${firstName}" "${lastName}"`);
    
    const halaxyPractitioner = await client.findPractitionerByName(firstName, lastName);
    
    if (!halaxyPractitioner) {
      await pool.close();
      return {
        status: 404,
        headers,
        jsonBody: { 
          success: false, 
          error: `Practitioner "${firstName} ${lastName}" not found in Halaxy. Please create them first.`,
          currentData: {
            halaxyPractitionerId: practitioner.halaxy_practitioner_id,
            halaxyPractitionerRoleId: practitioner.halaxy_practitioner_role_id,
          }
        },
      };
    }

    context.log(`Found Halaxy Practitioner: ${halaxyPractitioner.id}`);

    // Step 3: Get the PractitionerRole(s)
    const roles = await client.getPractitionerRolesByPractitioner(halaxyPractitioner.id);
    
    if (!roles || roles.length === 0) {
      await pool.close();
      return {
        status: 404,
        headers,
        jsonBody: { 
          success: false, 
          error: `No PractitionerRole found for "${firstName} ${lastName}" in Halaxy. Please configure their role first.`,
          halaxyPractitionerId: halaxyPractitioner.id,
        },
      };
    }

    // Use the first active role (usually there's only one)
    const activeRole = roles.find(r => r.active !== false) || roles[0];
    const roleId = activeRole.id;

    context.log(`Found PractitionerRole: ${roleId}`);

    // Step 4: Update the database
    const updateResult = await pool
      .request()
      .input('id', sql.Int, practitioner.id)
      .input('halaxyPractitionerId', sql.NVarChar, halaxyPractitioner.id)
      .input('halaxyPractitionerRoleId', sql.NVarChar, roleId)
      .query(`
        UPDATE practitioners 
        SET 
          halaxy_practitioner_id = @halaxyPractitionerId,
          halaxy_practitioner_role_id = @halaxyPractitionerRoleId,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    await pool.close();

    context.log(`✅ Updated practitioner ${practitioner.id} with Halaxy Role: ${roleId}`);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        message: `Successfully updated Halaxy IDs for ${firstName} ${lastName}`,
        practitioner: {
          id: practitioner.id,
          name: `${firstName} ${lastName}`,
          email: practitioner.email,
        },
        before: {
          halaxyPractitionerId: practitioner.halaxy_practitioner_id,
          halaxyPractitionerRoleId: practitioner.halaxy_practitioner_role_id,
        },
        after: {
          halaxyPractitionerId: halaxyPractitioner.id,
          halaxyPractitionerRoleId: roleId,
        },
        allRoles: roles.map(r => ({
          id: r.id,
          active: r.active,
        })),
      },
    };

  } catch (error) {
    context.error('Error fixing practitioner role:', error);
    return {
      status: 500,
      headers,
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

app.http('adminFixPractitionerRole', {
  methods: ['POST', 'GET', 'OPTIONS'],
  authLevel: 'anonymous', // TODO: Add admin auth
  route: 'management/fix-practitioner-role',
  handler: adminFixPractitionerRole,
});

export default adminFixPractitionerRole;
