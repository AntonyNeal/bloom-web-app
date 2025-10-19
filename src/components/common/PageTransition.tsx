import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  direction?: string; // Kept for compatibility but not used
}

/**
 * PageTransition - Simple fade transitions
 * 
 * Simplified from spatial navigation to just smooth fades.
 * Clean, performant, not confusing.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      style={{
        width: '100%',
        minHeight: '100vh',
      }}
    >
      {children}
    </motion.div>
  );
};
