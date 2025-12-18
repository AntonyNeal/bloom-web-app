// Performance-optimized entry point - minimal blocking
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import ONLY critical landing page CSS inline
import './index.css'
import './styles/landing-animations.css'

// Dynamic import for App to allow parallel CSS loading
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthProvider'

// Defer non-critical CSS - load after initial paint
if (typeof window !== 'undefined') {
  // Use requestIdleCallback with fallback for Safari
  const scheduleIdleTask = window.requestIdleCallback || ((cb: IdleRequestCallback) => setTimeout(cb, 1));
  
  scheduleIdleTask(() => {
    import('./styles/blob.css');
    import('./styles/animations.css');
    import('./styles/component-animations.css');
    import('./styles/flower-animations.css');
  }, { timeout: 2000 });
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
