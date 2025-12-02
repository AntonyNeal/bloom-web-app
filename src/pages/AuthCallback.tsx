/**
 * Auth Callback Page
 * Handles the redirect after Azure AD authentication
 * Safely handles case when MSAL provider isn't available
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthEnabled } from '../config/authConfig';

/**
 * Check if auth is properly configured (must match AuthProvider logic)
 */
const isAuthConfigured = (() => {
  try {
    const clientId = import.meta.env.VITE_B2C_CLIENT_ID || '';
    const authority = import.meta.env.VITE_B2C_AUTHORITY || '';
    
    const hasValidClientId = clientId.length > 30 && !clientId.includes('your-client-id');
    const hasValidAuthority = authority.startsWith('https://') && authority.includes('microsoft');
    const isEnabled = isAuthEnabled();
    
    return hasValidClientId && hasValidAuthority && isEnabled;
  } catch {
    return false;
  }
})();

/**
 * Fallback component when auth is not configured
 */
const AuthCallbackFallback = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('[AuthCallback] MSAL not configured, redirecting home');
    navigate('/');
  }, [navigate]);
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: '#FAF7F2',
      }}
    >
      <div style={{ fontSize: '18px', color: '#6B8E7F', fontWeight: 500 }}>
        Redirecting...
      </div>
    </div>
  );
};

/**
 * Component that uses MSAL hooks - only rendered when auth is configured
 */
const AuthCallbackWithMsal = () => {
  // Dynamic import to avoid loading MSAL when not needed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useMsal } = require('@azure/msal-react');
  const navigate = useNavigate();
  const { instance } = useMsal();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const response = await instance.handleRedirectPromise();
        
        if (response) {
          instance.setActiveAccount(response.account);
          console.log('Authentication successful:', response.account);
          navigate('/bloom');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/');
      }
    };

    handleRedirect();
  }, [instance, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: '#FAF7F2',
      }}
    >
      <div
        style={{
          fontSize: '18px',
          color: '#6B8E7F',
          fontWeight: 500,
          marginBottom: '16px',
        }}
      >
        Signing you in...
      </div>
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(107, 142, 127, 0.2)',
          borderTopColor: '#6B8E7F',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * Main export - chooses the right component based on auth configuration
 */
export const AuthCallback = isAuthConfigured ? AuthCallbackWithMsal : AuthCallbackFallback;
