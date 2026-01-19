/**
 * Cherry Blossom Flower - Standalone variant for meadow scenes
 * 
 * Based on Tier1Flower but without built-in positioning.
 * Does not modify the original Tier1Flower.
 * 
 * Visual characteristics:
 * - 5 delicate pink petals with soft gradients
 * - Fine stamens with golden tips
 * - Ethereal, luminous quality
 * - Reversed gradient (pale edges → deeper pink center)
 * 
 * Bloom Design System: Delicate, caring, vibrant
 */

import { memo, useId } from "react";

export interface CherryBlossomFlowerProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const CherryBlossomFlower = memo(({ 
  size = 64,
  className = '',
  animate = true,
}: CherryBlossomFlowerProps) => {
  const id = useId();
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`${className} ${animate ? 'cherry-blossom-sway' : ''}`}
      style={{ willChange: animate ? 'transform' : 'auto' }}
      aria-hidden="true"
    >
      <defs>
        {/* Reversed gradient: pale/white edges → deeper pink toward center */}
        <radialGradient id={`pinkPetal-${id}`}>
          <stop offset="0%" stopColor="#FFFBFC" />
          <stop offset="25%" stopColor="#FFE5ED" />
          <stop offset="60%" stopColor="#FFD4E0" />
          <stop offset="85%" stopColor="#FFB6C1" />
          <stop offset="100%" stopColor="#FFA8BA" />
        </radialGradient>
        
        {/* Softer center gradient */}
        <radialGradient id={`pinkCenter-${id}`}>
          <stop offset="0%" stopColor="#FFF5F8" />
          <stop offset="50%" stopColor="#FFE5ED" />
          <stop offset="100%" stopColor="#FFD4E0" />
        </radialGradient>
        
        {/* Subtle shadow */}
        <radialGradient id={`pinkShadow-${id}`}>
          <stop offset="0%" stopColor="#FFB6C1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF9BAD" stopOpacity="0.6" />
        </radialGradient>
        
        {/* Soft glow filter */}
        <filter id={`cherryGlow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.4" floodColor="#FFB6C1" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      <g>
        {/* 5 petals radiating from center */}
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const x = 16 + Math.cos((angle * Math.PI) / 180) * 9;
          const y = 16 + Math.sin((angle * Math.PI) / 180) * 9;
          // Organic variation
          const sizeVar = [1.0, 0.97, 1.02, 0.99, 1.01][i];
          
          return (
            <g key={i}>
              {/* Petal shadow/depth */}
              <ellipse
                cx={x + 0.3}
                cy={y + 0.4}
                rx={5.5 * sizeVar}
                ry={8 * sizeVar}
                fill={`url(#pinkShadow-${id})`}
                transform={`rotate(${angle} ${x} ${y})`}
              />
              {/* Main petal */}
              <ellipse
                cx={x}
                cy={y}
                rx={5.2 * sizeVar}
                ry={7.8 * sizeVar}
                fill={`url(#pinkPetal-${id})`}
                opacity="0.98"
                transform={`rotate(${angle} ${x} ${y})`}
                filter={`url(#cherryGlow-${id})`}
              />
              {/* Luminous highlight */}
              <ellipse
                cx={x - 1.0}
                cy={y - 2.0}
                rx={2.8}
                ry={4.2}
                fill="rgba(255, 255, 255, 0.75)"
                opacity="0.9"
                transform={`rotate(${angle} ${x} ${y})`}
              />
            </g>
          );
        })}
        
        {/* Center */}
        <circle cx="16" cy="16" r="4" fill={`url(#pinkCenter-${id})`} />
        
        {/* Stamens - 10 fine golden tips */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = i * 36;
          const x = 16 + Math.cos((angle * Math.PI) / 180) * 3;
          const y = 16 + Math.sin((angle * Math.PI) / 180) * 3;
          return (
            <circle 
              key={`stamen-${i}`} 
              cx={x} 
              cy={y} 
              r="0.6" 
              fill="#FFD700" 
              opacity="0.9" 
            />
          );
        })}
      </g>
      
      {/* Animation styles */}
      <style>{`
        @keyframes cherryBlossomSway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        .cherry-blossom-sway {
          animation: cherryBlossomSway 5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cherry-blossom-sway { animation: none; }
        }
      `}</style>
    </svg>
  );
});

CherryBlossomFlower.displayName = 'CherryBlossomFlower';

export default CherryBlossomFlower;
