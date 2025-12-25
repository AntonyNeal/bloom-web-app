/**
 * Halaxy Client - Frontend API wrapper
 * Handles communication with Azure Function for Halaxy booking operations
 */

import { apiService } from '../services/ApiService';
import { log } from './logger';
import { GOOGLE_ADS_ID, BOOKING_CONVERSION } from './trackingEvents';

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
  appointmentType?: string; // e.g., 'ndis-psychology-session', 'standard-psychology-session'
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
   * Uses centralized conversion labels from trackingEvents.ts
   */
  private fireBookingConversion(appointmentId: string): void {
    try {
      // Push to dataLayer for GTM (backup)
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'booking_completed',
          transaction_id: appointmentId,
          value: BOOKING_CONVERSION.value,
          currency: 'AUD',
        });
      }

      // Fire Google Ads conversion directly (most reliable)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
          send_to: `${GOOGLE_ADS_ID}/${BOOKING_CONVERSION.label}`,
          transaction_id: appointmentId,
          value: BOOKING_CONVERSION.value,
          currency: 'AUD',
        });
        console.log('[HalaxyClient] ✅ Google Ads conversion fired:', {
          label: BOOKING_CONVERSION.label,
          value: BOOKING_CONVERSION.value,
          appointmentId,
        });
      } else {
        console.warn('[HalaxyClient] ⚠️ gtag not available for conversion');
      }
    } catch (error) {
      console.error('[HalaxyClient] ❌ Error firing conversion:', error);
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
   * Automatically detects Sydney's timezone offset (AEST +10:00 or AEDT +11:00)
   */
  static formatDateTime(date: Date, timezone?: string): string {
    // If no timezone provided, calculate Sydney's current offset
    if (!timezone) {
      // Create a date formatter for Sydney timezone to detect DST
      const sydneyFormatter = new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Sydney',
        timeZoneName: 'shortOffset'
      });
      
      // Format the date to get the offset (e.g., "GMT+11" or "GMT+10")
      const parts = sydneyFormatter.formatToParts(date);
      const tzPart = parts.find(p => p.type === 'timeZoneName');
      
      if (tzPart?.value) {
        // Extract offset from "GMT+11" or "GMT+10"
        const match = tzPart.value.match(/GMT([+-]\d+)/);
        if (match) {
          const offsetHours = parseInt(match[1], 10);
          timezone = `${offsetHours >= 0 ? '+' : ''}${String(Math.abs(offsetHours)).padStart(2, '0')}:00`;
        }
      }
      
      // Fallback to +11:00 (AEDT) for Dec-Mar, +10:00 otherwise
      if (!timezone) {
        const month = date.getMonth(); // 0-indexed
        // DST is roughly Oct-Apr in Sydney
        const isDST = month >= 9 || month <= 3; // Oct(9) to Apr(3)
        timezone = isDST ? '+11:00' : '+10:00';
      }
    }
    
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
