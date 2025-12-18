import React from 'react';
import { ABTestContext } from '../hooks/useABTest';
import UnifiedHeader from './UnifiedHeader';

const SmartHeader = () => {
  // Safely check if A/B test context is available
  const abTestContext = React.useContext(ABTestContext);

  // If no A/B test context (e.g., during tests), use default photo
  if (!abTestContext) {
    console.warn(
      '[SmartHeader] A/B context not available, using default photo'
    );
    return <UnifiedHeader heroPhoto="/assets/hero-zoe-main.jpg" />;
  }

  const { variant } = abTestContext;

  // Handle case where variant is still loading/initializing
  if (variant === null || variant === undefined) {
    console.log('[SmartHeader] Variant still initializing, using fallback');
    return <UnifiedHeader heroPhoto="/assets/hero-zoe-main.jpg" />;
  }

  console.log(`[SmartHeader] Rendering variant: ${variant}`);

  // A/B Test: Different hero photos
  // photo-standing uses the full standing portrait (hero-1200.jpg - 1067x1600)
  // photo-current uses the seated photo (hero-zoe-main.jpg)
  const heroPhoto = variant === 'photo-standing' 
    ? '/assets/hero-1200.jpg' 
    : '/assets/hero-zoe-main.jpg';

  return <UnifiedHeader heroPhoto={heroPhoto} />;
};

export default SmartHeader;
