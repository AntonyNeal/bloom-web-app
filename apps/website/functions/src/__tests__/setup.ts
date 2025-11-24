// Test setup file for Azure Functions
// Mocks and global test configuration

// Mock Azure Functions context
export const mockContext = {
  invocationId: 'test-invocation-id',
  executionContext: {
    invocationId: 'test-invocation-id',
    functionName: 'test-function',
    functionDirectory: '/test',
  },
  bindings: {},
  bindingData: {},
  log: Object.assign(
    (...args: unknown[]) => {
      console.log('[MOCK LOG]', ...args);
    },
    {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      verbose: jest.fn(),
    }
  ),
  done: jest.fn(),
  res: {},
};

// Mock Azure Functions request
export const mockRequest = (overrides: Record<string, unknown> = {}) => ({
  method: 'GET',
  url: 'http://localhost:7071/api/test',
  headers: {},
  query: {},
  params: {},
  body: undefined,
  rawBody: undefined,
  ...overrides,
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test environment setup
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
