/**
 * Blossom Flower Component - A Miyazaki-Inspired Living Artwork
 * 
 * "The creation of a single world comes from a huge number of fragments
 * and chaos." — Hayao Miyazaki
 * 
 * This component embodies the philosophy that nature is never uniform.
 * Each blossom is unique, breathing, responding to the light and the
 * prosperity of its tree.
 * 
 * The weekly revenue directly influences:
 * - NUMBER: How many blossoms appear (handled by parent)
 * - SIZE: From delicate buds to magnificent full blooms
 * - VIBRANCY: From pale, sleeping pastels to rich, saturated sakura
 * - LUMINOSITY: The inner glow that suggests life and health
 * - COMPLEXITY: Petal count, stamen visibility, detail richness
 * 
 * Growth stages mirror the lifecycle of a real cherry blossom:
 * 0.0 - Dormant bud (tight, closed, waiting)
 * 0.2 - Awakening (first crack of color visible)
 * 0.4 - Opening (petals beginning to unfurl)
 * 0.6 - Blooming (petals spread, stamens visible)
 * 0.8 - Full bloom (maximum beauty)
 * 1.0 - Peak glory (inner radiance, falling pollen)
 */

import { memo, useMemo } from 'react';

// Deterministic pseudo-random for consistent flower uniqueness
function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + index.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

// Interpolate between values based on a factor
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// Interpolate colors
function lerpColor(color1: number[], color2: number[], t: number): string {
  const r = Math.round(lerp(color1[0], color2[0], t));
  const g = Math.round(lerp(color1[1], color2[1], t));
  const b = Math.round(lerp(color1[2], color2[2], t));
  const a = lerp(color1[3] ?? 1, color2[3] ?? 1, t);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export interface BlossomFlowerProps {
  x: number;
  y: number;
  size?: number;
  /** Bloom stage: 0 (tight bud) to 1 (full glory) */
  stage?: number;
  /** Vibrancy: 0 (pale, resting) to 1 (rich, prosperous) */
  vibrancy?: number;
  /** Luminosity: 0 (flat) to 1 (radiant inner glow) */
  luminosity?: number;
  rotation?: number;
  tilt?: number;
  id: string;
  delay?: number;
  season?: 'spring' | 'summer' | 'autumn';
  /** @deprecated Use vibrancy instead */
  intensity?: number;
}

export const BlossomFlower = memo(({
  x,
  y,
  size = 1.0,
  stage = 0.5,
  vibrancy,
  luminosity,
  rotation = 0,
  tilt = 0,
  id,
  delay = 0,
  season = 'spring',
  intensity,
}: BlossomFlowerProps) => {
  // Support legacy intensity prop, map to vibrancy/luminosity
  const effectiveVibrancy = vibrancy ?? intensity ?? 0.5;
  const effectiveLuminosity = luminosity ?? intensity ?? 0.5;
  
  // ============================================================================
  // DIMENSIONAL CALCULATIONS
  // Size grows with stage - buds are tiny, full blooms are magnificent
  // ============================================================================
  const baseRadius = 8 * size;
  
  // Bud: tight and small. Full bloom: expanded and open
  const bloomExpansion = 0.4 + stage * 0.6; // 0.4 → 1.0
  const petalLength = baseRadius * bloomExpansion * (1 + effectiveVibrancy * 0.15);
  const petalWidth = baseRadius * (0.25 + stage * 0.35) * (1 + effectiveVibrancy * 0.1);
  const centerRadius = baseRadius * 0.3 * (0.5 + stage * 0.5);
  
  // ============================================================================
  // COLOR PALETTE - The soul of the flower
  // Vibrancy transforms colors from whispered pastels to singing sakura
  // ============================================================================
  const palette = useMemo(() => {
    // Color definitions: [R, G, B, A]
    // Pale/resting state colors
    const paleColors = {
      petalOuter: [255, 248, 250, 0.85],  // Almost white with hint of pink
      petalMiddle: [255, 240, 245, 0.9],   // Soft blush
      petalInner: [255, 230, 238, 0.95],   // Gentle pink
      petalDeep: [250, 218, 228, 0.7],     // Deeper at base
      center: [255, 250, 240, 0.95],       // Warm cream
      stamen: [220, 180, 190, 0.8],        // Muted mauve
      highlight: [255, 255, 255, 0.3],     // Subtle shine
      glow: [255, 240, 245, 0.1],          // Faint aura
    };
    
    // Vibrant/prosperous state colors
    const vibrantColors = {
      petalOuter: [255, 210, 225, 0.95],   // Rich pink edge
      petalMiddle: [255, 183, 205, 0.98],  // Sakura pink
      petalInner: [255, 155, 185, 1.0],    // Deep sakura
      petalDeep: [235, 120, 160, 0.85],    // Rich magenta base
      center: [255, 235, 200, 1.0],        // Golden cream
      stamen: [200, 80, 120, 1.0],         // Deep rose
      highlight: [255, 255, 255, 0.8],     // Bright shine
      glow: [255, 200, 220, 0.4],          // Warm radiance
    };
    
    // Seasonal adjustments
    const seasonShift = {
      spring: { r: 0, g: 0, b: 0 },
      summer: { r: 10, g: -15, b: -10 },   // Warmer, coral hints
      autumn: { r: -15, g: -20, b: 10 },   // Deeper, purple hints
    }[season];
    
    const shift = (color: number[]) => [
      Math.max(0, Math.min(255, color[0] + seasonShift.r)),
      Math.max(0, Math.min(255, color[1] + seasonShift.g)),
      Math.max(0, Math.min(255, color[2] + seasonShift.b)),
      color[3],
    ];
    
    return {
      petalOuter: lerpColor(shift(paleColors.petalOuter), shift(vibrantColors.petalOuter), effectiveVibrancy),
      petalMiddle: lerpColor(shift(paleColors.petalMiddle), shift(vibrantColors.petalMiddle), effectiveVibrancy),
      petalInner: lerpColor(shift(paleColors.petalInner), shift(vibrantColors.petalInner), effectiveVibrancy),
      petalDeep: lerpColor(shift(paleColors.petalDeep), shift(vibrantColors.petalDeep), effectiveVibrancy),
      center: lerpColor(paleColors.center, vibrantColors.center, effectiveVibrancy),
      stamen: lerpColor(paleColors.stamen, vibrantColors.stamen, effectiveVibrancy),
      highlight: lerpColor(paleColors.highlight, vibrantColors.highlight, effectiveLuminosity),
      glow: lerpColor(paleColors.glow, vibrantColors.glow, effectiveLuminosity),
    };
  }, [effectiveVibrancy, effectiveLuminosity, season]);
  
  // ============================================================================
  // PETAL CONFIGURATION - Organic complexity
  // More petals appear as the flower develops
  // ============================================================================
  const petalConfig = useMemo(() => {
    // Base petal count increases with stage and vibrancy
    const basePetals = 5;
    const bonusPetals = Math.floor(stage * 2 + effectiveVibrancy * 2); // 0-4 extra
    const totalPetals = basePetals + bonusPetals;
    
    // Generate petal variations using seeded random
    const petals = [];
    for (let i = 0; i < totalPetals; i++) {
      const rand1 = seededRandom(id, i * 3);
      const rand2 = seededRandom(id, i * 3 + 1);
      const rand3 = seededRandom(id, i * 3 + 2);
      
      petals.push({
        // Angular position with natural irregularity
        angle: (i / totalPetals) * 360 + (rand1 - 0.5) * 15,
        // Size variation - some petals slightly larger
        sizeMultiplier: 0.85 + rand2 * 0.3,
        // Depth layering - alternating front/back with variation
        layer: i % 2 === 0 ? 'back' : 'front',
        // Individual petal opening (some unfurl faster)
        openness: Math.max(0, stage + (rand3 - 0.5) * 0.2),
        // Unique curl at petal tip
        curlAngle: (rand1 - 0.5) * 20 * stage,
      });
    }
    
    return petals;
  }, [id, stage, effectiveVibrancy]);
  
  // ============================================================================
  // STAMEN CONFIGURATION - The flower's jewelry
  // Only visible after opening, more prominent with prosperity
  // ============================================================================
  const stamenConfig = useMemo(() => {
    if (stage < 0.4) return []; // Stamens hidden in closed buds
    
    const stamenVisibility = (stage - 0.4) / 0.6; // 0 at stage 0.4, 1 at stage 1.0
    const baseCount = 6;
    const bonusCount = Math.floor(effectiveVibrancy * 6);
    const totalStamens = Math.round((baseCount + bonusCount) * stamenVisibility);
    
    const stamens = [];
    for (let i = 0; i < totalStamens; i++) {
      const rand1 = seededRandom(id + 'stamen', i * 2);
      const rand2 = seededRandom(id + 'stamen', i * 2 + 1);
      
      stamens.push({
        angle: (i / totalStamens) * 360 + (rand1 - 0.5) * 30,
        length: centerRadius * (1.0 + rand2 * 0.6 + effectiveVibrancy * 0.4),
        thickness: 0.3 + effectiveVibrancy * 0.3,
        // Anthers (pollen tips) more visible with luminosity
        antherSize: (0.4 + effectiveLuminosity * 0.4) * size,
      });
    }
    
    return stamens;
  }, [id, stage, effectiveVibrancy, effectiveLuminosity, centerRadius, size]);
  
  // ============================================================================
  // TRANSFORM CALCULATIONS
  // ============================================================================
  const tiltScale = 1 - Math.abs(tilt) * 0.002;
  const tiltYOffset = tilt * 0.1;
  
  // Breathing animation amplitude - subtle scale pulsing for living feel
  const breatheAmplitude = 0.02 + effectiveLuminosity * 0.02;
  
  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${tiltScale})`}
      style={{
        animation: `blossomBreathe ${4 + delay * 0.5}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: 'transform',
        // CSS variable for breathing animation
        // @ts-expect-error CSS custom property
        '--breathe-amplitude': breatheAmplitude,
      }}
    >
      <defs>
        {/* Complex petal gradient - multiple color stops for depth */}
        <radialGradient 
          id={`petal-grad-${id}`} 
          cx="30%" 
          cy="30%" 
          r="70%"
          fx="20%"
          fy="20%"
        >
          <stop offset="0%" stopColor={palette.highlight} />
          <stop offset="15%" stopColor={palette.petalOuter} />
          <stop offset="45%" stopColor={palette.petalMiddle} />
          <stop offset="75%" stopColor={palette.petalInner} />
          <stop offset="100%" stopColor={palette.petalDeep} />
        </radialGradient>
        
        {/* Inner glow gradient - luminosity creates this radiance */}
        <radialGradient id={`glow-${id}`}>
          <stop offset="0%" stopColor={palette.glow} />
          <stop offset="50%" stopColor={palette.glow} stopOpacity="0.5" />
          <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
        
        {/* Center gradient */}
        <radialGradient id={`center-${id}`} cx="35%" cy="35%">
          <stop offset="0%" stopColor="rgba(255,255,250,0.95)" />
          <stop offset="50%" stopColor={palette.center} />
          <stop offset="100%" stopColor={palette.petalInner} stopOpacity="0.5" />
        </radialGradient>
        
        {/* Soft shadow */}
        <radialGradient id={`shadow-${id}`}>
          <stop offset="0%" stopColor="rgba(80,60,70,0.12)" />
          <stop offset="100%" stopColor="rgba(80,60,70,0)" />
        </radialGradient>
        
        {/* Highlight shimmer filter */}
        <filter id={`shimmer-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={0.5 + effectiveLuminosity * 0.5} />
        </filter>
        
        {/* Dewdrop effect for high luminosity */}
        <radialGradient id={`dewdrop-${id}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      
      {/* ================================================================
          LAYER 1: Shadow - grounds the flower
          ================================================================ */}
      <ellipse
        cx={0.5}
        cy={tiltYOffset + petalLength * 0.1}
        rx={petalLength * 1.1}
        ry={petalLength * 0.6}
        fill={`url(#shadow-${id})`}
        opacity={0.4 + stage * 0.2}
      />
      
      {/* ================================================================
          LAYER 2: Inner glow - luminosity creates warmth from within
          Only visible when flower has opened
          ================================================================ */}
      {stage > 0.3 && effectiveLuminosity > 0.2 && (
        <ellipse
          cx={0}
          cy={tiltYOffset}
          rx={petalLength * 0.8}
          ry={petalLength * 0.7}
          fill={`url(#glow-${id})`}
          opacity={effectiveLuminosity * 0.6}
        />
      )}
      
      {/* ================================================================
          LAYER 3: Back petals
          ================================================================ */}
      {petalConfig
        .filter(p => p.layer === 'back')
        .map((petal, i) => (
          <PetalShape
            key={`back-${i}`}
            angle={petal.angle}
            length={petalLength * petal.sizeMultiplier}
            width={petalWidth * petal.sizeMultiplier}
            openness={petal.openness}
            curl={petal.curlAngle}
            gradientId={`petal-grad-${id}`}
            opacity={0.85}
            tiltYOffset={tiltYOffset}
          />
        ))}
      
      {/* ================================================================
          LAYER 4: Front petals (on top of back petals)
          ================================================================ */}
      {petalConfig
        .filter(p => p.layer === 'front')
        .map((petal, i) => (
          <PetalShape
            key={`front-${i}`}
            angle={petal.angle}
            length={petalLength * petal.sizeMultiplier}
            width={petalWidth * petal.sizeMultiplier}
            openness={petal.openness}
            curl={petal.curlAngle}
            gradientId={`petal-grad-${id}`}
            opacity={1}
            tiltYOffset={tiltYOffset}
          />
        ))}
      
      {/* ================================================================
          LAYER 5: Petal highlights - delicate light catching
          Only on front petals, intensity based on luminosity
          ================================================================ */}
      {effectiveLuminosity > 0.3 && petalConfig
        .filter(p => p.layer === 'front')
        .slice(0, 3) // Only a few highlights, not every petal
        .map((petal, i) => {
          const angleRad = (petal.angle - 90) * (Math.PI / 180);
          const hx = Math.cos(angleRad) * petalLength * 0.3;
          const hy = Math.sin(angleRad) * petalLength * 0.3 + tiltYOffset;
          
          return (
            <ellipse
              key={`highlight-${i}`}
              cx={hx}
              cy={hy}
              rx={petalWidth * 0.25}
              ry={petalLength * 0.15}
              fill="rgba(255,255,255,0.9)"
              opacity={effectiveLuminosity * 0.5}
              transform={`rotate(${petal.angle} ${hx} ${hy})`}
              filter={`url(#shimmer-${id})`}
            />
          );
        })}
      
      {/* ================================================================
          LAYER 6: Center - the heart of the flower
          ================================================================ */}
      <circle
        cx={0}
        cy={tiltYOffset}
        r={centerRadius}
        fill={`url(#center-${id})`}
      />
      
      {/* Center detail ring */}
      <circle
        cx={0}
        cy={tiltYOffset}
        r={centerRadius * 0.7}
        fill="none"
        stroke={palette.petalDeep}
        strokeWidth={0.3}
        opacity={0.3 + effectiveVibrancy * 0.3}
      />
      
      {/* ================================================================
          LAYER 7: Stamens - the flower's delicate jewelry
          ================================================================ */}
      {stamenConfig.map((stamen, i) => {
        const angleRad = stamen.angle * (Math.PI / 180);
        const x1 = Math.cos(angleRad) * centerRadius * 0.4;
        const y1 = Math.sin(angleRad) * centerRadius * 0.4 + tiltYOffset;
        const x2 = Math.cos(angleRad) * stamen.length;
        const y2 = Math.sin(angleRad) * stamen.length + tiltYOffset;
        
        return (
          <g key={`stamen-${i}`}>
            {/* Filament */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={palette.stamen}
              strokeWidth={stamen.thickness}
              strokeLinecap="round"
              opacity={0.7 + effectiveVibrancy * 0.3}
            />
            {/* Anther (pollen tip) */}
            <circle
              cx={x2}
              cy={y2}
              r={stamen.antherSize}
              fill={palette.stamen}
            />
            {/* Pollen highlight */}
            <circle
              cx={x2 - stamen.antherSize * 0.3}
              cy={y2 - stamen.antherSize * 0.3}
              r={stamen.antherSize * 0.4}
              fill="rgba(255,250,200,0.9)"
              opacity={0.5 + effectiveLuminosity * 0.5}
            />
          </g>
        );
      })}
      
      {/* ================================================================
          LAYER 8: Center highlight - creates dimensional depth
          ================================================================ */}
      <ellipse
        cx={-centerRadius * 0.25}
        cy={tiltYOffset - centerRadius * 0.25}
        rx={centerRadius * 0.35}
        ry={centerRadius * 0.25}
        fill="rgba(255,255,255,0.85)"
        opacity={0.5 + effectiveLuminosity * 0.4}
      />
      
      {/* ================================================================
          LAYER 9: Dewdrops - appear at high luminosity
          Like morning dew catching light
          ================================================================ */}
      {effectiveLuminosity > 0.6 && (
        <>
          {/* Main dewdrop on a petal */}
          <circle
            cx={petalLength * 0.4}
            cy={-petalLength * 0.2 + tiltYOffset}
            r={1.2 * size}
            fill={`url(#dewdrop-${id})`}
          />
          {/* Secondary smaller dewdrop */}
          {effectiveLuminosity > 0.8 && (
            <circle
              cx={-petalLength * 0.35}
              cy={petalLength * 0.15 + tiltYOffset}
              r={0.8 * size}
              fill={`url(#dewdrop-${id})`}
            />
          )}
        </>
      )}
      
      {/* ================================================================
          LAYER 10: Pistil - only at full bloom
          ================================================================ */}
      {stage > 0.8 && (
        <>
          <circle
            cx={0}
            cy={tiltYOffset}
            r={centerRadius * 0.2}
            fill={palette.center}
          />
          <circle
            cx={0}
            cy={tiltYOffset}
            r={centerRadius * 0.1}
            fill="rgba(255,255,240,0.95)"
          />
        </>
      )}
    </g>
  );
});

BlossomFlower.displayName = 'BlossomFlower';

/**
 * Individual Petal Shape - organic, curved, life-like
 * Uses a bezier curve path for natural petal form
 */
interface PetalShapeProps {
  angle: number;
  length: number;
  width: number;
  openness: number;
  curl: number;
  gradientId: string;
  opacity: number;
  tiltYOffset: number;
}

const PetalShape = memo(({
  angle,
  length,
  width,
  openness,
  curl,
  gradientId,
  opacity,
  tiltYOffset,
}: PetalShapeProps) => {
  // Convert angle to radians for positioning
  const angleRad = (angle - 90) * (Math.PI / 180);
  
  // Petal unfurls from center - openness affects how far it extends
  const effectiveLength = length * (0.3 + openness * 0.7);
  const effectiveWidth = width * (0.4 + openness * 0.6);
  
  // Petal tip position
  const tipX = Math.cos(angleRad) * effectiveLength;
  const tipY = Math.sin(angleRad) * effectiveLength + tiltYOffset;
  
  // Control points for bezier curve create natural petal shape
  // The petal has a slight S-curve and widens in the middle
  const midRadius = effectiveLength * 0.55;
  const midX = Math.cos(angleRad) * midRadius;
  const midY = Math.sin(angleRad) * midRadius + tiltYOffset;
  
  // Perpendicular angle for width
  const perpAngle = angleRad + Math.PI / 2;
  
  // Create organic petal path
  // Start at center, curve out to tip, curve back
  const path = `
    M 0 ${tiltYOffset}
    Q ${midX + Math.cos(perpAngle) * effectiveWidth * 0.7} 
      ${midY + Math.sin(perpAngle) * effectiveWidth * 0.7}
      ${tipX} ${tipY}
    Q ${midX - Math.cos(perpAngle) * effectiveWidth * 0.7}
      ${midY - Math.sin(perpAngle) * effectiveWidth * 0.7}
      0 ${tiltYOffset}
    Z
  `;
  
  return (
    <g transform={`rotate(${curl} ${tipX} ${tipY})`}>
      <path
        d={path}
        fill={`url(#${gradientId})`}
        opacity={opacity}
      />
      {/* Subtle vein line */}
      <line
        x1={0}
        y1={tiltYOffset}
        x2={tipX * 0.85}
        y2={tipY - tiltYOffset * 0.15 + tiltYOffset}
        stroke="rgba(200,150,170,0.15)"
        strokeWidth={0.4}
        strokeLinecap="round"
        opacity={opacity * 0.5}
      />
    </g>
  );
});

PetalShape.displayName = 'PetalShape';

export default BlossomFlower;
