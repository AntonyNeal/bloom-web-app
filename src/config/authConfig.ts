import type { Configuration } from '@azure/msal-browser';
import { LogLevel } from '@azure/msal-browser';

/**
 * Detect if running on iOS (iPhone/iPad) in any browser
 */
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Configuration object for MSAL (Microsoft Authentication Library)
 * This handles Azure AD B2C authentication for the Bloom platform
 * Optimized for iOS compatibility
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_B2C_CLIENT_ID || '',
    authority: import.meta.env.VITE_B2C_AUTHORITY || '',
    redirectUri: `${window.location.origin}/auth/callback`,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false, // CRITICAL: Prevents iOS redirect loops
  },
  cache: {
    cacheLocation: 'localStorage', // localStorage is more reliable on iOS than sessionStorage
    storeAuthStateInCookie: true, // CRITICAL: Required for iOS Safari and Chrome on iOS
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          default:
            return;
        }
      },
      logLevel: import.meta.env.DEV ? LogLevel.Verbose : LogLevel.Error,
    },
    allowNativeBroker: false, // Disables WAM Broker
    iframeHashTimeout: isIOS() ? 10000 : 6000, // Longer timeout for iOS
    navigateFrameWait: isIOS() ? 1000 : 500, // iOS needs more time for navigation
  },
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 */
export const loginRequest = {
  scopes: (import.meta.env.VITE_B2C_SCOPES || 'openid profile email User.Read').split(' '),
};

/**
 * Add the endpoints for MS Graph API here.
 * For more information, see: https://docs.microsoft.com/en-us/graph/permissions-reference
 */
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};

/**
 * Check if Azure AD B2C is enabled in environment config
 */
export const isAuthEnabled = () => {
  return import.meta.env.VITE_B2C_ENABLED === 'true';
};
