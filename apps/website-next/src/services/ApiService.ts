/**
 * ApiService - Centralized API client
 *
 * Provides consistent error handling, retry logic, and type-safe API calls
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  private defaultTimeout = 30000; // 30 seconds
  private defaultRetries = 3;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_AZURE_FUNCTION_URL || '';
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Make a GET request
   */
  async get<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Core request method with retry logic
   */
  private async request<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const timeout = config?.timeout || this.defaultTimeout;
    const retries = config?.retries ?? this.defaultRetries;
    const retryDelay = config?.retryDelay || 1000;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, config, timeout);
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (
          error instanceof Response &&
          error.status >= 400 &&
          error.status < 500
        ) {
          throw this.createApiError(error.status, error.statusText);
        }

        // Only retry if we have attempts left
        if (attempt < retries) {
          await this.delay(retryDelay * (attempt + 1)); // Exponential backoff
          continue;
        }
      }
    }

    // All retries exhausted
    throw this.createApiError(
      500,
      lastError?.message || 'Request failed after retries'
    );
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    config?: RequestConfig,
    timeout?: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      // If response is not OK but has JSON body, extract error message
      if (!response.ok) {
        const errorMessage = data?.error || data?.message || response.statusText;
        throw this.createApiError(response.status, errorMessage);
      }

      // If response is already in ApiResponse format
      if ('success' in data) {
        return data as ApiResponse<T>;
      }

      // Wrap raw data in ApiResponse format
      return {
        success: true,
        data: data as T,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // If we already created an ApiError, rethrow it
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }
      // If response wasn't OK and we couldn't parse JSON
      if (!response.ok) {
        throw this.createApiError(response.status, response.statusText);
      }
      throw this.createApiError(500, 'Failed to parse response JSON');
    }
  }

  /**
   * Create standardized API error
   */
  private createApiError(statusCode: number, message: string): ApiError {
    return {
      code: `HTTP_${statusCode}`,
      message,
      statusCode,
    };
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    // If endpoint is already a full URL, return as-is
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.slice(1)
      : endpoint;

    const normalizedBase = this.baseUrl.replace(/\/+$/, '');
    const normalizedEndpoint = cleanEndpoint.replace(/^\/+/, '');

    if (!normalizedBase) {
      return `/${normalizedEndpoint}`;
    }

    const baseEndsWithApi = /\/api$/i.test(normalizedBase);
    const endpointStartsWithApi = /^api(\/|$)/i.test(normalizedEndpoint);

    if (baseEndsWithApi && endpointStartsWithApi) {
      const trimmedEndpoint = normalizedEndpoint.replace(/^api\/?/i, '');
      return trimmedEndpoint
        ? `${normalizedBase}/${trimmedEndpoint}`
        : normalizedBase;
    }

    return `${normalizedBase}/${normalizedEndpoint}`;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update base URL (useful for testing or environment changes)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
