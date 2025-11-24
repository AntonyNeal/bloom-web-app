/**
 * Azure Function: Create Stripe Payment Intent
 *
 * Creates a Stripe payment intent for appointment booking
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function (context, req) {
  context.log('[CreatePaymentIntent] Function invoked');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
    return;
  }

  try {
    const { amount, currency, customerEmail, customerName } = req.body;

    // Validate required parameters
    if (!amount || !currency || !customerEmail) {
      context.res = {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: {
          error: 'Missing required parameters: amount, currency, customerEmail',
        },
      };
      return;
    }

    // Validate Stripe secret key
    if (!process.env.STRIPE_SECRET_KEY) {
      context.log.error(
        '[CreatePaymentIntent] STRIPE_SECRET_KEY not configured'
      );
      context.res = {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: {
          error: 'Payment processing not configured',
        },
      };
      return;
    }

    context.log(
      `[CreatePaymentIntent] Creating payment intent for ${customerEmail}, amount: ${amount} ${currency}`
    );

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount), // Amount in cents
      currency: currency.toLowerCase(),
      receipt_email: customerEmail,
      metadata: {
        customer_name: customerName || '',
        customer_email: customerEmail,
        service: 'Psychology Session',
      },
      description: `Psychology session booking - ${customerName || customerEmail}`,
    });

    context.log(
      `[CreatePaymentIntent] Payment intent created: ${paymentIntent.id}`
    );

    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    };
  } catch (error) {
    context.log.error('[CreatePaymentIntent] Error:', error);

    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: {
        error: 'Failed to create payment intent',
        message: error.message,
      },
    };
  }
};
