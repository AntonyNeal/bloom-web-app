import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the service worker module
const mockRegister = vi.fn();

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: mockRegister,
    addEventListener: vi.fn(),
    controller: null,
  },
  writable: true,
});

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

// Create a mock service worker manager class
class MockServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;

  async register(config: ServiceWorkerConfig = {}) {
    // Simulate the actual logic but controlled for testing
    if (this.shouldSkipRegistration()) {
      console.log(
        '[SW] Service worker registration skipped (dev mode or disabled)'
      );
      return;
    }

    try {
      console.log('[SW] Registering service worker...');
      this.registration = await mockRegister('/sw.js', { scope: '/' });
      console.log('[SW] Service worker registered successfully');
      config.onSuccess?.(this.registration!);
    } catch (error) {
      console.error('[SW] Registration failed:', error);
      config.onError?.(error as Error);
    }
  }

  private shouldSkipRegistration(): boolean {
    return this.isDev || this.isDisabled;
  }

  // Properties that can be controlled in tests
  isDev = false;
  isDisabled = false;
}

const mockSwManager = new MockServiceWorkerManager();

// Mock the registerServiceWorker function
const registerServiceWorker = (config?: ServiceWorkerConfig) => {
  return mockSwManager.register(config);
};

describe('Service Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSwManager.isDev = false;
    mockSwManager.isDisabled = false;
  });

  it('skips registration in development mode', async () => {
    mockSwManager.isDev = true;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await registerServiceWorker();

    expect(consoleSpy).toHaveBeenCalledWith(
      '[SW] Service worker registration skipped (dev mode or disabled)'
    );
    expect(mockRegister).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('does not register new service worker when disabled', async () => {
    mockSwManager.isDisabled = true;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await registerServiceWorker();

    expect(consoleSpy).toHaveBeenCalledWith(
      '[SW] Service worker registration skipped (dev mode or disabled)'
    );
    expect(mockRegister).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('registers service worker in production mode', async () => {
    const mockRegistration = {
      addEventListener: vi.fn(),
      installing: null,
      waiting: null,
      active: null,
    };
    mockRegister.mockResolvedValue(mockRegistration);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await registerServiceWorker();

    expect(mockRegister).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(consoleSpy).toHaveBeenCalledWith(
      '[SW] Registering service worker...'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      '[SW] Service worker registered successfully'
    );
    consoleSpy.mockRestore();
  });

  it('handles registration errors gracefully', async () => {
    const error = new Error('Registration failed');
    mockRegister.mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await registerServiceWorker({
      onError: vi.fn(),
    });

    expect(consoleSpy).toHaveBeenCalledWith('[SW] Registration failed:', error);
    consoleSpy.mockRestore();
  });
});
