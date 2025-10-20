import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Performance debugging for Lighthouse FCP issues
const perfStart = performance.now();
console.log('[PERF] main.tsx started loading at', perfStart);

// Import styles
import './index.css'
// typography.css removed - file is empty, uses system fonts via index.css
import './styles/blob.css'
import './styles/landing-animations.css'
import './styles/component-animations.css'
import './styles/flower-animations.css' // CSS-only flower animations (replaces Framer Motion)
import './styles/animations.css' // Complete CSS animation library (replaces Framer Motion)

console.log('[PERF] CSS loaded in', performance.now() - perfStart, 'ms');

import App from './App.tsx'

console.log('[PERF] App imported in', performance.now() - perfStart, 'ms');

// Log when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[PERF] DOMContentLoaded at', performance.now());
  });
} else {
  console.log('[PERF] DOM already ready at', performance.now());
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[PERF] ERROR: Root element not found!');
  throw new Error('Root element not found');
}

console.log('[PERF] Root element found, creating React root at', performance.now() - perfStart, 'ms');

const root = createRoot(rootElement);

console.log('[PERF] React root created, rendering at', performance.now() - perfStart, 'ms');

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

console.log('[PERF] Render queued at', performance.now() - perfStart, 'ms');

// Log when first paint happens
requestAnimationFrame(() => {
  console.log('[PERF] First RAF callback at', performance.now() - perfStart, 'ms');
});

// Log paint timing from Performance API
window.addEventListener('load', () => {
  console.log('[PERF] Window load event at', performance.now());
  
  setTimeout(() => {
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      console.log(`[PERF] ${entry.name}: ${entry.startTime}ms`);
    });
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      console.log('[PERF] Navigation timing:', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive,
      });
    }
  }, 0);
});
