/**
 * API Type Definitions
 *
 * Common interfaces for API responses and requests
 */

// Base API response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp?: string;
}

// API error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// Runtime configuration response
export interface RuntimeConfigResponse {
  VITE_GA4_MEASUREMENT_ID: string;
  VITE_GOOGLE_ADS_CONVERSION_ID: string;
  VITE_HALAXY_BOOKING_URL: string;
  VITE_AZURE_FUNCTION_URL: string;
  VITE_ENVIRONMENT: string;
  [key: string]: string;
}

// A/B Test allocation response
export interface ABTestAllocationResponse {
  variant: string;
  testName: string;
  userId: string;
  timestamp: string;
}

// Booking session request
export interface BookingSessionRequest {
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  page_url: string;
  referrer?: string;
}

// Booking session response
export interface BookingSessionResponse {
  sessionId: string;
  expiresAt: string;
}

// Halaxy availability request
export interface HalaxyAvailabilityRequest {
  practitionerId?: string;
  startDate: string;
  endDate: string;
}

// Halaxy availability slot
export interface HalaxyAvailabilitySlot {
  id: string;
  start: string;
  end: string;
  available: boolean;
  practitionerId: string;
}

// Halaxy availability response
export interface HalaxyAvailabilityResponse
  extends ApiResponse<HalaxyAvailabilitySlot[]> {
  practitionerId: string;
  dateRange: {
    start: string;
    end: string;
  };
}
