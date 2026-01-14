import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';

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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Accept Offer Endpoint
 * 
 * GET /api/accept-offer/:token - Get offer details
 * POST /api/accept-offer/:token - Accept the offer
 * 
 * When the candidate accepts the offer, the status changes to 'accepted'
 * and the admin can then proceed with onboarding.
 */
async function acceptOfferHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Accept offer request: ${request.method} ${request.url}`);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  const token = request.params.token;

  context.log('🔍 Accept offer - Token:', token);

  if (!token) {
    return {
      status: 400,
      headers,
      jsonBody: { error: 'Offer token is required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getConfig());

    // Get the application by offer token
    const appResult = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT 
          id,
          first_name,
          last_name,
          email,
          status,
          contract_url,
          signed_contract_url,
          offer_sent_at,
          offer_accepted_at
        FROM applications
        WHERE offer_token = @token
      `);

    context.log('🔍 Query result count:', appResult.recordset.length);

    if (appResult.recordset.length === 0) {
      return {
        status: 404,
        headers,
        jsonBody: { error: 'Invalid or expired offer link' },
      };
    }

    const application = appResult.recordset[0];

    // GET - Return offer details
    if (request.method === 'GET') {
      return {
        status: 200,
        headers,
        jsonBody: {
          firstName: application.first_name,
          lastName: application.last_name,
          email: application.email,
          contractUrl: application.contract_url,
          signedContractUrl: application.signed_contract_url,
          offerSentAt: application.offer_sent_at,
          offerAcceptedAt: application.offer_accepted_at,
          isAccepted: !!application.offer_accepted_at,
        },
      };
    }

    // POST - Accept the offer
    if (request.method === 'POST') {
      // Check if already accepted
      if (application.offer_accepted_at) {
        return {
          status: 200,
          headers,
          jsonBody: { 
            success: true,
            message: 'Offer has already been accepted',
            alreadyAccepted: true,
          },
        };
      }

      // Validate that signed contract has been uploaded
      if (!application.signed_contract_url) {
        return {
          status: 400,
          headers,
          jsonBody: {
            error: 'Cannot accept offer without uploading a signed contract. Please upload your signed contract first.',
            requiresSignedContract: true,
          },
        };
      }

      // Update application to accepted
      await pool.request()
        .input('token', sql.NVarChar, token)
        .query(`
          UPDATE applications
          SET status = 'accepted',
              offer_accepted_at = GETDATE(),
              accepted_at = GETDATE()
          WHERE offer_token = @token
        `);

      context.log(`Offer accepted for application ${application.id} (${application.email})`);

      return {
        status: 200,
        headers,
        jsonBody: {
          success: true,
          message: 'Congratulations! You have accepted the offer. The Bloom team will be in touch with next steps.',
          firstName: application.first_name,
        },
      };
    }

    return {
      status: 405,
      headers,
      jsonBody: { error: 'Method not allowed' },
    };
  } catch (error) {
    context.error(`Error processing offer acceptance: ${error}`);
    return {
      status: 500,
      headers,
      jsonBody: { error: 'Failed to process offer', details: error instanceof Error ? error.message : 'Unknown error' },
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

app.http('accept-offer', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'accept-offer/{token}',
  handler: acceptOfferHandler,
});
