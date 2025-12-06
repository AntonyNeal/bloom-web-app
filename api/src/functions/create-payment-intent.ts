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

interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  serviceType?: string;
}

async function createPaymentIntent(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Processing create-payment-intent request', {
    method: req.method,
    url: req.url,
  });

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
    // Parse request body
    const body = (await req.json()) as CreatePaymentIntentRequest;

    // Validate required fields
    if (!body.amount || !body.currency || !body.customerEmail) {
      return {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        jsonBody: {
          error: 'Missing required fields: amount, currency, customerEmail',
        },
      };
    }

    // Validate amount is positive
    if (body.amount <= 0) {
      return {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        jsonBody: {
          error: 'Amount must be greater than 0',
        },
      };
    }

    context.log('Creating payment intent', {
      amount: body.amount,
      currency: body.currency,
      customerEmail: body.customerEmail,
    });

    const stripe = getStripeClient(context);

    // Create PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount,
      currency: body.currency,
      metadata: {
        customer_email: body.customerEmail,
        customer_name: body.customerName || '',
        service_type: body.serviceType || 'appointment',
      },
      receipt_email: body.customerEmail,
    });

    context.log('Payment intent created successfully', {
      paymentIntentId: paymentIntent.id,
    });

    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      jsonBody: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    };
  } catch (error) {
    context.error('Error creating payment intent:', error);

    // Handle Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        jsonBody: {
          error: error.message,
          type: error.type,
        },
      };
    }

    // Handle other errors
    return {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      jsonBody: {
        error: 'Failed to create payment intent',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// Register the function
app.http('createPaymentIntent', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'create-payment-intent',
  handler: createPaymentIntent,
});
