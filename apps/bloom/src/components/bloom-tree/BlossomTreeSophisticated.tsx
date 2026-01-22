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
 */

import React, { useState, useMemo, useEffect } from 'react';
import { BlossomFlower } from './BlossomFlower';
import { TreeBranch } from './TreeBranch';
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
  sky: {
    dawn: 'rgba(255, 243, 230, 0.6)',
    morning: 'rgba(245, 250, 255, 0.5)',
    afternoon: 'rgba(250, 248, 245, 0.5)',
    evening: 'rgba(255, 235, 220, 0.6)',
    night: 'rgba(230, 235, 250, 0.7)',
  },
};

export const BlossomTreeSophisticated: React.FC<BlossomTreeProps> = ({
  monthlyStats,
  weeklyStats,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  
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
  
  // Sophisticated blossom placement - artistic clusters, not random scatter
  const blossomClusters = useMemo(() => {
    const clusters: Array<{ x: number; y: number; size: number; stage: number; rotation: number; tilt: number }> = [];
    
    // Define artistic cluster zones (mimicking natural branch tips)
    // Adjusted for wider landscape viewBox (800x400, center at x=400)
    const clusterZones = [
      // Upper left canopy
      { cx: 280, cy: 135, radius: 45, density: 1.2, branchAngle: -35 },
      // Upper right canopy  
      { cx: 520, cy: 140, radius: 50, density: 1.3, branchAngle: 25 },
      // Middle left
      { cx: 320, cy: 195, radius: 38, density: 1.0, branchAngle: -20 },
      // Middle right
      { cx: 480, cy: 190, radius: 42, density: 1.1, branchAngle: 15 },
      // Lower left accent
      { cx: 260, cy: 245, radius: 25, density: 0.8, branchAngle: -45 },
      // Lower right accent
      { cx: 540, cy: 240, radius: 28, density: 0.9, branchAngle: 40 },
      // Center high (crown)
      { cx: 400, cy: 115, radius: 35, density: 1.4, branchAngle: 0 },
      // Center mid (heart)
      { cx: 400, cy: 180, radius: 48, density: 1.5, branchAngle: 0 },
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
        const distanceFromCenter = distance / zone.radius;
        const baseSize = 0.7 + Math.random() * 0.5;
        const centerBoost = (1 - distanceFromCenter) * 0.3;
        const size = baseSize + centerBoost;
        
        // Bloom stage varies - inner blossoms more developed
        const stageVariation = 0.7 + (1 - distanceFromCenter) * 0.3 + Math.random() * 0.1;
        const blossomStage = Math.min(growthFactor * stageVariation, 1);
        
        // Rotation follows branch angle with natural variation
        const rotation = zone.branchAngle + (Math.random() - 0.5) * 45;
        
        // Tilt creates depth - outer blossoms tilt away
        const tilt = distanceFromCenter * (Math.random() - 0.5) * 30;
        
        clusters.push({ x, y, size, stage: blossomStage, rotation, tilt });
        blossomId++;
      }
    });
    
    return clusters;
  }, [stage.blossomCount, growthFactor]);
  
  // Falling petals (only at peak bloom)
  const fallingPetals = useMemo(() => {
    if (stage.name !== 'fullBloom') return [];
    
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 150 + Math.random() * 300,
      y: 100 + Math.random() * 150,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 60,
    }));
  }, [stage.name]);
  
  // Ambient particles (pollen, light motes)
  const ambientParticles = useMemo(() => {
    if (growthFactor < 0.5) return [];
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 200 + Math.random() * 200,
      y: 120 + Math.random() * 180,
      delay: Math.random() * 6,
      radius: 1 + Math.random() * 2,
    }));
  }, [growthFactor]);
  
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
          height: '60%',
          background: `linear-gradient(to bottom, ${colors.sky[timeOfDay]}, transparent)`,
          pointerEvents: 'none',
          transition: 'background 2s ease',
        }}
      />
      
      {/* Horizon line - soft transition between sky and ground */}
      <div
        style={{
          position: 'absolute',
          bottom: '28%',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 5%, rgba(180, 190, 180, 0.3) 30%, rgba(180, 190, 180, 0.4) 50%, rgba(180, 190, 180, 0.3) 70%, transparent 95%)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Ground layer */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '28%',
          background: `linear-gradient(to top, ${colors.lavenderLight}, rgba(243, 240, 247, 0.3))`,
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
            <stop offset="0%" stopColor="rgba(90, 107, 90, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          
          {/* Gradient for sprout stem */}
          <linearGradient id="sprout-stem" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#6B7D6B" />
            <stop offset="100%" stopColor="#8FA88F" />
          </linearGradient>
          
          {/* Gradient for sprout leaves */}
          <linearGradient id="sprout-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9CB89C" />
            <stop offset="50%" stopColor="#7BA07B" />
            <stop offset="100%" stopColor="#6B8D6B" />
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
        
        {/* Seedling sprout - shows at early stages */}
        {growthFactor < 0.25 && (
          <g transform="translate(400, 370)">
            {/* Small soil mound */}
            <ellipse cx="0" cy="5" rx="25" ry="6" fill="rgba(139, 119, 101, 0.3)" />
            
            {/* Sprout stem - graceful curve */}
            <path
              d={`M 0 0 
                 Q ${-3 - growthFactor * 20} ${-40 - growthFactor * 60}, 
                   ${growthFactor * 5} ${-60 - growthFactor * 80}`}
              stroke="url(#sprout-stem)"
              strokeWidth={3 + growthFactor * 4}
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Left leaf - unfurling */}
            <path
              d={`M ${-2 + growthFactor * 3} ${-45 - growthFactor * 50}
                 Q ${-25 - growthFactor * 15} ${-55 - growthFactor * 40},
                   ${-18 - growthFactor * 10} ${-70 - growthFactor * 30}
                 Q ${-8 - growthFactor * 5} ${-58 - growthFactor * 45},
                   ${-2 + growthFactor * 3} ${-45 - growthFactor * 50}`}
              fill="url(#sprout-leaf)"
              opacity={0.6 + growthFactor}
            />
            
            {/* Right leaf - unfurling */}
            <path
              d={`M ${2 + growthFactor * 3} ${-50 - growthFactor * 55}
                 Q ${22 + growthFactor * 12} ${-60 - growthFactor * 35},
                   ${16 + growthFactor * 8} ${-75 - growthFactor * 25}
                 Q ${8 + growthFactor * 4} ${-62 - growthFactor * 40},
                   ${2 + growthFactor * 3} ${-50 - growthFactor * 55}`}
              fill="url(#sprout-leaf)"
              opacity={0.7 + growthFactor}
            />
            
            {/* Tiny center leaf bud */}
            <ellipse
              cx={growthFactor * 5}
              cy={-58 - growthFactor * 78}
              rx={4 + growthFactor * 3}
              ry={6 + growthFactor * 4}
              fill="#9CB89C"
              opacity={0.8}
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
                intensity={stage.intensity * 0.85}
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
                intensity={stage.intensity}
                rotation={blossom.rotation}
                tilt={blossom.tilt}
                delay={i * 0.05}
                season={season}
              />
            ))}
        </g>
        
        {/* Foreground layer (closest to viewer) */}
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
                intensity={stage.intensity}
                rotation={blossom.rotation}
                tilt={blossom.tilt}
                delay={i * 0.05}
                season={season}
              />
            ))}
        </g>
        
        {/* Falling petals */}
        {fallingPetals.map((petal) => (
          <circle
            key={`petal-${petal.id}`}
            cx={petal.x}
            cy={petal.y}
            r="3"
            fill="rgba(255, 182, 193, 0.6)"
            style={{
              animation: `petalFall ${petal.duration}s ease-in infinite`,
              animationDelay: `${petal.delay}s`,
              // @ts-expect-error - CSS custom property
              '--drift': `${petal.drift}px`,
            }}
          />
        ))}
        
        {/* Ambient particles */}
        {ambientParticles.map((particle) => (
          <circle
            key={`particle-${particle.id}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.radius}
            fill="rgba(255, 255, 240, 0.6)"
            style={{
              animation: `particleFloat 5s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </svg>
      
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
          
          {/* Next monthly milestone */}
          {stage.nextMilestone && (
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
                Next milestone
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: colors.sage,
                }}
              >
                ${stage.nextMilestone.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlossomTreeSophisticated;
