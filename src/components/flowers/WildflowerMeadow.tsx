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
import { Tier1Flower, Tier2Flower, Tier3Flower, LilyFlower, HydrangeaFlower } from './index';

export interface WildflowerMeadowProps {
  /** The practitioner's chosen flower - blooms prominently */
  heroFlower?: string;
  /** Optional practitioner name for accessibility */
  practitionerName?: string;
  /** Height of the meadow */
  height?: number;
  /** Whether to animate (respects prefers-reduced-motion) */
  animate?: boolean;
  /** Additional CSS classes */
  className?: string;
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
  'cherry blossom': 'cherry-blossom',
  'cherry': 'cherry-blossom',
  'sakura': 'cherry-blossom',
  'purple rose': 'purple-rose',
  'rose': 'purple-rose',
  'sunflower': 'sunflower',
  'lily': 'lily',
  'lillies': 'lily',
  'lilies': 'lily',
  'hydrangea': 'hydrangea',
  'daisy': 'daisy',
  'daisies': 'daisy',
};

function normalizeFlowerName(name: string): FlowerType {
  const normalized = name.toLowerCase().trim();
  return flowerNameMap[normalized] || 'cherry-blossom';
}

// Generate a consistent but organic-looking meadow
function generateMeadowFlowers(_heroFlowerType: FlowerType): MeadowFlower[] {
  const flowers: MeadowFlower[] = [];
  
  // Background flowers - scattered across the meadow
  // Left side cluster
  flowers.push(
    { type: 'cherry-blossom', x: 5, y: 40, size: 0.5, delay: 0.3, opacity: 0.5, zIndex: 1 },
    { type: 'hydrangea', x: 12, y: 55, size: 0.4, delay: 0.5, opacity: 0.45, zIndex: 1 },
    { type: 'lily', x: 8, y: 70, size: 0.55, delay: 0.7, opacity: 0.5, zIndex: 2 },
  );
  
  // Right side cluster
  flowers.push(
    { type: 'purple-rose', x: 88, y: 45, size: 0.5, delay: 0.4, opacity: 0.5, zIndex: 1 },
    { type: 'sunflower', x: 92, y: 60, size: 0.45, delay: 0.6, opacity: 0.45, zIndex: 1 },
    { type: 'cherry-blossom', x: 85, y: 75, size: 0.5, delay: 0.8, opacity: 0.5, zIndex: 2 },
  );
  
  // Mid-ground flowers - slightly larger, more visible
  flowers.push(
    { type: 'lily', x: 18, y: 65, size: 0.65, delay: 0.2, opacity: 0.6, zIndex: 3 },
    { type: 'hydrangea', x: 78, y: 58, size: 0.6, delay: 0.4, opacity: 0.55, zIndex: 3 },
    { type: 'purple-rose', x: 25, y: 78, size: 0.55, delay: 0.5, opacity: 0.6, zIndex: 4 },
    { type: 'cherry-blossom', x: 72, y: 72, size: 0.6, delay: 0.3, opacity: 0.55, zIndex: 4 },
  );
  
  // Additional scattered flowers for depth
  flowers.push(
    { type: 'sunflower', x: 32, y: 48, size: 0.45, delay: 0.6, opacity: 0.4, zIndex: 2 },
    { type: 'daisy', x: 65, y: 42, size: 0.4, delay: 0.7, opacity: 0.4, zIndex: 2 },
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
  const baseSize = isHero ? 88 : 48;
  const size = baseSize * flower.size;
  
  const renderFlower = () => {
    switch (flower.type) {
      case 'cherry-blossom':
        return (
          <Tier1Flower 
            isChecked={true} 
            isMobile={false} 
            shouldReduceMotion={!animate}
          />
        );
      case 'purple-rose':
        return (
          <Tier2Flower 
            isChecked={true} 
            isMobile={false} 
            shouldReduceMotion={!animate}
          />
        );
      case 'sunflower':
        return (
          <Tier3Flower 
            isChecked={true} 
            isMobile={false} 
            shouldReduceMotion={!animate}
          />
        );
      case 'lily':
        return <LilyFlower size={size} animate={animate} variant="pink" />;
      case 'hydrangea':
        return <HydrangeaFlower size={size} animate={animate} variant="purple" />;
      case 'daisy':
        // Using cherry blossom as placeholder until daisy is created
        return (
          <Tier1Flower 
            isChecked={true} 
            isMobile={true} 
            shouldReduceMotion={!animate}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 10 }}
      animate={{ 
        opacity: flower.opacity,
        scale: 1,
        y: 0,
      }}
      transition={{
        delay: flower.delay,
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{
        position: 'absolute',
        left: `${flower.x}%`,
        top: `${flower.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: flower.zIndex,
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {renderFlower()}
      </div>
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
        background: 'linear-gradient(180deg, #F0F7F4 0%, #E8F3EC 50%, #DFF0E5 100%)',
        borderRadius: 16,
      }}
      role="img"
      aria-label={
        practitionerName 
          ? `A wildflower meadow welcoming ${practitionerName} to the Bloom community${heroFlower ? `, featuring their chosen flower: ${heroFlower}` : ''}`
          : 'A wildflower meadow representing the Bloom practitioner community'
      }
    >
      {/* Soft gradient overlay for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center bottom, transparent 40%, rgba(107, 142, 127, 0.08) 100%)',
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
      
      {/* Hero flower - blooms center stage */}
      {heroFlower && (
        <HeroFlower
          flowerType={heroFlowerType}
          animate={shouldAnimate}
        />
      )}
      
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
