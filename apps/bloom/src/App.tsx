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
const ABTestDashboard = lazy(() =>
  import('./pages/admin/ABTestDashboard').then((m) => ({ default: m.ABTestDashboard }))
);
const SmokeTestDashboard = lazy(() =>
  import('./pages/admin/SmokeTestDashboard').then((m) => ({ default: m.SmokeTestDashboard }))
);
const PractitionerManagement = lazy(() =>
  import('./pages/admin/PractitionerManagement').then((m) => ({ default: m.PractitionerManagement }))
);
const InterviewManagement = lazy(() =>
  import('./pages/admin/InterviewManagement')
);

// Bloom Homepage (main authenticated home)
const BloomHomepage = lazy(() => import('./pages/BloomHomepage'));
const BusinessCoach = lazy(() => import('./pages/BusinessCoach'));
const NotesHistory = lazy(() => import('./pages/notes/NotesHistory'));
const NoteDetail = lazy(() => import('./pages/notes/NoteDetail'));
const ClientProfile = lazy(() => import('./pages/clients/ClientProfile'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AcceptOffer = lazy(() => import('./pages/AcceptOffer'));
const ScheduleInterview = lazy(() => import('./pages/ScheduleInterview'));
const InterviewRoom = lazy(() => import('./pages/InterviewRoom'));

// Session page for telehealth video calls
const SessionPage = lazy(() =>
  import('./pages/session/SessionPage').then((m) => ({ default: m.SessionPage }))
);
const SessionLobby = lazy(() =>
  import('./pages/session/SessionLobby').then((m) => ({ default: m.SessionLobby }))
);
// Patient join session - public route for patients to join via token link
const PatientJoinSession = lazy(() =>
  import('./pages/session/PatientJoinSession').then((m) => ({ default: m.PatientJoinSession }))
);
// Practice management - standalone clinic dashboard
const PracticePage = lazy(() =>
  import('./pages/PracticePage').then((m) => ({ default: m.PracticePage }))
);

/**
 * Session Router - Handles /session route
 * 
 * If a token query param is present, renders the patient join page (public).
 * Otherwise, renders the session lobby (protected, for clinicians).
 */
import { useSearchParams } from 'react-router-dom';

function SessionRouter() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  // If token is present, render the patient join session (public)
  if (token) {
    return (
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Connecting to your session...</div>}>
        <PatientJoinSession />
      </Suspense>
    );
  }
  
  // Otherwise, require authentication and show the session lobby (clinician)
  return (
    <ProtectedRoute>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Preparing therapy room...</div>}>
        <SessionLobby />
      </Suspense>
    </ProtectedRoute>
  );
}

// Clinician dashboard (feed-style home page)
const ClinicianDashboard = lazy(() =>
  import('./pages/dashboard/ClinicianDashboard').then((m) => ({ default: m.ClinicianDashboard }))
);

// Clinician calendar (week view)
const ClinicianCalendar = lazy(() =>
  import('./pages/calendar/ClinicianCalendar').then((m) => ({ default: m.ClinicianCalendar }))
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

  // Auto-redirect to bloom home if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('[LandingPage] User already authenticated, redirecting to bloom-home');
      navigate('/bloom-home', { replace: true });
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
            opacity: 1,
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
          {/* Purple rose - upper center-right (The Observer, moved for harmony)
              Miyazaki principle: Give important elements breathing space */}
          <div
            className="flower-main flower-main-2"
            style={{
              position: 'absolute',
              right: isMobile ? '120px' : '160px',
              top: isMobile ? '8px' : '18px',
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
          {/* #4: Small cherry blossom - upper right (balance, moved away from bloom button)
              Miyazaki principle: Create breathing space around key elements */}
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

        {/* DEBUG: DISABLED - Geometric Landmarks for Layout Debugging
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          Center crosshair
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: '100%',
              height: '2px',
              background: 'rgba(255, 0, 0, 0.5)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              width: '2px',
              height: '100%',
              background: 'rgba(255, 0, 0, 0.5)',
            }}
          />

          Corner markers
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '20px',
              height: '20px',
              border: '2px solid green',
              background: 'rgba(0, 255, 0, 0.2)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '20px',
              height: '20px',
              border: '2px solid green',
              background: 'rgba(0, 255, 0, 0.2)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              width: '20px',
              height: '20px',
              border: '2px solid green',
              background: 'rgba(0, 255, 0, 0.2)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              width: '20px',
              height: '20px',
              border: '2px solid green',
              background: 'rgba(0, 255, 0, 0.2)',
            }}
          />

          Grid overlay
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={`h-${i}`}
              style={{
                position: 'absolute',
                top: `${(i + 1) * 10}%`,
                left: 0,
                width: '100%',
                height: '1px',
                background: 'rgba(0, 0, 255, 0.2)',
              }}
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={`v-${i}`}
              style={{
                position: 'absolute',
                left: `${(i + 1) * 10}%`,
                top: 0,
                width: '1px',
                height: '100%',
                background: 'rgba(0, 0, 255, 0.2)',
              }}
            />
          ))}
        </div>
        */}

        {/* Bloom Button - Positioned near "Paperwork" word in headline */}
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '32%' : '35%',
            right: isMobile ? '3%' : '6%',
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
          {/* Primary button - Join the community - Solid and obviously clickable */}
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
            onFocus={(e) => {
              e.currentTarget.style.outline = '3px solid #6B8E7F';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(107, 142, 127, 0.35)';
              e.currentTarget.style.background =
                'linear-gradient(135deg, #7A9B8C 0%, #9FB8A5 100%)';
              // Animate arrow on hover - move left
              const arrow = e.currentTarget.querySelector('span:first-child') as HTMLElement;
              if (arrow) arrow.style.transform = 'translateX(-6px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 142, 127, 0.25)';
              e.currentTarget.style.background =
                'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)';
              // Reset arrow position
              const arrow = e.currentTarget.querySelector('span:first-child') as HTMLElement;
              if (arrow) arrow.style.transform = 'translateX(-2px)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            }}
          >
            {/* Subtle organic texture overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                borderRadius: '12px',
                pointerEvents: 'none',
              }}
            />
            {/* Subtle arrow indicator - pointing inward */}
            <span
              style={{
                position: 'relative',
                zIndex: 1,
                fontSize: '14px',
                transform: 'translateX(-2px)',
                transition: 'transform 0.3s ease',
              }}
            >
              ←
            </span>
            <span style={{ position: 'relative', zIndex: 1 }}>Explore Joining</span>
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

        {/* Bloom Homepage - main authenticated home */}
        <Route
          path="/bloom-home"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <BloomHomepage />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Business Coach */}
        <Route
          path="/business-coach"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <BusinessCoach />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Notes History - Past session notes viewer */}
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading notes...</div>}
                >
                  <NotesHistory />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Note Detail - View single note */}
        <Route
          path="/notes/:id"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading note...</div>}
                >
                  <NoteDetail />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Client Profile - View client details and history */}
        <Route
          path="/client/:clientId"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading client...</div>}
                >
                  <ClientProfile />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Onboarding - Public route (no auth required, uses token from URL) */}
        <Route
          path="/onboarding/:token"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
              >
                <Onboarding />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Accept Offer */}
        <Route
          path="/accept-offer/:token"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
              >
                <AcceptOffer />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Schedule Interview */}
        <Route
          path="/schedule-interview/:token"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
              >
                <ScheduleInterview />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Interview Video Room */}
        <Route
          path="/interview/:token"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
              >
                <InterviewRoom />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Clinician Calendar (week view) */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <ClinicianCalendar />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Legacy admin dashboard route */}
        <Route
          path="/admin/legacy-dashboard"
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
          path="/admin/interviews"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                >
                  <InterviewManagement />
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

        {/* Smoke Tests Dashboard */}
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

        {/* Patient Join Session - Public route for patients via token link */}
        <Route
          path="/join/:token"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Connecting to your session...</div>}
              >
                <PatientJoinSession />
              </Suspense>
            </ErrorBoundary>
          }
        />
        {/* Also support query param for backwards compatibility */}
        <Route
          path="/join"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Connecting to your session...</div>}
              >
                <PatientJoinSession />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Session Lobby - Therapy Room entry point (or Patient Join if token present) */}
        <Route
          path="/session"
          element={
            <ErrorBoundary>
              <SessionRouter />
            </ErrorBoundary>
          }
        />

        {/* Telehealth Session - Clinician video call interface */}
        <Route
          path="/session/:appointmentId"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Preparing session...</div>}
                >
                  <SessionPage />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Practice Management - Standalone clinic dashboard */}
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense
                  fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading practice...</div>}
                >
                  <PracticePage />
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
