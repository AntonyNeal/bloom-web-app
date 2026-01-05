import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { sendOfferEmail } from '../services/email';
import { randomUUID } from 'crypto';

/**
 * Send Offer Endpoint - v1.0.1
 * 
 * POST /api/send-offer/:id
 * Sends an offer email to the applicant with the contract attached.
 * The applicant must accept the offer before onboarding can begin.
 */

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

/**
 * Send Offer Endpoint
 * 
 * Sends an offer email to the applicant with the contract attached.
 * The applicant must accept the offer before onboarding can begin.
 * 
 * POST /api/send-offer/:id
 */
async function sendOfferHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Send offer request: ${request.method} ${request.url}`);

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

    // Get the application
    const appResult = await pool.request()
      .input('id', sql.Int, applicationId)
      .query(`
        SELECT 
          id,
          first_name,
          last_name,
          email,
          status,
          contract_url,
          offer_sent_at,
          offer_accepted_at
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

    // Check if contract is uploaded
    if (!application.contract_url) {
      return {
        status: 400,
        headers,
        jsonBody: { 
          error: 'Cannot send offer without a contract. Please upload the contract first.',
          code: 'CONTRACT_REQUIRED'
        },
      };
    }

    // Check if already accepted
    if (application.offer_accepted_at) {
      return {
        status: 400,
        headers,
        jsonBody: { 
          error: 'Offer has already been accepted by the applicant.',
          code: 'OFFER_ALREADY_ACCEPTED'
        },
      };
    }

    // Generate or reuse offer token
    let offerToken = application.offer_token;
    if (!offerToken) {
      offerToken = randomUUID();
    }

    // Update application status and set offer token
    await pool.request()
      .input('id', sql.Int, applicationId)
      .input('offer_token', sql.NVarChar, offerToken)
      .query(`
        UPDATE applications
        SET status = 'offer_sent',
            offer_sent_at = GETDATE(),
            offer_token = @offer_token
        WHERE id = @id
      `);

    // Build offer acceptance URL
    const baseUrl = process.env.ONBOARDING_BASE_URL || 'https://staging.bloom.life-psychology.com.au';
    const offerUrl = `${baseUrl}/accept-offer/${offerToken}`;

    // Send offer email
    await sendOfferEmail({
      firstName: application.first_name,
      email: application.email,
      offerUrl,
      contractUrl: application.contract_url,
    });

    context.log(`Offer sent to ${application.email} for application ${applicationId}`);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        message: 'Offer sent successfully',
        offerUrl,
      },
    };
  } catch (error) {
    context.error(`Error sending offer: ${error}`);
    return {
      status: 500,
      headers,
      jsonBody: { error: 'Failed to send offer', details: error instanceof Error ? error.message : 'Unknown error' },
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

app.http('send-offer', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'send-offer/{id}',
  handler: sendOfferHandler,
});
