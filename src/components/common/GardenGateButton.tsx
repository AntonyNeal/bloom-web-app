import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * HomeButton - Simple return navigation to landing page
 * 
 * Clean, minimal home button using Bloom design system.
 * Appears on all pages except the landing page.
 */
export const GardenGateButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show on landing page (already home)
  if (location.pathname === '/') {
    return null;
  }
  
  return (
    <motion.button
      onClick={() => navigate('/')}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      whileHover={{ 
        scale: 1.05,
        backgroundColor: 'rgba(107, 142, 127, 0.15)',
      }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'fixed',
        top: '24px',
        left: '24px',
        zIndex: 100,
        background: 'rgba(107, 142, 127, 0.1)',
        border: '2px solid rgba(107, 142, 127, 0.3)',
        borderRadius: '12px',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 2px 12px rgba(107, 142, 127, 0.15)',
        transition: 'box-shadow 0.2s ease',
      }}
      aria-label="Return to home"
      title="Home"
    >
      {/* Simple flower/bloom icon as home symbol */}
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#4a7c5d"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 5-petal flower - represents Bloom */}
        <circle cx="12" cy="12" r="2" fill="#6B8E7F" stroke="none" />
        {[0, 72, 144, 216, 288].map((angle) => {
          const x = 12 + Math.cos((angle * Math.PI) / 180) * 6;
          const y = 12 + Math.sin((angle * Math.PI) / 180) * 6;
          return (
            <ellipse
              key={angle}
              cx={x}
              cy={y}
              rx="3"
              ry="4.5"
              fill="#6B8E7F"
              stroke="none"
              transform={`rotate(${angle} ${x} ${y})`}
            />
          );
        })}
      </svg>
    </motion.button>
  );
};
