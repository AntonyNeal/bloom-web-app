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
import type { MonthlyStats } from '@/types/bloom';

interface BlossomTreeProps {
  monthlyStats: MonthlyStats;
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
  
  // Calculate growth based on ABSOLUTE revenue milestones (not percentages)
  // Each milestone unlocks new visual growth - a treat as clinicians progress in their career
  const revenue = monthlyStats.currentRevenue;
  
  // Revenue milestones - each unlocks new visual elements
  // These are absolute dollar amounts, so clinicians always see new growth as they earn more
  const MILESTONES = {
    SEEDLING: 0,        // Just planted - bare trunk
    SPROUTING: 500,     // First signs of life
    BUDDING: 1500,      // Early buds appearing
    GROWING: 3000,      // Branches starting to form
    LEAFING: 5000,      // Canopy developing
    BLOOMING: 8000,     // Flowers beginning
    FLOURISHING: 12000, // Rich with blossoms
    ABUNDANT: 18000,    // Nearly full bloom
    MAGNIFICENT: 25000, // Peak beauty
  };
  
  // Calculate growth factor (0-1) based on where we are between milestones
  // This creates smooth transitions between stages
  const getGrowthFactor = (rev: number): number => {
    if (rev >= MILESTONES.MAGNIFICENT) return 1.0;
    if (rev >= MILESTONES.ABUNDANT) return 0.85 + (rev - MILESTONES.ABUNDANT) / (MILESTONES.MAGNIFICENT - MILESTONES.ABUNDANT) * 0.15;
    if (rev >= MILESTONES.FLOURISHING) return 0.7 + (rev - MILESTONES.FLOURISHING) / (MILESTONES.ABUNDANT - MILESTONES.FLOURISHING) * 0.15;
    if (rev >= MILESTONES.BLOOMING) return 0.55 + (rev - MILESTONES.BLOOMING) / (MILESTONES.FLOURISHING - MILESTONES.BLOOMING) * 0.15;
    if (rev >= MILESTONES.LEAFING) return 0.4 + (rev - MILESTONES.LEAFING) / (MILESTONES.BLOOMING - MILESTONES.LEAFING) * 0.15;
    if (rev >= MILESTONES.GROWING) return 0.25 + (rev - MILESTONES.GROWING) / (MILESTONES.LEAFING - MILESTONES.GROWING) * 0.15;
    if (rev >= MILESTONES.BUDDING) return 0.15 + (rev - MILESTONES.BUDDING) / (MILESTONES.GROWING - MILESTONES.BUDDING) * 0.1;
    if (rev >= MILESTONES.SPROUTING) return 0.05 + (rev - MILESTONES.SPROUTING) / (MILESTONES.BUDDING - MILESTONES.SPROUTING) * 0.1;
    return rev / MILESTONES.SPROUTING * 0.05; // Tiny growth even at $0
  };
  
  const growthFactor = getGrowthFactor(revenue);
  
  // Determine season from month
  const getSeason = (monthName: string): 'spring' | 'summer' | 'autumn' => {
    const month = monthName.toLowerCase();
    if (['september', 'october', 'november'].includes(month)) return 'spring'; // Southern hemisphere
    if (['december', 'january', 'february'].includes(month)) return 'summer';
    return 'autumn'; // March - August
  };
  
  const season = getSeason(monthlyStats.monthName);
  
  // Growth stages based on absolute revenue milestones
  // Each stage is a visual treat to unlock as career progresses
  const getGrowthStage = (rev: number) => {
    if (rev >= MILESTONES.MAGNIFICENT) return { name: 'magnificent', label: '✨ Magnificent', blossomCount: 140, intensity: 1.0, nextMilestone: null };
    if (rev >= MILESTONES.ABUNDANT) return { name: 'abundant', label: '🌸 Abundant', blossomCount: 110, intensity: 0.92, nextMilestone: MILESTONES.MAGNIFICENT };
    if (rev >= MILESTONES.FLOURISHING) return { name: 'flourishing', label: '🌷 Flourishing', blossomCount: 85, intensity: 0.82, nextMilestone: MILESTONES.ABUNDANT };
    if (rev >= MILESTONES.BLOOMING) return { name: 'blooming', label: '🌺 Blooming', blossomCount: 60, intensity: 0.7, nextMilestone: MILESTONES.FLOURISHING };
    if (rev >= MILESTONES.LEAFING) return { name: 'leafing', label: '🌿 Leafing', blossomCount: 38, intensity: 0.58, nextMilestone: MILESTONES.BLOOMING };
    if (rev >= MILESTONES.GROWING) return { name: 'growing', label: '🌱 Growing', blossomCount: 22, intensity: 0.45, nextMilestone: MILESTONES.LEAFING };
    if (rev >= MILESTONES.BUDDING) return { name: 'budding', label: '🌱 Budding', blossomCount: 12, intensity: 0.35, nextMilestone: MILESTONES.GROWING };
    if (rev >= MILESTONES.SPROUTING) return { name: 'sprouting', label: '🌱 Sprouting', blossomCount: 5, intensity: 0.25, nextMilestone: MILESTONES.BUDDING };
    return { name: 'seedling', label: '🌰 Seedling', blossomCount: 0, intensity: 0.15, nextMilestone: MILESTONES.SPROUTING };
  };
  
  const stage = getGrowthStage(revenue);
  
  // Sophisticated blossom placement - artistic clusters, not random scatter
  const blossomClusters = useMemo(() => {
    const clusters: Array<{ x: number; y: number; size: number; stage: number; rotation: number; tilt: number }> = [];
    
    // Define artistic cluster zones (mimicking natural branch tips)
    // Adjusted for wider landscape viewBox (800x350, center at x=400)
    const clusterZones = [
      // Upper left canopy
      { cx: 280, cy: 85, radius: 45, density: 1.2, branchAngle: -35 },
      // Upper right canopy  
      { cx: 520, cy: 90, radius: 50, density: 1.3, branchAngle: 25 },
      // Middle left
      { cx: 320, cy: 145, radius: 38, density: 1.0, branchAngle: -20 },
      // Middle right
      { cx: 480, cy: 140, radius: 42, density: 1.1, branchAngle: 15 },
      // Lower left accent
      { cx: 260, cy: 195, radius: 25, density: 0.8, branchAngle: -45 },
      // Lower right accent
      { cx: 540, cy: 190, radius: 28, density: 0.9, branchAngle: 40 },
      // Center high (crown)
      { cx: 400, cy: 65, radius: 35, density: 1.4, branchAngle: 0 },
      // Center mid (heart)
      { cx: 400, cy: 130, radius: 48, density: 1.5, branchAngle: 0 },
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
        minHeight: '320px',
        aspectRatio: '16 / 9',
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
          height: '65%',
          background: `linear-gradient(to bottom, ${colors.sky[timeOfDay]}, transparent)`,
          pointerEvents: 'none',
          transition: 'background 2s ease',
        }}
      />
      
      {/* Ground layer */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '25%',
          background: `linear-gradient(to top, ${colors.lavenderLight}, transparent)`,
          pointerEvents: 'none',
        }}
      />
      
      {/* Main SVG canvas - landscape orientation with centered tree */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 350"
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
          cy="330"
          rx="140"
          ry="18"
          fill="url(#ground-shadow)"
          opacity="0.6"
        />
        
        {/* Tree trunk - grows taller with revenue, centered at x=400 */}
        <TreeBranch
          id="trunk"
          start={[400, 330]}
          control1={[395, 280 - growthFactor * 25]}
          control2={[405, 235 - growthFactor * 35]}
          end={[400, 190 - growthFactor * 45]}
          startThickness={32 + growthFactor * 8}
          endThickness={18 + growthFactor * 6}
          growth={Math.min(growthFactor * 1.2, 1)}
          variant="primary"
        />
        
        {/* Major branches - appear after 20% growth */}
        {growthFactor > 0.2 && (
          <>
            {/* Left primary branch */}
            <TreeBranch
              id="branch-left-1"
              start={[400, 220 - growthFactor * 30]}
              control1={[350, 195 - growthFactor * 25]}
              control2={[310, 180 - growthFactor * 20]}
              end={[280, 175 - growthFactor * 25]}
              startThickness={16 + growthFactor * 4}
              endThickness={6 + growthFactor * 2}
              growth={Math.min((growthFactor - 0.2) * 1.5, 1)}
              variant="primary"
            />
            
            {/* Right primary branch */}
            <TreeBranch
              id="branch-right-1"
              start={[400, 210 - growthFactor * 30]}
              control1={[450, 190 - growthFactor * 25]}
              control2={[490, 175 - growthFactor * 20]}
              end={[520, 170 - growthFactor * 25]}
              startThickness={16 + growthFactor * 4}
              endThickness={6 + growthFactor * 2}
              growth={Math.min((growthFactor - 0.2) * 1.5, 1)}
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
              start={[340, 190 - growthFactor * 22]}
              control1={[310, 165 - growthFactor * 16]}
              control2={[295, 140 - growthFactor * 12]}
              end={[285, 125 - growthFactor * 16]}
              startThickness={10 + growthFactor * 3}
              endThickness={3 + growthFactor}
              growth={Math.min((growthFactor - 0.4) * 2, 1)}
              variant="secondary"
            />
            
            {/* Right secondary */}
            <TreeBranch
              id="branch-right-2"
              start={[460, 185 - growthFactor * 22]}
              control1={[490, 160 - growthFactor * 16]}
              control2={[505, 135 - growthFactor * 12]}
              end={[515, 120 - growthFactor * 16]}
              startThickness={10 + growthFactor * 3}
              endThickness={3 + growthFactor}
              growth={Math.min((growthFactor - 0.4) * 2, 1)}
              variant="secondary"
            />
            
            {/* Center crown branch */}
            <TreeBranch
              id="branch-center"
              start={[400, 195 - growthFactor * 45]}
              control1={[400, 145 - growthFactor * 30]}
              control2={[402, 105 - growthFactor * 20]}
              end={[400, 75 - growthFactor * 15]}
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
              start={[300, 165 - growthFactor * 18]}
              control1={[280, 150 - growthFactor * 12]}
              control2={[270, 135 - growthFactor * 8]}
              end={[265, 122 - growthFactor * 10]}
              startThickness={6 + growthFactor * 2}
              endThickness={2}
              growth={Math.min((growthFactor - 0.6) * 2.5, 1)}
              variant="young"
            />
            
            <TreeBranch
              id="branch-right-3"
              start={[500, 160 - growthFactor * 18]}
              control1={[520, 145 - growthFactor * 12]}
              control2={[530, 130 - growthFactor * 8]}
              end={[535, 117 - growthFactor * 10]}
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
          {/* Show the stage icon without saying the name */}
          <span>{stage.label.split(' ')[0]}</span>
        </div>
        
        {/* Revenue display - compact landscape card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '12px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            flex: '0 1 auto',
          }}
        >
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
              {monthlyStats.monthName} Revenue
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
              ${revenue.toLocaleString()}
            </div>
          </div>
          {/* Show next milestone as the "goal" */}
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
