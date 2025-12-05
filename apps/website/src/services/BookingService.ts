/**
 * BookingService - Centralized booking logic
 *
 * Consolidates booking functionality from multiple components into a single service.
 * Reduces code duplication across Header, MinimalHeader, UnifiedHeader, and MobileCTABar.
 */

import type React from 'react';
import { tracker } from '../utils/UnifiedTracker';
import { log } from '../utils/logger';

export interface BookingClickOptions {
  buttonLocation: string;
  pageSection?: string;
  variant?: 'healthcare-optimized' | 'minimal';
}

export interface BookingModalState {
  isOpen: boolean;
  source?: string;
}

export class BookingService {
  private static instance: BookingService;
  private modalCallbacks: Array<(state: BookingModalState) => void> = [];

  private constructor() {}

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  /**
   * Register callback for modal state changes
   */
  onModalStateChange(callback: (state: BookingModalState) => void): () => void {
    this.modalCallbacks.push(callback);
    return () => {
      this.modalCallbacks = this.modalCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Handle booking click event
   */
  handleBookingClick(
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    options: BookingClickOptions
  ): void {
    event.preventDefault();

    log.info('Booking click', 'BookingService', options);

    // Track with unified tracker
    tracker.trackBookingClick(options.buttonLocation, 'general');

    // Track with GA4
    const trackingData = {
      page_section: options.pageSection || 'header',
      button_location: options.buttonLocation,
      ...(options.variant && { ab_variant: options.variant }),
    };

    // Import and call GA4 tracking
    import('../utils/gtag-tracking').then(({ trackBookNowClick }) => {
      trackBookNowClick(trackingData);
    });

    // Notify modal state listeners
    this.notifyModalState({ isOpen: true, source: options.buttonLocation });
  }

  /**
   * Open booking modal programmatically
   */
  openBookingModal(source: string): void {
    log.info('Opening modal', 'BookingService', { source });
    this.notifyModalState({ isOpen: true, source });
  }

  /**
   * Close booking modal
   */
  closeBookingModal(): void {
    log.debug('Closing modal', 'BookingService');
    this.notifyModalState({ isOpen: false });
  }

  /**
   * Notify all listeners of modal state change
   */
  private notifyModalState(state: BookingModalState): void {
    this.modalCallbacks.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        log.error('Modal callback error', 'BookingService', error);
      }
    });
  }
}

// Export singleton instance
export const bookingService = BookingService.getInstance();
