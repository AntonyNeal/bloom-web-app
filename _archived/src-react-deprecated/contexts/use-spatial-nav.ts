import { useContext } from 'react';
import { SpatialNavContext, type SpatialNavContextType } from './SpatialNavContext';

/**
 * Hook to access spatial navigation context
 * @throws Error if used outside SpatialNavProvider
 */
export const useSpatialNav = (): SpatialNavContextType => {
  const context = useContext(SpatialNavContext);
  if (!context) {
    throw new Error('useSpatialNav must be used within SpatialNavProvider');
  }
  return context;
};
