"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Cancel Payment Function
 *
 * Cancels a previously authorized payment if booking fails.
 * Used in the Authorize → Book → Capture flow.
 */
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
async function cancelPayment(req, context) {
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
        const body = (await req.json());
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
    }
    catch (error) {
        context.error('Error canceling payment:', error);
        if (error instanceof stripe_1.default.errors.StripeError) {
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
functions_1.app.http('cancelPayment', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'cancel-payment',
    handler: cancelPayment,
});
//# sourceMappingURL=cancel-payment.js.map