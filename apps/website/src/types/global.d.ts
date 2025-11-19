// Global TypeScript definitions for Life Psychology Australia
// Consolidates window interface declarations from multiple files

export {};

declare global {
  /**
   * Extended Window interface with application-specific properties
   */
  interface Window {
    // Feature flags
    VITE_ASSESSMENT_ENABLED?: string;
    VITE_CHAT_ENABLED?: string;
    VITE_DEBUG_PANEL?: string;

    // Runtime environment variables
    __ENV_VARS__?: Record<string, string>;

    // Google Tag Manager / Analytics
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;

    // Halaxy booking tracker
    halaxyBookingTracker?: HalaxyBookingTracker;
  }

  /**
   * Halaxy booking tracker interface
   */
  interface HalaxyBookingTracker {
    handleBookingClick: (
      eventOrButton?:
        | React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
        | HTMLButtonElement
        | Event,
      customUrl?: string
    ) => void;
  }
}
