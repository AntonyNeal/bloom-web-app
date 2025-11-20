import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
// import './index.css'; // Moved to async loading for performance
import App from './App';
import { loadRuntimeConfig } from './runtime-fetch';
import { initializeApplicationInsights } from './utils/applicationInsights';
import { log } from './utils/logger';

// Lightweight build metadata logging (kept minimal)
if (import.meta.env.DEV) {
  log.info('Life Psychology Australia - Build 614', 'main.tsx');
  log.debug('Starting app bootstrap', 'main.tsx');
}

// [VERSION] Deployed on 2025-11-19 - Iteration 811

async function bootstrapApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    log.error('Root element not found!', 'main.tsx');
    return;
  }

  if (import.meta.env.DEV) {
    log.debug('Root element found', 'main.tsx');
  }

  // Load runtime configuration from static file (replaced Function App)
  const runtimeConfigUrl = '/runtime-config.json';

  try {
    // Increase timeout to 5s to be more robust in CI / slower preview servers
    const configResult = await loadRuntimeConfig(runtimeConfigUrl, 5000);

    // If config failed to load or placeholders are still there, set fallback values
    if (
      !configResult ||
      (window as unknown as Record<string, unknown>).VITE_ASSESSMENT_ENABLED ===
        '__RUNTIME_VITE_ASSESSMENT_ENABLED__'
    ) {
      // Get current environment to conditionally enable/disable features
      const win = window as unknown as Record<string, unknown>;

      // Only set fallback values if they are not already present (don't override runtime/build-time)
      if (
        !win.VITE_ASSESSMENT_ENABLED ||
        String(win.VITE_ASSESSMENT_ENABLED).startsWith('__RUNTIME_')
      ) {
        win.VITE_ASSESSMENT_ENABLED = 'false';
        if (win.__ENV_VARS__)
          (
            win.__ENV_VARS__ as Record<string, unknown>
          ).VITE_ASSESSMENT_ENABLED = 'false';
      }

      // Prefer to preserve any existing chat setting; only disable if truly missing
      if (
        !win.VITE_CHAT_ENABLED ||
        String(win.VITE_CHAT_ENABLED).startsWith('__RUNTIME_')
      ) {
        // keep chat enabled when possible for staging/prestaging tests
        win.VITE_CHAT_ENABLED = win.VITE_CHAT_ENABLED ?? 'false';
        if (win.__ENV_VARS__)
          (win.__ENV_VARS__ as Record<string, unknown>).VITE_CHAT_ENABLED =
            win.VITE_CHAT_ENABLED;
      }

      if (
        !win.VITE_GA_MEASUREMENT_ID ||
        String(win.VITE_GA_MEASUREMENT_ID).startsWith('__RUNTIME_') ||
        win.VITE_GA_MEASUREMENT_ID === 'AUTO_DETECT'
      ) {
        // Use runtime detection for GA4 measurement ID
        const hostname = (win as unknown as Window).location?.hostname || '';
        if (
          hostname === 'www.life-psychology.com.au' ||
          hostname === 'life-psychology.com.au'
        ) {
          win.VITE_GA_MEASUREMENT_ID = 'G-XGGBRLPBKK';
        } else if (
          hostname.includes('azurestaticapps.net') ||
          hostname.includes('red-desert')
        ) {
          win.VITE_GA_MEASUREMENT_ID = 'G-XGGBRLPBKK';
        } else {
          win.VITE_GA_MEASUREMENT_ID = 'G-XGGBRLPBKK'; // Use production ID for unknown hosts
        }
        if (win.__ENV_VARS__)
          (win.__ENV_VARS__ as Record<string, unknown>).VITE_GA_MEASUREMENT_ID =
            win.VITE_GA_MEASUREMENT_ID;
      }

      if (import.meta.env.DEV) {
        console.log('[LOG] main.tsx - Fallback values set (conservative)');
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[WARN] main.tsx - Failed to load runtime config:', error);
    }
    // Set minimal fallback values if config loading fails
    const win = window as unknown as Record<string, unknown>;
    if (!win.__ENV_VARS__) win.__ENV_VARS__ = {};

    if (
      !win.VITE_ASSESSMENT_ENABLED ||
      String(win.VITE_ASSESSMENT_ENABLED).startsWith('__RUNTIME_')
    ) {
      win.VITE_ASSESSMENT_ENABLED = 'false';
      (win.__ENV_VARS__ as Record<string, unknown>).VITE_ASSESSMENT_ENABLED =
        'false';
    }

    if (
      !win.VITE_CHAT_ENABLED ||
      String(win.VITE_CHAT_ENABLED).startsWith('__RUNTIME_')
    ) {
      win.VITE_CHAT_ENABLED = win.VITE_CHAT_ENABLED ?? 'false';
      (win.__ENV_VARS__ as Record<string, unknown>).VITE_CHAT_ENABLED =
        win.VITE_CHAT_ENABLED;
    }

    if (
      !win.VITE_GA_MEASUREMENT_ID ||
      String(win.VITE_GA_MEASUREMENT_ID).startsWith('__RUNTIME_') ||
      win.VITE_GA_MEASUREMENT_ID === 'AUTO_DETECT'
    ) {
      // Use runtime detection for GA4 measurement ID
      const hostname = (win as unknown as Window).location?.hostname || '';
      if (
        hostname === 'www.life-psychology.com.au' ||
        hostname === 'life-psychology.com.au'
      ) {
        win.VITE_GA_MEASUREMENT_ID = 'G-XGGBRLPBKK';
      } else if (
        hostname.includes('azurestaticapps.net') ||
        hostname.includes('red-desert')
      ) {
        win.VITE_GA_MEASUREMENT_ID = 'G-XGGBRLPBKK';
      } else {
        win.VITE_GA_MEASUREMENT_ID = 'G-XGGBRLPBKK'; // Use production ID for unknown hosts
      }
      (win.__ENV_VARS__ as Record<string, unknown>).VITE_GA_MEASUREMENT_ID =
        win.VITE_GA_MEASUREMENT_ID;
    }
  }

  // Initialize Application Insights for monitoring and analytics
  initializeApplicationInsights();

  // Create React root and render app
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <HelmetProvider>
        <Router>
          <App />
        </Router>
      </HelmetProvider>
    </StrictMode>
  );
}

// Start the app
bootstrapApp().catch((error) => {
  log.error('Failed to bootstrap app', 'main.tsx', error);
});

// Defer non-critical operations to reduce Total Blocking Time
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(
    () => {
      // Register service worker for caching and performance
      import('./utils/serviceWorker')
        .then(({ registerServiceWorker }) => {
          registerServiceWorker({
            onSuccess: () => {
              log.info('Service worker registered successfully', 'ServiceWorker');
            },
            onError: (error) => {
              log.error('Service worker registration failed', 'ServiceWorker', error);
            },
          });
        })
        .catch(() => {
          // Silently fail if service worker loading fails
        });
    },
    { timeout: 2000 }
  ); // Don't wait longer than 2s
} else {
  // Fallback for browsers without requestIdleCallback
  setTimeout(() => {
    // Register service worker for caching and performance
    import('./utils/serviceWorker')
      .then(({ registerServiceWorker }) => {
        registerServiceWorker({
          onSuccess: () => {
            log.info('Service worker registered successfully', 'ServiceWorker');
          },
          onError: (error) => {
            log.error('Service worker registration failed', 'ServiceWorker', error);
          },
        });
      })
      .catch(() => {
        // Silently fail if service worker loading fails
      });
  }, 100);
}
