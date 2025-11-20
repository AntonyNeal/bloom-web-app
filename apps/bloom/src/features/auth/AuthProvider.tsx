import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import type { EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig, isAuthEnabled } from '@/config/authConfig';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Check if auth is properly configured
 */
const isAuthConfigured = () => {
  try {
    const clientId = msalConfig.auth.clientId || '';
    const authority = msalConfig.auth.authority || '';
    
    // Check if values are actual GUIDs/URLs, not empty or placeholder strings
    const hasValidClientId = clientId.length > 30 && !clientId.includes('your-client-id');
    const hasValidAuthority = authority.startsWith('https://') && authority.includes('microsoft');
    const isEnabled = isAuthEnabled();
    
    console.log('[Auth] Configuration check:', {
      hasValidClientId,
      hasValidAuthority,
      isEnabled,
      clientIdLength: clientId.length,
      authority: authority.substring(0, 30) + '...'
    });
    
    return hasValidClientId && hasValidAuthority && isEnabled;
  } catch (error) {
    console.warn('[Auth] Configuration check failed:', error);
    return false;
  }
};

/**
 * Initialize the MSAL instance only if auth is configured
 */
let msalInstance: PublicClientApplication | null = null;

if (isAuthConfigured()) {
  try {
    msalInstance = new PublicClientApplication(msalConfig);
    
    // Initialize MSAL with timeout protection
    const initTimeout = setTimeout(() => {
      console.error('[Auth] MSAL initialization timeout - continuing without auth');
    }, 5000);
    
    msalInstance.initialize()
      .then(() => {
        clearTimeout(initTimeout);
        console.log('[Auth] MSAL initialized successfully');
        
        // Handle redirect promise if coming back from AAD
        if (msalInstance) {
          msalInstance.handleRedirectPromise().catch((error: unknown) => {
            console.error('[Auth] Error handling redirect:', error);
          });
          
          // Account selection logic
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
          }
        }
      })
      .catch((error: unknown) => {
        clearTimeout(initTimeout);
        console.error('[Auth] MSAL initialization failed:', error);
      });
    
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
  } catch (error) {
    console.error('[Auth] Failed to create MSAL instance:', error);
    msalInstance = null;
  }
} else {
  console.warn('[Auth] Authentication not configured - running without auth');
}

/**
 * AuthProvider component wraps the app with MSAL authentication
 * Falls back to rendering children directly if auth is not configured
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isReady, setIsReady] = useState(!isAuthConfigured());
  
  useEffect(() => {
    if (isAuthConfigured() && msalInstance) {
      // Wait for MSAL to be ready, with a timeout fallback
      const timeout = setTimeout(() => {
        console.warn('[Auth] Timeout waiting for MSAL, continuing anyway');
        setIsReady(true);
      }, 3000);
      
      // Check if already initialized
      msalInstance.initialize()
        .then(() => {
          clearTimeout(timeout);
          setIsReady(true);
        })
        .catch(() => {
          clearTimeout(timeout);
          setIsReady(true);
        });
      
      return () => clearTimeout(timeout);
    }
  }, []);
  
  // If auth not configured or we're ready, render children
  if (!isAuthConfigured() || !msalInstance) {
    return <>{children}</>;
  }
  
  // Show loading state while MSAL initializes (with timeout)
  if (!isReady) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #9333ea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#666' }}>Initializing...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};
