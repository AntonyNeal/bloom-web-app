/**
 * Resend Onboarding Email Endpoint
 * 
 * POST /api/resend-onboarding/:applicationId
 * 
 * Generates a new onboarding token and resends the acceptance email.
 * Used when the original link expires or needs to be resent.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { randomBytes } from 'crypto';
import { sendAcceptanceEmail } from '../services/email';
import { createPractitionerFromApplication } from '../services/practitioner';

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

const ONBOARDING_BASE_URL = process.env.ONBOARDING_BASE_URL || 'https://staging.bloom.life-psychology.com.au';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function resendOnboardingHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Resend onboarding request: ${request.method} ${request.url}`);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  const applicationId = request.params.applicationId;

  if (!applicationId) {
    return {
      status: 400,
      headers,
      jsonBody: { error: 'Application ID is required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getConfig());

    // Get application with practitioner info
    const appResult = await pool.request()
      .input('id', sql.Int, applicationId)
      .query(`
        SELECT 
          a.id,
          a.first_name,
          a.last_name,
          a.email,
          a.status,
          a.contract_url,
          p.id as practitioner_uuid,
          p.onboarding_completed_at,
          p.onboarding_token,
          p.onboarding_token_expires_at
        FROM applications a
        LEFT JOIN practitioners p ON a.email = p.email
        WHERE a.id = @id
      `);

    if (appResult.recordset.length === 0) {
      return {
        status: 404,
        headers,
        jsonBody: { error: 'Application not found' },
      };
    }

    const application = appResult.recordset[0];

    // Verify application is in accepted status
    if (application.status !== 'accepted') {
      return {
        status: 400,
        headers,
        jsonBody: { error: `Cannot resend onboarding email - application status is '${application.status}', expected 'accepted'` },
      };
    }

    // Verify practitioner exists, or create it
    let practitionerId = application.practitioner_uuid;
    
    if (!practitionerId) {
      context.log(`Practitioner doesn't exist yet for application ${applicationId}. Creating...`);
      
      // Get the full application data needed for practitioner creation
      const fullAppResult = await pool.request()
        .input('id', sql.Int, applicationId)
        .query(`
          SELECT 
            id, first_name, last_name, email, phone,
            favorite_flower
          FROM applications
          WHERE id = @id
        `);
      
      if (fullAppResult.recordset.length === 0) {
        return {
          status: 404,
          headers,
          jsonBody: { error: 'Application not found for creating practitioner' },
        };
      }
      
      const fullApp = fullAppResult.recordset[0];
      
      // Create the practitioner
      const createResult = await createPractitionerFromApplication(pool, {
        id: fullApp.id,
        first_name: fullApp.first_name,
        last_name: fullApp.last_name,
        email: fullApp.email,
        phone: fullApp.phone,
        favorite_flower: fullApp.favorite_flower,
      });
      
      if (!createResult.success) {
        return {
          status: 400,
          headers,
          jsonBody: { error: createResult.error || 'Failed to create practitioner' },
        };
      }
      
      practitionerId = createResult.practitionerId;
      context.log(`Created practitioner ${practitionerId} for application ${applicationId}`);
    }

    // Check if onboarding already completed
    if (application.onboarding_completed_at) {
      return {
        status: 400,
        headers,
        jsonBody: { error: 'Onboarding has already been completed. The practitioner can log in normally.' },
      };
    }

    // Generate new onboarding token
    const newToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Update practitioner with new token
    await pool.request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .input('token', sql.NVarChar, newToken)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query(`
        UPDATE practitioners
        SET onboarding_token = @token,
            onboarding_token_expires_at = @expiresAt
        WHERE id = @practitionerId
      `);

    context.log(`Generated new onboarding token for practitioner ${practitionerId}`);

    // Build onboarding link
    const onboardingLink = `${ONBOARDING_BASE_URL}/onboarding/${newToken}`;

    // Send the acceptance email
    const emailResult = await sendAcceptanceEmail({
      firstName: application.first_name,
      lastName: application.last_name,
      email: application.email,
      onboardingLink,
      contractUrl: application.contract_url,
    });

    if (!emailResult.success) {
      context.error(`Failed to send onboarding email: ${emailResult.error}`);
      return {
        status: 500,
        headers,
        jsonBody: { error: `Failed to send email: ${emailResult.error}` },
      };
    }

    context.log(`Onboarding email resent to ${application.email}`);

    // Update application to mark email as sent
    await pool.request()
      .input('applicationId', sql.Int, applicationId)
      .query(`
        UPDATE applications
        SET onboarding_email_sent_at = GETDATE()
        WHERE id = @applicationId
      `);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        message: 'Onboarding email resent successfully',
        email: application.email,
        expiresAt: expiresAt.toISOString(),
      },
    };

  } catch (error) {
    context.error('Error in resend-onboarding handler:', error);
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

app.http('resend-onboarding', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'resend-onboarding/{applicationId}',
  handler: resendOnboardingHandler,
});
