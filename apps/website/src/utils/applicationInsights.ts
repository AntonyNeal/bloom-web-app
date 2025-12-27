/**
 * Application Insights Configuration and Utilities
 * Integrates with Azure Application Insights for performance monitoring and analytics
 */

import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Type definitions for telemetry properties
type TelemetryProperties = Record<string, string | number | boolean>;

// Application Insights configuration
const APP_INSIGHTS_CONFIG = {
  // Production Application Insights instance from rg-lpa-prod-opt
  instrumentationKey: '31c09786-0875-4ffe-a140-912a8cf2b29c',
  connectionString:
    'InstrumentationKey=31c09786-0875-4ffe-a140-912a8cf2b29c;IngestionEndpoint=https://australiaeast-1.in.applicationinsights.azure.com/;LiveEndpoint=https://australiaeast.livediagnostics.monitor.azure.com/;ApplicationId=34e18f34-f6ac-4614-b26a-17ae1dc7c539',

  // Enhanced configuration for Static Web Apps
  config: {
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,

    // Performance monitoring
    enablePerformanceTimingsTracking: true,
    enableUnhandledPromiseRejectionTracking: true,

    // Privacy and compliance
    disableCookiesUsage: false, // Enable for better user tracking
    enableDebug: import.meta.env.DEV,

    // Custom telemetry
    samplingPercentage: 100, // Full sampling for detailed insights
    maxBatchInterval: 15000, // Send data every 15 seconds
    maxBatchSizeInBytes: 1024 * 64, // 64KB batch size
  },
};

// Initialize Application Insights instance
let appInsights: ApplicationInsights | null = null;

/**
 * Initialize Application Insights
 * Should be called once during app bootstrap
 */
export const initializeApplicationInsights = (): ApplicationInsights | null => {
  try {
    // Only initialize if not already done
    if (appInsights) {
      return appInsights;
    }

    // CRITICAL: Do NOT initialize Application Insights in development/localhost
    // This prevents dev environment errors from triggering production alerts
    const hostname = window.location.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.includes('local')
    ) {
      console.log(
        '[AppInsights] Skipping initialization for localhost/development environment'
      );
      return null;
    }

    // Create new instance
    appInsights = new ApplicationInsights({
      config: {
        connectionString: APP_INSIGHTS_CONFIG.connectionString,
        ...APP_INSIGHTS_CONFIG.config,
      },
    });

    // Load and initialize
    appInsights.loadAppInsights();

    // Track initial page view
    appInsights.trackPageView();

    // Set up performance monitoring
    setupPerformanceMonitoring();

    console.log('[AppInsights] Initialized successfully');
    return appInsights;
  } catch (error) {
    console.error('[AppInsights] Failed to initialize:', error);
    return null;
  }
};

/**
 * Get the Application Insights instance
 */
export const getApplicationInsights = (): ApplicationInsights | null => {
  return appInsights;
};

/**
 * Track custom events
 */
export const trackEvent = (
  name: string,
  properties?: TelemetryProperties,
  measurements?: Record<string, number>
) => {
  if (appInsights) {
    appInsights.trackEvent({
      name,
      properties: properties || {},
      measurements: measurements || {},
    });
  }
};

/**
 * Track page views manually (for SPA routing)
 */
export const trackPageView = (
  name?: string,
  url?: string,
  properties?: TelemetryProperties
) => {
  if (appInsights) {
    const pageViewData: {
      uri: string;
      properties: TelemetryProperties;
      name?: string;
    } = {
      uri: url || window.location.href,
      properties: properties || {},
    };

    if (name) {
      pageViewData.name = name;
    }

    appInsights.trackPageView(pageViewData);
  }
};

/**
 * Track exceptions
 */
export const trackException = (
  error: Error,
  properties?: TelemetryProperties
) => {
  if (appInsights) {
    appInsights.trackException({
      exception: error,
      properties: properties || {},
    });
  }
};

/**
 * Track custom metrics
 */
export const trackMetric = (
  name: string,
  value: number,
  properties?: TelemetryProperties
) => {
  if (appInsights) {
    appInsights.trackMetric({
      name,
      average: value,
      properties: properties || {},
    });
  }
};

/**
 * Set up performance monitoring for Core Web Vitals
 */
const setupPerformanceMonitoring = () => {
  if (!appInsights) return;

  // Track Core Web Vitals with Web Vitals library integration
  if (typeof window !== 'undefined') {
    // Import and use web-vitals if available (v5+ uses onXXX naming)
    import('web-vitals')
      .then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        onCLS((metric) => {
          trackMetric('CoreWebVitals.CLS', metric.value, {
            name: metric.name,
            rating: metric.rating,
            delta: metric.delta,
          });
        });

        // INP (Interaction to Next Paint) replaced FID in web-vitals v4+
        onINP((metric) => {
          trackMetric('CoreWebVitals.INP', metric.value, {
            name: metric.name,
            rating: metric.rating,
            delta: metric.delta,
          });
        });

        onFCP((metric) => {
          trackMetric('CoreWebVitals.FCP', metric.value, {
            name: metric.name,
            rating: metric.rating,
            delta: metric.delta,
          });
        });

        onLCP((metric) => {
          trackMetric('CoreWebVitals.LCP', metric.value, {
            name: metric.name,
            rating: metric.rating,
            delta: metric.delta,
          });
        });

        onTTFB((metric) => {
          trackMetric('CoreWebVitals.TTFB', metric.value, {
            name: metric.name,
            rating: metric.rating,
            delta: metric.delta,
          });
        });
      })
      .catch((error) => {
        console.warn('[AppInsights] Web Vitals integration failed:', error);
      });

    // Track resource timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          trackMetric(
            'Performance.DOMContentLoaded',
            navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart
          );
          trackMetric(
            'Performance.LoadComplete',
            navigation.loadEventEnd - navigation.loadEventStart
          );
          trackMetric(
            'Performance.DNSLookup',
            navigation.domainLookupEnd - navigation.domainLookupStart
          );
          trackMetric(
            'Performance.TCPConnect',
            navigation.connectEnd - navigation.connectStart
          );
          trackMetric(
            'Performance.ServerResponse',
            navigation.responseEnd - navigation.requestStart
          );
        }
      }, 1000);
    });
  }
};

/**
 * Track booking conversions and user interactions
 */
export const trackBookingEvent = (
  eventType: 'booking_started' | 'booking_completed' | 'booking_abandoned',
  properties?: TelemetryProperties
) => {
  trackEvent(`Booking.${eventType}`, {
    ...properties,
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
  });
};

/**
 * Track assessment interactions
 */
export const trackAssessmentEvent = (
  eventType:
    | 'assessment_started'
    | 'assessment_completed'
    | 'assessment_abandoned',
  properties?: TelemetryProperties
) => {
  trackEvent(`Assessment.${eventType}`, {
    ...properties,
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
  });
};

/**
 * Track chat interactions
 */
export const trackChatEvent = (
  eventType: 'chat_opened' | 'chat_message_sent' | 'chat_closed',
  properties?: TelemetryProperties
) => {
  trackEvent(`Chat.${eventType}`, {
    ...properties,
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
  });
};

export default {
  initialize: initializeApplicationInsights,
  getInstance: getApplicationInsights,
  trackEvent,
  trackPageView,
  trackException,
  trackMetric,
  trackBookingEvent,
  trackAssessmentEvent,
  trackChatEvent,
};
