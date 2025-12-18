import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import type { EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig, isAuthEnabled } from '../../config/authConfig';
import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

/**
 * Check if auth is properly configured - memoized for performance
 */
let authConfiguredCache: boolean | null = null;

const isAuthConfigured = () => {
  if (authConfiguredCache !== null) return authConfiguredCache;
  
  try {
    const clientId = msalConfig.auth.clientId || '';
    const authority = msalConfig.auth.authority || '';
    
    // Check if values are actual GUIDs/URLs, not empty or placeholder strings
    const hasValidClientId = clientId.length > 30 && !clientId.includes('your-client-id');
    const hasValidAuthority = authority.startsWith('https://') && authority.includes('microsoft');
    const isEnabled = isAuthEnabled();
    
    authConfiguredCache = hasValidClientId && hasValidAuthority && isEnabled;
    return authConfiguredCache;
  } catch {
    authConfiguredCache = false;
    return false;
  }
};

/**
 * Initialize the MSAL instance only if auth is configured
 * Deferred initialization for better performance
 */
let msalInstance: PublicClientApplication | null = null;
let msalInitPromise: Promise<void> | null = null;

const initializeMsal = async (): Promise<void> => {
  if (!isAuthConfigured()) return;
  if (msalInitPromise) return msalInitPromise;
  
  msalInitPromise = (async () => {
    try {
      msalInstance = new PublicClientApplication(msalConfig);
      
      await Promise.race([
        msalInstance.initialize(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('MSAL initialization timeout')), 5000)
        )
      ]);
      
      // Handle redirect promise if coming back from AAD
      await msalInstance.handleRedirectPromise().catch(() => {});
      
      // Account selection logic
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }
      
      // Add event callback for login success
      msalInstance.addEventCallback((event: EventMessage) => {
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
          const payload = event.payload as AuthenticationResult;
          const account = payload.account;
          if (msalInstance) {
            msalInstance.setActiveAccount(account);
          }
        }
      });
    } catch {
      msalInstance = null;
    }
  })();
  
  return msalInitPromise;
};

/**
 * AuthProvider component wraps the app with MSAL authentication
 * Falls back to rendering children directly if auth is not configured
 * Uses deferred initialization for better performance
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isReady, setIsReady] = useState(!isAuthConfigured());
  
  const initialize = useCallback(async () => {
    if (!isAuthConfigured()) {
      setIsReady(true);
      return;
    }
    
    try {
      await initializeMsal();
    } finally {
      setIsReady(true);
    }
  }, []);
  
  useEffect(() => {
    // Use requestIdleCallback for non-blocking initialization
    const scheduleInit = window.requestIdleCallback || ((cb: IdleRequestCallback) => setTimeout(cb, 1));
    
    const handle = scheduleInit(() => {
      initialize();
    }, { timeout: 1000 });
    
    return () => {
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(handle as number);
      }
    };
  }, [initialize]);
  
  // If auth not configured or we're ready, render children
  if (!isAuthConfigured() || !msalInstance) {
    return <>{children}</>;
  }
  
  // Show minimal loading state while MSAL initializes
  if (!isReady) {
    return <>{children}</>;
  }
  
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};
