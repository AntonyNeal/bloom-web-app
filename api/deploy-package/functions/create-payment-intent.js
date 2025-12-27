"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const stripe_1 = __importDefault(require("stripe"));
let stripeClient = null;
function getStripeClient(context) {
    if (stripeClient) {
        return stripeClient;
    }
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        context.error('STRIPE_SECRET_KEY environment variable is not configured');
        throw new Error('Stripe configuration is missing');
    }
    stripeClient = new stripe_1.default(secretKey, {
        apiVersion: '2025-02-24.acacia',
    });
    return stripeClient;
}
async function createPaymentIntent(req, context) {
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
        const body = (await req.json());
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
        // Create PaymentIntent with manual capture (authorize now, capture after booking)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: body.amount,
            currency: body.currency,
            capture_method: 'manual', // Authorize only - capture after booking succeeds
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
    }
    catch (error) {
        context.error('Error creating payment intent:', error);
        // Handle Stripe errors
        if (error instanceof stripe_1.default.errors.StripeError) {
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
functions_1.app.http('createPaymentIntent', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'create-payment-intent',
    handler: createPaymentIntent,
});
//# sourceMappingURL=create-payment-intent.js.map