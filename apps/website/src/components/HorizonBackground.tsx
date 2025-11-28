import React, { useMemo } from 'react';

/**
 * HorizonBackground Component
 *
 * Creates a scenic horizon background with:
 * - Gradient sky from soft blue/teal to warm golden sunset tones
 * - Subtle horizon glow where sky meets earth
 * - Rolling earth/ground at the bottom where the "tree" grows from
 *
 * Designed to complement the Bloom garden/tree growth animations
 * while maintaining a calming, therapeutic atmosphere.
 */

interface HorizonBackgroundProps {
  /** Height of the earth/ground section (default: 25%) */
  earthHeight?: string;
  /** Whether to show animated elements like floating particles */
  animated?: boolean;
  /** Custom className for the container */
  className?: string;
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const HorizonBackground: React.FC<HorizonBackgroundProps> = ({
  earthHeight = '25%',
  animated = true,
  className = '',
}) => {
  const particleConfigs = useMemo(() => {
    const count = 8;
    return Array.from({ length: count }, (_, i) => {
      const width = 3 + pseudoRandom(i + 1) * 4;
      const height = 3 + pseudoRandom(i + 11) * 4;
      const topOffset = 20 + pseudoRandom(i + 21) * 40;
      const animationDuration = 15 + i * 2;
      return {
        width,
        height,
        left: 10 + i * 12,
        top: topOffset,
        animation: animationDuration,
        delay: i * -2,
      };
    });
  }, []);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Sky gradient - soft morning/dawn feel */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            #e8f4f8 0%,
            #d4e8ef 15%,
            #bde0eb 30%,
            #a8d8ea 45%,
            #c9e4ca 60%,
            #e2efcc 75%,
            #f5f0d0 88%,
            #faf6e3 100%
          )`,
        }}
      />

      {/* Horizon glow - warm light where sky meets earth */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: earthHeight,
          height: '120px',
          background: `linear-gradient(
            180deg,
            transparent 0%,
            rgba(255, 248, 225, 0.4) 30%,
            rgba(255, 243, 200, 0.6) 60%,
            rgba(255, 238, 180, 0.7) 100%
          )`,
          filter: 'blur(20px)',
        }}
      />

      {/* Distant hills silhouette - adds depth */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: earthHeight,
          height: '60px',
        }}
      >
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-full"
          style={{ opacity: 0.15 }}
        >
          <path
            d="M0,60 L0,45 Q180,20 360,35 Q540,50 720,30 Q900,10 1080,25 Q1260,40 1440,20 L1440,60 Z"
            fill="#5a8f5c"
          />
        </svg>
      </div>

      {/* Earth/ground layer - where the tree grows from */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{ height: earthHeight }}
      >
        {/* Base earth gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              180deg,
              #7cb87f 0%,
              #6aaa6d 15%,
              #5a9a5d 30%,
              #4a8a4d 50%,
              #3d7a40 70%,
              #306a33 85%,
              #285a2b 100%
            )`,
          }}
        />

        {/* Rolling hills contour at top of earth */}
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="absolute -top-[79px] left-0 w-full"
          style={{ height: '80px' }}
        >
          <defs>
            <linearGradient id="hillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8bc88e" />
              <stop offset="50%" stopColor="#7cb87f" />
              <stop offset="100%" stopColor="#6aaa6d" />
            </linearGradient>
          </defs>
          <path
            d="M0,80 L0,50 Q120,30 240,45 Q360,60 480,40 Q600,20 720,35 Q840,50 960,30 Q1080,10 1200,25 Q1320,40 1440,20 L1440,80 Z"
            fill="url(#hillGradient)"
          />
        </svg>

        {/* Grass texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(34, 85, 34, 0.3) 2px,
              rgba(34, 85, 34, 0.3) 3px
            )`,
            backgroundSize: '8px 100%',
          }}
        />

        {/* Subtle grass blades at horizon line */}
        <div
          className="absolute left-0 right-0 -top-3 h-6 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 12'%3E%3Cpath d='M2,12 L3,4 L4,12 M7,12 L8,2 L9,12 M12,12 L13,5 L14,12 M17,12 L18,3 L19,12' stroke='%234a8a4d' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '20px 12px',
            backgroundRepeat: 'repeat-x',
          }}
        />
      </div>

      {/* Animated floating particles - dandelion seeds / pollen */}
      {animated && (
        <div className="absolute inset-0 overflow-hidden">
          {particleConfigs.map((config, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/60"
              style={{
                width: `${config.width}px`,
                height: `${config.height}px`,
                left: `${config.left}%`,
                top: `${config.top}%`,
                animation: `float-particle ${config.animation}s ease-in-out infinite`,
                animationDelay: `${config.delay}s`,
                boxShadow: '0 0 4px rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </div>
      )}

      {/* Soft vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse at center 40%,
            transparent 0%,
            transparent 50%,
            rgba(0, 0, 0, 0.03) 100%
          )`,
        }}
      />

      {/* CSS for floating particles animation */}
      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.4;
          }
          25% {
            transform: translate(15px, -20px) rotate(90deg);
            opacity: 0.7;
          }
          50% {
            transform: translate(-10px, -35px) rotate(180deg);
            opacity: 0.5;
          }
          75% {
            transform: translate(20px, -15px) rotate(270deg);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default HorizonBackground;
