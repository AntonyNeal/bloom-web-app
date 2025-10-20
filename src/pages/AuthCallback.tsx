/**
 * Auth Callback Page
 * Handles the redirect after Azure AD authentication
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { instance } = useMsal();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Handle the redirect promise
        const response = await instance.handleRedirectPromise();
        
        if (response) {
          // Set the active account
          instance.setActiveAccount(response.account);
          console.log('Authentication successful:', response.account);
          
          // Navigate to the bloom portal
          navigate('/bloom');
        } else {
          // No response means the user cancelled or there was an error
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
