/**
 * Halaxy Token Manager
 * 
 * Handles OAuth 2.0 client credentials flow for Halaxy API authentication.
 * Tokens are cached with a buffer to prevent expiry during requests.
 * 
 * Per compliance guide: Store API credentials in Azure Key Vault, not in application code.
 */

import { HalaxyTokenResponse, HalaxyConfig } from './types';

// Token expiry buffer (1 minute before actual expiry)
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

// Cached token state
let cachedToken: string | null = null;
let tokenExpiryTime: Date | null = null;

/**
 * Get Halaxy configuration from environment variables
 * Uses the same env vars as the existing lpa-halaxy-webhook-handler function
 */
export function getHalaxyConfig(): HalaxyConfig {
  const clientId = process.env.HALAXY_CLIENT_ID;
  const clientSecret = process.env.HALAXY_CLIENT_SECRET;
  // FHIR API base - note: FHIR endpoints are at /fhir/, not /main/
  const fhirBaseUrl = process.env.HALAXY_FHIR_URL || 'https://au-api.halaxy.com/fhir';
  // Token endpoint is at the root domain
  const tokenUrl = 'https://au-api.halaxy.com/oauth2/token';
  
  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Halaxy credentials. Set HALAXY_CLIENT_ID and HALAXY_CLIENT_SECRET environment variables. ' +
      'These are already configured in the lpa-halaxy-webhook-handler function app.'
    );
  }

  return {
    clientId,
    clientSecret,
    apiBaseUrl: fhirBaseUrl,
    tokenUrl,
    webhookSecret: process.env.HALAXY_WEBHOOK_SECRET,
    organizationId: process.env.HALAXY_ORGANIZATION_ID,
    practitionerId: process.env.HALAXY_PRACTITIONER_ID,
    maxRequestsPerMinute: 60,
    requestTimeoutMs: 30000,
  };
}

/**
 * Get a valid access token for Halaxy API
 * 
 * Uses OAuth 2.0 client credentials flow with Basic authentication.
 * Tokens are cached and automatically refreshed when expired.
 * 
 * @returns Valid access token
 * @throws Error if token cannot be obtained
 */
export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && tokenExpiryTime && new Date() < tokenExpiryTime) {
    return cachedToken;
  }

  const config = getHalaxyConfig();
  
  console.log('[HalaxyTokenManager] Fetching new access token...');

  try {
    // Halaxy uses Basic authentication for token requests
    const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json',
        'User-Agent': 'Life-Psychology-AUS/1.0',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to obtain Halaxy access token: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const tokenResponse: HalaxyTokenResponse = await response.json();

    // Cache the token with buffer time
    cachedToken = tokenResponse.access_token;
    tokenExpiryTime = new Date(
      Date.now() + (tokenResponse.expires_in * 1000) - TOKEN_EXPIRY_BUFFER_MS
    );

    console.log(
      `[HalaxyTokenManager] Token obtained, expires at ${tokenExpiryTime.toISOString()}`
    );

    return cachedToken;
  } catch (error) {
    console.error('[HalaxyTokenManager] Token fetch failed:', error);
    throw error;
  }
}

/**
 * Invalidate the cached token
 * Use when a request fails with 401 to force token refresh
 */
export function invalidateToken(): void {
  console.log('[HalaxyTokenManager] Token invalidated');
  cachedToken = null;
  tokenExpiryTime = null;
}

/**
 * Check if credentials are configured
 * Useful for health checks and startup validation
 */
export function hasCredentials(): boolean {
  try {
    getHalaxyConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get token status for monitoring
 */
export function getTokenStatus(): {
  hasToken: boolean;
  expiresAt: string | null;
  isExpired: boolean;
} {
  return {
    hasToken: cachedToken !== null,
    expiresAt: tokenExpiryTime?.toISOString() || null,
    isExpired: tokenExpiryTime ? new Date() >= tokenExpiryTime : true,
  };
}
