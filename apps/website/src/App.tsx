// Force rebuild for payment integration deployment - Deploy with managed API - 2025-11-24
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy, useRef } from 'react';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import SEO from './components/SEO';
import GlobalBookingModal from './components/GlobalBookingModal';
import { ABTestProvider, ABTestControlPanel } from './components/ABTestProvider';
import { trackScrollDepth } from './utils/trackingEvents';
import { preloadAvailability } from './utils/availabilityPreloader';
// Note: High Intent timer is initialized by UnifiedTracker singleton when any page tracking is called
import './App.css';

import { injectGoogleAdsTag } from './utils/googleAds';
import { conversionManager } from './tracking';

// Lazy load below-the-fold components
const Footer = lazy(() => import('./components/Footer'));
const MobileCTABar = lazy(() => import('./components/MobileCTABar'));

// Lazy load all pages for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const IndividualTherapy = lazy(() => import('./pages/IndividualTherapy'));
const CouplesTherapy = lazy(() => import('./pages/CouplesTherapy'));
const AnxietyDepression = lazy(() => import('./pages/AnxietyDepression'));
const Neurodiversity = lazy(() => import('./pages/Neurodiversity'));
const NDISServices = lazy(() => import('./pages/NDISServices'));
const TraumaRecovery = lazy(() => import('./pages/TraumaRecovery'));
const GreaterHunter = lazy(() => import('./pages/GreaterHunter'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Privacy = lazy(() => import('./pages/Privacy'));
const CounsellingNewcastle = lazy(() => import('./pages/CounsellingNewcastle'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const TestConversions = lazy(() => import('./pages/TestConversions'));
const JoinUs = lazy(() => import('./pages/JoinUs'));
import { log } from './utils/logger';

function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Note: High Intent timer is auto-initialized by UnifiedTracker singleton
    // when any page calls tracker.trackXxxPage() - no manual init needed here

    // Scroll depth tracking
    let lastScrollPercent = 0;
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
          100
      );

      if (
        scrollPercent >= 25 &&
        scrollPercent % 25 === 0 &&
        scrollPercent > lastScrollPercent
      ) {
        trackScrollDepth(scrollPercent);
        lastScrollPercent = scrollPercent;
      }
    };

    window.addEventListener('scroll', handleScroll);

    window.addEventListener('error', (e) => {
      log.error('Window error event', 'App', e);
    });
    window.addEventListener('unhandledrejection', (e) => {
      log.error('Unhandled promise rejection', 'App', e.reason);
    });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('error', () => {});
      window.removeEventListener('unhandledrejection', () => {});
    };
  }, [pathname]);
  
  // Track initial page view only after a delay to not block first paint
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      // Defer first page view tracking to after LCP
      isFirstRender.current = false;
      const timer = setTimeout(() => {
        import('./utils/applicationInsights').then(({ trackPageView }) => {
          trackPageView(`Page View: ${pathname}`, window.location.href, {
            path: pathname,
            referrer: document.referrer || 'direct',
            timestamp: new Date().toISOString(),
          });
        });
      }, 2000); // Wait 2s after initial render
      return () => clearTimeout(timer);
    }
    
    // Track subsequent page views immediately (they don't block LCP)
    import('./utils/applicationInsights').then(({ trackPageView }) => {
      trackPageView(`Page View: ${pathname}`, window.location.href, {
        path: pathname,
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString(),
      });
    });
  }, [pathname]);

  // Preload availability data after initial render - enables "next available" message
  // in MobileCTABar and UnifiedHeader on ALL pages, not just Home
  useEffect(() => {
    // Defer availability preloading to not block initial render
    const timer = setTimeout(() => {
      preloadAvailability();
    }, 1000); // Wait 1 second after mount
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Defer analytics initialization to avoid blocking initial render
    const initAnalyticsWhenIdle = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(
          () => {
            setTimeout(async () => {
              try {
                const { initAnalytics } = await import('./utils/analytics');
                initAnalytics();
              } catch (error) {
                log.error('Analytics initialization failed', 'App', error);
              }

              try {
                injectGoogleAdsTag();
              } catch (error) {
                log.error('Google Ads tag injection failed', 'App', error);
              }
            }, 2000); // Reduced delay since we're already in idle time
          },
          { timeout: 5000 }
        );
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(async () => {
          try {
            const { initAnalytics } = await import('./utils/analytics');
            initAnalytics();
          } catch (error) {
            log.error('Analytics initialization failed', 'App', error);
          }

          try {
            injectGoogleAdsTag();
          } catch (error) {
            log.error('Google Ads tag injection failed', 'App', error);
          }
        }, 5000);
      }
    };

    initAnalyticsWhenIdle();

    // Initialize conversion tracking system (captures GCLID/UTM immediately)
    try {
      conversionManager.initialize();
    } catch (error) {
      log.error('Conversion tracking initialization failed', 'App', error);
    }

    // Initialize intent scorer immediately (lightweight)
    (async () => {
      try {
        const { intentScorer } = await import('./utils/analytics');
        intentScorer.trackReturnVisit();
      } catch (error) {
        log.error('Intent scorer initialization failed', 'App', error);
      }
    })();

    return () => {
      // No cleanup needed for requestIdleCallback
    };
  }, []);
  return (
    <ErrorBoundary>
      <ABTestProvider>
        <ABTestControlPanel />
        <ScrollToTop />
        {/* Default SEO - will be overridden by page-specific SEO components */}
        <SEO />
        <Header />
        <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/individual-therapy" element={<IndividualTherapy />} />
            <Route path="/couples-therapy" element={<CouplesTherapy />} />
            <Route path="/anxiety-depression" element={<AnxietyDepression />} />
            <Route path="/neurodiversity" element={<Neurodiversity />} />
            <Route path="/ndis-services" element={<NDISServices />} />
            <Route path="/trauma-recovery" element={<TraumaRecovery />} />
            <Route path="/greater-hunter" element={<GreaterHunter />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/join-us" element={<JoinUs />} />
            <Route
              path="/counselling-newcastle"
              element={<CounsellingNewcastle />}
            />
            <Route path="/booking-success" element={<BookingSuccess />} />
            {/* Test conversions page - accessible with ?test_key=bloom2025 in production */}
            <Route path="/test-conversions" element={<TestConversions />} />
            {/* Development test route removed */}
            {import.meta.env.MODE === 'development' && (
              <Route
                path="/test-google-ads"
                element={
                  <div style={{ padding: '20px', fontFamily: 'monospace' }}>
                    <h1>Google Ads Test Page</h1>
                    <p>Redirecting to test page...</p>
                    <script
                      dangerouslySetInnerHTML={{
                        __html: `window.location.href = '/test-google-ads.html';`,
                      }}
                    />
                  </div>
                }
              />
            )}
          </Routes>
        </Suspense>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>

        {/* Mobile-only sticky CTA bar */}
        <Suspense fallback={null}>
          <MobileCTABar />
        </Suspense>
        <GlobalBookingModal />
      </ABTestProvider>
    </ErrorBoundary>
  );
}
export default App;
