/**
 * Blossom Flower Component - Hand-crafted parametric cherry blossom
 * 
 * Inspired by Miyazaki's attention to botanical detail and the sophistication
 * of Japanese woodblock prints. Each blossom is a miniature artwork.
 * 
 * Parameters control:
 * - Growth stage (bud → opening → full bloom → mature)
 * - Color intensity (pale → vibrant based on revenue/season)
 * - Size variation (natural diversity)
 * - Petal spread (how open the flower is)
 * - Rotation and tilt (natural positioning)
 */

import { memo, useMemo } from 'react';

export interface BlossomFlowerProps {
  /** X position in SVG coordinates */
  x: number;
  /** Y position in SVG coordinates */
  y: number;
  /** Size multiplier (0.5 to 2.0, default 1.0) */
  size?: number;
  /** Growth stage: 0 (tight bud) to 1 (full bloom) */
  stage?: number;
  /** Color intensity: 0 (pale) to 1 (vibrant) */
  intensity?: number;
  /** Rotation in degrees */
  rotation?: number;
  /** Tilt angle for depth (positive = toward viewer) */
  tilt?: number;
  /** Unique ID for gradients */
  id: string;
  /** Optional animation delay in seconds */
  delay?: number;
  /** Season variant: spring, summer, autumn */
  season?: 'spring' | 'summer' | 'autumn';
}

export const BlossomFlower = memo(({
  x,
  y,
  size = 1.0,
  stage = 1.0,
  intensity = 0.7,
  rotation = 0,
  tilt = 0,
  id,
  delay = 0,
  season = 'spring',
}: BlossomFlowerProps) => {
  // Calculate actual dimensions based on size and stage
  const baseRadius = 8 * size;
  const petalLength = baseRadius * (0.6 + stage * 0.4); // Petals extend more when blooming
  const petalWidth = baseRadius * (0.3 + stage * 0.25);
  const centerRadius = baseRadius * 0.35 * (0.7 + stage * 0.3);
  
  // Color variations by season and intensity
  const getColors = () => {
    const intensityFactor = intensity;
    
    switch (season) {
      case 'spring': // Classic pink cherry blossom
        return {
          petalBase: `rgba(${255}, ${230 - intensityFactor * 30}, ${237 - intensityFactor * 40}, ${0.95 + intensityFactor * 0.05})`,
          petalTip: `rgba(${255}, ${250 - intensityFactor * 20}, ${252 - intensityFactor * 20}, 0.98)`,
          petalDeep: `rgba(${255}, ${182 - intensityFactor * 50}, ${193 - intensityFactor * 60}, ${0.7 + intensityFactor * 0.2})`,
          center: `rgba(${255}, ${240 - intensityFactor * 40}, ${220 - intensityFactor * 60}, 0.95)`,
          stamen: `rgba(${200 + intensityFactor * 40}, ${90 + intensityFactor * 30}, ${122}, 0.9)`,
        };
      case 'summer': // Warmer, more coral tones
        return {
          petalBase: `rgba(${255}, ${200 - intensityFactor * 20}, ${210 - intensityFactor * 30}, 0.95)`,
          petalTip: `rgba(${255}, ${230 - intensityFactor * 10}, ${240 - intensityFactor * 10}, 0.98)`,
          petalDeep: `rgba(${255}, ${150 - intensityFactor * 30}, ${170 - intensityFactor * 40}, 0.8)`,
          center: `rgba(${255}, ${220 - intensityFactor * 30}, ${200 - intensityFactor * 50}, 0.95)`,
          stamen: `rgba(${220 + intensityFactor * 30}, ${100 + intensityFactor * 30}, ${130}, 0.9)`,
        };
      case 'autumn': // Deeper, more saturated pinks with hints of purple
        return {
          petalBase: `rgba(${255 - intensityFactor * 20}, ${180 - intensityFactor * 40}, ${200 - intensityFactor * 50}, 0.95)`,
          petalTip: `rgba(${255}, ${220 - intensityFactor * 20}, ${235 - intensityFactor * 25}, 0.98)`,
          petalDeep: `rgba(${230 - intensityFactor * 40}, ${140 - intensityFactor * 50}, ${170 - intensityFactor * 60}, 0.85)`,
          center: `rgba(${245}, ${200 - intensityFactor * 50}, ${190 - intensityFactor * 70}, 0.95)`,
          stamen: `rgba(${180 + intensityFactor * 40}, ${70 + intensityFactor * 30}, ${110}, 0.9)`,
        };
    }
  };
  
  const colors = getColors();
  
  // Petal opening: starts at 45° overlap, opens to 72° spacing
  const petalAngleSpread = 45 + stage * 27; // 45° to 72°
  const petalCount = 5;
  
  // Calculate tilt effect (perspective transformation)
  const tiltScale = 1 - Math.abs(tilt) * 0.003; // Subtle foreshortening
  const tiltYOffset = tilt * 0.15; // Vertical shift based on tilt
  
  // Stamen count increases with bloom stage
  const stamenCount = Math.floor(8 + stage * 4); // 8 to 12 stamens
  
  // Pre-compute stamen lengths to avoid calling Math.random during render
  const stamenLengths = useMemo(() => 
    Array.from({ length: 12 }, () => centerRadius * (1.2 + Math.random() * 0.4)),
    [centerRadius]
  );
  
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${tiltScale}, ${1 + Math.abs(tilt) * 0.002})`}
      style={{
        animation: delay > 0 ? `blossomFloat ${3 + delay}s ease-in-out infinite` : undefined,
        animationDelay: `${delay}s`,
        willChange: 'transform',
      }}
    >
      <defs>
        {/* Petal gradient - radial from center to tip */}
        <radialGradient id={`petal-gradient-${id}`}>
          <stop offset="0%" stopColor={colors.petalDeep} />
          <stop offset="35%" stopColor={colors.petalBase} />
          <stop offset="75%" stopColor={colors.petalTip} />
          <stop offset="100%" stopColor={colors.petalTip} stopOpacity="0.95" />
        </radialGradient>
        
        {/* Center gradient */}
        <radialGradient id={`center-gradient-${id}`}>
          <stop offset="0%" stopColor="rgba(255, 255, 250, 0.9)" />
          <stop offset="40%" stopColor={colors.center} />
          <stop offset="100%" stopColor={colors.petalBase} />
        </radialGradient>
        
        {/* Soft shadow for depth */}
        <radialGradient id={`shadow-gradient-${id}`}>
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0.05)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
        </radialGradient>
      </defs>
      
      {/* Shadow layer */}
      <ellipse
        cx="0.5"
        cy={tiltYOffset + 0.8}
        rx={petalLength * 1.2}
        ry={petalLength * 0.9}
        fill={`url(#shadow-gradient-${id})`}
        opacity="0.4"
      />
      
      {/* Petals - layered with depth */}
      {Array.from({ length: petalCount }).map((_, i) => {
        const angle = (i * petalAngleSpread - 90) * (Math.PI / 180);
        const petalX = Math.cos(angle) * (petalLength * 0.5);
        const petalY = Math.sin(angle) * (petalLength * 0.5) + tiltYOffset;
        
        // Alternate petal depth for natural layering
        const isBack = i % 2 === 0;
        const depthOpacity = isBack ? 0.85 : 1.0;
        const depthScale = isBack ? 0.95 : 1.0;
        
        return (
          <g key={i}>
            {/* Petal body */}
            <ellipse
              cx={petalX}
              cy={petalY}
              rx={petalWidth * depthScale}
              ry={petalLength * depthScale}
              fill={`url(#petal-gradient-${id})`}
              opacity={depthOpacity}
              transform={`rotate(${(i * petalAngleSpread)} 0 0)`}
            />
            
            {/* Petal highlight - creates luminosity */}
            <ellipse
              cx={petalX * 0.7}
              cy={petalY * 0.6}
              rx={petalWidth * 0.4}
              ry={petalLength * 0.5}
              fill="rgba(255, 255, 255, 0.6)"
              opacity={0.7 * depthOpacity}
              transform={`rotate(${(i * petalAngleSpread)} 0 0)`}
            />
            
            {/* Petal edge detail - subtle darker edge */}
            <ellipse
              cx={petalX * 1.1}
              cy={petalY * 1.1}
              rx={petalWidth * 0.95}
              ry={petalLength * 0.98}
              fill="none"
              stroke={colors.petalDeep}
              strokeWidth="0.3"
              opacity={0.3 * depthOpacity}
              transform={`rotate(${(i * petalAngleSpread)} 0 0)`}
            />
          </g>
        );
      })}
      
      {/* Flower center */}
      <circle
        cx="0"
        cy={tiltYOffset}
        r={centerRadius}
        fill={`url(#center-gradient-${id})`}
        opacity="0.95"
      />
      
      {/* Stamens - radiating from center */}
      {Array.from({ length: stamenCount }).map((_, i) => {
        const angle = (i * (360 / stamenCount)) * (Math.PI / 180);
        const stamenLength = stamenLengths[i] || centerRadius * 1.4;
        const x1 = Math.cos(angle) * (centerRadius * 0.3);
        const y1 = Math.sin(angle) * (centerRadius * 0.3) + tiltYOffset;
        const x2 = Math.cos(angle) * stamenLength;
        const y2 = Math.sin(angle) * stamenLength + tiltYOffset;
        
        return (
          <g key={`stamen-${i}`} opacity={stage * 0.9}>
            {/* Filament */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={colors.stamen}
              strokeWidth={0.4 * size}
              opacity="0.75"
              strokeLinecap="round"
            />
            {/* Anther (pollen tip) */}
            <circle
              cx={x2}
              cy={y2}
              r={0.6 * size}
              fill={colors.stamen}
              opacity="0.9"
            />
            {/* Pollen highlight */}
            <circle
              cx={x2 - 0.2}
              cy={y2 - 0.2}
              r={0.3 * size}
              fill="rgba(255, 255, 200, 0.8)"
              opacity="0.6"
            />
          </g>
        );
      })}
      
      {/* Center highlight - creates depth */}
      <ellipse
        cx="-0.8"
        cy={tiltYOffset - 0.8}
        rx={centerRadius * 0.4}
        ry={centerRadius * 0.3}
        fill="rgba(255, 255, 255, 0.8)"
        opacity="0.7"
      />
      
      {/* Pistil (if fully bloomed) */}
      {stage > 0.7 && (
        <g>
          <circle
            cx="0"
            cy={tiltYOffset}
            r={centerRadius * 0.25}
            fill={colors.center}
            opacity="0.9"
          />
          <circle
            cx="0"
            cy={tiltYOffset}
            r={centerRadius * 0.15}
            fill="rgba(255, 255, 240, 0.9)"
          />
        </g>
      )}
    </g>
  );
});

BlossomFlower.displayName = 'BlossomFlower';
