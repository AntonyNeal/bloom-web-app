import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { createAzureUser, findAzureUserByEmail } from '../services/azure-ad';

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

/**
 * Manually create Azure AD user for a practitioner who completed onboarding
 * but didn't get their Azure AD account created (e.g., due to configuration issues)
 * 
 * POST /api/create-azure-user/:practitionerId
 */
async function createAzureUserHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  const practitionerId = req.params.practitionerId;
  
  if (!practitionerId) {
    return {
      status: 400,
      headers,
      jsonBody: { error: 'Practitioner ID is required' },
    };
  }

  try {
    const config = getConfig();
    const pool = await sql.connect(config);

    // Get practitioner info
    const practitionerResult = await pool.request()
      .input('id', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT id, email, first_name, last_name, display_name, 
               azure_ad_object_id, company_email, onboarding_completed_at
        FROM practitioners 
        WHERE id = @id
      `);

    if (practitionerResult.recordset.length === 0) {
      return {
        status: 404,
        headers,
        jsonBody: { error: 'Practitioner not found' },
      };
    }

    const practitioner = practitionerResult.recordset[0];

    // Check if they already have an Azure AD account
    if (practitioner.azure_ad_object_id && practitioner.company_email) {
      return {
        status: 200,
        headers,
        jsonBody: {
          message: 'Practitioner already has Azure AD account',
          azure_ad_object_id: practitioner.azure_ad_object_id,
          company_email: practitioner.company_email,
        },
      };
    }

    // Check if they completed onboarding
    if (!practitioner.onboarding_completed_at) {
      return {
        status: 400,
        headers,
        jsonBody: { error: 'Practitioner has not completed onboarding yet' },
      };
    }

    // Generate their company email
    const username = `${practitioner.first_name.toLowerCase()}.${practitioner.last_name.toLowerCase()}`.replace(/[^a-z.]/g, '');
    const expectedEmail = `${username}@life-psychology.com.au`;

    context.log(`Creating Azure AD user for practitioner ${practitionerId}: ${expectedEmail}`);

    // Check if user already exists in Azure AD (e.g., created manually)
    let azureObjectId = await findAzureUserByEmail(expectedEmail);
    let companyEmail = expectedEmail;
    let licenseAssigned = false;
    let created = false;

    if (!azureObjectId) {
      // Generate a temporary password - they'll need to reset it
      const tempPassword = `Bloom${Math.random().toString(36).substring(2, 8)}!${Math.floor(Math.random() * 100)}`;
      
      // Create new Azure AD user
      const azureUser = await createAzureUser({
        email: practitioner.email,  // Personal email for contact
        firstName: practitioner.first_name,
        lastName: practitioner.last_name,
        displayName: practitioner.display_name || `${practitioner.first_name} ${practitioner.last_name}`,
        password: tempPassword,
      });
      
      azureObjectId = azureUser.id;
      companyEmail = azureUser.userPrincipalName;
      licenseAssigned = azureUser.licenseAssigned;
      created = true;
      
      context.log(`Created Azure AD user ${companyEmail} (ID: ${azureObjectId}), License: ${licenseAssigned}`);
    } else {
      context.log(`Azure AD user already exists: ${companyEmail} (ID: ${azureObjectId})`);
    }

    // Update practitioner record with Azure AD info
    await pool.request()
      .input('id', sql.UniqueIdentifier, practitionerId)
      .input('azure_ad_object_id', sql.NVarChar, azureObjectId)
      .input('company_email', sql.NVarChar, companyEmail)
      .query(`
        UPDATE practitioners
        SET azure_ad_object_id = @azure_ad_object_id,
            company_email = @company_email
        WHERE id = @id
      `);

    context.log(`Updated practitioner ${practitionerId} with Azure AD info`);

    await pool.close();

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        created,
        azure_ad_object_id: azureObjectId,
        company_email: companyEmail,
        license_assigned: licenseAssigned,
        message: created 
          ? `Azure AD user created: ${companyEmail}. A temporary password was set - user should reset via Azure AD.`
          : `Azure AD user already existed: ${companyEmail}. Linked to practitioner record.`,
      },
    };
  } catch (error) {
    context.error('Failed to create Azure AD user:', error);
    return {
      status: 500,
      headers,
      jsonBody: { 
        error: 'Failed to create Azure AD user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

app.http('createAzureUser', {
  methods: ['POST', 'OPTIONS'],
  route: 'create-azure-user/{practitionerId}',
  authLevel: 'anonymous',
  handler: createAzureUserHandler,
});
