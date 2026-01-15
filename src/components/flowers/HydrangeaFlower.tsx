/**
 * Hydrangea Flower - Purple/Blue Mophead Hydrangea
 * 
 * Visual characteristics from reference:
 * - Large spherical cluster of many small 4-petal florets
 * - Colors ranging from blue to purple to pink
 * - Each floret is simple - 4 rounded petals
 * - Dense, lush ball effect with overlapping blooms
 * - Beautiful color variation within each cluster
 * 
 * Miyazaki touch: organic color variation, gentle breathing animation
 */

import { memo, useMemo } from "react";

export interface HydrangeaFlowerProps {
  size?: number;
  className?: string;
  animate?: boolean;
  variant?: 'purple' | 'blue' | 'pink' | 'mixed';
}

// Generate a single small floret (4-petal flower)
const Floret = ({ 
  cx, 
  cy, 
  size, 
  color, 
  rotation,
  opacity 
}: { 
  cx: number; 
  cy: number; 
  size: number; 
  color: string;
  rotation: number;
  opacity: number;
}) => {
  const petalSize = size * 0.4;
  
  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`} opacity={opacity}>
      {/* 4 petals arranged in a cross */}
      {[0, 90, 180, 270].map((angle, i) => {
        const radians = (angle * Math.PI) / 180;
        const px = Math.cos(radians) * petalSize;
        const py = Math.sin(radians) * petalSize;
        
        return (
          <ellipse
            key={i}
            cx={px}
            cy={py}
            rx={petalSize * 0.85}
            ry={petalSize * 0.65}
            fill={color}
            transform={`rotate(${angle} ${px} ${py})`}
          />
        );
      })}
      {/* Tiny center */}
      <circle cx="0" cy="0" r={size * 0.12} fill="#FFFDE7" opacity="0.8" />
    </g>
  );
};

export const HydrangeaFlower = memo(({ 
  size = 80,
  className = '',
  animate = true,
  variant = 'purple'
}: HydrangeaFlowerProps) => {
  
  // Color palettes for different variants
  const colorPalettes = {
    'purple': [
      '#9B59B6', '#8E44AD', '#7D3C98', '#6C3483', '#5B2C6F',
      '#A569BD', '#BB8FCE', '#D2B4DE', '#9B59B6', '#8E44AD'
    ],
    'blue': [
      '#5DADE2', '#3498DB', '#2E86C1', '#2874A6', '#21618C',
      '#85C1E9', '#AED6F1', '#5DADE2', '#3498DB', '#2980B9'
    ],
    'pink': [
      '#E91E8C', '#D81B7A', '#C71585', '#DB7093', '#FF69B4',
      '#FFB6C1', '#FFC0CB', '#E91E8C', '#D81B7A', '#C71585'
    ],
    'mixed': [
      '#9B59B6', '#8E44AD', '#5DADE2', '#3498DB', '#E91E8C',
      '#BB8FCE', '#85C1E9', '#FFB6C1', '#7D3C98', '#2E86C1'
    ],
  };

  const colors = colorPalettes[variant];

  // Generate florets in a spherical arrangement
  // Using seeded random for deterministic, stable output
  const florets = useMemo(() => {
    // Simple seeded pseudo-random number generator
    let seed = variant.charCodeAt(0) * 100;
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    const result: Array<{
      cx: number;
      cy: number;
      size: number;
      color: string;
      rotation: number;
      opacity: number;
      zIndex: number;
    }> = [];

    const centerX = 24;
    const centerY = 24;
    const clusterRadius = 18;
    
    // Create concentric rings of florets
    const rings = [
      { radius: 0, count: 1, floretSize: 5 },
      { radius: 5, count: 6, floretSize: 4.5 },
      { radius: 9, count: 10, floretSize: 4.2 },
      { radius: 13, count: 14, floretSize: 4 },
      { radius: 17, count: 18, floretSize: 3.8 },
    ];

    rings.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (360 / ring.count) * i + (ringIndex * 15); // Offset each ring
        const radians = (angle * Math.PI) / 180;
        
        // Add some organic randomness (using seeded random for stability)
        const radiusVariation = ring.radius + (seededRandom() - 0.5) * 2;
        const angleVariation = (seededRandom() - 0.5) * 10;
        
        const cx = centerX + Math.cos(radians + angleVariation * Math.PI / 180) * radiusVariation;
        const cy = centerY + Math.sin(radians + angleVariation * Math.PI / 180) * radiusVariation;
        
        // Color selection with some randomness
        const colorIndex = Math.floor(seededRandom() * colors.length);
        
        // Outer florets are slightly more transparent (depth effect)
        const opacity = 0.85 + (1 - ring.radius / clusterRadius) * 0.15;
        
        result.push({
          cx,
          cy,
          size: ring.floretSize + (seededRandom() - 0.5) * 0.5,
          color: colors[colorIndex],
          rotation: seededRandom() * 45,
          opacity,
          zIndex: ringIndex,
        });
      }
    });

    // Sort by zIndex for proper layering (center on top)
    return result.sort((a, b) => a.zIndex - b.zIndex);
  }, [colors, variant]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`${className} ${animate ? 'hydrangea-breathe' : ''}`}
      style={{
        willChange: animate ? 'transform' : 'auto',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Soft shadow for depth */}
        <filter id="hydrangeaShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2"/>
        </filter>
        
        {/* Subtle inner glow */}
        <radialGradient id="hydrangeaGlow">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow for lush effect */}
      <circle cx="24" cy="24" r="20" fill="url(#hydrangeaGlow)" />

      {/* Floret cluster */}
      <g filter="url(#hydrangeaShadow)">
        {florets.map((floret, i) => (
          <Floret
            key={i}
            cx={floret.cx}
            cy={floret.cy}
            size={floret.size}
            color={floret.color}
            rotation={floret.rotation}
            opacity={floret.opacity}
          />
        ))}
      </g>

      {/* Subtle highlight on top */}
      <ellipse
        cx="20"
        cy="18"
        rx="8"
        ry="6"
        fill="white"
        opacity="0.1"
      />

      <style>{`
        .hydrangea-breathe {
          animation: hydrangeaBreathe 5s ease-in-out infinite;
        }
        
        @keyframes hydrangeaBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .hydrangea-breathe {
            animation: none;
          }
        }
      `}</style>
    </svg>
  );
});

HydrangeaFlower.displayName = 'HydrangeaFlower';

export default HydrangeaFlower;
