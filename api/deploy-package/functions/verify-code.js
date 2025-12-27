"use strict";
/**
 * Verify Code Function
 *
 * Verifies a code sent via SMS against the stored verification data.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const send_verification_code_1 = require("./send-verification-code");
const MAX_ATTEMPTS = 5;
async function verifyCode(req, context) {
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
        context.log('[VerifyCode] Verifying code for ID:', body.verificationId);
        // Validate request
        if (!body.verificationId || !body.code) {
            return {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: {
                    success: false,
                    verified: false,
                    error: 'Verification ID and code are required',
                },
            };
        }
        // Get verification data
        const verificationData = send_verification_code_1.verificationStore.get(body.verificationId);
        if (!verificationData) {
            context.warn('[VerifyCode] Verification ID not found:', body.verificationId);
            return {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: {
                    success: false,
                    verified: false,
                    error: 'Invalid or expired verification ID',
                },
            };
        }
        // Check if expired
        if (verificationData.expiresAt < Date.now()) {
            context.warn('[VerifyCode] Verification expired:', body.verificationId);
            send_verification_code_1.verificationStore.delete(body.verificationId);
            return {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: {
                    success: false,
                    verified: false,
                    error: 'Verification code has expired',
                },
            };
        }
        // Check max attempts
        if (verificationData.attempts >= MAX_ATTEMPTS) {
            context.warn('[VerifyCode] Max attempts reached:', body.verificationId);
            send_verification_code_1.verificationStore.delete(body.verificationId);
            return {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: {
                    success: false,
                    verified: false,
                    error: 'Maximum verification attempts exceeded',
                    attemptsRemaining: 0,
                },
            };
        }
        // Increment attempts
        verificationData.attempts++;
        // Verify code
        const codeMatches = verificationData.code === body.code;
        if (codeMatches) {
            context.log('[VerifyCode] Code verified successfully:', body.verificationId);
            // Clean up verification data after successful verification
            send_verification_code_1.verificationStore.delete(body.verificationId);
            return {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: {
                    success: true,
                    verified: true,
                },
            };
        }
        else {
            context.warn('[VerifyCode] Invalid code attempt:', body.verificationId);
            const attemptsRemaining = MAX_ATTEMPTS - verificationData.attempts;
            return {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: {
                    success: true,
                    verified: false,
                    error: 'Invalid verification code',
                    attemptsRemaining,
                },
            };
        }
    }
    catch (error) {
        context.error('[VerifyCode] Error:', error);
        return {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            jsonBody: {
                success: false,
                verified: false,
                error: error instanceof Error ? error.message : 'Failed to verify code',
            },
        };
    }
}
// Register the function
functions_1.app.http('verifyCode', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'verify-code',
    handler: verifyCode,
});
//# sourceMappingURL=verify-code.js.map