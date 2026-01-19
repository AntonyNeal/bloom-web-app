import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/**
 * Login redirect component for /login route
 * Automatically triggers Azure AD authentication or redirects authenticated users
 */
const LoginRedirect = () => {
  const { isAuthenticated, login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) {
      return; // Wait for auth state to be determined
    }

    if (isAuthenticated) {
      // User is already authenticated, redirect to bloom home
      console.log('[LoginRedirect] User already authenticated, redirecting to bloom home');
      navigate('/bloom-home');
    } else {
      // User is not authenticated, trigger Azure AD login
      console.log('[LoginRedirect] Triggering Azure AD login');
      login();
    }
  }, [isAuthenticated, isLoading, login, navigate]);

  // Show loading state while determining auth status
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '1.125rem',
          fontWeight: '500',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #9333ea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        Redirecting to authentication...
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginRedirect;
