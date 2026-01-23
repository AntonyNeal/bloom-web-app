import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Performance debugging for Lighthouse FCP issues
const perfStart = performance.now();

// Import ONLY landing page critical CSS
import './index.css'
import './styles/landing-animations.css'

// requestIdleCallback polyfill for Safari/iOS Safari which don't support it
const scheduleIdleTask = window.requestIdleCallback || 
  ((cb: IdleRequestCallback) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1));

// Defer non-critical CSS - load after initial render
scheduleIdleTask(() => {
  import('./styles/blob.css');
  import('./styles/animations.css');
  import('./styles/component-animations.css');
  import('./styles/flower-animations.css');
}, { timeout: 1000 });

import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthProvider'

// Log when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // DOM ready
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

// Use setTimeout for Safari compatibility (requestAnimationFrame may also have issues)
setTimeout(() => {
  // First paint callback
}, 0);

// Log paint timing from Performance API
window.addEventListener('load', () => {
  setTimeout(() => {
    const paintEntries = performance.getEntriesByType('paint');
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    // Performance data available for debugging if needed
    void paintEntries;
    void navigation;
  }, 0);
});
