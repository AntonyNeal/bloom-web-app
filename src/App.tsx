import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { GardenGateButton } from './components/common/GardenGateButton';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import BloomLoginButton from './components/auth/BloomLoginButton';
import LoginRedirect from './components/auth/LoginRedirect';
import AuthCallback from './pages/auth/AuthCallback';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuth } from './hooks/useAuth';

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

// Lazy-loaded flower components - keep original React components for visual fidelity
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

// Landing Page - Simple navigation, no Phase 8 transitions
function LandingPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Auto-redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('[LandingPage] User already authenticated, redirecting to dashboard');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Hero Content - Ambient background provided by global AmbientBackground component
          Animations defined in src/styles/landing-animations.css */}
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
        {/* Garden Bed - Abundant Cottage Garden
            Miyazaki-inspired: Natural asymmetry, breathing room, depth through layering
            9 flowers total: 3 prominent (greeting) + 6 companions (scattered naturally) */}
        <div
          style={{
            position: 'relative',
            width: isMobile ? '280px' : '400px',
            height: isMobile ? '140px' : '180px',
            marginBottom: isMobile ? '24px' : '32px',
          }}
        >
          {/* === MAIN FLOWERS - The Three Greeters === */}
          {/* Cherry blossom - left side, mid-height (The Welcomer)
              Refined scale: delicate stamens with ethereal presence */}
          <div
            className="flower-main flower-main-1"
            style={{
              position: 'absolute',
              left: isMobile ? '12px' : '30px',
              top: isMobile ? '42px' : '60px',
              opacity: 0,
              transform: isMobile ? 'scale(1.08)' : 'scale(1.10)',
            }}
          >
            <Suspense fallback={<div style={{ width: '48px', height: '48px' }} />}>
              <Tier1Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
            </Suspense>
          </div>
          {/* Purple rose - upper right area (The Observer)
              Scaled down: layered petals create visual weight */}
          <div
            className="flower-main flower-main-2"
            style={{
              position: 'absolute',
              right: isMobile ? '55px' : '85px',
              top: isMobile ? '6px' : '14px',
              opacity: 0,
              transform: isMobile ? 'scale(0.92)' : 'scale(0.95)',
            }}
          >
            <Suspense fallback={<div style={{ width: '48px', height: '48px' }} />}>
              <Tier2Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
            </Suspense>
          </div>
          {/* Golden daisy - right side, mid-low (The Anchor)
              Kept at original scale: perfect grounding element */}
          <div
            className="flower-main flower-main-3"
            style={{
              position: 'absolute',
              right: isMobile ? '8px' : '24px',
              bottom: isMobile ? '32px' : '40px',
              opacity: 0,
            }}
          >
            <Suspense fallback={<div style={{ width: '48px', height: '48px' }} />}>
              <Tier3Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
            </Suspense>
          </div>
          {/* === COMPANION FLOWERS - Natural Scatter (6 companions) === */}
          {/* #1: Small cherry blossom - lower left corner (grounding, airiness) */}
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
            <Suspense fallback={<div style={{ width: '24px', height: '24px' }} />}>
              <Tier1Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
            </Suspense>
          </div>
          {/* #2: Small golden daisy - upper left (creates depth) */}
          {/* #2: Small golden daisy - lower-middle (warmth, balance) */}
          <div
            className="flower-small flower-small-2"
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '35%',
            }}
          >
            <Suspense fallback={<div style={{ width: '24px', height: '24px' }} />}>
              <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
            </Suspense>
          </div>{' '}
          {/* #3: Small cherry blossom - center-left (mid-ground layer, changed from purple)
              More cherry blossoms create lightness */}
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
            <Suspense fallback={<div style={{ width: '24px', height: '24px' }} />}>
              <Tier1Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
            </Suspense>
          </div>
          {/* #4: Small cherry blossom - upper right (balance, changed from pink)
              Adjusted position for better spacing */}
          <div
            className="flower-small flower-small-4"
            style={{
              position: 'absolute',
              right: isMobile ? '38px' : '58px',
              top: isMobile ? '32px' : '47px',
              opacity: 0,
              transform: isMobile ? 'scale(0.47)' : 'scale(0.57)',
            }}
          >
            <Suspense fallback={<div style={{ width: '24px', height: '24px' }} />}>
              <Tier1Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
            </Suspense>
          </div>
          {/* #5: Tiny golden daisy - bottom right (the welcome at the gate)
              Shifted slightly left to break column effect */}
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
            <Suspense fallback={<div style={{ width: '24px', height: '24px' }} />}>
              <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
            </Suspense>
          </div>
          {/* #6: Small golden daisy - upper-middle-left (adds warmth, changed from purple)
              More golden flowers balance the composition */}
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
            <Suspense fallback={<div style={{ width: '24px', height: '24px' }} />}>
              <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
            </Suspense>
          </div>
          {/* #7: Tiny golden daisy - bottom left (warmth in corners) */}
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
            <Suspense fallback={<div style={{ width: '24px', height: '24px' }} />}>
              <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
            </Suspense>
          </div>
          {/* #8: Small golden daisy - center-right mid (adds golden glow) */}
          {/* #8: Small golden daisy - center-right mid (adds golden glow) */}
          <div
            className="flower-small flower-small-8"
            style={{
              position: 'absolute',
              top: '48%',
              right: '30%',
            }}
          >
            <Suspense fallback={<div style={{ width: '24px', height: '24px' }} />}>
              <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
            </Suspense>
          </div>
          {/* #9: Tiny golden daisy - upper-left (corner warmth) */}
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
            <Suspense fallback={<div style={{ width: '24px', height: '24px' }} />}>
              <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
            </Suspense>
          </div>
        </div>

        {/* Headline */}
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

        {/* Organization name - Link to main website */}
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

        {/* Bloom Button - Positioned in top-right corner for subtle access */}
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '16px' : '24px',
            right: isMobile ? '16px' : '32px',
            zIndex: 20,
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
          {/* Primary button - Join the community */}
          <button
            onClick={() => navigate('/join-us')}
            aria-label="Explore joining our community"
            className="secondary-button"
            style={{
              minWidth: isMobile ? '100%' : '200px',
              height: '48px',
              background: 'rgba(107, 142, 127, 0.1)',
              color: '#6B8E7F',
              fontSize: '16px',
              fontWeight: 500,
              borderRadius: '8px',
              border: '2px solid rgba(107, 142, 127, 0.3)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(107, 142, 127, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '3px solid #6B8E7F';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(107, 142, 127, 0.15)';
              e.currentTarget.style.borderColor = '#6B8E7F';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(107, 142, 127, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(107, 142, 127, 0.3)';
            }}
          >
            <span>Explore Joining</span>
          </button>
        </div>
      </main>
    </div>
  );
}

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
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Login redirect - triggers Azure AD authentication */}
        <Route path="/login" element={<LoginRedirect />} />

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
