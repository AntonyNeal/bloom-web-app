'use client';

import dynamic from 'next/dynamic';

// Lazy load AvailabilityIndicator - it fetches API data and is not critical for LCP
const AvailabilityIndicator = dynamic(
  () => import('./AvailabilityIndicator').then(mod => mod.AvailabilityIndicator),
  { 
    ssr: false, // Skip SSR since it depends on client-side fetch
    loading: () => <div className="min-h-[24px]" /> // Reserve space to prevent CLS
  }
);

export function AvailabilityIndicatorClient() {
  return <AvailabilityIndicator />;
}
