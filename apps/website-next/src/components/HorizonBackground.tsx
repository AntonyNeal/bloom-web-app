'use client';

import { useState, useEffect } from 'react';

/**
 * HorizonBackground Component (Client Component)
 *
 * Creates a scenic, TIME-AWARE horizon background with:
 * - Dynamic sky that changes with the real time of day
 * - Subtle horizon glow where sky meets earth
 * - Rolling earth/ground at the bottom where the "tree" grows from
 *
 * Time periods (Melbourne time):
 * - Night (8pm-5am): Deep indigo/blue with stars
 * - Dawn (5am-7am): Soft pinks and oranges rising
 * - Morning (7am-11am): Light blue with warm horizon
 * - Midday (11am-3pm): Bright blue sky
 * - Afternoon (3pm-6pm): Golden hour warmth
 * - Dusk (6pm-8pm): Orange, pink, purple sunset
 *
 * Designed to connect users with natural rhythms while maintaining
 * a calming, therapeutic atmosphere in the Miyazaki spirit.
 */

interface HorizonBackgroundProps {
  /** Height of the earth/ground section (default: 25%) */
  earthHeight?: string;
  /** Whether to show animated elements like floating particles */
  animated?: boolean;
  /** Custom className for the container */
  className?: string;
}

// Sky gradient configurations for each time period
const SKY_GRADIENTS = {
  night: {
    sky: `linear-gradient(
      180deg,
      #0d1b2a 0%,
      #1b263b 20%,
      #1e3a5f 40%,
      #2d4a6f 60%,
      #3d5a7f 80%,
      #4a6a8f 100%
    )`,
    horizon: 'rgba(100, 120, 160, 0.3)',
    hills: '#1a2a3a',
    earth: ['#2a4a3a', '#234a35', '#1d4030', '#17362a', '#112c24', '#0d241e', '#0a1c18'],
    hillGradient: ['#3a5a4a', '#2a4a3a', '#234a35'],
  },
  dawn: {
    sky: `linear-gradient(
      180deg,
      #2d3a4a 0%,
      #4a4a5a 15%,
      #6a5a6a 30%,
      #8a6a7a 45%,
      #c08090 60%,
      #e0a0a0 75%,
      #f5c0b0 88%,
      #ffe0c8 100%
    )`,
    horizon: 'rgba(255, 200, 150, 0.5)',
    hills: '#5a6a5c',
    earth: ['#6a9a6d', '#5a8a5d', '#4a7a4d', '#3d6a40', '#305a33', '#284a2b', '#203a23'],
    hillGradient: ['#7aaa7e', '#6a9a6d', '#5a8a5d'],
  },
  morning: {
    sky: `linear-gradient(
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
    horizon: 'rgba(255, 248, 225, 0.6)',
    hills: '#5a8f5c',
    earth: ['#7cb87f', '#6aaa6d', '#5a9a5d', '#4a8a4d', '#3d7a40', '#306a33', '#285a2b'],
    hillGradient: ['#8bc88e', '#7cb87f', '#6aaa6d'],
  },
  midday: {
    sky: `linear-gradient(
      180deg,
      #87ceeb 0%,
      #98d4ef 15%,
      #a8daf3 30%,
      #b8e0f7 45%,
      #c8e6fb 60%,
      #d8ecff 75%,
      #e8f2ff 88%,
      #f0f8ff 100%
    )`,
    horizon: 'rgba(255, 255, 240, 0.4)',
    hills: '#5a9f5c',
    earth: ['#82c885', '#72b875', '#62a865', '#529855', '#428845', '#327835', '#286828'],
    hillGradient: ['#92d895', '#82c885', '#72b875'],
  },
  afternoon: {
    sky: `linear-gradient(
      180deg,
      #a8d8ea 0%,
      #b8dce8 15%,
      #c8e0e6 30%,
      #d8e4d4 45%,
      #e8e8c2 60%,
      #f0e8b0 75%,
      #f8e8a0 88%,
      #ffe890 100%
    )`,
    horizon: 'rgba(255, 235, 180, 0.6)',
    hills: '#6a9a5c',
    earth: ['#7cb87f', '#6caa6f', '#5c9a5f', '#4c8a4f', '#3c7a3f', '#2c6a2f', '#1c5a1f'],
    hillGradient: ['#8cc88f', '#7cb87f', '#6caa6f'],
  },
  dusk: {
    sky: `linear-gradient(
      180deg,
      #4a5a8a 0%,
      #6a5a8a 15%,
      #8a5a8a 30%,
      #aa6a8a 45%,
      #ca8090 60%,
      #e0a0a0 75%,
      #f0c0b0 88%,
      #ffd8c0 100%
    )`,
    horizon: 'rgba(255, 180, 140, 0.6)',
    hills: '#5a7a5c',
    earth: ['#6aaa6d', '#5a9a5d', '#4a8a4d', '#3a7a3d', '#2a6a2d', '#1a5a1d', '#0a4a0d'],
    hillGradient: ['#7aba7d', '#6aaa6d', '#5a9a5d'],
  },
};

type TimePeriod = keyof typeof SKY_GRADIENTS;

/**
 * Determine the current time period based on the hour
 */
function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 20 || hour < 5) return 'night';
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'midday';
  if (hour >= 15 && hour < 18) return 'afternoon';
  return 'dusk'; // 18-20
}

// Deterministic pseudo-random for consistent SSR
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Pre-compute particle configs at module level for zero runtime cost
const PARTICLE_COUNT = 8;
const particleConfigs = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
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

// Star configurations for night sky
const STAR_COUNT = 30;
const starConfigs = Array.from({ length: STAR_COUNT }, (_, i) => ({
  left: pseudoRandom(i + 100) * 100,
  top: pseudoRandom(i + 200) * 60, // Stars only in upper 60% of sky
  size: 1 + pseudoRandom(i + 300) * 2,
  opacity: 0.4 + pseudoRandom(i + 400) * 0.6,
  twinkle: 2 + pseudoRandom(i + 500) * 3,
}));

export function HorizonBackground({
  earthHeight = '25%',
  animated = true,
  className = '',
}: HorizonBackgroundProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('morning');

  useEffect(() => {
    // Set initial time period
    const updateTimePeriod = () => {
      const now = new Date();
      const hour = now.getHours();
      setTimePeriod(getTimePeriod(hour));
    };

    updateTimePeriod();

    // Update every minute to catch transitions
    const interval = setInterval(updateTimePeriod, 60000);
    return () => clearInterval(interval);
  }, []);

  const sky = SKY_GRADIENTS[timePeriod];
  const isNight = timePeriod === 'night';

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Sky gradient - changes with time of day */}
      <div
        className="absolute inset-0 transition-all duration-[3000ms] ease-in-out"
        style={{ background: sky.sky }}
      />

      {/* Stars - only visible at night */}
      {isNight && (
        <div className="absolute inset-0">
          {starConfigs.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animationDuration: `${star.twinkle}s`,
                animationDelay: `${-star.twinkle * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Horizon glow - warm light where sky meets earth */}
      <div
        className="absolute left-0 right-0 transition-all duration-[3000ms] ease-in-out"
        style={{
          bottom: earthHeight,
          height: '120px',
          background: `linear-gradient(
            180deg,
            transparent 0%,
            ${sky.horizon} 30%,
            ${sky.horizon} 60%,
            ${sky.horizon} 100%
          )`,
          filter: 'blur(20px)',
        }}
      />

      {/* Distant hills silhouette - adds depth */}
      <div
        className="absolute left-0 right-0 transition-all duration-[3000ms] ease-in-out"
        style={{
          bottom: earthHeight,
          height: '60px',
        }}
      >
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-full transition-all duration-[3000ms] ease-in-out"
          style={{ opacity: 0.15 }}
        >
          <path
            d="M0,60 L0,45 Q180,20 360,35 Q540,50 720,30 Q900,10 1080,25 Q1260,40 1440,20 L1440,60 Z"
            fill={sky.hills}
          />
        </svg>
      </div>

      {/* Earth/ground layer - where the tree grows from */}
      <div
        className="absolute left-0 right-0 bottom-0 transition-all duration-[3000ms] ease-in-out"
        style={{ height: earthHeight }}
      >
        {/* Base earth gradient */}
        <div
          className="absolute inset-0 transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `linear-gradient(
              180deg,
              ${sky.earth[0]} 0%,
              ${sky.earth[1]} 15%,
              ${sky.earth[2]} 30%,
              ${sky.earth[3]} 50%,
              ${sky.earth[4]} 70%,
              ${sky.earth[5]} 85%,
              ${sky.earth[6]} 100%
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
              <stop offset="0%" stopColor={sky.hillGradient[0]} />
              <stop offset="50%" stopColor={sky.hillGradient[1]} />
              <stop offset="100%" stopColor={sky.hillGradient[2]} />
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
              className="absolute rounded-full bg-white/60 animate-float-particle"
              style={{
                width: `${config.width}px`,
                height: `${config.height}px`,
                left: `${config.left}%`,
                top: `${config.top}%`,
                animationDuration: `${config.animation}s`,
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
    </div>
  );
}

export default HorizonBackground;
