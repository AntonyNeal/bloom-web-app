/**
 * Sunflower - Vibrant Golden Sunflower
 * 
 * Visual characteristics from reference:
 * - Multiple layers of golden-yellow petals radiating outward
 * - Rich brown center disk with spiral seed pattern
 * - Warm gradient from bright yellow edges to golden/orange base
 * - Subtle shadow and depth on each petal
 * - Organic variations in petal size and angle
 * 
 * Designed with care following Bloom Design System principles:
 * - Warm, vibrant colors that feel alive
 * - Organic imperfection (Miyazaki touch)
 * - Soft shadows for depth without harshness
 */

import { memo, useId } from "react";

export interface SunflowerFlowerProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const SunflowerFlower = memo(({ 
  size = 80,
  className = '',
  animate = true,
}: SunflowerFlowerProps) => {
  const uniqueId = useId();
  
  // Generate petal data with organic variation
  const outerPetals = Array.from({ length: 21 }, (_, i) => {
    const baseAngle = (360 / 21) * i;
    const angleVariation = (i % 3 === 0 ? 3 : i % 3 === 1 ? -2 : 1);
    const lengthVariation = 0.92 + (Math.sin(i * 2.3) * 0.12);
    const widthVariation = 0.9 + (Math.cos(i * 1.7) * 0.15);
    return { angle: baseAngle + angleVariation, length: lengthVariation, width: widthVariation };
  });
  
  const innerPetals = Array.from({ length: 14 }, (_, i) => {
    const baseAngle = (360 / 14) * i + 12; // Offset from outer
    const angleVariation = (i % 2 === 0 ? 2 : -2);
    const lengthVariation = 0.85 + (Math.sin(i * 1.9) * 0.1);
    return { angle: baseAngle + angleVariation, length: lengthVariation };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`${className} ${animate ? 'sunflower-sway' : ''}`}
      style={{ willChange: animate ? 'transform' : 'auto' }}
      aria-hidden="true"
    >
      <defs>
        {/* Outer petal gradient - bright sunny yellow */}
        <linearGradient id={`sunflowerPetalOuter-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF176" />
          <stop offset="30%" stopColor="#FFEE58" />
          <stop offset="60%" stopColor="#FFEB3B" />
          <stop offset="85%" stopColor="#FDD835" />
          <stop offset="100%" stopColor="#FBC02D" />
        </linearGradient>
        
        {/* Inner petal gradient - warmer, more orange */}
        <linearGradient id={`sunflowerPetalInner-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="40%" stopColor="#FFD54F" />
          <stop offset="70%" stopColor="#FFCA28" />
          <stop offset="100%" stopColor="#FFB300" />
        </linearGradient>
        
        {/* Petal shadow - subtle warm shadow */}
        <linearGradient id={`sunflowerPetalShadow-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F9A825" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F57F17" stopOpacity="0.5" />
        </linearGradient>
        
        {/* Center disk gradient - rich chocolate brown */}
        <radialGradient id={`sunflowerCenter-${uniqueId}`}>
          <stop offset="0%" stopColor="#6D4C41" />
          <stop offset="25%" stopColor="#5D4037" />
          <stop offset="50%" stopColor="#4E342E" />
          <stop offset="75%" stopColor="#3E2723" />
          <stop offset="100%" stopColor="#2C1A12" />
        </radialGradient>
        
        {/* Center highlight - subtle golden reflection */}
        <radialGradient id={`sunflowerCenterHighlight-${uniqueId}`}>
          <stop offset="0%" stopColor="#8D6E63" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#5D4037" stopOpacity="0" />
        </radialGradient>
        
        {/* Seed dot gradient */}
        <radialGradient id={`sunflowerSeed-${uniqueId}`}>
          <stop offset="0%" stopColor="#FFB300" />
          <stop offset="100%" stopColor="#FF8F00" />
        </radialGradient>
        
        {/* Soft shadow filter */}
        <filter id={`sunflowerShadow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.3" dy="0.5" stdDeviation="0.4" floodColor="#5D4037" floodOpacity="0.25"/>
        </filter>
      </defs>

      <g transform="translate(24, 24)">
        {/* Outer ring of petals - 21 long petals */}
        {outerPetals.map((petal, i) => {
          const petalLength = 13 * petal.length;
          const petalWidth = 3.2 * petal.width;
          const radians = (petal.angle * Math.PI) / 180;
          const tipX = Math.cos(radians) * petalLength;
          const tipY = Math.sin(radians) * petalLength;
          const midX = Math.cos(radians) * (petalLength * 0.5);
          const midY = Math.sin(radians) * (petalLength * 0.5);
          
          return (
            <g key={`outer-${i}`}>
              {/* Petal shadow */}
              <ellipse
                cx={midX + 0.3}
                cy={midY + 0.4}
                rx={petalWidth}
                ry={petalLength * 0.48}
                fill={`url(#sunflowerPetalShadow-${uniqueId})`}
                transform={`rotate(${petal.angle + 90} ${midX} ${midY})`}
              />
              {/* Main petal */}
              <ellipse
                cx={midX}
                cy={midY}
                rx={petalWidth * 0.95}
                ry={petalLength * 0.46}
                fill={`url(#sunflowerPetalOuter-${uniqueId})`}
                filter={`url(#sunflowerShadow-${uniqueId})`}
                transform={`rotate(${petal.angle + 90} ${midX} ${midY})`}
              />
              {/* Petal highlight - luminous edge */}
              <ellipse
                cx={midX - Math.cos(radians) * 1}
                cy={midY - Math.sin(radians) * 1}
                rx={petalWidth * 0.5}
                ry={petalLength * 0.25}
                fill="rgba(255, 255, 255, 0.4)"
                transform={`rotate(${petal.angle + 90} ${midX} ${midY})`}
              />
              {/* Central vein */}
              <line
                x1={Math.cos(radians) * 5}
                y1={Math.sin(radians) * 5}
                x2={tipX * 0.85}
                y2={tipY * 0.85}
                stroke="#F9A825"
                strokeWidth="0.3"
                opacity="0.4"
              />
            </g>
          );
        })}

        {/* Inner ring of petals - 14 shorter petals */}
        {innerPetals.map((petal, i) => {
          const petalLength = 9 * petal.length;
          const petalWidth = 2.8;
          const radians = (petal.angle * Math.PI) / 180;
          const midX = Math.cos(radians) * (petalLength * 0.5);
          const midY = Math.sin(radians) * (petalLength * 0.5);
          
          return (
            <g key={`inner-${i}`}>
              {/* Main petal */}
              <ellipse
                cx={midX}
                cy={midY}
                rx={petalWidth}
                ry={petalLength * 0.45}
                fill={`url(#sunflowerPetalInner-${uniqueId})`}
                opacity="0.9"
                transform={`rotate(${petal.angle + 90} ${midX} ${midY})`}
              />
            </g>
          );
        })}

        {/* Center disk - rich brown */}
        <circle
          cx="0"
          cy="0"
          r="7"
          fill={`url(#sunflowerCenter-${uniqueId})`}
        />
        
        {/* Center highlight */}
        <ellipse
          cx="-1.5"
          cy="-1.5"
          rx="3"
          ry="2.5"
          fill={`url(#sunflowerCenterHighlight-${uniqueId})`}
        />

        {/* Seed pattern - spiral arrangement */}
        {Array.from({ length: 24 }, (_, i) => {
          // Fibonacci spiral approximation
          const goldenAngle = 137.5;
          const angle = i * goldenAngle;
          const radius = Math.sqrt(i) * 1.1;
          const radians = (angle * Math.PI) / 180;
          const cx = Math.cos(radians) * radius;
          const cy = Math.sin(radians) * radius;
          const seedSize = 0.4 + (i * 0.02);
          
          if (radius > 6) return null;
          
          return (
            <circle
              key={`seed-${i}`}
              cx={cx}
              cy={cy}
              r={seedSize}
              fill={i % 3 === 0 ? `url(#sunflowerSeed-${uniqueId})` : '#5D4037'}
              opacity={i % 3 === 0 ? 0.8 : 0.5}
            />
          );
        })}
        
        {/* Outer seed ring - darker */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (360 / 12) * i + 15;
          const radians = (angle * Math.PI) / 180;
          const cx = Math.cos(radians) * 5.5;
          const cy = Math.sin(radians) * 5.5;
          
          return (
            <circle
              key={`outerseed-${i}`}
              cx={cx}
              cy={cy}
              r="0.5"
              fill="#3E2723"
              opacity="0.6"
            />
          );
        })}
      </g>
      
      {/* CSS animation */}
      <style>{`
        @keyframes sunflowerSway {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }
        
        .sunflower-sway {
          animation: sunflowerSway 5s ease-in-out infinite;
          transform-origin: center bottom;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .sunflower-sway {
            animation: none;
          }
        }
      `}</style>
    </svg>
  );
});

SunflowerFlower.displayName = 'SunflowerFlower';
