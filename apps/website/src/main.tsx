// Force rebuild - 2025-11-24
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
// import './index.css'; // Moved to async loading for performance
import App from './App';
// Runtime config loaded asynchronously after initial render
// Application Insights is dynamically imported after render for better TBT

// Lightweight build metadata logging (kept minimal)
if (import.meta.env.DEV) {
  console.log('Life Psychology Australia - Build 614');
  console.log('[LOG] main.tsx - Starting app bootstrap');
}

// [VERSION] Deployed on 2025-11-19 - Iteration 803

// Set minimal default config values synchronously for immediate render
function setDefaultConfig() {
  const win = window as unknown as Record<string, unknown>;
  if (!win.__ENV_VARS__) win.__ENV_VARS__ = {};
  
  // Default values - allows immediate render without blocking
  if (!win.VITE_ASSESSMENT_ENABLED) {
    win.VITE_ASSESSMENT_ENABLED = 'false';
    (win.__ENV_VARS__ as Record<string, unknown>).VITE_ASSESSMENT_ENABLED = 'false';
  }
  if (!win.VITE_CHAT_ENABLED) {
    win.VITE_CHAT_ENABLED = 'false';
    (win.__ENV_VARS__ as Record<string, unknown>).VITE_CHAT_ENABLED = 'false';
  }
  
  // Runtime detection for GA4 measurement ID
  const hostname = window.location?.hostname || '';
  if (!win.VITE_GA_MEASUREMENT_ID || String(win.VITE_GA_MEASUREMENT_ID).startsWith('__RUNTIME_')) {
    if (
      hostname === 'www.life-psychology.com.au' ||
      hostname === 'life-psychology.com.au' ||
      hostname.includes('azurestaticapps.net') ||
      hostname.includes('red-desert')
    ) {
      win.VITE_GA_MEASUREMENT_ID = 'G-XGGBRLPBKK';
    } else {
      win.VITE_GA_MEASUREMENT_ID = 'G-XGGBRLPBKK';
    }
    (win.__ENV_VARS__ as Record<string, unknown>).VITE_GA_MEASUREMENT_ID = win.VITE_GA_MEASUREMENT_ID;
  }
}

// Load runtime config asynchronously (non-blocking)
async function loadRuntimeConfigAsync() {
  try {
    const { loadRuntimeConfig } = await import('./runtime-fetch');
    await loadRuntimeConfig('/runtime-config.json', 5000);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[WARN] main.tsx - Failed to load runtime config:', error);
    }
  }
}

function bootstrapApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[ERROR] main.tsx - Root element not found!');
    return;
  }

  if (import.meta.env.DEV) {
    console.log('[LOG] main.tsx - Root element found');
  }

  // Set default config values synchronously (non-blocking)
  setDefaultConfig();

  // Render React immediately without waiting for runtime config
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

  // Load runtime config asynchronously after initial render
  loadRuntimeConfigAsync();

  // Defer Application Insights initialization to reduce TBT
  // Load after initial paint using requestIdleCallback with longer timeout
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(
      () => {
        import('./utils/applicationInsights').then(({ initializeApplicationInsights }) => {
          initializeApplicationInsights();
        });
      },
      { timeout: 5000 }
    );
  } else {
    setTimeout(() => {
      import('./utils/applicationInsights').then(({ initializeApplicationInsights }) => {
        initializeApplicationInsights();
      });
    }, 4000);
  }
}

// Start the app
bootstrapApp();

// Defer non-critical operations to reduce Total Blocking Time
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(
    () => {
      // Register service worker for caching and performance
      import('./utils/serviceWorker')
        .then(({ registerServiceWorker }) => {
          registerServiceWorker({
            onSuccess: () => {
              console.log('[SW] Service worker registered successfully');
            },
            onError: (error) => {
              console.error('[SW] Service worker registration failed:', error);
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
            console.log('[SW] Service worker registered successfully');
          },
          onError: (error) => {
            console.error('[SW] Service worker registration failed:', error);
          },
        });
      })
      .catch(() => {
        // Silently fail if service worker loading fails
      });
  }, 100);
}

