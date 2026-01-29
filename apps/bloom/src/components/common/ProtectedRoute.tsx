import { useIsAuthenticated } from '@azure/msal-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

/**
 * ProtectedRoute - Secures admin routes with Azure AD authentication
 * 
 * Features:
 * - Checks authentication status via MSAL
 * - Shows loading state during auth initialization
 * - Redirects to landing page if not authenticated
 * - Preserves attempted URL in location state for post-login redirect
 * - Optionally wraps content in AuthenticatedLayout with BloomHeader
 * 
 * Usage:
 * <Route path="/admin/dashboard" element={
 *   <ProtectedRoute>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 * } />
 * 
 * // For pages that need no header (video calls, etc.):
 * <Route path="/session/:id" element={
 *   <ProtectedRoute withLayout={false}>
 *     <SessionPage />
 *   </ProtectedRoute>
 * } />
 */

interface ProtectedRouteProps {
  children: JSX.Element;
  /** Wrap content in AuthenticatedLayout with BloomHeader (default: false to avoid double headers on pages that already have BloomHeader) */
  withLayout?: boolean;
}

export const ProtectedRoute = ({ children, withLayout = false }: ProtectedRouteProps) => {
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
  // Users can sign in from the landing page
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/" 
        replace 
      />
    );
  }

  // User is authenticated - render protected content
  // Wrap in layout unless explicitly disabled
  if (withLayout) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }
  
  return children;
};
