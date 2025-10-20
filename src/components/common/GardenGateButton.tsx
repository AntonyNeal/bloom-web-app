import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * HomeButton - Simple return navigation to landing page
 * 
 * Uses CSS animations for better performance (GPU-accelerated).
 * Clean, minimal home button using Bloom design system.
 * Appears on all pages except the landing page.
 */
export const GardenGateButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show on landing page (already home) or join-us page
  if (location.pathname === '/' || location.pathname === '/join-us') {
    return null;
  }
  
  return (
    <button
      onClick={() => navigate('/')}
      className="garden-gate-button"
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
    </button>
  );
};
