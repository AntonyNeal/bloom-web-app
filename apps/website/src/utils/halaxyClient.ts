/**
 * Halaxy Client - Frontend API wrapper
 * Handles communication with Azure Function for Halaxy booking operations
 */

import { apiService } from '../services/ApiService';
import { log } from './logger';

interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
}

interface AppointmentDetails {
  startTime: string; // ISO 8601 format with timezone
  endTime: string;
  minutesDuration: number;
  notes?: string;
}

interface SessionData {
  client_id?: string;
  session_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
}

interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  patientId?: string;
  bookingSessionId?: string;
  message?: string;
  error?: string;
}

export class HalaxyClient {
  private static instance: HalaxyClient;
  private readonly AZURE_FUNCTION_URL: string;

  private constructor() {
    // Get Azure Function URL from environment
    const functionUrl = import.meta.env['VITE_HALAXY_BOOKING_FUNCTION_URL'];

    if (!functionUrl) {
      console.error(
        '[HalaxyClient] VITE_HALAXY_BOOKING_FUNCTION_URL not configured'
      );
      // Fallback for development
      this.AZURE_FUNCTION_URL =
        'http://localhost:7071/api/create-halaxy-booking';
    } else {
      this.AZURE_FUNCTION_URL = functionUrl;
    }
  }

  static getInstance(): HalaxyClient {
    if (!HalaxyClient.instance) {
      HalaxyClient.instance = new HalaxyClient();
    }
    return HalaxyClient.instance;
  }

  /**
   * Extract GA4 client_id from _ga cookie
   */
  private extractClientId(): string | null {
    try {
      const gaCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('_ga='));

      if (!gaCookie) return null;

      const cookieValue = gaCookie.split('=')[1];
      const parts = cookieValue.split('.');
      if (parts.length >= 4) {
        return parts.slice(2).join('.');
      }
      return null;
    } catch (error) {
      console.error('[HalaxyClient] Error extracting client_id:', error);
      return null;
    }
  }

  /**
   * Get GA4 session_id
   */
  private async getSessionId(): Promise<string | null> {
    return new Promise((resolve) => {
      if (typeof gtag === 'undefined') {
        resolve(null);
        return;
      }

      try {
        gtag('get', 'G-XGGBRLPBKK', 'session_id', (sessionId: string) => {
          resolve(sessionId || null);
        });

        setTimeout(() => resolve(null), 1000);
      } catch (error) {
        console.error('[HalaxyClient] Error getting session_id:', error);
        resolve(null);
      }
    });
  }

  /**
   * Extract UTM parameters from URL
   */
  private extractUtmParams(): Partial<SessionData> {
    const urlParams = new URLSearchParams(window.location.search);
    const params: Partial<SessionData> = {};

    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    const gclid = urlParams.get('gclid');

    if (utmSource) params.utm_source = utmSource;
    if (utmMedium) params.utm_medium = utmMedium;
    if (utmCampaign) params.utm_campaign = utmCampaign;
    if (gclid) params.gclid = gclid;

    return params;
  }

  /**
   * Build session data for tracking
   */
  private async buildSessionData(): Promise<SessionData> {
    const clientId = this.extractClientId();
    const sessionId = await this.getSessionId();
    const utmParams = this.extractUtmParams();

    const sessionData: SessionData = {
      ...utmParams,
    };

    if (clientId) sessionData.client_id = clientId;
    if (sessionId) sessionData.session_id = sessionId;

    return sessionData;
  }

  /**
   * Create a booking with Halaxy
   */
  async createBooking(
    patient: PatientData,
    appointmentDetails: AppointmentDetails
  ): Promise<BookingResponse> {
    try {
      console.log('[HalaxyClient] Creating booking...', {
        patient: { ...patient, email: '***' },
        appointmentDetails,
      });

      // Build session data for tracking
      const sessionData = await this.buildSessionData();

      // Call Azure Function
      const response = await apiService.post<BookingResponse>(
        this.AZURE_FUNCTION_URL,
        {
          patient,
          appointmentDetails,
          sessionData,
        }
      );

      console.log('[HalaxyClient] API Response:', response);

      // Handle response - the API may return data directly or nested in response.data
      // When API returns { success: true, appointmentId: ... }, it gets passed through directly
      // Check if the response itself is the booking response (has appointmentId)
      const data: BookingResponse = (response as unknown as BookingResponse).appointmentId 
        ? (response as unknown as BookingResponse)
        : response.data as BookingResponse;

      if (!data || !data.success) {
        const errorMsg = data?.error || 
          (typeof response.error === 'string' ? response.error : null) ||
          (typeof (response as { error?: { message?: string } }).error?.message === 'string'
            ? (response as { error?: { message?: string } }).error?.message
            : 'Booking failed');
        log.error('Booking failed', 'HalaxyClient', { response, data });
        throw new Error(errorMsg);
      }

      console.log('[HalaxyClient] Booking successful:', data);

      // Fire GA4 conversion event
      this.fireBookingConversion(data.appointmentId || '');

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Unknown error occurred';
      
      console.error('[HalaxyClient] Booking error:', errorMessage);
      log.error('Booking failed', 'HalaxyClient', error);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Fire GA4 conversion event for successful booking
   */
  private fireBookingConversion(appointmentId: string): void {
    try {
      // Push to dataLayer for GTM
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'booking_completed',
          transaction_id: appointmentId,
          value: 250,
          currency: 'AUD',
        });
      }

      // Fire Google Ads conversion
      if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
          send_to: 'AW-11563740075/BOOKING_CONVERSION_LABEL', // Update with your label
          transaction_id: appointmentId,
          value: 250,
          currency: 'AUD',
        });
      }

      console.log('[HalaxyClient] Conversion event fired for:', appointmentId);
    } catch (error) {
      console.error('[HalaxyClient] Error firing conversion:', error);
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format (Australian)
   */
  static validatePhone(phone: string): boolean {
    // Allow Australian mobile and landline formats
    const phoneRegex = /^(\+61|0)[2-478](\s?\d){8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Format date for Halaxy API (ISO 8601 with timezone)
   */
  static formatDateTime(date: Date, timezone = '+10:00'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezone}`;
  }
}

// Export singleton instance
export const halaxyClient = HalaxyClient.getInstance();
