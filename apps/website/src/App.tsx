import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import SEO from './components/SEO';
import MobileCTABar from './components/MobileCTABar';
import {
  ABTestProvider,
  ABTestControlPanel,
} from './components/ABTestProvider';
import { trackScrollDepth } from './utils/trackingEvents';
import { trackPageView } from './utils/applicationInsights';
import { initHighIntentTimer } from './utils/microConversions';
// Lazy load ChatAssistant since it's conditionally rendered
// const ChatAssistant = lazy(() => import('./components/ChatAssistant'));
import './App.css';

// Extend Window interface for our custom properties
declare global {
  interface Window {
    VITE_ASSESSMENT_ENABLED?: string;
    VITE_CHAT_ENABLED?: string;
    __ENV_VARS__?: Record<string, string>;
  }
}

import { getEnvVar, getEnvBool } from './utils/env';
import { injectGoogleAdsTag } from './utils/googleAds';
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
// const Assessment = lazy(async () => {
//   try {
//     const module = await import('./pages/Assessment');
//     return module;
//   } catch (error) {
//     console.error('[ERROR] Failed to load Assessment component:', error);
//     throw error;
//   }
// });
import { log } from './utils/logger';

function App() {
  // const [isChatOpen, setIsChatOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    // Initialize High Intent timer for micro-conversions
    initHighIntentTimer();

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
  useEffect(() => {
    // Track page view in Application Insights
    trackPageView(`Page View: ${pathname}`, window.location.href, {
      path: pathname,
      referrer: document.referrer || 'direct',
      timestamp: new Date().toISOString(),
    });
  }, [pathname]);

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

    // Initialize intent scorer immediately (lightweight)
    (async () => {
      try {
        const { intentScorer } = await import('./utils/analytics');
        intentScorer.trackReturnVisit();
      } catch (error) {
        log.error('Intent scorer initialization failed', 'App', error);
      }
    })();

    // Listen for chat toggle events from buttons
    // const handleToggleChat = () => setIsChatOpen((prev) => !prev);
    // window.addEventListener('toggleChat', handleToggleChat);

    return () => {
      // No cleanup needed for requestIdleCallback
      // window.removeEventListener('toggleChat', handleToggleChat);
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
            {import.meta.env.DEV && (
              <Route path="/test-conversions" element={<TestConversions />} />
            )}
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
            {/* Temporary debug route - always available */}
            <Route
              path="/debug"
              element={
                <div style={{ padding: '20px', fontFamily: 'monospace' }}>
                  <h1>Debug Information</h1>
                  <h2>Environment Variables:</h2>
                  <pre>
                    {JSON.stringify(
                      {
                        'import.meta.env.VITE_ASSESSMENT_ENABLED': import.meta
                          .env.VITE_ASSESSMENT_ENABLED,
                        'window.VITE_ASSESSMENT_ENABLED':
                          window.VITE_ASSESSMENT_ENABLED,
                        'window.__ENV_VARS__': window.__ENV_VARS__,
                        'getEnvBool result': getEnvBool(
                          'VITE_ASSESSMENT_ENABLED'
                        ),
                        'getEnvVar result': getEnvVar(
                          'VITE_ASSESSMENT_ENABLED'
                        ),
                      },
                      null,
                      2
                    )}
                  </pre>
                  <h2>Runtime Config Test:</h2>
                  <button
                    onClick={() => {
                      fetch('/runtime-config.json')
                        .then((r) => r.json())
                        .then((data) => {
                          console.log('Runtime config:', data);
                          alert('Check console for runtime config');
                        })
                        .catch((err) =>
                          console.error('Error fetching config:', err)
                        );
                    }}
                  >
                    Test Runtime Config Fetch
                  </button>
                </div>
              }
            />

            {/* Conditionally show assessment route based on env var */}
            {/* {(() => {
            console.log('🔍 ===========================================');
            console.log('🔍 APP COMPONENT - ASSESSMENT ROUTE DEBUG');
            console.log('🔍 ===========================================');
            console.log('🔍 Timestamp:', new Date().toISOString());
            console.log('🔍 Component: App.tsx (Route rendering)');
            console.log('🔍 Current pathname:', pathname);

            // Log all environment sources
            console.log('📦 Build-time env (import.meta.env):');
            console.log(
              '   - VITE_ASSESSMENT_ENABLED:',
              import.meta.env.VITE_ASSESSMENT_ENABLED
            );

            console.log('🌐 Global window variables:');
            console.log(
              '   - window.VITE_ASSESSMENT_ENABLED:',
              window.VITE_ASSESSMENT_ENABLED
            );
            console.log('   - window.__ENV_VARS__:', window.__ENV_VARS__);

            console.log('🔧 Utility function results:');
            const assessmentEnabled = getEnvBool('VITE_ASSESSMENT_ENABLED');
            console.log(
              '   - getEnvBool(VITE_ASSESSMENT_ENABLED):',
              assessmentEnabled
            );
            console.log(
              '   - getEnvVar(VITE_ASSESSMENT_ENABLED):',
              getEnvVar('VITE_ASSESSMENT_ENABLED')
            );

            console.log('🎯 Final decision:');
            console.log('   - assessmentEnabled:', assessmentEnabled);
            console.log(
              '   - Will render assessment route:',
              assessmentEnabled ? 'YES' : 'NO'
            );

            console.log('🔍 ===========================================');

            console.log('[RENDER] Assessment route check:', assessmentEnabled);
            return assessmentEnabled ? (
              <Route path="/assessment" element={<Assessment />} />
            ) : null;
          })()} */}
          </Routes>
        </Suspense>
        <Footer />

        {/* Mobile-only sticky CTA bar */}
        <MobileCTABar />
        {/* {(() => {
        console.log('💬 ===========================================');
        console.log('💬 APP COMPONENT - CHAT COMPONENT DEBUG');
        console.log('💬 ===========================================');
        console.log('💬 Timestamp:', new Date().toISOString());

        console.log('📦 Build-time env (import.meta.env):');
        console.log(
          '   - VITE_CHAT_ENABLED:',
          import.meta.env.VITE_CHAT_ENABLED
        );

        console.log('🌐 Global window variables:');
        console.log('   - window.VITE_CHAT_ENABLED:', window.VITE_CHAT_ENABLED);

        console.log('🔧 Utility function results:');
        const chatEnabled = getEnvBool('VITE_CHAT_ENABLED');
        console.log('   - getEnvBool(VITE_CHAT_ENABLED):', chatEnabled);
        console.log(
          '   - getEnvVar(VITE_CHAT_ENABLED):',
          getEnvVar('VITE_CHAT_ENABLED')
        );

        console.log('🎯 Final decision:');
        console.log('   - chatEnabled:', chatEnabled);
        console.log(
          '   - Will render chat component:',
          chatEnabled ? 'YES' : 'NO'
        );

        console.log('💬 ===========================================');

        console.log('[RENDER] Chat component check:', chatEnabled);
        return chatEnabled ? (
          <Suspense fallback={null}>
            <ChatAssistant
              isOpen={isChatOpen}
              onToggle={() => setIsChatOpen((prev) => !prev)}
            />
          </Suspense>
        ) : null;
      })()} */}
      </ABTestProvider>
    </ErrorBoundary>
  );
}
export default App;
