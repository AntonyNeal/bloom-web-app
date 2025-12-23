/**
 * Cancel Payment Function
 * 
 * Cancels a previously authorized payment if booking fails.
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

interface CancelPaymentRequest {
  paymentIntentId: string;
  reason?: string;
}

async function cancelPayment(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Processing cancel-payment request');

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
    const body = (await req.json()) as CancelPaymentRequest;

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

    context.log('Canceling payment', { 
      paymentIntentId: body.paymentIntentId,
      reason: body.reason || 'booking_failed',
    });

    const stripe = getStripeClient(context);

    // Cancel the authorized payment
    const paymentIntent = await stripe.paymentIntents.cancel(body.paymentIntentId, {
      cancellation_reason: 'requested_by_customer',
    });

    context.log('Payment canceled successfully', {
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
    context.error('Error canceling payment:', error);

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
        error: 'Failed to cancel payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

app.http('cancelPayment', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'cancel-payment',
  handler: cancelPayment,
});
