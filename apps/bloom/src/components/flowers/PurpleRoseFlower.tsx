/**
 * Purple Rose Flower - Standalone variant for meadow scenes
 * 
 * Based on Tier2Flower but without built-in positioning.
 * Does not modify the original Tier2Flower.
 * 
 * Visual characteristics:
 * - Layered petals (outer + inner) for depth
 * - Deep purple with gradient from pale edges to rich center
 * - Organic variations in petal size and angle
 * - Elegant, romantic feel
 * 
 * Bloom Design System: Detailed, caring, vibrant
 */

import { memo, useId } from "react";

export interface PurpleRoseFlowerProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const PurpleRoseFlower = memo(({ 
  size = 64,
  className = '',
  animate = true,
}: PurpleRoseFlowerProps) => {
  const id = useId();
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`${className} ${animate ? 'purple-rose-sway' : ''}`}
      style={{ willChange: animate ? 'transform' : 'auto' }}
      aria-hidden="true"
    >
      <defs>
        {/* Outer petal gradient - lighter, more exposed */}
        <radialGradient id={`purpleOuter-${id}`}>
          <stop offset="0%" stopColor="#F0E5F9" />
          <stop offset="30%" stopColor="#E0CEF0" />
          <stop offset="60%" stopColor="#C7ABD9" />
          <stop offset="85%" stopColor="#B18FC7" />
          <stop offset="100%" stopColor="#9B72AA" />
        </radialGradient>
        
        {/* Inner petal gradient - deeper, more shadowed */}
        <radialGradient id={`purpleInner-${id}`}>
          <stop offset="0%" stopColor="#D4BEED" />
          <stop offset="40%" stopColor="#B18FC7" />
          <stop offset="70%" stopColor="#9B72AA" />
          <stop offset="100%" stopColor="#7A5589" />
        </radialGradient>
        
        {/* Deep shadow for petal overlaps */}
        <radialGradient id={`purpleShadow-${id}`}>
          <stop offset="0%" stopColor="#6F4C7A" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4A3350" stopOpacity="0.8" />
        </radialGradient>
        
        {/* Soft center */}
        <radialGradient id={`roseCenter-${id}`}>
          <stop offset="0%" stopColor="#F5E6B8" />
          <stop offset="60%" stopColor="#E8D4A8" />
          <stop offset="100%" stopColor="#C9A87C" />
        </radialGradient>
        
        {/* Soft glow filter */}
        <filter id={`roseGlow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="#9B72AA" floodOpacity="0.25"/>
        </filter>
      </defs>
      
      <g>
        {/* Outer ring: 6 petals - larger, lighter */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          // Organic variations
          const angleVar = [5, -3, 4, -4, 3, -5][i];
          const sizeVar = [1.05, 0.95, 1.0, 1.08, 0.98, 1.02][i];
          const adjustedAngle = angle + angleVar;
          const petalDistance = 10.5;
          const x = 20 + Math.cos((adjustedAngle * Math.PI) / 180) * petalDistance;
          const y = 20 + Math.sin((adjustedAngle * Math.PI) / 180) * petalDistance;
          const petalWidth = 6.5 * sizeVar;
          const petalHeight = 7.2 * sizeVar;

          return (
            <g key={`outer-${i}`}>
              {/* Soft shadow beneath petal */}
              <ellipse
                cx={x + 0.5}
                cy={y + 1.0}
                rx={petalWidth}
                ry={petalHeight}
                fill={`url(#purpleShadow-${id})`}
                transform={`rotate(${adjustedAngle + 8} ${x} ${y})`}
              />
              {/* Main outer petal */}
              <ellipse
                cx={x}
                cy={y}
                rx={petalWidth}
                ry={petalHeight}
                fill={`url(#purpleOuter-${id})`}
                transform={`rotate(${adjustedAngle} ${x} ${y})`}
                filter={`url(#roseGlow-${id})`}
              />
              {/* Highlight on petal */}
              <ellipse
                cx={x - 1}
                cy={y - 1.5}
                rx={petalWidth * 0.35}
                ry={petalHeight * 0.4}
                fill="rgba(255, 255, 255, 0.3)"
                transform={`rotate(${adjustedAngle} ${x} ${y})`}
              />
            </g>
          );
        })}

        {/* Inner ring: 4 petals - smaller, deeper color */}
        {[45, 135, 225, 315].map((angle, i) => {
          const angleVar = [-3, 4, -2, 3][i];
          const sizeVar = [1.0, 0.95, 1.05, 0.98][i];
          const adjustedAngle = angle + angleVar;
          const petalDistance = 5.5;
          const x = 20 + Math.cos((adjustedAngle * Math.PI) / 180) * petalDistance;
          const y = 20 + Math.sin((adjustedAngle * Math.PI) / 180) * petalDistance;
          const petalWidth = 4.5 * sizeVar;
          const petalHeight = 5.5 * sizeVar;

          return (
            <g key={`inner-${i}`}>
              {/* Shadow */}
              <ellipse
                cx={x + 0.3}
                cy={y + 0.5}
                rx={petalWidth}
                ry={petalHeight}
                fill={`url(#purpleShadow-${id})`}
                transform={`rotate(${adjustedAngle} ${x} ${y})`}
              />
              {/* Inner petal */}
              <ellipse
                cx={x}
                cy={y}
                rx={petalWidth}
                ry={petalHeight}
                fill={`url(#purpleInner-${id})`}
                transform={`rotate(${adjustedAngle} ${x} ${y})`}
              />
            </g>
          );
        })}

        {/* Center - golden/cream */}
        <circle cx="20" cy="20" r="4" fill={`url(#roseCenter-${id})`} />
        
        {/* Tiny center details */}
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = i * 72;
          const x = 20 + Math.cos((angle * Math.PI) / 180) * 1.5;
          const y = 20 + Math.sin((angle * Math.PI) / 180) * 1.5;
          return (
            <circle
              key={`center-${i}`}
              cx={x}
              cy={y}
              r="0.4"
              fill="#D4A84B"
              opacity="0.7"
            />
          );
        })}
      </g>
      
      {/* Animation styles */}
      <style>{`
        @keyframes purpleRoseSway {
          0%, 100% { transform: rotate(-1.5deg); }
          50% { transform: rotate(1.5deg); }
        }
        .purple-rose-sway {
          animation: purpleRoseSway 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .purple-rose-sway { animation: none; }
        }
      `}</style>
    </svg>
  );
});

PurpleRoseFlower.displayName = 'PurpleRoseFlower';

export default PurpleRoseFlower;
