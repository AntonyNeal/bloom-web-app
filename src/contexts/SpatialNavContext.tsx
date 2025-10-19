import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * SpatialNavContext - Navigation state management for spatial transitions
 * 
 * Tracks navigation history to determine correct transition direction.
 * Maintains spatial metaphor: Bloom is a place with geography, not a website.
 * 
 * Spatial Geography:
 * - CENTER: Landing page (Garden Gate - threshold, choice point)
 * - LEFT: Joining journey (qualification → application)
 * - RIGHT: Existing practitioners (bloom portal)
 * - UP: Celebrations, achievements, elevation
 * - DOWN: Settings, admin, technical (future)
 */

type NavigationDirection = 'left' | 'right' | 'up' | 'down' | 'none';

interface SpatialNavContextType {
  currentPage: string;
  previousPage: string | null;
  direction: NavigationDirection;
  navigateSpatial: (to: string, direction: NavigationDirection) => void;
  getReturnDirection: () => NavigationDirection;
}

const SpatialNavContext = createContext<SpatialNavContextType | null>(null);

interface SpatialNavProviderProps {
  children: ReactNode;
}

export const SpatialNavProvider: React.FC<SpatialNavProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [direction, setDirection] = useState<NavigationDirection>('none');
  
  /**
   * Determine reversed direction based on current location
   * Maps current page to the direction needed to return to origin
   */
  const getReversedDirection = useCallback((currentPath: string): NavigationDirection => {
    switch (currentPath) {
      case '/join-us':
        return 'right'; // Came from landing (left), go back right
      case '/bloom':
        return 'left'; // Came from landing (right), go back left
      case '/application':
        return 'right'; // Came from qualification (left), go back right
      case '/':
        return 'none'; // At origin, no specific direction
      default:
        return 'none';
    }
  }, []);
  
  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      // Browser navigation detected - determine reverse direction
      const currentPath = location.pathname;
      const reversedDirection = getReversedDirection(currentPath);
      setDirection(reversedDirection);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, getReversedDirection]);
  
  /**
   * Navigate with spatial awareness
   * @param to - Target route
   * @param navDirection - Direction of movement (left, right, up, down)
   */
  const navigateSpatial = (to: string, navDirection: NavigationDirection) => {
    setPreviousPage(location.pathname);
    setDirection(navDirection);
    navigate(to, { state: { direction: navDirection } });
  };
  
  /**
   * Get the direction to return to previous page
   * Reverses the original navigation direction
   */
  const getReturnDirection = (): NavigationDirection => {
    return getReversedDirection(location.pathname);
  };
  
  const value: SpatialNavContextType = {
    currentPage: location.pathname,
    previousPage,
    direction: (location.state as { direction?: NavigationDirection })?.direction || direction,
    navigateSpatial,
    getReturnDirection,
  };
  
  return (
    <SpatialNavContext.Provider value={value}>
      {children}
    </SpatialNavContext.Provider>
  );
};

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
