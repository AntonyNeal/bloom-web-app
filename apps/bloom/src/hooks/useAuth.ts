import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest, isAuthEnabled } from '../config/authConfig';
import { InteractionStatus, type AccountInfo } from '@azure/msal-browser';

/**
 * Check if auth is properly configured
 * Must match the logic in AuthProvider.tsx
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
 * Stub implementation when auth is not configured
 */
const stubAuth = {
  isAuthenticated: false,
  user: null as AccountInfo | null,
  login: async () => {
    console.warn('[Auth] Authentication is not configured');
  },
  logout: async () => {
    console.warn('[Auth] Authentication is not configured');
  },
  getAccessToken: async () => null as string | null,
  isLoading: false,
};

/**
 * Custom hook for authentication operations when MSAL is configured
 * Wraps MSAL hooks for easier use throughout the app
 */
const useAuthWithMsal = () => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const login = async () => {
    try {
      // Check if running on iOS and handle differently
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        // For iOS, use popup flow as fallback if redirect fails
        try {
          await instance.loginRedirect(loginRequest);
        } catch (redirectError) {
          console.warn('iOS redirect failed, trying popup:', redirectError);
          await instance.loginPopup(loginRequest);
        }
      } else {
        await instance.loginRedirect(loginRequest);
      }
    } catch (error) {
      console.error('Login error:', error);
      // Show user-friendly error message for iOS users
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        alert('Authentication issue detected. Please ensure cookies are enabled and try again. If the problem persists, try using Safari instead of Chrome.');
      }
    }
  };

  const logout = async () => {
    try {
      await instance.logoutRedirect({
        account: instance.getActiveAccount(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getAccessToken = async () => {
    if (!isAuthenticated) {
      return null;
    }

    const account = instance.getActiveAccount();
    if (!account) {
      return null;
    }

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition error:', error);
      // If silent token acquisition fails, redirect to login
      await instance.loginRedirect(loginRequest);
      return null;
    }
  };

  return {
    isAuthenticated,
    user: accounts[0] || null,
    login,
    logout,
    getAccessToken,
    isLoading: inProgress !== InteractionStatus.None,
  };
};

/**
 * Main useAuth hook - use this in components
 * Returns stub if auth is not configured, otherwise uses MSAL
 */
export const useAuth = isAuthConfigured ? useAuthWithMsal : () => stubAuth;
