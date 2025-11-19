// MSAL (Microsoft Authentication Library) configuration
// This can be customized per app but provides base configuration

export interface MsalConfig {
  clientId: string;
  authority: string;
  redirectUri: string;
}

export const createMsalConfig = (clientId: string, tenantId: string, redirectUri: string) => {
  return {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  };
};
