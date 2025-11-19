/**
 * Tier 3 Flower: PhD - Golden Black-eyed Susan with Sparkles
 * 
 * Extracted from QualificationCheck.tsx for better code organization
 * and bundle size optimization.
 * 
 * Visual characteristics:
 * - 12 long, narrow golden petals radiating like sun rays
 * - Dark brown/black center (characteristic of Black-eyed Susan)
 * - Textured center disk with floret details
 * - Sparkling particle burst animation
 * - Optional smaller companion flower
 */

import { memo } from "react";

export interface Tier3FlowerProps {
  isChecked: boolean;
  isMobile: boolean;
  shouldReduceMotion: boolean | null;
}

export const Tier3Flower = memo(({ 
  isChecked, 
  isMobile, 
  shouldReduceMotion
}: Tier3FlowerProps) => {
  if (!isChecked) return null;

  const size = isMobile ? 58 : 74;
  const reduceMotion = shouldReduceMotion || false;
  
  return (
    <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className={!reduceMotion ? "tier3-flower-enter" : ""}
        style={{
          willChange: reduceMotion ? 'auto' : 'transform, opacity',
        }}
        aria-hidden="true"
      >
        <defs>
          {/* Black-eyed Susan / Rudbeckia inspired gradients */}
          <radialGradient id="rudbeckiaPetal">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="30%" stopColor="#FFD54F" />
            <stop offset="60%" stopColor="#FFCA28" />
            <stop offset="85%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#FFB300" />
          </radialGradient>
          <radialGradient id="rudbeckiaPetalBase">
            <stop offset="0%" stopColor="#FFA726" />
            <stop offset="50%" stopColor="#FF9800" />
            <stop offset="100%" stopColor="#F57C00" />
          </radialGradient>
          <radialGradient id="rudbeckiaCenter">
            <stop offset="0%" stopColor="#4A2C2A" />
            <stop offset="40%" stopColor="#3E2723" />
            <stop offset="70%" stopColor="#2C1810" />
            <stop offset="100%" stopColor="#1A0F08" />
          </radialGradient>
          <radialGradient id="rudbeckiaCenterHighlight">
            <stop offset="0%" stopColor="#6D4C41" />
            <stop offset="50%" stopColor="#5D4037" />
            <stop offset="100%" stopColor="#4E342E" />
          </radialGradient>
        </defs>
        
        {/* Black-eyed Susan flower */}
        <g>
          {/* 12 long, narrow petals radiating outward like sun rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
            const angleVariation = (i % 3 === 0 ? 2 : i % 3 === 1 ? -2 : 0);
            const lengthVariation = 0.9 + (Math.sin(i * 1.7) * 0.15);
            const adjustedAngle = angle + angleVariation;
            
            const petalStartDist = 5.5;
            const petalLength = 6.5 * lengthVariation;
            const petalMidDist = petalStartDist + (petalLength / 2);
            
            const x = 20 + Math.cos((adjustedAngle * Math.PI) / 180) * petalMidDist;
            const y = 20 + Math.sin((adjustedAngle * Math.PI) / 180) * petalMidDist;
            
            return (
              <g key={i}>
                {/* Main petal with integrated shadow */}
                <ellipse
                  cx={x}
                  cy={y}
                  rx={1.3 * lengthVariation}
                  ry={petalLength / 2}
                  fill="url(#rudbeckiaPetal)"
                  stroke="url(#rudbeckiaPetalBase)"
                  strokeWidth="0.4"
                  opacity="0.95"
                  transform={`rotate(${adjustedAngle + 90} ${x} ${y})`}
                />
              </g>
            );
          })}
          
          {/* Dark center disk (characteristic of Black-eyed Susan) */}
          <circle cx="20" cy="20" r="5.5" fill="url(#rudbeckiaCenter)" />
          
          {/* Center highlight (subtle 3D depth) */}
          <circle cx="19" cy="19" r="2.2" fill="url(#rudbeckiaCenterHighlight)" opacity="0.35" />
          
          {/* Center texture (disk florets) - optimized to 8 dots */}
          {[...Array(8)].map((_, i) => {
            const centerAngle = (i / 8) * 360;
            const centerDist = 2;
            const cx = 20 + Math.cos((centerAngle * Math.PI) / 180) * centerDist;
            const cy = 20 + Math.sin((centerAngle * Math.PI) / 180) * centerDist;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="0.5"
                fill="#3E2723"
                opacity="0.4"
              />
            );
          })}
        </g>
      </svg>
      
      {/* Sparkles removed for cleaner composition */}
    </div>
  );
});

Tier3Flower.displayName = 'Tier3Flower';
