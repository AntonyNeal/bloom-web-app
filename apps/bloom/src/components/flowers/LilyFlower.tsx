/**
 * Lily Flower - Pink Asiatic Lily
 * 
 * Visual characteristics from reference:
 * - 6 pointed petals curving outward like a star
 * - Pink gradient from pale edges to deeper pink center
 * - Prominent stamens with dark red/brown anthers
 * - Delicate spotting/freckling near center
 * - Elegant, graceful form
 * 
 * Miyazaki touch: organic variations, gentle movement
 */

import { memo, useId } from "react";

export interface LilyFlowerProps {
  size?: number;
  className?: string;
  animate?: boolean;
  variant?: 'pink' | 'white-pink' | 'coral';
}

export const LilyFlower = memo(({ 
  size = 80,
  className = '',
  animate = true,
  variant = 'pink'
}: LilyFlowerProps) => {
  // Color variants
  const colorSchemes = {
    'pink': {
      petalOuter: ['#FFFBFC', '#FFE5ED', '#FFD4E0', '#FFB6C1', '#FFA8BA'],
      petalInner: ['#FFD4E0', '#FFB6C1', '#FF9BAD', '#FF8DA1'],
      stamen: '#8B4513',
      anther: '#4A1A1A',
      spots: '#D4707080',
    },
    'white-pink': {
      petalOuter: ['#FFFFFF', '#FFF5F8', '#FFE5ED', '#FFCDD8', '#FFB6C8'],
      petalInner: ['#FFEEF3', '#FFD4E0', '#FFC0CB', '#FFB0BE'],
      stamen: '#90EE90',
      anther: '#8B4513',
      spots: '#FF69B480',
    },
    'coral': {
      petalOuter: ['#FFF5F0', '#FFE4D6', '#FFCDB8', '#FFB69E', '#FFA082'],
      petalInner: ['#FFCDB8', '#FFB69E', '#FFA082', '#FF8C66'],
      stamen: '#228B22',
      anther: '#8B4513',
      spots: '#CD5C5C80',
    },
  };

  const colors = colorSchemes[variant];
  const uniqueId = useId();
  const gradientId = `lilyPetal-${variant}-${uniqueId}`;
  const innerGradientId = `lilyPetalInner-${variant}-${uniqueId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`${className} ${animate ? 'lily-flower-sway' : ''}`}
      style={{
        willChange: animate ? 'transform' : 'auto',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Main petal gradient - pale edges to deeper center */}
        <radialGradient id={gradientId} cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor={colors.petalOuter[0]} />
          <stop offset="25%" stopColor={colors.petalOuter[1]} />
          <stop offset="50%" stopColor={colors.petalOuter[2]} />
          <stop offset="75%" stopColor={colors.petalOuter[3]} />
          <stop offset="100%" stopColor={colors.petalOuter[4]} />
        </radialGradient>
        
        {/* Inner petal shadow gradient */}
        <linearGradient id={innerGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.petalInner[0]} />
          <stop offset="40%" stopColor={colors.petalInner[1]} />
          <stop offset="70%" stopColor={colors.petalInner[2]} />
          <stop offset="100%" stopColor={colors.petalInner[3]} />
        </linearGradient>

        {/* Soft petal shadow */}
        <filter id="lilyPetalShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodOpacity="0.15"/>
        </filter>
      </defs>

      <g transform="translate(24, 24)">
        {/* 6 petals - lily characteristic pointed petals curving outward */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          // Organic variations - Miyazaki touch
          const angleVariation = [3, -2, 4, -3, 2, -4][i];
          const lengthVariation = [1.0, 0.95, 1.02, 0.98, 1.03, 0.97][i];
          const widthVariation = [1.0, 1.05, 0.98, 1.02, 0.96, 1.04][i];
          const curveVariation = [0, 2, -1, 1, -2, 0][i];
          
          const adjustedAngle = angle + angleVariation;
          
          // Petal dimensions
          const petalLength = 16 * lengthVariation;
          const petalWidth = 5 * widthVariation;
          
          return (
            <g key={i} transform={`rotate(${adjustedAngle})`}>
              {/* Main petal - pointed ellipse shape */}
              <path
                d={`
                  M 0 -3
                  Q ${petalWidth + curveVariation} -${petalLength * 0.4} ${petalWidth * 0.6} -${petalLength * 0.85}
                  Q 0 -${petalLength} 0 -${petalLength}
                  Q 0 -${petalLength} -${petalWidth * 0.6} -${petalLength * 0.85}
                  Q -${petalWidth + curveVariation} -${petalLength * 0.4} 0 -3
                  Z
                `}
                fill={`url(#${gradientId})`}
                filter="url(#lilyPetalShadow)"
                opacity="0.95"
              />
              
              {/* Central vein line */}
              <line
                x1="0"
                y1="-4"
                x2="0"
                y2={-petalLength * 0.9}
                stroke={colors.petalInner[2]}
                strokeWidth="0.3"
                opacity="0.4"
              />
              
              {/* Subtle spots/freckling near base */}
              {[0.3, 0.4, 0.5].map((pos, j) => (
                <circle
                  key={j}
                  cx={(j - 1) * 1.5}
                  cy={-petalLength * pos}
                  r={0.4 + (j * 0.1)}
                  fill={colors.spots}
                />
              ))}
            </g>
          );
        })}

        {/* Center - where stamens emerge */}
        <circle
          cx="0"
          cy="0"
          r="3"
          fill="#90EE90"
          opacity="0.6"
        />

        {/* Stamens - 6 prominent filaments with anthers */}
        {[30, 90, 150, 210, 270, 330].map((angle, i) => {
          const radians = (angle * Math.PI) / 180;
          const stamenLength = 8 + (i % 2) * 1.5; // Alternating lengths
          
          const endX = Math.cos(radians) * stamenLength;
          const endY = Math.sin(radians) * stamenLength;
          const ctrlX = Math.cos(radians) * (stamenLength * 0.6);
          const ctrlY = Math.sin(radians) * (stamenLength * 0.6);
          
          return (
            <g key={`stamen-${i}`}>
              {/* Filament (stem) */}
              <path
                d={`M 0 0 Q ${ctrlX * 1.1} ${ctrlY * 1.1} ${endX} ${endY}`}
                stroke={colors.stamen}
                strokeWidth="0.5"
                fill="none"
                opacity="0.8"
              />
              
              {/* Anther (pollen-bearing tip) */}
              <ellipse
                cx={endX}
                cy={endY}
                rx="1.2"
                ry="0.6"
                fill={colors.anther}
                transform={`rotate(${angle} ${endX} ${endY})`}
              />
            </g>
          );
        })}

        {/* Central pistil */}
        <circle cx="0" cy="0" r="1.5" fill="#98FB98" />
        <circle cx="0" cy="0" r="0.8" fill="#228B22" />
      </g>

      <style>{`
        .lily-flower-sway {
          animation: lilySway 4s ease-in-out infinite;
          transform-origin: center bottom;
        }
        
        @keyframes lilySway {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .lily-flower-sway {
            animation: none;
          }
        }
      `}</style>
    </svg>
  );
});

LilyFlower.displayName = 'LilyFlower';

export default LilyFlower;
