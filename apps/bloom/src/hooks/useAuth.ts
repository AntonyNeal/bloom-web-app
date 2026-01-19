import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from '../config/authConfig';
import { InteractionStatus } from '@azure/msal-browser';

/**
 * Custom hook for authentication operations
 * Wraps MSAL hooks for easier use throughout the app
 */
export const useAuth = () => {
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
