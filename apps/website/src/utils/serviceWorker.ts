// Service Worker Registration Utility
// Handles registration, updates, and user notifications

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  async register(config: ServiceWorkerConfig = {}) {
    // Only register in production and when not disabled
    if (import.meta.env.DEV || import.meta.env.VITE_DISABLE_SW === 'true') {
      console.log(
        '[SW] Service worker registration skipped (dev mode or disabled)'
      );
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Service workers not supported');
      return;
    }

    try {
      console.log('[SW] Registering service worker...');

      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Service worker registered successfully');

      // Handle updates
      this.registration!.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              this.updateAvailable = true;
              config.onUpdate?.(this.registration!);
            }
          });
        }
      });

      // Handle controller change (new SW activated)
      // DISABLED auto-reload - it causes jarring page refreshes after deployments
      // Users will get updated content on their next navigation or manual refresh
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed - new service worker is now active');
        // Do NOT auto-reload - let users continue their session uninterrupted
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message from service worker:', event.data);
      });

      config.onSuccess?.(this.registration!);
    } catch (error) {
      console.error('[SW] Registration failed:', error);
      config.onError?.(error as Error);
    }
  }

  // Skip waiting and activate new service worker immediately
  skipWaiting() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Get current registration
  getRegistration() {
    return this.registration;
  }

  // Check if update is available
  isUpdateAvailable() {
    return this.updateAvailable;
  }

  // Unregister service worker (for development/testing)
  async unregister() {
    if (this.registration) {
      await this.registration.unregister();
      console.log('[SW] Service worker unregistered');
    }
  }
}

// Export singleton instance
export const swManager = new ServiceWorkerManager();

// Convenience function for quick registration
export const registerServiceWorker = (config?: ServiceWorkerConfig) => {
  return swManager.register(config);
};

// React hook for using service worker in components
export const useServiceWorker = () => {
  return {
    register: swManager.register.bind(swManager),
    skipWaiting: swManager.skipWaiting.bind(swManager),
    isUpdateAvailable: swManager.isUpdateAvailable.bind(swManager),
    getRegistration: swManager.getRegistration.bind(swManager),
    unregister: swManager.unregister.bind(swManager),
  };
};
