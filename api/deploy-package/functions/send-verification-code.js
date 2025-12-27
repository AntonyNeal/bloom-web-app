"use strict";
/**
 * Send Verification Code Function
 *
 * Sends an SMS verification code to a phone number using Azure Communication Services.
 * Stores the code in memory with expiration for later verification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationStore = void 0;
const functions_1 = require("@azure/functions");
const communication_sms_1 = require("@azure/communication-sms");
// In-memory storage for verification codes (in production, use Redis or Azure Cache)
const verificationStore = new Map();
exports.verificationStore = verificationStore;
// Clean up expired codes periodically
function cleanupExpiredCodes() {
    const now = Date.now();
    for (const [id, data] of verificationStore.entries()) {
        if (data.expiresAt < now) {
            verificationStore.delete(id);
        }
    }
}
// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);
/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * Generate a unique verification ID
 */
function generateVerificationId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
/**
 * Normalize phone number to E.164 format
 * Assumes Australian numbers (add +61 if not present)
 */
function normalizePhoneNumber(phone) {
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');
    // If starts with 0, replace with +61
    if (normalized.startsWith('0')) {
        normalized = '61' + normalized.substring(1);
    }
    // Add + if not present
    if (!normalized.startsWith('+')) {
        normalized = '+' + normalized;
    }
    return normalized;
}
async function sendVerificationCode(req, context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, request-id',
        'Access-Control-Max-Age': '86400',
    };
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return { status: 204, headers: corsHeaders };
    }
    try {
        const body = await req.json();
        context.log('[SendVerificationCode] Received request for phone:', body.phoneNumber);
        // Validate phone number
        if (!body.phoneNumber) {
            return {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: {
                    success: false,
                    error: 'Phone number is required',
                },
            };
        }
        // Check Azure Communication Services credentials
        const connectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING;
        if (!connectionString) {
            context.error('[SendVerificationCode] Azure Communication Services not configured');
            return {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: {
                    success: false,
                    error: 'SMS service temporarily unavailable',
                },
            };
        }
        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(body.phoneNumber);
        context.log('[SendVerificationCode] Normalized phone:', normalizedPhone);
        // Generate verification code and ID
        const code = generateVerificationCode();
        const verificationId = generateVerificationId();
        const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
        // Store verification data
        verificationStore.set(verificationId, {
            code,
            phoneNumber: normalizedPhone,
            expiresAt,
            attempts: 0,
        });
        // Send SMS using Azure Communication Services
        const smsClient = new communication_sms_1.SmsClient(connectionString);
        const sendResults = await smsClient.send({
            from: process.env.AZURE_COMMUNICATION_SERVICES_PHONE_NUMBER || '',
            to: [normalizedPhone],
            message: `Your Life Psychology verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this message.`,
        });
        // Check if SMS was sent successfully
        const result = sendResults[0];
        if (!result.successful) {
            context.error('[SendVerificationCode] SMS send failed:', result.errorMessage);
            verificationStore.delete(verificationId); // Clean up
            return {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: {
                    success: false,
                    error: 'Failed to send verification code',
                },
            };
        }
        context.log('[SendVerificationCode] SMS sent successfully, ID:', verificationId);
        return {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            jsonBody: {
                success: true,
                verificationId,
                expiresIn: 600, // 10 minutes in seconds
            },
        };
    }
    catch (error) {
        context.error('[SendVerificationCode] Error:', error);
        return {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            jsonBody: {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send verification code',
            },
        };
    }
}
// Register the function
functions_1.app.http('sendVerificationCode', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'send-verification-code',
    handler: sendVerificationCode,
});
//# sourceMappingURL=send-verification-code.js.map