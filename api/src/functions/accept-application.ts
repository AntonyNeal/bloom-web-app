/**
 * Accept Application Endpoint
 * 
 * POST /api/accept-application/:id
 * 
 * Accepts an application and creates the practitioner record
 * with onboarding token. Returns the onboarding link.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { createPractitionerFromApplication } from '../services/practitioner';
import { sendAcceptanceEmail } from '../services/email';

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

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function acceptApplicationHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Accept application request: ${request.method} ${request.url}`);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  const applicationId = request.params.id;

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

    // First, get the application and verify it's in 'accepted' status
    const appResult = await pool.request()
      .input('id', sql.Int, applicationId)
      .query(`
        SELECT 
          id,
          first_name,
          last_name,
          email,
          phone,
          ahpra_registration,
          specializations,
          experience_years,
          photo_url,
          favorite_flower,
          status,
          practitioner_id,
          contract_url
        FROM applications
        WHERE id = @id
      `);

    if (appResult.recordset.length === 0) {
      return {
        status: 404,
        headers,
        jsonBody: { error: 'Application not found' },
      };
    }

    const application = appResult.recordset[0];

    // Check if already has a practitioner (find by email, not by practitioner_id which is Halaxy ID)
    const practResult = await pool.request()
      .input('email', sql.NVarChar, application.email)
      .query(`
        SELECT id, onboarding_token, onboarding_completed_at, email
        FROM practitioners
        WHERE email = @email
      `);

    if (practResult.recordset.length > 0) {
      const pract = practResult.recordset[0];
      if (pract.onboarding_completed_at) {
        return {
          status: 400,
          headers,
          jsonBody: { error: 'Practitioner has already completed onboarding' },
        };
      }
      if (pract.onboarding_token) {
        const baseUrl = process.env.ONBOARDING_BASE_URL || 'https://staging.bloom.life-psychology.com.au';
        return {
            status: 200,
            headers,
            jsonBody: {
              success: true,
              message: 'Practitioner already exists',
              practitionerId: pract.id,
              onboardingLink: `${baseUrl}/onboarding/${pract.onboarding_token}`,
            },
          };
        }
      }

    // Check status
    if (application.status !== 'accepted') {
      return {
        status: 400,
        headers,
        jsonBody: { 
          error: `Application must be in 'accepted' status to create practitioner. Current status: ${application.status}`,
        },
      };
    }

    // Create the practitioner
    context.log(`Creating practitioner from application ${applicationId}`);
    
    const result = await createPractitionerFromApplication(pool, {
      id: application.id,
      first_name: application.first_name,
      last_name: application.last_name,
      email: application.email,
      phone: application.phone,
      favorite_flower: application.favorite_flower, // Zoe's secret intel 🌸
    });

    if (!result.success) {
      return {
        status: 500,
        headers,
        jsonBody: { error: result.error || 'Failed to create practitioner' },
      };
    }

    context.log(`Practitioner created: ${result.practitionerId}`);
    context.log(`Onboarding link: ${result.onboardingLink}`);

    // Verify contract is attached before sending email
    if (!application.contract_url) {
      return {
        status: 400,
        headers,
        jsonBody: { error: 'Cannot accept application without a contract. Please upload the contract first.' },
      };
    }

    // Get Halaxy verification status
    const halaxyCheck = await pool.request()
      .input('id', sql.Int, applicationId)
      .query(`
        SELECT halaxy_practitioner_verified
        FROM applications
        WHERE id = @id
      `);
    
    const isHalaxyVerified = halaxyCheck.recordset.length > 0 
      ? halaxyCheck.recordset[0].halaxy_practitioner_verified 
      : false;

    // Send the onboarding email only if Halaxy is verified
    let emailSent = false;
    if (isHalaxyVerified) {
      try {
        await sendAcceptanceEmail({
          firstName: application.first_name,
          lastName: application.last_name,
          email: application.email,
          onboardingLink: result.onboardingLink,
          contractUrl: application.contract_url,
        });
        emailSent = true;
        context.log(`Onboarding email sent to ${application.email}`);

        // Update application to mark email as sent
        await pool.request()
          .input('applicationId', sql.Int, applicationId)
          .query(`
            UPDATE applications
            SET onboarding_email_sent_at = GETDATE()
            WHERE id = @applicationId
          `);
      } catch (emailError) {
        context.error('Failed to send onboarding email:', emailError);
        // Don't fail the whole request - practitioner was created successfully
      }
    } else {
      context.log(`Halaxy not verified for application ${applicationId}. Email not sent.`);
    }

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        message: emailSent 
          ? 'Practitioner created and onboarding email sent'
          : 'Practitioner created. Email will be sent after Halaxy verification.',
        practitionerId: result.practitionerId,
        onboardingToken: result.onboardingToken,
        onboardingLink: result.onboardingLink,
        emailSent,
        halaxyVerified: isHalaxyVerified,
      },
    };
  } catch (error) {
    context.error('Error in accept application handler:', error);
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

app.http('accept-application', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'accept-application/{id}',
  handler: acceptApplicationHandler,
});

export default acceptApplicationHandler;
