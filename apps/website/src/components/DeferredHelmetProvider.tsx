import { lazy, Suspense, useEffect, useState, ReactNode } from 'react';

// Lazy load HelmetProvider to reduce TBT on initial render
// SEO meta tags are already in index.html for the homepage
const LazyHelmetProvider = lazy(() => 
  import('react-helmet-async').then(mod => ({ default: mod.HelmetProvider }))
);

interface DeferredHelmetProviderProps {
  children: ReactNode;
}

/**
 * Deferred Helmet Provider that loads after initial paint.
 * This reduces Total Blocking Time (TBT) by ~400ms.
 * 
 * SEO meta tags are already in index.html, so search crawlers
 * will get the correct content even before React hydrates.
 */
export function DeferredHelmetProvider({ children }: DeferredHelmetProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Defer loading until after first paint using requestIdleCallback
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => setIsReady(true),
        { timeout: 1000 } // Load within 1 second max
      );
    } else {
      // Fallback for Safari
      setTimeout(() => setIsReady(true), 100);
    }
  }, []);

  // Before HelmetProvider loads, just render children
  // The static SEO tags in index.html will be used
  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <LazyHelmetProvider>{children}</LazyHelmetProvider>
    </Suspense>
  );
}

export default DeferredHelmetProvider;
