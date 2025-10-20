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
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login error:', error);
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
