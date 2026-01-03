import { lazy, Suspense, useEffect, memo, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

import { Toaster } from './components/ui/toaster';
import { GardenGateButton } from './components/common/GardenGateButton';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import BloomLoginButton from './components/auth/BloomLoginButton';
import LoginRedirect from './components/auth/LoginRedirect';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuth } from './hooks/useAuth';

// Lazy load all non-landing page routes (including auth callback)
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));

// Lazy load all non-landing page routes
const DesignSystemTest = lazy(() =>
  import('./DesignSystemTest').then((m) => ({ default: m.DesignSystemTest }))
);
const ApplicationDetail = lazy(() => import('./pages/admin/ApplicationDetail'));
const JoinUs = lazy(() => import('./pages/JoinUs').then((m) => ({ default: m.JoinUs })));
const Admin = lazy(() =>
  import('./pages/admin/ApplicationManagement').then((m) => ({ default: m.Admin }))
);
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const ABTestDashboard = lazy(() =>
  import('./pages/admin/ABTestDashboard').then((m) => ({ default: m.ABTestDashboard }))
);
const SmokeTestDashboard = lazy(() =>
  import('./pages/admin/SmokeTestDashboard').then((m) => ({ default: m.SmokeTestDashboard }))
);
const PractitionerManagement = lazy(() =>
  import('./pages/admin/PractitionerManagement').then((m) => ({ default: m.PractitionerManagement }))
);
const BloomHomepage = lazy(() => import('./pages/BloomHomepage'));
const BusinessCoach = lazy(() => import('./pages/BusinessCoach'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

// Lazy-loaded flower components with preloading
const Tier1Flower = lazy(() =>
  import('@/components/flowers/Tier1Flower').then((m) => ({ default: m.Tier1Flower }))
);
const Tier2Flower = lazy(() =>
  import('@/components/flowers/Tier2Flower').then((m) => ({ default: m.Tier2Flower }))
);
const Tier3Flower = lazy(() =>
  import('@/components/flowers/Tier3Flower').then((m) => ({ default: m.Tier3Flower }))
);

// Import lightweight hooks directly
import { useIsMobile } from '@/hooks/use-is-mobile';

// Memoized flower placeholder for better loading UX
const FlowerPlaceholder = memo(({ size = 48 }: { size?: number }) => (
  <div style={{ width: size, height: size }} aria-hidden="true" />
));
FlowerPlaceholder.displayName = 'FlowerPlaceholder';

// Memoized flower wrapper to prevent re-renders
const FlowerWrapper = memo(({ 
  children, 
  className, 
  style 
}: { 
  children: React.ReactNode; 
  className: string; 
  style: React.CSSProperties 
}) => (
  <div className={className} style={style}>
    {children}
  </div>
));
FlowerWrapper.displayName = 'FlowerWrapper';

// Landing Page - Simple navigation, optimized for performance
const LandingPage = memo(function LandingPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Auto-redirect to bloom home if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/bloom-home', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Memoize flower positions to prevent recalculation
  const flowerStyles = useMemo(() => ({
    main1: {
      position: 'absolute' as const,
      left: isMobile ? '12px' : '30px',
      top: isMobile ? '42px' : '60px',
      opacity: 0,
      transform: isMobile ? 'scale(1.08)' : 'scale(1.10)',
    },
    main2: {
      position: 'absolute' as const,
      right: isMobile ? '120px' : '160px',
      top: isMobile ? '8px' : '18px',
      opacity: 0,
      transform: isMobile ? 'scale(0.92)' : 'scale(0.95)',
    },
    main3: {
      position: 'absolute' as const,
      right: isMobile ? '8px' : '24px',
      bottom: isMobile ? '32px' : '40px',
      opacity: 0,
    },
  }), [isMobile]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: isMobile ? '16px' : '20px',
          background: 'transparent',
          maxHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Garden Bed - Optimized flower rendering */}
        <div
          style={{
            position: 'relative',
            width: isMobile ? '280px' : '400px',
            height: isMobile ? '140px' : '180px',
            marginBottom: isMobile ? '24px' : '32px',
          }}
        >
          {/* Main Flowers */}
          <FlowerWrapper className="flower-main flower-main-1" style={flowerStyles.main1}>
            <Suspense fallback={<FlowerPlaceholder size={48} />}>
              <Tier1Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
            </Suspense>
          </FlowerWrapper>
          
          <FlowerWrapper className="flower-main flower-main-2" style={flowerStyles.main2}>
            <Suspense fallback={<FlowerPlaceholder size={48} />}>
              <Tier2Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
            </Suspense>
          </FlowerWrapper>
          
          <FlowerWrapper className="flower-main flower-main-3" style={flowerStyles.main3}>
            <Suspense fallback={<FlowerPlaceholder size={48} />}>
              <Tier3Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
            </Suspense>
          </FlowerWrapper>

          {/* Companion Flowers - Simplified for performance */}
          <CompanionFlowers isMobile={isMobile} />
        </div>

        {/* Headline - Critical for LCP */}
        <h1
          className="headline"
          style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: 600,
            color: '#3A3A3A',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            textAlign: 'center',
            marginBottom: isMobile ? '12px' : '16px',
            opacity: 0,
          }}
        >
          Care for People, Not Paperwork
        </h1>

        {/* Organization name */}
        <div
          className="org-name"
          style={{
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: 500,
            textAlign: 'center',
            marginBottom: isMobile ? '12px' : '16px',
            opacity: 0,
          }}
        >
          <a
            href="https://www.life-psychology.com.au/"
            target="_blank"
            rel="noopener noreferrer"
            className="org-link"
            aria-label="Visit Life Psychology Australia main website"
          >
            Life Psychology Australia
          </a>
        </div>

        {/* Mission statement */}
        <p
          className="mission"
          style={{
            fontSize: isMobile ? '14px' : '15px',
            lineHeight: 1.5,
            color: '#4A4A4A',
            textAlign: 'center',
            maxWidth: '400px',
            margin: '0 auto',
            marginBottom: isMobile ? '20px' : '24px',
            opacity: 0,
          }}
        >
          A community of psychologists
          <br />
          building sustainable practices together
        </p>

        {/* Bloom Button */}
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '16px' : '24px',
            right: isMobile ? '16px' : '32px',
            zIndex: 20,
            pointerEvents: 'auto',
          }}
        >
          <BloomLoginButton isMobile={isMobile} />
        </div>

        {/* Main Action Button */}
        <div
          className="buttons"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: isMobile ? '16px' : '20px',
            width: isMobile ? '100%' : 'auto',
            maxWidth: isMobile ? '320px' : 'none',
            opacity: 0,
          }}
        >
          <button
            onClick={() => navigate('/join-us')}
            aria-label="Explore joining our community"
            className="secondary-button"
            style={{
              minWidth: isMobile ? '100%' : '220px',
              height: '56px',
              background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
              color: '#FEFDFB',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(107, 142, 127, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                borderRadius: '12px',
                pointerEvents: 'none',
              }}
            />
            <span style={{ position: 'relative', zIndex: 1 }}>Explore Joining</span>
          </button>
        </div>
      </main>
    </div>
  );
});

// Companion flowers extracted for better code splitting
const CompanionFlowers = memo(({ isMobile }: { isMobile: boolean }) => (
  <>
    <div
      className="flower-small flower-small-1"
      style={{
        position: 'absolute',
        left: isMobile ? '0px' : '6px',
        bottom: isMobile ? '14px' : '22px',
        opacity: 0,
        transform: isMobile ? 'scale(0.52)' : 'scale(0.62)',
      }}
    >
      <Suspense fallback={<FlowerPlaceholder size={24} />}>
        <Tier1Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </Suspense>
    </div>
    <div
      className="flower-small flower-small-2"
      style={{
        position: 'absolute',
        bottom: '20%',
        left: '35%',
        opacity: 0,
        transform: 'scale(0.50)',
      }}
    >
      <Suspense fallback={<FlowerPlaceholder size={24} />}>
        <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </Suspense>
    </div>
    <div
      className="flower-small flower-small-3"
      style={{
        position: 'absolute',
        left: isMobile ? '115px' : '165px',
        top: isMobile ? '72px' : '92px',
        opacity: 0,
        transform: isMobile ? 'scale(0.42)' : 'scale(0.52)',
      }}
    >
      <Suspense fallback={<FlowerPlaceholder size={24} />}>
        <Tier1Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </Suspense>
    </div>
    <div
      className="flower-small flower-small-4"
      style={{
        position: 'absolute',
        right: isMobile ? '85px' : '125px',
        top: isMobile ? '45px' : '65px',
        opacity: 0,
        transform: isMobile ? 'scale(0.47)' : 'scale(0.57)',
      }}
    >
      <Suspense fallback={<FlowerPlaceholder size={24} />}>
        <Tier1Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </Suspense>
    </div>
    <div
      className="flower-small flower-small-5"
      style={{
        position: 'absolute',
        right: isMobile ? '12px' : '22px',
        bottom: isMobile ? '6px' : '11px',
        opacity: 0,
        transform: isMobile ? 'scale(0.37)' : 'scale(0.44)',
      }}
    >
      <Suspense fallback={<FlowerPlaceholder size={24} />}>
        <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </Suspense>
    </div>
    <div
      className="flower-small flower-small-6"
      style={{
        position: 'absolute',
        left: isMobile ? '68px' : '98px',
        top: isMobile ? '27px' : '37px',
        opacity: 0,
        transform: isMobile ? 'scale(0.40)' : 'scale(0.50)',
      }}
    >
      <Suspense fallback={<FlowerPlaceholder size={24} />}>
        <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </Suspense>
    </div>
    <div
      className="flower-small flower-small-7"
      style={{
        position: 'absolute',
        left: isMobile ? '25px' : '45px',
        bottom: isMobile ? '12px' : '18px',
        opacity: 0,
        transform: isMobile ? 'scale(0.35)' : 'scale(0.42)',
      }}
    >
      <Suspense fallback={<FlowerPlaceholder size={24} />}>
        <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </Suspense>
    </div>
    <div
      className="flower-small flower-small-8"
      style={{
        position: 'absolute',
        top: '48%',
        right: '30%',
        opacity: 0,
        transform: 'scale(0.48)',
      }}
    >
      <Suspense fallback={<FlowerPlaceholder size={24} />}>
        <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </Suspense>
    </div>
    <div
      className="flower-small flower-small-9"
      style={{
        position: 'absolute',
        left: isMobile ? '8px' : '15px',
        top: isMobile ? '18px' : '25px',
        opacity: 0,
        transform: isMobile ? 'scale(0.33)' : 'scale(0.39)',
      }}
    >
      <Suspense fallback={<FlowerPlaceholder size={24} />}>
        <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </Suspense>
    </div>
  </>
));
CompanionFlowers.displayName = 'CompanionFlowers';

/**
 * Simple routes - No transitions for maximum performance
 */
function AnimatedRoutes() {
  return (
    <>
      {/* Garden Gate return button (shows on all non-landing pages) */}
      <GardenGateButton />

      <Routes>
        {/* Landing page - Garden Gate (no lazy loading, immediate) */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth callback route - handles Azure AD redirect */}
        <Route path="/auth/callback" element={
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Completing sign-in...</div>}>
            <AuthCallback />
          </Suspense>
        } />

        {/* Login redirect - triggers Azure AD authentication */}
        <Route path="/login" element={<LoginRedirect />} />

        {/* Practitioner onboarding - complete account setup after acceptance */}
        <Route
          path="/onboarding/:token"
          element={
            <ErrorBoundary>
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                <Onboarding />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Bloom Homepage - Practice dashboard with blossom tree */}
        <Route
          path="/bloom-home"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
              >
                <BloomHomepage practitionerId={import.meta.env.VITE_DEV_PRACTITIONER_ID} />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Business Coach - Practice growth dashboard */}
        <Route
          path="/business-coach"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
              >
                <BusinessCoach />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Qualification check - Joining journey */}
        <Route
          path="/join-us"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
              >
                <JoinUs />
              </Suspense>
              <Toaster />
            </ErrorBoundary>
          }
        />

        {/* Bloom portal - Existing practitioners (Protected) */}
        <Route
          path="/bloom"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <AdminDashboard />
                </Suspense>
                <Toaster />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Admin routes (Protected - temporary, to be integrated into /bloom) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <AdminDashboard />
                </Suspense>
                <Toaster />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <AdminDashboard />
                </Suspense>
                <Toaster />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <Admin />
                </Suspense>
                <Toaster />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/applications/:id"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <ApplicationDetail applicationId={''} />
                </Suspense>
                <Toaster />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* A/B Testing Dashboard */}
        <Route
          path="/admin/ab-tests"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <ABTestDashboard />
                </Suspense>
                <Toaster />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Smoke Test Dashboard */}
        <Route
          path="/admin/smoke-tests"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <SmokeTestDashboard />
                </Suspense>
                <Toaster />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Practitioner Management */}
        <Route
          path="/admin/practitioners"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <PractitionerManagement />
                </Suspense>
                <Toaster />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Design system test route */}
        <Route
          path="/design-test"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
              >
                <DesignSystemTest />
              </Suspense>
            </ErrorBoundary>
          }
        />
      </Routes>
    </>
  );
}

/**
 * Phase 8: App with Spatial Navigation
 *
 * Architecture:
 * - Fixed ambient background layer (blobs + particles)
 * - Spatial navigation provider (tracks direction)
 * - Animated routes with page transitions
 *
 * Future (Phase 9+):
 * - Ambient background evolution between sections
 * - More complex spatial relationships
 */
function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <BrowserRouter>
        <ErrorBoundary>
          {/* Fixed ambient background - present on all pages */}
          <AmbientBackground />

          {/* Simple routing - no transitions */}
          <AnimatedRoutes />
        </ErrorBoundary>
      </BrowserRouter>
    </div>
  );
}

/**
 * AmbientBackground - Fixed layer present across all pages
 * PERFORMANCE MODE: Static blobs with CSS classes
 */
function AmbientBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Static watercolor blobs using CSS classes for better performance */}
      <div className="bloom-blob bloom-blob-1" />
      <div className="bloom-blob bloom-blob-2" />
      <div className="bloom-blob bloom-blob-3" />
    </div>
  );
}

export default App;
