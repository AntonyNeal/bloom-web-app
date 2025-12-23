/**
 * Capture Payment Function
 * 
 * Captures a previously authorized payment after booking succeeds.
 * Used in the Authorize → Book → Capture flow.
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripeClient(context: InvocationContext): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    context.error('STRIPE_SECRET_KEY environment variable is not configured');
    throw new Error('Stripe configuration is missing');
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
  });

  return stripeClient;
}

interface CapturePaymentRequest {
  paymentIntentId: string;
  appointmentId?: string; // Optional: store in metadata for reference
}

async function capturePayment(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Processing capture-payment request');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  try {
    const body = (await req.json()) as CapturePaymentRequest;

    if (!body.paymentIntentId) {
      return {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        jsonBody: {
          error: 'Missing required field: paymentIntentId',
        },
      };
    }

    context.log('Capturing payment', { paymentIntentId: body.paymentIntentId });

    const stripe = getStripeClient(context);

    // Update metadata with appointment ID if provided
    if (body.appointmentId) {
      await stripe.paymentIntents.update(body.paymentIntentId, {
        metadata: {
          appointment_id: body.appointmentId,
        },
      });
    }

    // Capture the authorized payment
    const paymentIntent = await stripe.paymentIntents.capture(body.paymentIntentId);

    context.log('Payment captured successfully', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });

    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      jsonBody: {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      },
    };
  } catch (error) {
    context.error('Error capturing payment:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        jsonBody: {
          success: false,
          error: error.message,
          type: error.type,
        },
      };
    }

    return {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      jsonBody: {
        success: false,
        error: 'Failed to capture payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

app.http('capturePayment', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'capture-payment',
  handler: capturePayment,
});
