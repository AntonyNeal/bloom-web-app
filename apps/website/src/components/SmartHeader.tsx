import React from 'react';
import { ABTestContext } from '../hooks/useABTest';
import UnifiedHeader from './UnifiedHeader';

const SmartHeader = () => {
  // Safely check if A/B test context is available
  const abTestContext = React.useContext(ABTestContext);

  // If no A/B test context (e.g., during tests), use default photo
  if (!abTestContext) {
    return <UnifiedHeader heroPhoto="/assets/hero-zoe-main.jpg" />;
  }

  const { variant } = abTestContext;

  // Handle case where variant is still loading/initializing
  if (variant === null || variant === undefined) {
    return <UnifiedHeader heroPhoto="/assets/hero-zoe-main.jpg" />;
  }

  // A/B Test: Different hero photos
  // photo-current uses the sitting on couch photo (production - proven to work)
  // photo-standing uses the close-up portrait (warmer, more personal connection)
  const heroPhoto = variant === 'photo-standing' 
    ? '/assets/zoe.jpg' 
    : '/assets/hero-zoe-main.jpg';

  return <UnifiedHeader heroPhoto={heroPhoto} />;
};

export default SmartHeader;
