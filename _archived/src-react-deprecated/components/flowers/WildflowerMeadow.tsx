/**
 * Wildflower Meadow
 * 
 * A Miyazaki-inspired field of wildflowers representing the Bloom community.
 * Used on the onboarding page to visually welcome new practitioners.
 * 
 * Design philosophy:
 * - Each flower represents practitioners in the community
 * - The practitioner's chosen flower blooms prominently
 * - "Show, don't tell" - no callout box, the beauty speaks for itself
 * - Gentle organic movement, never distracting
 * 
 * The meadow is a visual metaphor: "You're joining a garden of healers"
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tier1Flower, Tier2Flower, Tier3Flower } from './index';
import { LilyFlower, HydrangeaFlower } from './index';

export interface WildflowerMeadowProps {
  /** The practitioner's chosen flower - blooms prominently */
  heroFlower?: string;
  /** Optional practitioner name for accessibility */
  practitionerName?: string;
  /** Height of the meadow - number (px) or string (e.g., '100%') */
  height?: number | string;
  /** Whether to animate (respects prefers-reduced-motion) */
  animate?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Border radius - set to 0 for full-screen backgrounds */
  borderRadius?: number;
}

// Flower types available in the meadow
type FlowerType = 'cherry-blossom' | 'purple-rose' | 'sunflower' | 'lily' | 'hydrangea' | 'daisy';

interface MeadowFlower {
  type: FlowerType;
  x: number;       // percentage from left
  y: number;       // percentage from top
  size: number;    // size multiplier
  delay: number;   // animation delay
  opacity: number; // slight variation
  zIndex: number;
}

// Map user-friendly names to flower types
const flowerNameMap: Record<string, FlowerType> = {
  // Form values (exact matches after toLowerCase)
  'cherry blossom': 'cherry-blossom',
  'purple rose': 'purple-rose',
  'sunflower': 'sunflower',
  // Alternative names people might enter in "Other"
  'cherry': 'cherry-blossom',
  'sakura': 'cherry-blossom',
  'rose': 'purple-rose',
  'roses': 'purple-rose',
  'lily': 'lily',
  'lillies': 'lily',
  'lilies': 'lily',
  'hydrangea': 'hydrangea',
  'hydrangeas': 'hydrangea',
  'daisy': 'daisy',
  'daisies': 'daisy',
  'tulip': 'cherry-blossom', // Map common flowers to closest match
  'tulips': 'cherry-blossom',
  'lavender': 'purple-rose',
  'peony': 'cherry-blossom',
  'peonies': 'cherry-blossom',
  'orchid': 'purple-rose',
  'orchids': 'purple-rose',
};

function normalizeFlowerName(name: string): FlowerType {
  const normalized = name.toLowerCase().trim();
  return flowerNameMap[normalized] || 'cherry-blossom';
}

// Generate a Miyazaki-inspired meadow - flowers everywhere, alive in the wind
function generateMeadowFlowers(heroFlowerType: FlowerType): MeadowFlower[] {
  const flowers: MeadowFlower[] = [];
  const flowerType = heroFlowerType;
  
  // === TOP HORIZON - distant, smaller, dreamy ===
  // Far away flowers catching the light
  flowers.push(
    { type: flowerType, x: 8, y: 8, size: 0.35, delay: 0.9, opacity: 0.55, zIndex: 1 },
    { type: flowerType, x: 22, y: 12, size: 0.4, delay: 1.1, opacity: 0.5, zIndex: 1 },
    { type: flowerType, x: 38, y: 6, size: 0.32, delay: 1.3, opacity: 0.45, zIndex: 1 },
    { type: flowerType, x: 55, y: 10, size: 0.38, delay: 1.0, opacity: 0.5, zIndex: 1 },
    { type: flowerType, x: 72, y: 8, size: 0.35, delay: 1.2, opacity: 0.48, zIndex: 1 },
    { type: flowerType, x: 88, y: 12, size: 0.4, delay: 0.95, opacity: 0.52, zIndex: 1 },
  );
  
  // === UPPER-MID - growing closer, more detail ===
  flowers.push(
    { type: flowerType, x: 5, y: 22, size: 0.5, delay: 0.7, opacity: 0.65, zIndex: 2 },
    { type: flowerType, x: 18, y: 28, size: 0.55, delay: 0.8, opacity: 0.7, zIndex: 2 },
    { type: flowerType, x: 35, y: 20, size: 0.48, delay: 0.6, opacity: 0.6, zIndex: 2 },
    { type: flowerType, x: 50, y: 25, size: 0.52, delay: 0.75, opacity: 0.68, zIndex: 2 },
    { type: flowerType, x: 68, y: 22, size: 0.5, delay: 0.65, opacity: 0.62, zIndex: 2 },
    { type: flowerType, x: 82, y: 28, size: 0.55, delay: 0.85, opacity: 0.7, zIndex: 2 },
    { type: flowerType, x: 95, y: 20, size: 0.45, delay: 0.9, opacity: 0.58, zIndex: 2 },
  );
  
  // === MID-GROUND - the heart of the meadow ===
  flowers.push(
    { type: flowerType, x: 3, y: 42, size: 0.7, delay: 0.4, opacity: 0.85, zIndex: 3 },
    { type: flowerType, x: 15, y: 48, size: 0.75, delay: 0.5, opacity: 0.9, zIndex: 3 },
    { type: flowerType, x: 28, y: 38, size: 0.65, delay: 0.35, opacity: 0.82, zIndex: 3 },
    { type: flowerType, x: 42, y: 45, size: 0.72, delay: 0.45, opacity: 0.88, zIndex: 4 },
    { type: flowerType, x: 58, y: 40, size: 0.68, delay: 0.4, opacity: 0.85, zIndex: 3 },
    { type: flowerType, x: 75, y: 48, size: 0.78, delay: 0.55, opacity: 0.92, zIndex: 4 },
    { type: flowerType, x: 90, y: 42, size: 0.65, delay: 0.38, opacity: 0.8, zIndex: 3 },
  );
  
  // === LOWER-MID - closer, bolder ===
  flowers.push(
    { type: flowerType, x: 8, y: 62, size: 0.85, delay: 0.25, opacity: 0.95, zIndex: 5 },
    { type: flowerType, x: 22, y: 68, size: 0.9, delay: 0.3, opacity: 0.98, zIndex: 5 },
    { type: flowerType, x: 38, y: 58, size: 0.8, delay: 0.2, opacity: 0.92, zIndex: 5 },
    { type: flowerType, x: 55, y: 65, size: 0.88, delay: 0.28, opacity: 0.96, zIndex: 6 },
    { type: flowerType, x: 70, y: 60, size: 0.82, delay: 0.22, opacity: 0.94, zIndex: 5 },
    { type: flowerType, x: 85, y: 68, size: 0.92, delay: 0.32, opacity: 0.98, zIndex: 6 },
  );
  
  // === FOREGROUND - closest, largest, most vibrant ===
  flowers.push(
    { type: flowerType, x: 5, y: 82, size: 1.0, delay: 0.1, opacity: 1.0, zIndex: 7 },
    { type: flowerType, x: 18, y: 88, size: 1.1, delay: 0.15, opacity: 1.0, zIndex: 8 },
    { type: flowerType, x: 35, y: 78, size: 0.95, delay: 0.08, opacity: 0.98, zIndex: 7 },
    { type: flowerType, x: 52, y: 85, size: 1.05, delay: 0.12, opacity: 1.0, zIndex: 8 },
    { type: flowerType, x: 68, y: 80, size: 0.98, delay: 0.1, opacity: 0.99, zIndex: 7 },
    { type: flowerType, x: 82, y: 88, size: 1.12, delay: 0.18, opacity: 1.0, zIndex: 8 },
    { type: flowerType, x: 95, y: 82, size: 0.9, delay: 0.14, opacity: 0.95, zIndex: 7 },
  );
  
  return flowers;
}

// Individual flower renderer with hero emphasis
const FlowerRenderer = memo(({ 
  flower,
  isHero = false,
  animate = true,
}: { 
  flower: MeadowFlower;
  isHero?: boolean;
  animate?: boolean;
}) => {
  // Scale for meadow - Tier flowers are designed at 88px/74px, we want varied sizes
  const baseSize = isHero ? 1.0 : 0.8;
  const scale = baseSize * flower.size;
  
  const renderFlower = () => {
    // Wrapper to neutralize Tier flower's built-in absolute positioning
    const FlowerWrapper = ({ children }: { children: React.ReactNode }) => (
      <div style={{ 
        position: 'relative', 
        width: 88 * scale, 
        height: 88 * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}>
        <div style={{ 
          position: 'relative',
          width: '100%',
          height: '100%',
          // Override the Tier flower's absolute positioning
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Neutralize the flower's absolute + right positioning */}
          <div style={{ 
            position: 'relative',
            transform: 'translateX(8px) translateY(0)', // Compensate for right: -8px/right: -10px
          }}>
            {children}
          </div>
        </div>
      </div>
    );
    
    switch (flower.type) {
      case 'cherry-blossom':
        return (
          <FlowerWrapper>
            <Tier1Flower isChecked={true} isMobile={false} shouldReduceMotion={!animate} />
          </FlowerWrapper>
        );
      case 'purple-rose':
        return (
          <FlowerWrapper>
            <Tier2Flower isChecked={true} isMobile={false} shouldReduceMotion={!animate} />
          </FlowerWrapper>
        );
      case 'sunflower':
        return (
          <FlowerWrapper>
            <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={!animate} />
          </FlowerWrapper>
        );
      case 'lily':
        return <LilyFlower size={72 * scale} animate={animate} variant="pink" />;
      case 'hydrangea':
        return <HydrangeaFlower size={72 * scale} animate={animate} variant="purple" />;
      case 'daisy':
        // Using cherry blossom as placeholder until daisy is created
        return (
          <FlowerWrapper>
            <Tier1Flower isChecked={true} isMobile={false} shouldReduceMotion={!animate} />
          </FlowerWrapper>
        );
      default:
        return null;
    }
  };
  
  // Each flower sways gently - subtle, organic movement
  // Smaller distant flowers sway more (lighter), larger close flowers sway less (grounded)
  const swayDuration = 5 + (flower.x % 3) + (flower.y % 2); // 5-9 seconds
  const swayDelay = (flower.x * 0.02) + (flower.y * 0.01); // staggered start
  const swayAmount = 3 - (flower.zIndex * 0.25); // Distant flowers: ~2.5°, close flowers: ~1°
  
  // Atmospheric perspective - distant flowers are hazier
  const blurAmount = Math.max(0, (3 - flower.zIndex) * 0.15); // zIndex 1: 0.3px blur, zIndex 2: 0.15px, zIndex 3+: 0
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ 
        opacity: flower.opacity,
        scale: 1,
        y: 0,
      }}
      transition={{
        delay: flower.delay,
        duration: 1.0,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{
        position: 'absolute',
        left: `${flower.x}%`,
        top: `${flower.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: flower.zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
      }}
    >
      {/* Inner wrapper for gentle swaying */}
      <motion.div
        animate={animate ? {
          rotate: [-swayAmount, swayAmount, -swayAmount],
        } : {}}
        transition={{
          duration: swayDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: swayDelay,
        }}
        style={{
          transformOrigin: 'center bottom',
        }}
      >
        {renderFlower()}
      </motion.div>
    </motion.div>
  );
});

FlowerRenderer.displayName = 'FlowerRenderer';

// Hero flower with special animation - blooms center stage
const HeroFlower = memo(({ 
  flowerType,
  animate = true,
}: { 
  flowerType: FlowerType;
  animate?: boolean;
}) => {
  const size = 120;
  
  const renderFlower = () => {
    switch (flowerType) {
      case 'cherry-blossom':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
            <defs>
              <radialGradient id="heroCherry">
                <stop offset="0%" stopColor="#FFFBFC" />
                <stop offset="25%" stopColor="#FFE5ED" />
                <stop offset="60%" stopColor="#FFD4E0" />
                <stop offset="85%" stopColor="#FFB6C1" />
                <stop offset="100%" stopColor="#FFA8BA" />
              </radialGradient>
              <radialGradient id="heroCherryShadow">
                <stop offset="0%" stopColor="#FFB6C1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FF9BAD" stopOpacity="0.6" />
              </radialGradient>
            </defs>
            <g>
              {[0, 72, 144, 216, 288].map((angle, i) => {
                const x = 16 + Math.cos((angle * Math.PI) / 180) * 9;
                const y = 16 + Math.sin((angle * Math.PI) / 180) * 9;
                return (
                  <g key={i}>
                    <ellipse
                      cx={x + 0.3}
                      cy={y + 0.4}
                      rx="5.5"
                      ry="8"
                      fill="url(#heroCherryShadow)"
                      transform={`rotate(${angle} ${x} ${y})`}
                    />
                    <ellipse
                      cx={x}
                      cy={y}
                      rx="5.2"
                      ry="7.8"
                      fill="url(#heroCherry)"
                      opacity="0.98"
                      transform={`rotate(${angle} ${x} ${y})`}
                    />
                    <ellipse
                      cx={x - 1.0}
                      cy={y - 2.0}
                      rx="2.8"
                      ry="4.2"
                      fill="rgba(255, 255, 255, 0.75)"
                      opacity="0.9"
                      transform={`rotate(${angle} ${x} ${y})`}
                    />
                  </g>
                );
              })}
              {/* Center */}
              <circle cx="16" cy="16" r="4" fill="#FFE5ED" />
              {/* Stamens */}
              {Array.from({ length: 10 }).map((_, i) => {
                const angle = i * 36;
                const x = 16 + Math.cos((angle * Math.PI) / 180) * 3;
                const y = 16 + Math.sin((angle * Math.PI) / 180) * 3;
                return (
                  <circle key={i} cx={x} cy={y} r="0.6" fill="#FFD700" opacity="0.9" />
                );
              })}
            </g>
          </svg>
        );
      case 'purple-rose':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
            <defs>
              <radialGradient id="heroPurpleOuter">
                <stop offset="0%" stopColor="#F0E5F9" />
                <stop offset="30%" stopColor="#E0CEF0" />
                <stop offset="60%" stopColor="#C7ABD9" />
                <stop offset="85%" stopColor="#B18FC7" />
                <stop offset="100%" stopColor="#9B72AA" />
              </radialGradient>
              <radialGradient id="heroPurpleInner">
                <stop offset="0%" stopColor="#D4BEED" />
                <stop offset="40%" stopColor="#B18FC7" />
                <stop offset="70%" stopColor="#9B72AA" />
                <stop offset="100%" stopColor="#7A5589" />
              </radialGradient>
            </defs>
            <g>
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const angleVariation = [5, -3, 4, -4, 3, -5][i];
                const adjustedAngle = angle + angleVariation;
                const x = 20 + Math.cos((adjustedAngle * Math.PI) / 180) * 10.5;
                const y = 20 + Math.sin((adjustedAngle * Math.PI) / 180) * 10.5;
                return (
                  <ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx="6.5"
                    ry="7.2"
                    fill="url(#heroPurpleOuter)"
                    transform={`rotate(${adjustedAngle} ${x} ${y})`}
                  />
                );
              })}
              {[30, 90, 150, 210, 270, 330].map((angle, i) => {
                const x = 20 + Math.cos((angle * Math.PI) / 180) * 6;
                const y = 20 + Math.sin((angle * Math.PI) / 180) * 6;
                return (
                  <ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx="4.5"
                    ry="5.5"
                    fill="url(#heroPurpleInner)"
                    transform={`rotate(${angle} ${x} ${y})`}
                  />
                );
              })}
              <circle cx="20" cy="20" r="4" fill="#F5E6B8" />
            </g>
          </svg>
        );
      case 'sunflower':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
            <defs>
              <radialGradient id="heroSunflowerPetal">
                <stop offset="0%" stopColor="#FFFACD" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFA500" />
              </radialGradient>
              <radialGradient id="heroSunflowerCenter">
                <stop offset="0%" stopColor="#8B4513" />
                <stop offset="50%" stopColor="#654321" />
                <stop offset="100%" stopColor="#3D2914" />
              </radialGradient>
            </defs>
            <g>
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = i * 22.5;
                const x = 20 + Math.cos((angle * Math.PI) / 180) * 13;
                const y = 20 + Math.sin((angle * Math.PI) / 180) * 13;
                return (
                  <ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx="4"
                    ry="9"
                    fill="url(#heroSunflowerPetal)"
                    transform={`rotate(${angle} ${x} ${y})`}
                  />
                );
              })}
              <circle cx="20" cy="20" r="8" fill="url(#heroSunflowerCenter)" />
              {/* Seeds pattern */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = i * 30;
                const r = 4;
                const x = 20 + Math.cos((angle * Math.PI) / 180) * r;
                const y = 20 + Math.sin((angle * Math.PI) / 180) * r;
                return (
                  <circle key={i} cx={x} cy={y} r="0.8" fill="#FFD700" opacity="0.6" />
                );
              })}
            </g>
          </svg>
        );
      case 'lily':
        return <LilyFlower size={size} animate={animate} variant="pink" />;
      case 'hydrangea':
        return <HydrangeaFlower size={size} animate={animate} variant="purple" />;
      default:
        return <LilyFlower size={size} animate={animate} variant="pink" />;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 0.3,
        duration: 1.2,
        ease: [0.34, 1.56, 0.64, 1], // Slightly bouncy - blooming effect
      }}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.1))',
      }}
      className={animate ? 'hero-flower-gentle-sway' : ''}
    >
      {renderFlower()}
    </motion.div>
  );
});

HeroFlower.displayName = 'HeroFlower';

export const WildflowerMeadow = memo(({
  heroFlower,
  practitionerName,
  height = 280,
  animate = true,
  className = '',
  borderRadius = 16,
}: WildflowerMeadowProps) => {
  // Normalize the hero flower name
  const heroFlowerType = heroFlower ? normalizeFlowerName(heroFlower) : 'cherry-blossom';
  
  // Generate meadow flowers - memoized for consistency
  const meadowFlowers = useMemo(
    () => generateMeadowFlowers(heroFlowerType),
    [heroFlowerType]
  );
  
  // Check for reduced motion preference
  const shouldReduceMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  
  const shouldAnimate = animate && !shouldReduceMotion;
  
  return (
    <div
      className={`wildflower-meadow ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        // Miyazaki-inspired gradient: soft sky meets lush meadow
        background: `
          linear-gradient(180deg, 
            #F5F9F7 0%,      /* Pale morning sky */
            #E8F4EC 15%,     /* Light sage mist */
            #DCF0E2 35%,     /* Soft meadow green */
            #D0EBD8 55%,     /* Richer grass */
            #C5E5CE 75%,     /* Deeper foreground */
            #BAE0C5 100%     /* Grounded base */
          )
        `,
        borderRadius,
      }}
      role="img"
      aria-label={
        practitionerName 
          ? `A garden where each flower was planted by a practitioner. ${practitionerName}'s ${heroFlower || 'flower'} now joins them.`
          : 'A garden tended by practitioners, each flower representing someone who chose to grow something together'
      }
    >
      {/* Atmospheric depth - subtle warmth from sun */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 120% 60% at 50% 0%, rgba(255, 248, 230, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse 100% 80% at 50% 100%, rgba(107, 142, 127, 0.12) 0%, transparent 60%)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      {/* Soft light rays from top - Miyazaki touch */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          right: '20%',
          height: '60%',
          background: 'linear-gradient(180deg, rgba(255, 252, 240, 0.3) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      
      {/* Ground shadow for depth */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(75, 110, 90, 0.08) 100%)',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />
      
      {/* Background meadow flowers - the community */}
      {meadowFlowers.map((flower, index) => (
        <FlowerRenderer
          key={`meadow-${index}`}
          flower={flower}
          animate={shouldAnimate}
        />
      ))}
      
      {/* CSS for animations */}
      <style>{`
        @keyframes gentleSway {
          0%, 100% { transform: translate(-50%, -50%) rotate(-2deg); }
          50% { transform: translate(-50%, -50%) rotate(2deg); }
        }
        
        .hero-flower-gentle-sway {
          animation: gentleSway 6s ease-in-out infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .hero-flower-gentle-sway {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
});

WildflowerMeadow.displayName = 'WildflowerMeadow';

export default WildflowerMeadow;
