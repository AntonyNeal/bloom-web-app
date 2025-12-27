"use strict";
/**
 * Halaxy Token Manager
 *
 * Handles OAuth 2.0 client credentials flow for Halaxy API authentication.
 * Tokens are cached with a buffer to prevent expiry during requests.
 *
 * Per Halaxy docs: https://developers.halaxy.com/docs/authentication
 * - Use client_credentials grant type
 * - Send JSON body (not form-urlencoded)
 * - Tokens are valid for 15 minutes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHalaxyConfig = getHalaxyConfig;
exports.getAccessToken = getAccessToken;
exports.invalidateToken = invalidateToken;
exports.hasCredentials = hasCredentials;
exports.getTokenStatus = getTokenStatus;
// Token expiry buffer (2 minutes before actual expiry for safety)
const TOKEN_EXPIRY_BUFFER_MS = 2 * 60 * 1000;
// Cached token state
let cachedToken = null;
let tokenExpiryTime = null;
/**
 * Get Halaxy configuration from environment variables
 */
function getHalaxyConfig() {
    const clientId = process.env.HALAXY_CLIENT_ID;
    const clientSecret = process.env.HALAXY_CLIENT_SECRET;
    // API base - Halaxy uses /main/ for most endpoints
    const apiBaseUrl = process.env.HALAXY_API_URL || 'https://au-api.halaxy.com/main';
    // Token endpoint
    const tokenUrl = process.env.HALAXY_TOKEN_URL || 'https://au-api.halaxy.com/main/oauth/token';
    if (!clientId || !clientSecret) {
        throw new Error('Missing Halaxy credentials. Set HALAXY_CLIENT_ID and HALAXY_CLIENT_SECRET environment variables.');
    }
    return {
        clientId,
        clientSecret,
        apiBaseUrl,
        tokenUrl,
        webhookSecret: process.env.HALAXY_WEBHOOK_SECRET,
        organizationId: process.env.HALAXY_ORGANIZATION_ID,
        practitionerId: process.env.HALAXY_PRACTITIONER_ID,
        maxRequestsPerMinute: 60,
        requestTimeoutMs: 15000, // Reduced from 30s for faster failure detection
    };
}
/**
 * Get a valid access token for Halaxy API
 *
 * Uses OAuth 2.0 client_credentials flow as per Halaxy docs.
 * Tokens are cached and automatically refreshed when expired.
 *
 * @returns Valid access token
 * @throws Error if token cannot be obtained
 */
async function getAccessToken() {
    // Return cached token if still valid
    if (cachedToken && tokenExpiryTime && new Date() < tokenExpiryTime) {
        return cachedToken;
    }
    const config = getHalaxyConfig();
    console.log('[HalaxyTokenManager] Fetching new access token...');
    try {
        // Halaxy uses client_credentials grant type with JSON body
        // Per docs: https://developers.halaxy.com/docs/authentication
        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/fhir+json',
                'User-Agent': 'Life-Psychology-Australia (support@life-psychology.com.au)',
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: config.clientId,
                client_secret: config.clientSecret,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to obtain Halaxy access token: ${response.status} ${response.statusText}. ${errorText}`);
        }
        const tokenResponse = await response.json();
        // Cache the token with buffer time (tokens valid for 15 min per docs)
        cachedToken = tokenResponse.access_token;
        tokenExpiryTime = new Date(Date.now() + (tokenResponse.expires_in * 1000) - TOKEN_EXPIRY_BUFFER_MS);
        console.log(`[HalaxyTokenManager] Token obtained, expires at ${tokenExpiryTime.toISOString()}`);
        return cachedToken;
    }
    catch (error) {
        console.error('[HalaxyTokenManager] Token fetch failed:', error);
        throw error;
    }
}
/**
 * Invalidate the cached token
 * Use when a request fails with 401 to force token refresh
 */
function invalidateToken() {
    console.log('[HalaxyTokenManager] Token invalidated');
    cachedToken = null;
    tokenExpiryTime = null;
}
/**
 * Check if credentials are configured
 * Useful for health checks and startup validation
 */
function hasCredentials() {
    try {
        getHalaxyConfig();
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Get token status for monitoring
 */
function getTokenStatus() {
    return {
        hasToken: cachedToken !== null,
        expiresAt: (tokenExpiryTime === null || tokenExpiryTime === void 0 ? void 0 : tokenExpiryTime.toISOString()) || null,
        isExpired: tokenExpiryTime ? new Date() >= tokenExpiryTime : true,
    };
}
//# sourceMappingURL=token-manager.js.map