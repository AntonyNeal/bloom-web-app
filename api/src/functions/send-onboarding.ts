/**
 * Send Onboarding Email
 * 
 * Creates a practitioner record with Halaxy ID and sends onboarding email.
 * Requires admin to provide the Halaxy Practitioner ID manually.
 * 
 * POST /api/send-onboarding/:id
 * Body: { halaxyPractitionerId: string }
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { createPractitionerFromApplication } from '../services/practitioner';
import { HalaxyClient } from '../services/halaxy/client';

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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

async function sendOnboardingHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Send onboarding request: ${request.method} ${request.url}`);

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
    // Get request body
    const body = (await request.json()) as { halaxyPractitionerId: string };
    const { halaxyPractitionerId } = body;

    if (!halaxyPractitionerId || !halaxyPractitionerId.trim()) {
      return {
        status: 400,
        headers,
        jsonBody: { error: 'Halaxy Practitioner ID is required' },
      };
    }

    // Validate Halaxy ID format (should start with PR- or be numeric)
    const halaxyIdPattern = /^(PR-\d+|\d+)$/;
    if (!halaxyIdPattern.test(halaxyPractitionerId.trim())) {
      return {
        status: 400,
        headers,
        jsonBody: { error: 'Invalid Halaxy Practitioner ID format. Expected format: PR-12345 or numeric ID' },
      };
    }

    pool = await sql.connect(getConfig());

    // Get the application and verify it's in 'accepted' status
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
          practitioner_id
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

    // Check if status is 'accepted'
    if (application.status !== 'accepted') {
      return {
        status: 400,
        headers,
        jsonBody: { 
          error: `Application must be in 'accepted' status to send onboarding. Current status: ${application.status}`,
          currentStatus: application.status,
        },
      };
    }

    // Check if practitioner already exists for this application
    if (application.practitioner_id) {
      return {
        status: 400,
        headers,
        jsonBody: { 
          error: 'Onboarding has already been sent for this application',
          practitionerId: application.practitioner_id,
        },
      };
    }

    // Verify the Halaxy Practitioner ID exists in Halaxy
    context.log(`Validating Halaxy Practitioner ID: ${halaxyPractitionerId}`);
    try {
      const halaxyClient = new HalaxyClient();
      // Add PR- prefix if not present
      const practitionerId = halaxyPractitionerId.startsWith('PR-') 
        ? halaxyPractitionerId 
        : `PR-${halaxyPractitionerId}`;
      
      await halaxyClient.getPractitioner(practitionerId);
      context.log(`✅ Verified practitioner exists in Halaxy: ${practitionerId}`);
    } catch (error) {
      context.error('Failed to verify Halaxy Practitioner ID:', error);
      return {
        status: 400,
        headers,
        jsonBody: { 
          error: 'Could not find this Practitioner ID in Halaxy. Please verify the ID is correct.',
          halaxyError: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }

    // Create the practitioner with the provided Halaxy ID
    context.log(`Creating practitioner from application ${applicationId} with Halaxy ID ${halaxyPractitionerId}`);
    
    const result = await createPractitionerFromApplication(pool, {
      id: application.id,
      first_name: application.first_name,
      last_name: application.last_name,
      email: application.email,
      phone: application.phone,
      ahpra_registration: application.ahpra_registration,
      specializations: application.specializations,
      experience_years: application.experience_years,
      photo_url: application.photo_url,
    }, halaxyPractitionerId); // Pass Halaxy ID

    if (!result.success) {
      return {
        status: 500,
        headers,
        jsonBody: { error: result.error || 'Failed to create practitioner' },
      };
    }

    context.log(`✅ Practitioner created: ${result.practitionerId}`);
    context.log(`📧 Onboarding link: ${result.onboardingLink}`);

    // TODO: Send onboarding email with the link
    // For now, return the link so admin can send it manually

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        message: 'Onboarding email prepared successfully',
        practitionerId: result.practitionerId,
        onboardingLink: result.onboardingLink,
        onboardingToken: result.onboardingToken,
        // Return info for admin
        practitionerInfo: {
          firstName: application.first_name,
          lastName: application.last_name,
          email: application.email,
          halaxyPractitionerId: halaxyPractitionerId,
        },
      },
    };
  } catch (error) {
    context.error('Error sending onboarding:', error);
    return {
      status: 500,
      headers,
      jsonBody: { error: error instanceof Error ? error.message : 'Failed to send onboarding' },
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

app.http('sendOnboarding', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'send-onboarding/{id}',
  handler: sendOnboardingHandler,
});
