import React from 'react';
import { ABTestContext } from '../hooks/useABTest';
import MinimalHeader from './MinimalHeader';
import UnifiedHeader from './UnifiedHeader';

const SmartHeader = () => {
  // Safely check if A/B test context is available
  const abTestContext = React.useContext(ABTestContext);

  // If no A/B test context (e.g., during tests), use healthcare-optimized fallback
  if (!abTestContext) {
    console.warn(
      '[SmartHeader] A/B context not available, using healthcare-optimized fallback'
    );
    return <UnifiedHeader />;
  }

  const { variant } = abTestContext;

  // Handle case where variant is still loading/initializing
  if (variant === null || variant === undefined) {
    console.log('[SmartHeader] Variant still initializing, using fallback');
    return <UnifiedHeader />;
  }

  console.log(`[SmartHeader] Rendering variant: ${variant}`);

  // Default to healthcare-optimized if variant not set
  if (variant === 'minimal') {
    return <MinimalHeader />;
  }

  // Default to healthcare-optimized (current version)
  return <UnifiedHeader />;
};

export default SmartHeader;
