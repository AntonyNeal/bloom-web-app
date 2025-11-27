/**
 * Halaxy Webhook Handler
 * 
 * Azure Function HTTP trigger for real-time Halaxy webhook events.
 * Receives push notifications when appointments, patients, or practitioners change.
 * 
 * Webhook Setup in Halaxy:
 * 1. Go to Settings > Integrations > Webhooks
 * 2. Add webhook URL: https://bloom-api-{env}.azurewebsites.net/api/halaxy/webhook
 * 3. Select events: appointment.*, patient.*, practitioner.*
 * 4. Copy the webhook secret to HALAXY_WEBHOOK_SECRET env var
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getHalaxySyncService } from '../services/halaxy/sync-service';
import { HalaxyWebhookPayload, HalaxyWebhookEvent } from '../services/halaxy/types';
import crypto from 'crypto';

/**
 * Verify webhook signature from Halaxy
 * Ensures the request actually came from Halaxy, not a malicious actor
 */
function verifyWebhookSignature(
  signature: string | null,
  body: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn('[HalaxyWebhook] Missing signature or secret');
    return false;
  }

  // Halaxy uses HMAC-SHA256 for webhook signatures
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Main webhook handler
 */
async function halaxyWebhookHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const startTime = Date.now();
  
  context.log('[HalaxyWebhook] Received webhook request');

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature
    const signature = req.headers.get('x-halaxy-signature') || 
                      req.headers.get('x-webhook-signature');
    const webhookSecret = process.env.HALAXY_WEBHOOK_SECRET;

    if (webhookSecret && !verifyWebhookSignature(signature, rawBody, webhookSecret)) {
      context.warn('[HalaxyWebhook] Invalid webhook signature');
      return {
        status: 401,
        jsonBody: { 
          success: false, 
          error: 'Invalid webhook signature' 
        },
      };
    }

    // Parse the webhook payload
    let payload: HalaxyWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      context.error('[HalaxyWebhook] Failed to parse webhook body:', parseError);
      return {
        status: 400,
        jsonBody: { 
          success: false, 
          error: 'Invalid JSON payload' 
        },
      };
    }

    // Validate required fields
    if (!payload.event || !payload.data) {
      context.warn('[HalaxyWebhook] Missing event or data in payload');
      return {
        status: 400,
        jsonBody: { 
          success: false, 
          error: 'Missing event or data' 
        },
      };
    }

    context.log(`[HalaxyWebhook] Processing event: ${payload.event}`);

    // Process the webhook event
    const syncService = getHalaxySyncService();
    const result = await syncService.incrementalSync(
      payload.event as HalaxyWebhookEvent,
      payload.data
    );

    const duration = Date.now() - startTime;
    
    context.log(
      `[HalaxyWebhook] Event ${payload.event} processed in ${duration}ms. ` +
      `Success: ${result.success}, Records: ${result.recordsProcessed}`
    );

    return {
      status: 200,
      jsonBody: {
        success: result.success,
        event: payload.event,
        recordsProcessed: result.recordsProcessed,
        duration,
      },
    };

  } catch (error) {
    context.error('[HalaxyWebhook] Webhook processing failed:', error);
    
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
    };
  }
}

// Register the Azure Function
app.http('halaxyWebhook', {
  methods: ['POST'],
  authLevel: 'function', // Requires function key for additional security
  route: 'halaxy/webhook',
  handler: halaxyWebhookHandler,
});

export default halaxyWebhookHandler;
