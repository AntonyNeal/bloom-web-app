/**
 * Test Setup and Global Configuration
 * 
 * This file runs before all tests and sets up:
 * - Environment variables for testing
 * - Global mocks
 * - Test utilities
 */

import { jest } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';

// Mock environment variables for testing
process.env.SQL_CONNECTION_STRING = 'mock-connection-string';
process.env.ACS_CONNECTION_STRING = 'mock-acs-connection';
process.env.AZURE_OPENAI_KEY = 'mock-openai-key';
process.env.AZURE_OPENAI_ENDPOINT = 'https://mock.openai.azure.com';
process.env.BLOOM_URL = 'https://test.bloom.life-psychology.com.au';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      testUtils: typeof testUtils;
    }
  }
}

export const testUtils = {
  /**
   * Create a mock HTTP request
   */
  mockRequest: (body?: unknown, params?: Record<string, string>, headers?: Record<string, string>) => ({
    json: async () => body,
    params,
    headers: new Map(Object.entries(headers || {})),
    query: new URLSearchParams(),
  }),

  /**
   * Create a mock invocation context
   */
  mockContext: () => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    invocationId: 'test-invocation-id',
  }),

  /**
   * Generate test data
   */
  testData: {
    appointmentId: () => `test-appt-${Date.now()}`,
    patientId: () => `test-patient-${Date.now()}`,
    practitionerId: () => '00000000-0000-0000-0000-000000000001',
    token: () => 'test-token-' + Math.random().toString(36).substring(7),
  },
};

// Make testUtils available globally
(global as unknown as { testUtils: typeof testUtils }).testUtils = testUtils;

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
  jest.clearAllMocks();
});
