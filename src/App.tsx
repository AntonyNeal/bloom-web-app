import { lazy, Suspense, memo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { GardenGateButton } from '@/components/common/GardenGateButton';

// Lazy load all non-landing page routes
const DesignSystemTest = lazy(() => import('./DesignSystemTest').then(m => ({ default: m.DesignSystemTest })));
const ApplicationDetail = lazy(() => import('./pages/admin/ApplicationDetail'));
const JoinUs = lazy(() => import('./pages/JoinUs').then(m => ({ default: m.JoinUs })));
const Admin = lazy(() => import('./pages/admin/ApplicationManagement').then(m => ({ default: m.Admin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
import {
  Tier1Flower,
  Tier2Flower,
  Tier3Flower,
  useIsMobile,
} from '@/components/common/QualificationCheck';

// Memoized flower components to prevent re-renders
const MemoizedTier1 = memo(Tier1Flower);
const MemoizedTier2 = memo(Tier2Flower);
const MemoizedTier3 = memo(Tier3Flower);

// Landing Page - Simple navigation, no Phase 8 transitions
function LandingPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

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
          padding: '24px',
          background: 'transparent',
        }}
      >
        {/* Garden Bed - Abundant Cottage Garden
            Miyazaki-inspired: Natural asymmetry, breathing room, depth through layering
            9 flowers total: 3 prominent (greeting) + 6 companions (scattered naturally) */}
        <div
          style={{
            position: 'relative',
            width: isMobile ? '320px' : '480px',
            height: isMobile ? '180px' : '220px',
            marginBottom: isMobile ? '48px' : '64px',
          }}
        >
          {/* === MAIN FLOWERS - The Three Greeters === */}
          
          {/* Pink wildflower - left side, mid-height (The Welcomer) */}
          <div
            className="flower-main flower-main-1"
            style={{
              position: 'absolute',
              left: isMobile ? '20px' : '40px',
              top: isMobile ? '60px' : '80px',
              opacity: 0,
            }}
          >
            <MemoizedTier1 
              isChecked={true} 
              isMobile={isMobile} 
              shouldReduceMotion={true}
            />
          </div>

          {/* Purple rose - upper right area (The Observer) */}
          <div
            className="flower-main flower-main-2"
            style={{
              position: 'absolute',
              right: isMobile ? '60px' : '100px',
              top: isMobile ? '10px' : '20px',
              opacity: 0,
            }}
          >
            <MemoizedTier2 
              isChecked={true} 
              isMobile={isMobile} 
              shouldReduceMotion={true}
              sparkleCount={0}
              sparkleDelay={0}
            />
          </div>

          {/* Golden daisy - right side, mid-low (The Anchor) */}
          <div
            className="flower-main flower-main-3"
            style={{
              position: 'absolute',
              right: isMobile ? '10px' : '30px',
              bottom: isMobile ? '40px' : '50px',
              opacity: 0,
            }}
          >
            <MemoizedTier3 
              isChecked={true} 
              isMobile={isMobile} 
              shouldReduceMotion={true}
              sparkleCount={0}
              sparkleDelay={0}
            />
          </div>

          {/* === COMPANION FLOWERS - Natural Scatter (6 companions) === */}
          
          {/* #1: Small pink - lower left corner (grounding) */}
          <div
            className="flower-small flower-small-1"
            style={{
              position: 'absolute',
              left: isMobile ? '0px' : '10px',
              bottom: isMobile ? '20px' : '30px',
              opacity: 0,
              transform: isMobile ? 'scale(0.5)' : 'scale(0.6)',
            }}
          >
            <MemoizedTier1 
              isChecked={true} 
              isMobile={false}
              shouldReduceMotion={true}
            />
          </div>

          {/* #2: Small gold - upper left (creates depth) */}
          <div
            className="flower-small flower-small-2"
            style={{
              position: 'absolute',
              left: isMobile ? '80px' : '120px',
              top: isMobile ? '0px' : '0px',
              opacity: 0,
              transform: isMobile ? 'scale(0.45)' : 'scale(0.55)',
            }}
          >
            <MemoizedTier3 
              isChecked={true} 
              isMobile={false}
              shouldReduceMotion={true}
              sparkleCount={0}
              sparkleDelay={0}
            />
          </div>

          {/* #3: Small purple - center-left (mid-ground layer) */}
          <div
            className="flower-small flower-small-3"
            style={{
              position: 'absolute',
              left: isMobile ? '110px' : '160px',
              top: isMobile ? '70px' : '90px',
              opacity: 0,
              transform: isMobile ? 'scale(0.4)' : 'scale(0.5)',
            }}
          >
            <MemoizedTier2 
              isChecked={true} 
              isMobile={false}
              shouldReduceMotion={true}
              sparkleCount={0}
              sparkleDelay={0}
            />
          </div>

          {/* #4: Small pink - upper right (ADJUSTED - moved away from overlap) */}
          <div
            className="flower-small flower-small-4"
            style={{
              position: 'absolute',
              right: isMobile ? '35px' : '55px',
              top: isMobile ? '30px' : '45px',
              opacity: 0,
              transform: isMobile ? 'scale(0.45)' : 'scale(0.55)',
            }}
          >
            <MemoizedTier1 
              isChecked={true} 
              isMobile={false}
              shouldReduceMotion={true}
            />
          </div>

          {/* #5: NEW - Tiny gold - bottom right (the welcome at the gate) */}
          <div
            className="flower-small flower-small-5"
            style={{
              position: 'absolute',
              right: isMobile ? '5px' : '15px',
              bottom: isMobile ? '5px' : '10px',
              opacity: 0,
              transform: isMobile ? 'scale(0.35)' : 'scale(0.42)',
            }}
          >
            <MemoizedTier3 
              isChecked={true} 
              isMobile={false}
              shouldReduceMotion={true}
              sparkleCount={0}
              sparkleDelay={0}
            />
          </div>

          {/* #6: NEW - Small purple - upper-middle-left (adds air and depth) */}
          <div
            className="flower-small flower-small-6"
            style={{
              position: 'absolute',
              left: isMobile ? '65px' : '95px',
              top: isMobile ? '25px' : '35px',
              opacity: 0,
              transform: isMobile ? 'scale(0.38)' : 'scale(0.48)',
            }}
          >
            <MemoizedTier2 
              isChecked={true} 
              isMobile={false}
              shouldReduceMotion={true}
              sparkleCount={0}
              sparkleDelay={0}
            />
          </div>
        </div>

        {/* Headline */}
        <h1
          className="headline"
          style={{
            fontSize: isMobile ? '32px' : '40px',
            fontWeight: 600,
            color: '#3A3A3A',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            textAlign: 'center',
            marginBottom: isMobile ? '16px' : '20px',
            opacity: 0,
          }}
        >
          Care for People, Not Paperwork
        </h1>

        {/* Organization name - Link to main website */}
        <div
          className="org-name"
          style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 500,
            textAlign: 'center',
            marginBottom: isMobile ? '16px' : '20px',
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
            fontSize: isMobile ? '15px' : '16px',
            lineHeight: 1.6,
            color: '#5A5A5A',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 auto',
            marginBottom: isMobile ? '32px' : '40px',
            opacity: 0,
          }}
        >
          A community of psychologists
          <br />
          building sustainable practices together
        </p>

        {/* Buttons */}
        <div
          className="buttons"
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            marginTop: '32px',
            justifyContent: 'center',
            alignItems: 'center',
            width: isMobile ? '100%' : 'auto',
            maxWidth: isMobile ? '400px' : 'none',
            opacity: 0,
          }}
        >
          {/* Primary button - Join the community */}
          <button
            onClick={() => navigate('/join-us')}
            aria-label="Explore joining our community"
            className="primary-button"
            style={{
              minWidth: isMobile ? '100%' : '220px',
              height: '56px',
              background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
              color: '#FEFDFB',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
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
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '3px solid #6B8E7F';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            <span>Explore Joining</span>
          </button>

          {/* Secondary button - "Bloom" */}
          <button
            onClick={() => navigate('/bloom')}
            aria-label="Access practitioner portal"
            className="secondary-button"
            style={{
              minWidth: isMobile ? '100%' : '180px',
              height: '56px',
              background: 'transparent',
              color: '#6B8E7F',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '2px solid rgba(107, 142, 127, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '3px solid #6B8E7F';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            <div style={{ 
              width: '20px', 
              height: '20px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'visible',
              position: 'relative',
              marginRight: '-10px',
              left: '-18px'
            }}>
              <div style={{
                transform: 'scale(0.25) translateX(-20px)',
                transformOrigin: 'center',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <MemoizedTier2 
                  isChecked={true} 
                  isMobile={false}
                  shouldReduceMotion={true}
                  sparkleCount={0}
                  sparkleDelay={0}
                />
              </div>
            </div>
            <span style={{ position: 'relative', zIndex: 0 }}>Bloom</span>
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
        
        {/* Qualification check - Joining journey */}
        <Route
          path="/join-us"
          element={
            <ErrorBoundary>
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                <JoinUs />
              </Suspense>
              <Toaster />
            </ErrorBoundary>
          }
        />
        
        {/* Bloom portal - Existing practitioners */}
        <Route
          path="/bloom"
          element={
            <ErrorBoundary>
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                <AdminDashboard />
              </Suspense>
              <Toaster />
            </ErrorBoundary>
          }
        />
        
        {/* Admin routes (temporary - to be integrated into /bloom) */}
        <Route
          path="/admin"
          element={
            <ErrorBoundary>
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                <AdminDashboard />
              </Suspense>
              <Toaster />
            </ErrorBoundary>
          }
        />
        
        <Route
          path="/admin/applications"
          element={
            <ErrorBoundary>
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                <Admin />
              </Suspense>
              <Toaster />
            </ErrorBoundary>
          }
        />
        
        <Route
          path="/admin/applications/:id"
          element={
            <ErrorBoundary>
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                <ApplicationDetail applicationId={""} />
              </Suspense>
              <Toaster />
            </ErrorBoundary>
          }
        />
        
        {/* Design system test route */}
        <Route
          path="/design-test"
          element={
            <ErrorBoundary>
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
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

