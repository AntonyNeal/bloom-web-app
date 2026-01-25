/**
 * Sophisticated Blossom Tree - The centerpiece of the Bloom homepage
 * 
 * A living artwork that grows with monthly revenue, changes with seasons,
 * and responds to time of day. Inspired by:
 * - Miyazaki's attention to natural movement and life
 * - Japanese cherry blossom paintings (ukiyo-e)
 * - The organic asymmetry of real trees
 * 
 * Architecture:
 * - Parametric trunk and branch system
 * - Hand-placed blossom clusters for artistic composition
 * - Layered depth with foreground/midground/background elements
 * - Particle effects (falling petals, floating pollen)
 * - Dynamic lighting based on time and season
 * - Smooth growth animations keyed to revenue milestones
 * - Weather integration - responds to local weather conditions
 */

import React, { useState, useMemo, useEffect } from 'react';
import { BlossomFlower } from './BlossomFlower';
import { TreeBranch } from './TreeBranch';
import { useWeather, getWeatherEffects } from '@/hooks/useWeather';
import type { MonthlyStats, WeeklyStats } from '@/types/bloom';

interface BlossomTreeProps {
  monthlyStats: MonthlyStats;
  weeklyStats?: WeeklyStats;
  className?: string;
}

// Color palette constants
const colors = {
  cream: '#FAF8F3',
  sage: '#7B8D7B',
  sageDark: '#5A6B5A',
  lavenderLight: '#F3F0F7',
  // Earth tones for ground
  earth: {
    deep: '#8B7355',
    mid: '#A08B6E',
    light: '#C4B49A',
    highlight: '#D9CCBA',
  },
  // Sprout greens - vibrant to contrast with earth
  sprout: {
    stem: '#6B8E4E',
    stemDark: '#4A6B35',
    leaf: '#8BC34A',
    leafLight: '#AED581',
    leafDark: '#689F38',
  },
  sky: {
    dawn: 'rgba(255, 220, 200, 0.7)',
    morning: 'rgba(200, 220, 245, 0.6)',
    afternoon: 'rgba(220, 235, 250, 0.5)',
    evening: 'rgba(255, 200, 170, 0.7)',
    night: 'rgba(180, 195, 230, 0.8)',
  },
  // Wooden frame - warm aged wood tones
  wood: {
    dark: '#5C4033',
    mid: '#7A5C42',
    light: '#9E7B5E',
    highlight: '#C4A77D',
    grain: '#4A3728',
  },
};

export const BlossomTreeSophisticated: React.FC<BlossomTreeProps> = ({
  monthlyStats,
  weeklyStats,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  
  // ============================================================================
  // WEATHER INTEGRATION - Real-time local weather affects the scene
  // ============================================================================
  const { weather, locationName } = useWeather({
    refreshInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });
  const weatherEffects = useMemo(() => getWeatherEffects(weather), [weather]);
  
  // Determine time of day for lighting

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 7) setTimeOfDay('dawn');
    else if (hour >= 7 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
    else if (hour >= 17 && hour < 20) setTimeOfDay('evening');
    else setTimeOfDay('night');
  }, []);
  
  // ============================================================================
  // MOON PHASE CALCULATION - Reflects reality
  // Using a simplified but accurate lunation algorithm
  // A lunar cycle is approximately 29.53 days
  // ============================================================================
  const moonPhase = useMemo(() => {
    const now = new Date();
    // Known new moon date: January 6, 2000 at 18:14 UTC
    const knownNewMoon = new Date('2000-01-06T18:14:00Z');
    const lunarCycle = 29.53058867; // days
    
    const daysSinceKnownNewMoon = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const currentCycleDay = daysSinceKnownNewMoon % lunarCycle;
    const phase = currentCycleDay / lunarCycle; // 0-1 through the cycle
    
    // Phase names for reference:
    // 0.00 - 0.03: New Moon
    // 0.03 - 0.25: Waxing Crescent
    // 0.25 - 0.28: First Quarter
    // 0.28 - 0.47: Waxing Gibbous
    // 0.47 - 0.53: Full Moon
    // 0.53 - 0.72: Waning Gibbous
    // 0.72 - 0.78: Last Quarter
    // 0.78 - 0.97: Waning Crescent
    // 0.97 - 1.00: New Moon
    
    return phase;
  }, []);
  
  // ============================================================================
  // TWO GROWTH CYCLES:
  // 1. MONTHLY - Tree structure (trunk, branches) grows throughout the month
  //    Resets to a sprout on the 1st of each month
  // 2. WEEKLY - Blossoms/flowers bloom based on this week's earnings
  //    Fresh flowers each week, size based on weekly revenue
  // ============================================================================
  
  const monthlyRevenue = monthlyStats.currentRevenue;
  const weeklyRevenue = weeklyStats?.currentRevenue ?? 0;
  
  // Monthly tree growth milestones - the tree structure
  // At $0 on day 1: tiny sprout
  // At month's target: full majestic tree
  const MONTHLY_MILESTONES = {
    SPROUT: 0,          // Day 1 - fresh sprout
    SEEDLING: 1000,     // Early growth
    SAPLING: 3000,      // Young tree forming
    GROWING: 6000,      // Branches developing
    ESTABLISHED: 10000, // Strong structure
    MAJESTIC: 15000,    // Full beautiful tree
    MAGNIFICENT: 20000, // Peak monthly growth
  };
  
  // Weekly blossom milestones - flowers and fruits
  // Resets each Monday, blooms based on that week's revenue
  const WEEKLY_MILESTONES = {
    BARREN: 0,          // No sessions yet this week
    BUDDING: 500,       // First buds appearing
    BLOOMING: 1500,     // Flowers opening
    FLOURISHING: 3000,  // Rich with blossoms
    ABUNDANT: 5000,     // Overflowing with flowers
    MAGNIFICENT: 8000,  // Peak weekly bloom
  };
  
  // Calculate TREE growth factor (0-1) based on monthly revenue
  const getTreeGrowthFactor = (rev: number): number => {
    if (rev >= MONTHLY_MILESTONES.MAGNIFICENT) return 1.0;
    if (rev >= MONTHLY_MILESTONES.MAJESTIC) return 0.85 + (rev - MONTHLY_MILESTONES.MAJESTIC) / (MONTHLY_MILESTONES.MAGNIFICENT - MONTHLY_MILESTONES.MAJESTIC) * 0.15;
    if (rev >= MONTHLY_MILESTONES.ESTABLISHED) return 0.65 + (rev - MONTHLY_MILESTONES.ESTABLISHED) / (MONTHLY_MILESTONES.MAJESTIC - MONTHLY_MILESTONES.ESTABLISHED) * 0.2;
    if (rev >= MONTHLY_MILESTONES.GROWING) return 0.45 + (rev - MONTHLY_MILESTONES.GROWING) / (MONTHLY_MILESTONES.ESTABLISHED - MONTHLY_MILESTONES.GROWING) * 0.2;
    if (rev >= MONTHLY_MILESTONES.SAPLING) return 0.25 + (rev - MONTHLY_MILESTONES.SAPLING) / (MONTHLY_MILESTONES.GROWING - MONTHLY_MILESTONES.SAPLING) * 0.2;
    if (rev >= MONTHLY_MILESTONES.SEEDLING) return 0.1 + (rev - MONTHLY_MILESTONES.SEEDLING) / (MONTHLY_MILESTONES.SAPLING - MONTHLY_MILESTONES.SEEDLING) * 0.15;
    return rev / MONTHLY_MILESTONES.SEEDLING * 0.1; // Tiny sprout even at $0
  };
  
  // Calculate BLOSSOM factor (0-1) based on weekly revenue
  const getBlossomFactor = (rev: number): number => {
    if (rev >= WEEKLY_MILESTONES.MAGNIFICENT) return 1.0;
    if (rev >= WEEKLY_MILESTONES.ABUNDANT) return 0.8 + (rev - WEEKLY_MILESTONES.ABUNDANT) / (WEEKLY_MILESTONES.MAGNIFICENT - WEEKLY_MILESTONES.ABUNDANT) * 0.2;
    if (rev >= WEEKLY_MILESTONES.FLOURISHING) return 0.6 + (rev - WEEKLY_MILESTONES.FLOURISHING) / (WEEKLY_MILESTONES.ABUNDANT - WEEKLY_MILESTONES.FLOURISHING) * 0.2;
    if (rev >= WEEKLY_MILESTONES.BLOOMING) return 0.35 + (rev - WEEKLY_MILESTONES.BLOOMING) / (WEEKLY_MILESTONES.FLOURISHING - WEEKLY_MILESTONES.BLOOMING) * 0.25;
    if (rev >= WEEKLY_MILESTONES.BUDDING) return 0.1 + (rev - WEEKLY_MILESTONES.BUDDING) / (WEEKLY_MILESTONES.BLOOMING - WEEKLY_MILESTONES.BUDDING) * 0.25;
    return rev / WEEKLY_MILESTONES.BUDDING * 0.1;
  };
  
  const growthFactor = getTreeGrowthFactor(monthlyRevenue); // Tree structure
  const blossomFactor = getBlossomFactor(weeklyRevenue);     // Flowers/fruits
  
  // Determine season from month (affects blossom colors)
  const getSeason = (monthName: string): 'spring' | 'summer' | 'autumn' => {
    const month = monthName.toLowerCase();
    if (['september', 'october', 'november'].includes(month)) return 'spring'; // Southern hemisphere
    if (['december', 'january', 'february'].includes(month)) return 'summer';
    return 'autumn'; // March - August
  };
  
  const season = getSeason(monthlyStats.monthName);
  
  // Tree stage label based on MONTHLY growth
  const getTreeStage = (rev: number) => {
    if (rev >= MONTHLY_MILESTONES.MAGNIFICENT) return { name: 'magnificent', label: '🌳 Magnificent' };
    if (rev >= MONTHLY_MILESTONES.MAJESTIC) return { name: 'majestic', label: '🌲 Majestic' };
    if (rev >= MONTHLY_MILESTONES.ESTABLISHED) return { name: 'established', label: '🌿 Established' };
    if (rev >= MONTHLY_MILESTONES.GROWING) return { name: 'growing', label: '🪴 Growing' };
    if (rev >= MONTHLY_MILESTONES.SAPLING) return { name: 'sapling', label: '🌱 Sapling' };
    if (rev >= MONTHLY_MILESTONES.SEEDLING) return { name: 'seedling', label: '🌱 Seedling' };
    return { name: 'sprout', label: '🌱 Sprout' };
  };
  
  // Blossom count and intensity based on WEEKLY revenue
  const getBlossomStage = (rev: number) => {
    if (rev >= WEEKLY_MILESTONES.MAGNIFICENT) return { blossomCount: 120, intensity: 1.0, label: '✨ Magnificent bloom' };
    if (rev >= WEEKLY_MILESTONES.ABUNDANT) return { blossomCount: 90, intensity: 0.9, label: '🌸 Abundant' };
    if (rev >= WEEKLY_MILESTONES.FLOURISHING) return { blossomCount: 65, intensity: 0.75, label: '🌷 Flourishing' };
    if (rev >= WEEKLY_MILESTONES.BLOOMING) return { blossomCount: 40, intensity: 0.55, label: '🌺 Blooming' };
    if (rev >= WEEKLY_MILESTONES.BUDDING) return { blossomCount: 18, intensity: 0.35, label: '🌼 Budding' };
    return { blossomCount: 0, intensity: 0.15, label: '💤 Resting' };
  };
  
  const treeStage = getTreeStage(monthlyRevenue);
  const blossomStage = getBlossomStage(weeklyRevenue);
  
  // Combined stage for backward compatibility
  const stage = {
    name: treeStage.name,
    label: treeStage.label,
    blossomCount: blossomStage.blossomCount,
    intensity: blossomStage.intensity,
    nextMilestone: Object.values(MONTHLY_MILESTONES).find(m => m > monthlyRevenue) ?? null,
  };
  
  // ============================================================================
  // BLOSSOM VIBRANCY & LUMINOSITY - Driven by Weekly Revenue
  // These transform the visual quality of each flower
  // ============================================================================
  
  // Vibrancy: How saturated and rich the colors are (0 = pale, 1 = deep sakura)
  // At low weekly revenue: flowers are pale, almost white, sleeping
  // At high weekly revenue: flowers are rich, vibrant, singing pink
  const blossomVibrancy = Math.min(1, blossomFactor * 1.2); // Slightly boosted
  
  // Luminosity: The inner glow, highlights, dewdrops (0 = flat, 1 = radiant)
  // At low revenue: flowers are matte, no highlights
  // At high revenue: flowers glow with inner light, dewdrops sparkle
  const blossomLuminosity = Math.min(1, blossomFactor * 1.1);
  
  // Size multiplier based on weekly prosperity
  // Flowers grow larger when the week is going well
  const blossomSizeMultiplier = 0.7 + blossomFactor * 0.5; // 0.7x to 1.2x
  
  // Bloom openness - how unfurled the petals are
  // Early week with low revenue: tight buds
  // Strong week: full, open blooms
  const blossomOpenness = 0.3 + blossomFactor * 0.7; // 0.3 to 1.0
  
  // Sophisticated blossom placement - artistic clusters, not random scatter
  const blossomClusters = useMemo(() => {
    const clusters: Array<{ 
      x: number; 
      y: number; 
      size: number; 
      stage: number; 
      vibrancy: number;
      luminosity: number;
      rotation: number; 
      tilt: number;
    }> = [];
    
    // Define artistic cluster zones (mimicking natural branch tips)
    // Adjusted for wider landscape viewBox (800x400, center at x=400)
    const clusterZones = [
      // Upper left canopy
      { cx: 280, cy: 135, radius: 45, density: 1.2, branchAngle: -35, light: 0.9 },
      // Upper right canopy  
      { cx: 520, cy: 140, radius: 50, density: 1.3, branchAngle: 25, light: 1.0 },
      // Middle left
      { cx: 320, cy: 195, radius: 38, density: 1.0, branchAngle: -20, light: 0.85 },
      // Middle right
      { cx: 480, cy: 190, radius: 42, density: 1.1, branchAngle: 15, light: 0.95 },
      // Lower left accent
      { cx: 260, cy: 245, radius: 25, density: 0.8, branchAngle: -45, light: 0.7 },
      // Lower right accent
      { cx: 540, cy: 240, radius: 28, density: 0.9, branchAngle: 40, light: 0.75 },
      // Center high (crown) - most light
      { cx: 400, cy: 115, radius: 35, density: 1.4, branchAngle: 0, light: 1.0 },
      // Center mid (heart) - focal point
      { cx: 400, cy: 180, radius: 48, density: 1.5, branchAngle: 0, light: 0.95 },
    ];
    
    // Generate blossoms within each cluster zone
    let blossomId = 0;
    const targetCount = stage.blossomCount;
    const blossomsPerZone = Math.ceil(targetCount / clusterZones.length);
    
    clusterZones.forEach((zone) => {
      const zoneCount = Math.floor(blossomsPerZone * zone.density);
      
      for (let i = 0; i < zoneCount && blossomId < targetCount; i++) {
        // Polar coordinates for natural clustering (denser at center)
        const distance = zone.radius * Math.sqrt(Math.random()); // sqrt for uniform distribution
        const angle = Math.random() * Math.PI * 2;
        
        const x = zone.cx + Math.cos(angle) * distance;
        const y = zone.cy + Math.sin(angle) * distance;
        
        // Size variation - larger blossoms toward cluster centers
        // WEEKLY REVENUE affects the base size multiplier
        const distanceFromCenter = distance / zone.radius;
        const baseSize = (0.7 + Math.random() * 0.5) * blossomSizeMultiplier;
        const centerBoost = (1 - distanceFromCenter) * 0.3;
        const size = baseSize + centerBoost;
        
        // Bloom openness - WEEKLY REVENUE makes flowers more open
        // Inner blossoms bloom first, outer ones follow
        const innerBloomBonus = (1 - distanceFromCenter) * 0.2;
        const randomVariation = (Math.random() - 0.5) * 0.15;
        const flowerStage = Math.min(1, blossomOpenness + innerBloomBonus + randomVariation);
        
        // Vibrancy - WEEKLY REVENUE enriches the colors
        // Center flowers are slightly more vibrant
        const vibrancyBonus = (1 - distanceFromCenter) * 0.15;
        const flowerVibrancy = Math.min(1, blossomVibrancy + vibrancyBonus + Math.random() * 0.1);
        
        // Luminosity - WEEKLY REVENUE adds inner glow
        // Zone light factor affects how much light this area catches
        const lightBonus = zone.light * 0.2;
        const flowerLuminosity = Math.min(1, blossomLuminosity * zone.light + lightBonus * blossomFactor);
        
        // Rotation follows branch angle with natural variation
        const rotation = zone.branchAngle + (Math.random() - 0.5) * 45;
        
        // Tilt creates depth - outer blossoms tilt away
        const tilt = distanceFromCenter * (Math.random() - 0.5) * 30;
        
        clusters.push({ 
          x, 
          y, 
          size, 
          stage: flowerStage, 
          vibrancy: flowerVibrancy,
          luminosity: flowerLuminosity,
          rotation, 
          tilt 
        });
        blossomId++;
      }
    });
    
    return clusters;
  }, [stage.blossomCount, blossomOpenness, blossomSizeMultiplier, blossomVibrancy, blossomLuminosity, blossomFactor]);
  
  // Falling petals - appear at high weekly revenue with vibrant flowers
  const fallingPetals = useMemo(() => {
    // Petals fall when blossoms are abundant and vibrant
    if (blossomFactor < 0.7 || stage.blossomCount < 50) return [];
    
    const petalCount = Math.floor(6 + blossomFactor * 10); // 6-16 petals
    
    return Array.from({ length: petalCount }, (_, i) => ({
      id: i,
      x: 250 + Math.random() * 300,
      y: 100 + Math.random() * 150,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 60,
      // Petal color intensity matches vibrancy
      opacity: 0.4 + blossomVibrancy * 0.4,
    }));
  }, [blossomFactor, stage.blossomCount, blossomVibrancy]);
  
  // Ambient particles (pollen, light motes) - more with higher luminosity
  const ambientParticles = useMemo(() => {
    // Particles appear when there's enough tree and weekly prosperity
    if (growthFactor < 0.3 || blossomLuminosity < 0.3) return [];
    
    // More particles with higher luminosity
    const particleCount = Math.floor(4 + blossomLuminosity * 12); // 4-16 particles
    
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 200,
      delay: Math.random() * 6,
      radius: 0.8 + Math.random() * (1.5 + blossomLuminosity),
      // Golden pollen vs white light motes
      isGolden: Math.random() < 0.4,
    }));
  }, [growthFactor, blossomLuminosity]);
  
  // ============================================================================
  // WEATHER PARTICLES - Rain, snow based on real local weather
  // ============================================================================
  const weatherParticles = useMemo(() => {
    if (!weather) return [];
    
    const { condition, intensity } = weather;
    const count = weatherEffects.particleCount;
    
    if (condition === 'rainy' || condition === 'stormy') {
      // Generate deterministic rain positions using index-based calculation
      return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 50 + ((i * 17) % 700),
        y: -20 - ((i * 23) % 50),
        length: intensity === 'heavy' ? 12 : intensity === 'moderate' ? 8 : 5,
        speed: intensity === 'heavy' ? 0.4 : intensity === 'moderate' ? 0.6 : 0.8,
        delay: (i * 0.15) % 2,
        opacity: intensity === 'heavy' ? 0.5 : intensity === 'moderate' ? 0.4 : 0.3,
        type: 'rain' as const,
      }));
    }
    
    if (condition === 'snowy') {
      // Snowflakes drift more gently
      return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 50 + ((i * 31) % 700),
        y: -10 - ((i * 19) % 30),
        radius: 2 + ((i * 7) % 3),
        speed: intensity === 'heavy' ? 3 : intensity === 'moderate' ? 4 : 5,
        delay: (i * 0.25) % 4,
        drift: ((i * 13) % 60) - 30,
        opacity: 0.7,
        type: 'snow' as const,
      }));
    }
    
    return [];
  }, [weather, weatherEffects.particleCount]);

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '380px',
        aspectRatio: '2.2 / 1',
        backgroundColor: colors.cream,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: isHovered 
          ? '0 8px 32px rgba(122, 141, 122, 0.15)'
          : '0 4px 16px rgba(122, 141, 122, 0.08)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Ambient sky layer - changes with time of day */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '72%',
          background: `linear-gradient(to bottom, ${colors.sky[timeOfDay]} 0%, rgba(200, 220, 240, 0.4) 50%, rgba(230, 235, 220, 0.2) 100%)`,
          pointerEvents: 'none',
          transition: 'background 2s ease',
        }}
      />
      
      {/* Moon - appears in evening/night with realistic phase */}
      {(timeOfDay === 'evening' || timeOfDay === 'night' || timeOfDay === 'dawn') && (
        <div
          style={{
            position: 'absolute',
            top: timeOfDay === 'dawn' ? '8%' : timeOfDay === 'evening' ? '12%' : '15%',
            right: timeOfDay === 'dawn' ? '25%' : timeOfDay === 'evening' ? '15%' : '18%',
            width: '64px',
            height: '64px',
            pointerEvents: 'none',
            opacity: timeOfDay === 'night' ? 1 : timeOfDay === 'evening' ? 0.92 : 0.7,
            transition: 'all 2s ease',
            filter: timeOfDay === 'night' 
              ? 'drop-shadow(0 0 25px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 50px rgba(230, 240, 255, 0.5)) drop-shadow(0 0 80px rgba(200, 220, 255, 0.3))'
              : timeOfDay === 'evening'
              ? 'drop-shadow(0 0 20px rgba(255, 252, 245, 0.7)) drop-shadow(0 0 40px rgba(255, 250, 240, 0.4))'
              : 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.5))',
          }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64">
            <defs>
              {/* Realistic moon surface - subtle warm-cool gradient */}
              <radialGradient id="moonBase" cx="40%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#FEFEFE" />
                <stop offset="30%" stopColor="#F8F8F6" />
                <stop offset="60%" stopColor="#E8E6E0" />
                <stop offset="100%" stopColor="#D8D4CC" />
              </radialGradient>
              
              {/* Terminator shadow gradient */}
              <radialGradient id="moonTerminator" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(40, 45, 55, 0.97)" />
                <stop offset="100%" stopColor="rgba(25, 30, 40, 0.99)" />
              </radialGradient>
              
              {/* Mare (sea) gradient - bluish gray */}
              <radialGradient id="mareColor" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(120, 125, 130, 0.5)" />
                <stop offset="100%" stopColor="rgba(100, 105, 115, 0.35)" />
              </radialGradient>
              
              {/* Crater shadow */}
              <radialGradient id="craterDark" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(180, 175, 165, 0.6)" />
                <stop offset="100%" stopColor="rgba(160, 155, 145, 0.3)" />
              </radialGradient>
              
              {/* Bright ray pattern for Tycho-like crater */}
              <radialGradient id="rayPattern" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              
              {/* Subtle noise texture overlay */}
              <filter id="moonTexture" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
                <feColorMatrix type="saturate" values="0" />
                <feBlend in="SourceGraphic" in2="noise" mode="multiply" result="textured" />
                <feComposite in="textured" in2="SourceGraphic" operator="in" />
              </filter>
            </defs>
            
            {/* Base moon circle with texture */}
            <circle cx="32" cy="32" r="30" fill="url(#moonBase)" />
            
            {/* === MARE (Dark "Seas") - Major features === */}
            
            {/* Mare Imbrium (Sea of Rains) - large dark area upper left */}
            <ellipse cx="22" cy="20" rx="10" ry="8" fill="rgba(140, 138, 130, 0.35)" />
            
            {/* Mare Serenitatis (Sea of Serenity) - upper right of center */}
            <ellipse cx="36" cy="22" rx="7" ry="6" fill="rgba(135, 133, 128, 0.32)" />
            
            {/* Mare Tranquillitatis (Sea of Tranquility) - right of center */}
            <ellipse cx="40" cy="30" rx="8" ry="6" fill="rgba(130, 128, 125, 0.3)" />
            
            {/* Mare Crisium (Sea of Crises) - isolated dark spot upper right */}
            <ellipse cx="48" cy="20" rx="5" ry="4" fill="rgba(125, 123, 120, 0.35)" />
            
            {/* Mare Fecunditatis (Sea of Fertility) - lower right */}
            <ellipse cx="44" cy="38" rx="6" ry="5" fill="rgba(128, 126, 122, 0.28)" />
            
            {/* Mare Nubium (Sea of Clouds) - lower left area */}
            <ellipse cx="24" cy="42" rx="8" ry="5" fill="rgba(135, 132, 128, 0.3)" />
            
            {/* Oceanus Procellarum (Ocean of Storms) - large left side */}
            <path 
              d="M 12 25 Q 8 32 12 40 Q 18 45 22 38 Q 18 30 12 25" 
              fill="rgba(140, 137, 132, 0.28)" 
            />
            
            {/* === CRATERS === */}
            
            {/* Tycho crater - bright with rays, southern hemisphere */}
            <circle cx="30" cy="50" r="3" fill="rgba(220, 218, 212, 0.7)" />
            <circle cx="30" cy="50" r="1.5" fill="rgba(180, 175, 168, 0.5)" />
            {/* Tycho rays */}
            <line x1="30" y1="50" x2="20" y2="30" stroke="rgba(240, 238, 232, 0.15)" strokeWidth="1" />
            <line x1="30" y1="50" x2="45" y2="35" stroke="rgba(240, 238, 232, 0.12)" strokeWidth="0.8" />
            <line x1="30" y1="50" x2="15" y2="45" stroke="rgba(240, 238, 232, 0.1)" strokeWidth="0.6" />
            
            {/* Copernicus crater - prominent crater upper center */}
            <circle cx="25" cy="30" r="3.5" fill="rgba(190, 185, 175, 0.4)" />
            <circle cx="25" cy="30" r="2" fill="rgba(210, 205, 198, 0.3)" />
            
            {/* Kepler crater - small bright crater */}
            <circle cx="16" cy="32" r="2" fill="rgba(200, 195, 188, 0.35)" />
            
            {/* Aristarchus - brightest crater on the moon */}
            <circle cx="12" cy="26" r="2" fill="rgba(255, 252, 245, 0.5)" />
            
            {/* Plato crater - dark floored crater */}
            <ellipse cx="28" cy="14" rx="3" ry="2" fill="rgba(110, 108, 105, 0.4)" />
            
            {/* Smaller craters scattered across surface */}
            <circle cx="42" cy="26" r="1.5" fill="rgba(180, 175, 168, 0.3)" />
            <circle cx="38" cy="44" r="2" fill="rgba(185, 180, 172, 0.35)" />
            <circle cx="18" cy="48" r="1.5" fill="rgba(175, 170, 162, 0.3)" />
            <circle cx="50" cy="32" r="1.2" fill="rgba(190, 185, 178, 0.25)" />
            <circle cx="46" cy="44" r="1" fill="rgba(180, 175, 168, 0.2)" />
            <circle cx="20" cy="22" r="1.2" fill="rgba(195, 190, 182, 0.25)" />
            <circle cx="34" cy="38" r="1.5" fill="rgba(175, 172, 165, 0.3)" />
            
            {/* Subtle highlands texture - brighter areas */}
            <ellipse cx="48" cy="38" rx="4" ry="6" fill="rgba(245, 242, 235, 0.15)" />
            <ellipse cx="16" cy="42" rx="5" ry="4" fill="rgba(240, 238, 232, 0.12)" />
            
            {/* Subtle limb darkening */}
            <circle 
              cx="32" 
              cy="32" 
              r="29" 
              fill="none" 
              stroke="rgba(160, 155, 145, 0.2)" 
              strokeWidth="2"
            />
            
            {/* Phase shadow overlay - uses clip path to show correct phase */}
            {moonPhase < 0.03 || moonPhase > 0.97 ? (
              // New moon - almost fully shadowed
              <circle cx="32" cy="32" r="29" fill="url(#moonTerminator)" />
            ) : moonPhase < 0.5 ? (
              // Waxing - shadow on the left, light on right
              <path
                d={(() => {
                  const illumination = moonPhase * 2;
                  const curveX = 32 - (illumination * 60);
                  return `M 32 2 
                          A 30 30 0 0 0 32 62 
                          Q ${curveX} 32 32 2`;
                })()}
                fill="url(#moonTerminator)"
              />
            ) : (
              // Waning - shadow on the right
              <path
                d={(() => {
                  const shadowAmount = (moonPhase - 0.5) * 2;
                  const curveX = 32 + (shadowAmount * 60);
                  return `M 32 2 
                          A 30 30 0 0 1 32 62 
                          Q ${curveX} 32 32 2`;
                })()}
                fill="url(#moonTerminator)"
              />
            )}
            
            {/* Bright outer glow/corona effect */}
            <circle 
              cx="32" 
              cy="32" 
              r="30" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.15)" 
              strokeWidth="0.5"
            />
          </svg>
        </div>
      )}
      
      {/* Horizon glow - warm light where sky meets earth */}
      <div
        style={{
          position: 'absolute',
          bottom: '26%',
          left: 0,
          right: 0,
          height: '8%',
          background: 'linear-gradient(to bottom, transparent, rgba(255, 248, 235, 0.5) 50%, rgba(220, 195, 160, 0.4))',
          pointerEvents: 'none',
        }}
      />
      
      {/* Ground layer - earthy browns and tans */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '28%',
          background: `linear-gradient(to top, ${colors.earth.deep} 0%, ${colors.earth.mid} 40%, ${colors.earth.light} 80%, ${colors.earth.highlight} 100%)`,
          pointerEvents: 'none',
        }}
      />
      
      {/* Main SVG canvas - landscape orientation with centered tree */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax meet"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      >
        <defs>
          {/* Soft shadow for ground elements */}
          <radialGradient id="ground-shadow">
            <stop offset="0%" stopColor="rgba(60, 45, 30, 0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          
          {/* Sprout stem gradient - rich green */}
          <linearGradient id="sprout-stem" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={colors.sprout.stemDark} />
            <stop offset="50%" stopColor={colors.sprout.stem} />
            <stop offset="100%" stopColor={colors.sprout.leaf} />
          </linearGradient>
          
          {/* Sprout leaf gradient - vibrant lime green */}
          <linearGradient id="sprout-leaf-left" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={colors.sprout.leafDark} />
            <stop offset="40%" stopColor={colors.sprout.leaf} />
            <stop offset="100%" stopColor={colors.sprout.leafLight} />
          </linearGradient>
          
          <linearGradient id="sprout-leaf-right" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.sprout.leafDark} />
            <stop offset="40%" stopColor={colors.sprout.leaf} />
            <stop offset="100%" stopColor={colors.sprout.leafLight} />
          </linearGradient>

          {/* Animations */}
          <style>
            {`
              @keyframes blossomFloat {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(2px, -3px) rotate(2deg); }
                50% { transform: translate(-1px, 2px) rotate(-1deg); }
                75% { transform: translate(3px, -1px) rotate(3deg); }
              }
              
              @keyframes blossomBreathe {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(calc(1 + var(--breathe-amplitude, 0.02))); }
              }
              
              @keyframes petalFall {
                0% {
                  transform: translate(0, 0) rotate(0deg);
                  opacity: 0.8;
                }
                100% {
                  transform: translate(var(--drift), 300px) rotate(360deg);
                  opacity: 0;
                }
              }
              
              @keyframes particleFloat {
                0%, 100% {
                  transform: translate(0, 0);
                  opacity: 0.3;
                }
                50% {
                  transform: translate(10px, -20px);
                  opacity: 0.7;
                }
              }
              
              @keyframes shimmerPulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.8; }
              }
              
              @keyframes rainFall {
                0% {
                  transform: translateY(0);
                  opacity: 0.6;
                }
                100% {
                  transform: translateY(450px);
                  opacity: 0;
                }
              }
              
              @keyframes snowFall {
                0% {
                  transform: translate(0, 0) rotate(0deg);
                  opacity: 0.8;
                }
                100% {
                  transform: translate(var(--drift, 0px), 450px) rotate(360deg);
                  opacity: 0;
                }
              }
            `}
          </style>
        </defs>
        
        {/* Ground shadow/circle - centered in wider canvas */}
        <ellipse
          cx="400"
          cy="380"
          rx="140"
          ry="18"
          fill="url(#ground-shadow)"
          opacity="0.6"
        />
        
        {/* Seedling sprout - shows at early stages with vibrant green against brown earth */}
        {growthFactor < 0.25 && (
          <g transform="translate(400, 370)">
            {/* Small soil mound - darker earth tone */}
            <ellipse cx="0" cy="8" rx="30" ry="8" fill="rgba(90, 70, 50, 0.5)" />
            <ellipse cx="0" cy="6" rx="22" ry="5" fill="rgba(110, 85, 60, 0.4)" />
            
            {/* Sprout stem - vibrant green */}
            <path
              d={`M 0 0 
                 Q ${-4 - growthFactor * 20} ${-45 - growthFactor * 60}, 
                   ${growthFactor * 6} ${-70 - growthFactor * 80}`}
              stroke="url(#sprout-stem)"
              strokeWidth={4 + growthFactor * 5}
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Left leaf - bright lime green */}
            <path
              d={`M ${-3 + growthFactor * 3} ${-50 - growthFactor * 50}
                 Q ${-30 - growthFactor * 18} ${-60 - growthFactor * 40},
                   ${-22 - growthFactor * 12} ${-80 - growthFactor * 30}
                 Q ${-10 - growthFactor * 6} ${-65 - growthFactor * 45},
                   ${-3 + growthFactor * 3} ${-50 - growthFactor * 50}`}
              fill="url(#sprout-leaf-left)"
              opacity={0.85 + growthFactor * 0.15}
            />
            
            {/* Left leaf vein */}
            <path
              d={`M ${-5 + growthFactor * 2} ${-52 - growthFactor * 48}
                 Q ${-18 - growthFactor * 8} ${-62 - growthFactor * 38},
                   ${-16 - growthFactor * 8} ${-72 - growthFactor * 28}`}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              fill="none"
            />
            
            {/* Right leaf - bright lime green */}
            <path
              d={`M ${3 + growthFactor * 4} ${-55 - growthFactor * 55}
                 Q ${28 + growthFactor * 15} ${-65 - growthFactor * 35},
                   ${20 + growthFactor * 10} ${-85 - growthFactor * 25}
                 Q ${10 + growthFactor * 5} ${-70 - growthFactor * 40},
                   ${3 + growthFactor * 4} ${-55 - growthFactor * 55}`}
              fill="url(#sprout-leaf-right)"
              opacity={0.9 + growthFactor * 0.1}
            />
            
            {/* Right leaf vein */}
            <path
              d={`M ${5 + growthFactor * 3} ${-57 - growthFactor * 53}
                 Q ${16 + growthFactor * 8} ${-67 - growthFactor * 33},
                   ${14 + growthFactor * 7} ${-77 - growthFactor * 23}`}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
              fill="none"
            />
            
            {/* Tiny unfurling center bud */}
            <ellipse
              cx={growthFactor * 6}
              cy={-68 - growthFactor * 78}
              rx={5 + growthFactor * 4}
              ry={7 + growthFactor * 5}
              fill={colors.sprout.leafLight}
              opacity={0.9}
            />
          </g>
        )}
        
        {/* Tree trunk - grows taller with revenue, centered at x=400 */}
        {growthFactor >= 0.15 && (
          <TreeBranch
            id="trunk"
            start={[400, 380]}
            control1={[395, 330 - growthFactor * 25]}
            control2={[405, 285 - growthFactor * 35]}
            end={[400, 240 - growthFactor * 45]}
            startThickness={32 + growthFactor * 8}
            endThickness={18 + growthFactor * 6}
            growth={Math.min((growthFactor - 0.15) * 1.4, 1)}
            variant="primary"
          />
        )}
        
        {/* Major branches - appear after 25% growth */}
        {growthFactor > 0.25 && (
          <>
            {/* Left primary branch */}
            <TreeBranch
              id="branch-left-1"
              start={[400, 270 - growthFactor * 30]}
              control1={[350, 245 - growthFactor * 25]}
              control2={[310, 230 - growthFactor * 20]}
              end={[280, 225 - growthFactor * 25]}
              startThickness={16 + growthFactor * 4}
              endThickness={6 + growthFactor * 2}
              growth={Math.min((growthFactor - 0.25) * 1.5, 1)}
              variant="primary"
            />
            
            {/* Right primary branch */}
            <TreeBranch
              id="branch-right-1"
              start={[400, 260 - growthFactor * 30]}
              control1={[450, 240 - growthFactor * 25]}
              control2={[490, 225 - growthFactor * 20]}
              end={[520, 220 - growthFactor * 25]}
              startThickness={16 + growthFactor * 4}
              endThickness={6 + growthFactor * 2}
              growth={Math.min((growthFactor - 0.25) * 1.5, 1)}
              variant="primary"
            />
          </>
        )}
        
        {/* Secondary branches - appear after 40% growth */}
        {growthFactor > 0.4 && (
          <>
            {/* Left secondary */}
            <TreeBranch
              id="branch-left-2"
              start={[340, 240 - growthFactor * 22]}
              control1={[310, 215 - growthFactor * 16]}
              control2={[295, 190 - growthFactor * 12]}
              end={[285, 175 - growthFactor * 16]}
              startThickness={10 + growthFactor * 3}
              endThickness={3 + growthFactor}
              growth={Math.min((growthFactor - 0.4) * 2, 1)}
              variant="secondary"
            />
            
            {/* Right secondary */}
            <TreeBranch
              id="branch-right-2"
              start={[460, 235 - growthFactor * 22]}
              control1={[490, 210 - growthFactor * 16]}
              control2={[505, 185 - growthFactor * 12]}
              end={[515, 170 - growthFactor * 16]}
              startThickness={10 + growthFactor * 3}
              endThickness={3 + growthFactor}
              growth={Math.min((growthFactor - 0.4) * 2, 1)}
              variant="secondary"
            />
            
            {/* Center crown branch */}
            <TreeBranch
              id="branch-center"
              start={[400, 245 - growthFactor * 45]}
              control1={[400, 195 - growthFactor * 30]}
              control2={[402, 155 - growthFactor * 20]}
              end={[400, 125 - growthFactor * 15]}
              startThickness={12 + growthFactor * 3}
              endThickness={4 + growthFactor}
              growth={Math.min((growthFactor - 0.4) * 2, 1)}
              variant="secondary"
            />
          </>
        )}
        
        {/* Tertiary branches (young growth) - after 60% */}
        {growthFactor > 0.6 && (
          <>
            <TreeBranch
              id="branch-left-3"
              start={[300, 215 - growthFactor * 18]}
              control1={[280, 200 - growthFactor * 12]}
              control2={[270, 185 - growthFactor * 8]}
              end={[265, 172 - growthFactor * 10]}
              startThickness={6 + growthFactor * 2}
              endThickness={2}
              growth={Math.min((growthFactor - 0.6) * 2.5, 1)}
              variant="young"
            />
            
            <TreeBranch
              id="branch-right-3"
              start={[500, 210 - growthFactor * 18]}
              control1={[520, 195 - growthFactor * 12]}
              control2={[530, 180 - growthFactor * 8]}
              end={[535, 167 - growthFactor * 10]}
              startThickness={6 + growthFactor * 2}
              endThickness={2}
              growth={Math.min((growthFactor - 0.6) * 2.5, 1)}
              variant="young"
            />
          </>
        )}
        
        {/* Blossoms - layered for depth */}
        {/* Background layer (further from viewer) */}
        <g opacity="0.85">
          {blossomClusters
            .filter(b => b.tilt < -5)
            .map((blossom, i) => (
              <BlossomFlower
                key={`bg-${i}`}
                id={`bg-${i}`}
                x={blossom.x}
                y={blossom.y}
                size={blossom.size * 0.9}
                stage={blossom.stage}
                vibrancy={blossom.vibrancy * 0.85}
                luminosity={blossom.luminosity * 0.7}
                rotation={blossom.rotation}
                tilt={blossom.tilt}
                delay={i * 0.05}
                season={season}
              />
            ))}
        </g>
        
        {/* Midground layer */}
        <g>
          {blossomClusters
            .filter(b => b.tilt >= -5 && b.tilt <= 5)
            .map((blossom, i) => (
              <BlossomFlower
                key={`mg-${i}`}
                id={`mg-${i}`}
                x={blossom.x}
                y={blossom.y}
                size={blossom.size}
                stage={blossom.stage}
                vibrancy={blossom.vibrancy}
                luminosity={blossom.luminosity}
                rotation={blossom.rotation}
                tilt={blossom.tilt}
                delay={i * 0.05}
                season={season}
              />
            ))}
        </g>
        
        {/* Foreground layer (closest to viewer) - most vibrant and luminous */}
        <g>
          {blossomClusters
            .filter(b => b.tilt > 5)
            .map((blossom, i) => (
              <BlossomFlower
                key={`fg-${i}`}
                id={`fg-${i}`}
                x={blossom.x}
                y={blossom.y}
                size={blossom.size * 1.1}
                stage={blossom.stage}
                vibrancy={Math.min(1, blossom.vibrancy * 1.1)}
                luminosity={Math.min(1, blossom.luminosity * 1.15)}
                rotation={blossom.rotation}
                tilt={blossom.tilt}
                delay={i * 0.05}
                season={season}
              />
            ))}
        </g>
        
        {/* Falling petals - color intensity matches weekly vibrancy */}
        {fallingPetals.map((petal) => {
          // Petal color deepens with vibrancy
          const r = Math.round(255);
          const g = Math.round(182 - blossomVibrancy * 40);
          const b = Math.round(193 - blossomVibrancy * 30);
          
          return (
            <circle
              key={`petal-${petal.id}`}
              cx={petal.x}
              cy={petal.y}
              r={2.5 + blossomVibrancy * 1.5}
              fill={`rgba(${r}, ${g}, ${b}, ${petal.opacity})`}
              style={{
                animation: `petalFall ${petal.duration}s ease-in infinite`,
                animationDelay: `${petal.delay}s`,
                // @ts-expect-error - CSS custom property
                '--drift': `${petal.drift}px`,
              }}
            />
          );
        })}
        
        {/* Ambient particles - golden pollen and light motes */}
        {ambientParticles.map((particle) => (
          <circle
            key={`particle-${particle.id}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.radius}
            fill={particle.isGolden 
              ? `rgba(255, 240, 180, ${0.4 + blossomLuminosity * 0.4})`
              : `rgba(255, 255, 250, ${0.3 + blossomLuminosity * 0.5})`
            }
            style={{
              animation: `particleFloat 5s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
        
        {/* Weather particles - rain or snow based on local weather */}
        {weatherParticles.map((particle) => (
          particle.type === 'rain' ? (
            <line
              key={`weather-${particle.id}`}
              x1={particle.x}
              y1={particle.y}
              x2={particle.x + 2}
              y2={particle.y + particle.length}
              stroke={`rgba(180, 200, 220, ${particle.opacity})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                animation: `rainFall ${particle.speed}s linear infinite`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ) : (
            <circle
              key={`weather-${particle.id}`}
              cx={particle.x}
              cy={particle.y}
              r={particle.radius}
              fill={`rgba(255, 255, 255, ${particle.opacity})`}
              style={{
                animation: `snowFall ${particle.speed}s ease-in-out infinite`,
                animationDelay: `${particle.delay}s`,
                // @ts-expect-error - CSS custom property
                '--drift': `${particle.drift}px`,
              }}
            />
          )
        ))}
      </svg>
      
      {/* Weather overlay tint - subtle color shift based on conditions */}
      {weatherEffects.skyTint && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: weatherEffects.skyTint,
            pointerEvents: 'none',
            transition: 'background 3s ease',
            borderRadius: '16px',
          }}
        />
      )}
      
      {/* Weather indicator - shows current conditions */}
      {weather && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderRadius: '20px',
            fontSize: '13px',
            color: colors.sageDark,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          <span style={{ fontSize: '16px' }}>
            {weather.condition === 'clear' && weather.isDay && '☀️'}
            {weather.condition === 'clear' && !weather.isDay && '🌙'}
            {weather.condition === 'cloudy' && '☁️'}
            {weather.condition === 'rainy' && '🌧️'}
            {weather.condition === 'stormy' && '⛈️'}
            {weather.condition === 'snowy' && '❄️'}
            {weather.condition === 'windy' && '💨'}
            {weather.condition === 'foggy' && '🌫️'}
          </span>
          <span style={{ fontWeight: 500 }}>{weather.temperature}°</span>
          {locationName && (
            <span style={{ opacity: 0.7, fontSize: '11px' }}>{locationName}</span>
          )}
        </div>
      )}
      
      {/* Stats overlay - landscape layout with tree visible */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Stage indicator - visual only, no text label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '16px',
            fontSize: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* Show the tree stage icon */}
          <span>{treeStage.label.split(' ')[0]}</span>
          {/* Show blossom indicator if blooming */}
          {blossomStage.blossomCount > 0 && (
            <span style={{ marginLeft: '2px' }}>🌸</span>
          )}
        </div>
        
        {/* Revenue display - monthly (tree) and weekly (blossoms) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '12px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            flex: '0 1 auto',
          }}
        >
          {/* Monthly revenue - drives tree growth */}
          <div>
            <div
              style={{
                fontSize: '11px',
                color: colors.sageDark,
                opacity: 0.6,
                marginBottom: '2px',
                fontWeight: 500,
              }}
            >
              {monthlyStats.monthName}
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: colors.sageDark,
                fontFamily: "'Crimson Text', Georgia, serif",
                letterSpacing: '-0.5px',
              }}
            >
              ${monthlyRevenue.toLocaleString()}
            </div>
          </div>
          
          {/* Weekly revenue - drives blossoms */}
          {weeklyStats && (
            <div style={{ 
              borderLeft: `1px solid rgba(122, 141, 122, 0.2)`,
              paddingLeft: '20px',
            }}>
              <div
                style={{
                  fontSize: '11px',
                  color: colors.sageDark,
                  opacity: 0.6,
                  marginBottom: '2px',
                }}
              >
                This week
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  color: weeklyRevenue > 0 ? colors.sage : colors.sageDark,
                }}
              >
                ${weeklyRevenue.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* ============================================================================
          ORGANIC WOODEN FRAME - Like looking out a cottage window
          Not a perfect rectangle, but organic curves suggesting aged wood or
          branches that have grown into a frame shape over time.
          ============================================================================ */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          borderRadius: '16px',
        }}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <defs>
          {/* Wood grain gradient - gives depth and warmth */}
          <linearGradient id="woodGrainH" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.wood.dark} />
            <stop offset="15%" stopColor={colors.wood.mid} />
            <stop offset="30%" stopColor={colors.wood.dark} />
            <stop offset="50%" stopColor={colors.wood.light} />
            <stop offset="70%" stopColor={colors.wood.mid} />
            <stop offset="85%" stopColor={colors.wood.dark} />
            <stop offset="100%" stopColor={colors.wood.mid} />
          </linearGradient>
          
          <linearGradient id="woodGrainV" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.wood.dark} />
            <stop offset="20%" stopColor={colors.wood.mid} />
            <stop offset="40%" stopColor={colors.wood.light} />
            <stop offset="60%" stopColor={colors.wood.mid} />
            <stop offset="80%" stopColor={colors.wood.dark} />
            <stop offset="100%" stopColor={colors.wood.mid} />
          </linearGradient>
          
          {/* Inner shadow to create depth */}
          <linearGradient id="frameShadowTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          
          <linearGradient id="frameShadowBottom" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          
          <linearGradient id="frameShadowLeft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          
          <linearGradient id="frameShadowRight" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          
          {/* Highlight for beveled edge effect */}
          <linearGradient id="frameHighlightTop" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="70%" stopColor={colors.wood.highlight} />
            <stop offset="100%" stopColor={colors.wood.light} />
          </linearGradient>
        </defs>
        
        {/* TOP FRAME - organic gentle wave, thicker */}
        <path
          d="M 0 0 
             L 100 0 
             L 100 5.5 
             Q 85 5.2, 70 5.8 
             Q 50 6.2, 30 5.5 
             Q 15 5.0, 0 5.3 
             Z"
          fill="url(#woodGrainH)"
        />
        {/* Top inner bevel highlight */}
        <path
          d="M 0 5.3 
             Q 15 5.0, 30 5.5 
             Q 50 6.2, 70 5.8 
             Q 85 5.2, 100 5.5 
             L 100 6.5 
             Q 85 6.2, 70 6.8 
             Q 50 7.2, 30 6.5 
             Q 15 6.0, 0 6.3 
             Z"
          fill="url(#frameShadowTop)"
          opacity="0.5"
        />
        
        {/* BOTTOM FRAME - slightly wavy, thicker */}
        <path
          d="M 0 100 
             L 100 100 
             L 100 93.5 
             Q 80 94.2, 60 93.8 
             Q 40 93.2, 20 94.0 
             Q 10 94.5, 0 94.0 
             Z"
          fill="url(#woodGrainH)"
        />
        {/* Bottom inner shadow */}
        <path
          d="M 0 94.0 
             Q 10 94.5, 20 94.0 
             Q 40 93.2, 60 93.8 
             Q 80 94.2, 100 93.5 
             L 100 92.5 
             Q 80 93.2, 60 92.8 
             Q 40 92.2, 20 93.0 
             Q 10 93.5, 0 93.0 
             Z"
          fill="url(#frameShadowBottom)"
          opacity="0.4"
        />
        
        {/* LEFT FRAME - organic vertical with slight curve inward */}
        <path
          d="M 0 0 
             L 0 100 
             L 4.5 100 
             Q 4.2 80, 4.8 60 
             Q 5.2 40, 4.5 20 
             Q 4.0 10, 4.3 0 
             Z"
          fill="url(#woodGrainV)"
        />
        {/* Left inner shadow */}
        <path
          d="M 4.3 0 
             Q 4.0 10, 4.5 20 
             Q 5.2 40, 4.8 60 
             Q 4.2 80, 4.5 100 
             L 5.5 100 
             Q 5.2 80, 5.8 60 
             Q 6.2 40, 5.5 20 
             Q 5.0 10, 5.3 0 
             Z"
          fill="url(#frameShadowLeft)"
          opacity="0.4"
        />
        
        {/* RIGHT FRAME - matching organic curve */}
        <path
          d="M 100 0 
             L 100 100 
             L 95.5 100 
             Q 95.8 75, 95.2 50 
             Q 94.8 25, 95.5 10 
             Q 96.0 5, 95.7 0 
             Z"
          fill="url(#woodGrainV)"
        />
        {/* Right inner shadow */}
        <path
          d="M 95.7 0 
             Q 96.0 5, 95.5 10 
             Q 94.8 25, 95.2 50 
             Q 95.8 75, 95.5 100 
             L 94.5 100 
             Q 94.8 75, 94.2 50 
             Q 93.8 25, 94.5 10 
             Q 95.0 5, 94.7 0 
             Z"
          fill="url(#frameShadowRight)"
          opacity="0.4"
        />
        
        {/* Corner overlaps - organic knots/joints */}
        {/* Top-left corner */}
        <ellipse
          cx="3"
          cy="3.5"
          rx="2.8"
          ry="3"
          fill={colors.wood.dark}
        />
        <ellipse
          cx="3"
          cy="3.5"
          rx="1.8"
          ry="2"
          fill={colors.wood.mid}
          opacity="0.7"
        />
        
        {/* Top-right corner */}
        <ellipse
          cx="97"
          cy="3.5"
          rx="2.8"
          ry="3"
          fill={colors.wood.dark}
        />
        <ellipse
          cx="97"
          cy="3.5"
          rx="1.8"
          ry="2"
          fill={colors.wood.mid}
          opacity="0.7"
        />
        
        {/* Bottom-left corner */}
        <ellipse
          cx="3"
          cy="96.5"
          rx="2.8"
          ry="3"
          fill={colors.wood.dark}
        />
        <ellipse
          cx="3"
          cy="96.5"
          rx="1.8"
          ry="2"
          fill={colors.wood.mid}
          opacity="0.7"
        />
        
        {/* Bottom-right corner */}
        <ellipse
          cx="97"
          cy="96.5"
          rx="2.8"
          ry="3"
          fill={colors.wood.dark}
        />
        <ellipse
          cx="97"
          cy="96.5"
          rx="1.8"
          ry="2"
          fill={colors.wood.mid}
          opacity="0.7"
        />
        
        {/* Subtle wood grain texture lines */}
        {/* Top frame grain */}
        <path
          d="M 10 2.5 Q 30 2.2, 50 2.8 Q 70 2.3, 90 2.6"
          stroke={colors.wood.grain}
          strokeWidth="0.15"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M 8 3.8 Q 25 4.2, 45 3.5 Q 65 4.0, 85 3.7"
          stroke={colors.wood.grain}
          strokeWidth="0.12"
          fill="none"
          opacity="0.3"
        />
        
        {/* Bottom frame grain */}
        <path
          d="M 15 97.2 Q 35 96.8, 55 97.5 Q 75 97.0, 92 97.3"
          stroke={colors.wood.grain}
          strokeWidth="0.15"
          fill="none"
          opacity="0.4"
        />
        
        {/* Left frame grain */}
        <path
          d="M 2.2 15 Q 2.5 35, 2.0 55 Q 2.4 75, 2.2 90"
          stroke={colors.wood.grain}
          strokeWidth="0.15"
          fill="none"
          opacity="0.35"
        />
        
        {/* Right frame grain */}
        <path
          d="M 97.8 12 Q 97.5 32, 98.0 52 Q 97.6 72, 97.8 88"
          stroke={colors.wood.grain}
          strokeWidth="0.15"
          fill="none"
          opacity="0.35"
        />
        
        {/* Small knots/imperfections for organic feel */}
        <circle cx="25" cy="3" r="0.6" fill={colors.wood.grain} opacity="0.5" />
        <circle cx="72" cy="4" r="0.5" fill={colors.wood.grain} opacity="0.4" />
        <circle cx="2.5" cy="45" r="0.5" fill={colors.wood.grain} opacity="0.5" />
        <circle cx="97.5" cy="65" r="0.5" fill={colors.wood.grain} opacity="0.4" />
        <circle cx="40" cy="96" r="0.6" fill={colors.wood.grain} opacity="0.5" />
        <circle cx="78" cy="97" r="0.5" fill={colors.wood.grain} opacity="0.4" />
      </svg>
    </div>
  );
};

export default BlossomTreeSophisticated;
