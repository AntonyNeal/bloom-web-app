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
      
      // Expose MSAL instance globally for hooks that need it
      (window as any).msalInstance = msalInstance;
      
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
 * CRITICAL: Must NOT render children that use useMsal() until MsalProvider is ready
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isReady, setIsReady] = useState(!isAuthConfigured());
  const [msalReady, setMsalReady] = useState(false);
  
  const initialize = useCallback(async () => {
    if (!isAuthConfigured()) {
      setIsReady(true);
      return;
    }
    
    try {
      await initializeMsal();
      // Mark MSAL as ready only after successful initialization
      if (msalInstance) {
        setMsalReady(true);
      }
    } finally {
      setIsReady(true);
    }
  }, []);
  
  useEffect(() => {
    // Initialize immediately for auth callback pages (they need MSAL right away)
    const isAuthCallback = window.location.pathname === '/auth/callback';
    
    if (isAuthCallback) {
      // Immediate initialization for auth callback
      initialize();
    } else {
      // Use requestIdleCallback for non-blocking initialization on other pages
      const scheduleInit = window.requestIdleCallback || ((cb: IdleRequestCallback) => setTimeout(cb, 1));
      
      const handle = scheduleInit(() => {
        initialize();
      }, { timeout: 1000 });
      
      return () => {
        if (window.cancelIdleCallback) {
          window.cancelIdleCallback(handle as number);
        }
      };
    }
  }, [initialize]);
  
  // If auth not configured, render children directly (no MSAL needed)
  if (!isAuthConfigured()) {
    return <>{children}</>;
  }
  
  // While MSAL is initializing, show loading state
  // CRITICAL: Do NOT render children here as they may use useMsal() hook
  if (!isReady || !msalReady || !msalInstance) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#FAF7F2'
      }}>
        <div style={{ textAlign: 'center', color: '#6B8E7F' }}>
          <div style={{ fontSize: '18px', fontWeight: 500 }}>Loading...</div>
        </div>
      </div>
    );
  }
  
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};
