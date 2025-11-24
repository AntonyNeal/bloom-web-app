import { getEnvVar } from './env';
import { captureGCLID, storeBookingIntent } from './conversionTracking';
import { apiService } from '../services/ApiService';
import { log } from './logger';
import {
  extractClientIdFromCookie,
  getSessionId,
  extractUtmParameters,
  storeUtmParameters,
  pushToDataLayer,
  getGCLID,
  storeGCLID,
  type GA4Session,
} from './trackingCore';

/**
 * Types for Azure webhook integration
 */
interface AzureBookingRequest {
  client_id: string;
  session_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
}

interface AzureBookingResponse {
  success: boolean;
  booking_session_id: string;
  message: string;
}

/**
 * Automatically handles Halaxy booking links with Google Ads conversion tracking
 * This utility provides a consistent way to handle all booking links across the site
 */
export class HalaxyBookingTracker {
  private static instance: HalaxyBookingTracker;

  // Azure endpoint configuration - key should be in environment variables
  private readonly AZURE_ENDPOINT =
    import.meta.env.VITE_HALAXY_WEBHOOK_URL || 
    'https://lpa-halaxy-webhook-handler.azurewebsites.net/api/store-booking-session';
  private readonly MEASUREMENT_ID = 'G-XGGBRLPBKK';
  private readonly AZURE_TIMEOUT = 3000; // 3 seconds

  private constructor() {
    // Don't initialize bookingUrl here - lazy load it when needed
  }

  static getInstance(): HalaxyBookingTracker {
    if (!HalaxyBookingTracker.instance) {
      HalaxyBookingTracker.instance = new HalaxyBookingTracker();
    }
    return HalaxyBookingTracker.instance;
  }

  /**
   * Get the booking URL, lazy loading it when first needed
   */
  private getBookingUrl(): string {
    return getEnvVar('VITE_BOOKING_URL', '');
  }

  /**
   * Get complete GA4 session information
   * Delegates to trackingCore utilities
   */
  private async getGA4Session(): Promise<GA4Session> {
    const [client_id, session_id] = await Promise.all([
      Promise.resolve(extractClientIdFromCookie()),
      getSessionId(this.MEASUREMENT_ID),
    ]);

    return { client_id, session_id };
  }

  /**
   * Send booking session data to Azure endpoint
   */
  private async sendToAzure(
    requestData: AzureBookingRequest
  ): Promise<AzureBookingResponse | null> {
    try {
      log.info(
        'Sending booking session to Azure',
        'HalaxyTracker',
        requestData
      );

      const result = await apiService.post<AzureBookingResponse>(
        this.AZURE_ENDPOINT,
        requestData,
        {
          timeout: this.AZURE_TIMEOUT,
        }
      );

      if (!result.success || !result.data) {
        log.error('Azure booking session failed', 'HalaxyTracker', {
          error: result.error,
        });
        return null;
      }

      const data = result.data;

      if (!data.success || !data.booking_session_id) {
        log.error(
          'Invalid response from Azure endpoint',
          'HalaxyTracker',
          data
        );
        return null;
      }

      log.info('Azure booking session created', 'HalaxyTracker', data);
      return data;
    } catch (error) {
      log.error('Azure request failed', 'HalaxyTracker', error);
      return null;
    }
  }

  /**
   * Handle booking link click with conversion tracking
   * Preserves GCLID and other URL parameters
   * Supports multiple calling patterns for flexibility
   */
  async handleBookingClick(
    eventOrButton?:
      | React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
      | HTMLButtonElement
      | Event,
    customUrl?: string
  ) {
    // Handle different input types
    let event:
      | React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
      | Event
      | null = null;
    let button: HTMLButtonElement | null = null;

    if (
      eventOrButton instanceof Event ||
      (eventOrButton && 'preventDefault' in eventOrButton)
    ) {
      // Normal event object
      event = eventOrButton;
      event.preventDefault?.();

      // Find button from event target
      const target = (event as Event & { target?: EventTarget })
        .target as HTMLElement;
      button = target?.closest('button') as HTMLButtonElement;
    } else if (eventOrButton instanceof HTMLButtonElement) {
      // Direct button element passed
      button = eventOrButton;
    } else if (!eventOrButton) {
      // No arguments - try to find button from current context
      // This is a fallback for testing/manual calls
      const activeElement = document.activeElement as HTMLElement;
      button = activeElement?.closest('button') as HTMLButtonElement;

      // If no active button, look for any Book Now button
      if (!button) {
        const bookButtons = Array.from(
          document.querySelectorAll('button')
        ).filter((btn) => btn.textContent?.toLowerCase().includes('book'));
        button = bookButtons[0] || null;
      }
    }

    if (!button) {
      log.warn('No button found for booking click tracking', 'HalaxyTracker');
      return;
    }

    // Get the target URL (use custom URL if provided, otherwise use default booking URL)
    const targetUrl = customUrl || this.getBookingUrl();

    // Push a permanent dataLayer event so analytics can consistently observe bookings.
    // This allows analytics to fire conversion tracking reliably.
    const transaction_id = `lpa-${Date.now()}-${Math.floor(
      Math.random() * 100000
    )}`;

    pushToDataLayer({
      event: 'halaxy_booking',
      value: 70,
      currency: 'AUD',
      transaction_id,
    });

    log.debug('Pushed halaxy_booking to dataLayer', 'HalaxyTracker', {
      transaction_id,
    });

    // Do NOT send conversions directly here. Analytics will observe the dataLayer
    // events we pushed above and is responsible for sending conversion hits.
    // This avoids duplicate conversion sends.

    // Validate that we have a valid URL
    if (!targetUrl || targetUrl.trim() === '') {
      log.error('No booking URL configured', 'HalaxyTracker', {
        customUrl,
        bookingUrl: this.getBookingUrl(),
        envVar: getEnvVar('VITE_BOOKING_URL', 'NOT_FOUND'),
      });
      // Fallback to a default booking page or show an error
      alert('Booking system is currently unavailable. Please try again later.');
      return;
    }

    try {
      // Preserve GCLID and other URL parameters
      const currentUrl = new URL(window.location.href);
      // Make URL construction robust: accept absolute URLs, and fall back to
      // constructing relative URLs against the current page. This avoids
      // "Invalid URL" exceptions for common cases like paths or protocol-less
      // URLs (e.g. "www.example.com/path").
      let targetUrlObj: URL;
      try {
        targetUrlObj = new URL(targetUrl);
      } catch (err) {
        log.warn(
          'URL construction failed, attempting relative fallback',
          'HalaxyTracker',
          { targetUrl, err }
        );
        // Try constructing relative to the current location as a fallback
        try {
          targetUrlObj = new URL(targetUrl, window.location.href);
        } catch (inner) {
          // Re-throw so the outer catch handles it
          log.error('Fallback URL construction failed', 'HalaxyTracker', {
            targetUrl,
            error: inner,
          });
          throw inner;
        }
      }

      // Copy all search parameters from current URL to target URL
      currentUrl.searchParams.forEach((value, key) => {
        if (!targetUrlObj.searchParams.has(key)) {
          targetUrlObj.searchParams.set(key, value);
        }
      });

      // Capture GCLID and store booking intent before redirecting
      // This helps with offline conversion matching when user returns
      try {
        captureGCLID();
        storeBookingIntent({
          source: 'website',
          medium: 'booking_button',
          bookingValue: 250,
        });
        log.debug('GCLID and booking intent captured', 'HalaxyTracker');
      } catch (error) {
        log.warn('Failed to capture GCLID/intent', 'HalaxyTracker', error);
      }

      // Only run Azure integration in production environment
      if (import.meta.env.VITE_ENVIRONMENT === 'production') {
        await this.handleAzureIntegration(targetUrlObj);
      } else {
        log.debug(
          'Skipping Azure integration (not in production)',
          'HalaxyTracker'
        );
        // In development/staging, just redirect normally
        setTimeout(() => {
          window.location.href = targetUrlObj.toString();
        }, 100);
      }
    } catch (error) {
      log.error('Invalid booking URL', 'HalaxyTracker', { targetUrl, error });
      alert('There was an error with the booking link. Please try again.');
    }
  }

  /**
   * Handle Azure integration for production mode
   * Extracts GA4 data, sends to Azure, and appends booking_session_id to URL
   */
  private async handleAzureIntegration(targetUrlObj: URL): Promise<void> {
    try {
      log.debug('Starting Azure integration', 'HalaxyTracker');

      // Extract UTM parameters and store them (using trackingCore)
      const utmParams = extractUtmParameters();
      storeUtmParameters(utmParams);

      // Store GCLID if present (using trackingCore)
      const gclid = getGCLID();
      if (gclid) {
        storeGCLID(gclid);
      }

      // Get GA4 session data (using refactored method)
      const { client_id, session_id } = await this.getGA4Session();

      if (!client_id) {
        log.warn(
          'No client_id available, redirecting without Azure tracking',
          'HalaxyTracker'
        );
        window.location.href = targetUrlObj.toString();
        return;
      }

      if (!session_id) {
        log.warn(
          'No session_id available, redirecting without Azure tracking',
          'HalaxyTracker'
        );
        window.location.href = targetUrlObj.toString();
        return;
      }

      // Prepare Azure request data
      const azureRequest: AzureBookingRequest = {
        client_id,
        session_id,
        ...utmParams, // Spread UTM parameters
      };

      // Send to Azure endpoint
      const azureResponse = await this.sendToAzure(azureRequest);

      if (azureResponse && azureResponse.booking_session_id) {
        // Append booking_session_id to Halaxy URL
        const separator = targetUrlObj.href.includes('?') ? '&' : '?';
        targetUrlObj = new URL(
          `${targetUrlObj.href}${separator}booking_session_id=${azureResponse.booking_session_id}`
        );

        log.debug('Added booking_session_id to URL', 'HalaxyTracker', {
          booking_session_id: azureResponse.booking_session_id,
        });
      } else {
        log.warn(
          'Azure request failed or returned no booking_session_id',
          'HalaxyTracker'
        );
      }

      // Always redirect, even if Azure fails
      setTimeout(() => {
        window.location.href = targetUrlObj.toString();
      }, 100);
    } catch (error) {
      log.error('Azure integration error', 'HalaxyTracker', error);
      // Always redirect on error to not block user
      setTimeout(() => {
        window.location.href = targetUrlObj.toString();
      }, 100);
    }
  }

  /**
   * Get booking URL with preserved parameters (public method)
   */
  getBookingUrlWithParams(customUrl?: string): string {
    const targetUrl = customUrl || this.getBookingUrl();

    // Validate that we have a valid URL
    if (!targetUrl || targetUrl.trim() === '') {
      log.error(
        'No booking URL configured for getBookingUrlWithParams',
        'HalaxyTracker',
        {
          customUrl,
          bookingUrl: this.getBookingUrl(),
        }
      );
      return '#'; // Return a safe fallback
    }

    try {
      const currentUrl = new URL(window.location.href);
      const targetUrlObj = new URL(targetUrl);

      // Copy all search parameters from current URL to target URL
      currentUrl.searchParams.forEach((value, key) => {
        if (!targetUrlObj.searchParams.has(key)) {
          targetUrlObj.searchParams.set(key, value);
        }
      });

      return targetUrlObj.toString();
    } catch (error) {
      log.error(
        'Invalid booking URL in getBookingUrlWithParams',
        'HalaxyTracker',
        { targetUrl, error }
      );
      return '#'; // Return a safe fallback
    }
  }

  /**
   * React hook for handling booking clicks
   */
  useBookingHandler(customUrl?: string) {
    const handleClick = async (
      event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
    ) => {
      await this.handleBookingClick(event, customUrl);
    };

    return { handleClick, bookingUrl: this.getBookingUrlWithParams(customUrl) };
  }
}

// Export singleton instance
export const halaxyTracker = HalaxyBookingTracker.getInstance();
