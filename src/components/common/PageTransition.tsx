import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  direction?: string; // Kept for compatibility but not used
}

/**
 * PageTransition - Simple fade transitions
 * 
 * Uses CSS animations for better performance (GPU-accelerated).
 * Clean, performant, not confusing.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <div className="page-transition">
      {children}
    </div>
  );
};
