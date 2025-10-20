import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import type { EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig } from '../../config/authConfig';

/**
 * Initialize the MSAL instance
 */
const msalInstance = new PublicClientApplication(msalConfig);

/**
 * Initialize MSAL asynchronously
 * MSAL initialization is handled automatically by the library
 */
if (!msalInstance.getActiveAccount()) {
  // Initialize and handle redirect promise
  msalInstance.initialize().then(() => {
    // Handle redirect promise if coming back from AAD
    msalInstance.handleRedirectPromise().catch((error) => {
      console.error('Error handling redirect:', error);
    });
    
    // Account selection logic is app dependent
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  });
}

// Add event callback for login success
msalInstance.addEventCallback((event: EventMessage) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const payload = event.payload as AuthenticationResult;
    const account = payload.account;
    msalInstance.setActiveAccount(account);
  }
});

/**
 * AuthProvider component wraps the app with MSAL authentication
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => (
  <MsalProvider instance={msalInstance}>{children}</MsalProvider>
);
