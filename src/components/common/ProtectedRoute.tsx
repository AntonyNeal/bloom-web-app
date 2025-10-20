import { useIsAuthenticated } from '@azure/msal-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';

/**
 * ProtectedRoute - Secures admin routes with Azure AD authentication
 * 
 * Features:
 * - Checks authentication status via MSAL
 * - Shows loading state during auth initialization
 * - Redirects to landing page if not authenticated
 * - Preserves attempted URL in location state for post-login redirect
 * 
 * Usage:
 * <Route path="/admin/dashboard" element={
 *   <ProtectedRoute>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 * } />
 */
export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useIsAuthenticated();
  const { isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      console.log('[ProtectedRoute] Access denied - not authenticated. Attempted path:', location.pathname);
    }
  }, [isAuthenticated, isLoading, location.pathname]);

  // Show loading state while auth initializes
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#FAF7F2',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #6B8E7F',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ 
            fontSize: '18px', 
            color: '#4A4A4A',
            fontWeight: 500,
          }}>
            Verifying authentication...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect to landing page if not authenticated
  // Preserve the attempted path in location state for post-login redirect
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/" 
        replace 
        state={{ from: location.pathname, authRequired: true }}
      />
    );
  }

  // User is authenticated - render protected content
  return children;
};
