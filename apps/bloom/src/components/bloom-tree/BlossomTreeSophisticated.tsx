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
  
  // Calculate growth metrics
  // Use targetRevenue if provided, otherwise estimate based on current revenue (assume 80% of way there)
  const effectiveTarget = monthlyStats.targetRevenue || Math.max(monthlyStats.currentRevenue * 1.25, 1);
  const growthPercentage = Math.min((monthlyStats.currentRevenue / effectiveTarget) * 100, 100);
  const growthFactor = growthPercentage / 100; // 0 to 1
  
  // Determine season from month
  const getSeason = (monthName: string): 'spring' | 'summer' | 'autumn' => {
    const month = monthName.toLowerCase();
    if (['september', 'october', 'november'].includes(month)) return 'spring'; // Southern hemisphere
    if (['december', 'january', 'february'].includes(month)) return 'summer';
    return 'autumn'; // March - August
  };
  
  const season = getSeason(monthlyStats.monthName);
  
  // Growth stages with visual characteristics
  const getGrowthStage = (pct: number) => {
    if (pct < 15) return { name: 'dormant', label: '≡ƒî▒ Dormant', blossomCount: 0, intensity: 0.3 };
    if (pct < 30) return { name: 'budding', label: '≡ƒî┐ Early Buds', blossomCount: 12, intensity: 0.4 };
    if (pct < 50) return { name: 'emerging', label: '≡ƒî╕ Emerging', blossomCount: 28, intensity: 0.55 };
    if (pct < 70) return { name: 'blooming', label: '≡ƒî║ Blooming', blossomCount: 52, intensity: 0.7 };
    if (pct < 90) return { name: 'flourishing', label: '≡ƒî╕≡ƒî╕ Flourishing', blossomCount: 84, intensity: 0.85 };
    return { name: 'fullBloom', label: '≡ƒî│ Peak Bloom', blossomCount: 120, intensity: 1.0 };
  };
  
  const stage = getGrowthStage(growthPercentage);
  
  // Sophisticated blossom placement - artistic clusters, not random scatter
  const blossomClusters = useMemo(() => {
    const clusters: Array<{ x: number; y: number; size: number; stage: number; rotation: number; tilt: number }> = [];
    
    // Define artistic cluster zones (mimicking natural branch tips)
    const clusterZones = [
      // Upper left canopy
      { cx: 180, cy: 100, radius: 45, density: 1.2, branchAngle: -35 },
      // Upper right canopy  
      { cx: 420, cy: 110, radius: 50, density: 1.3, branchAngle: 25 },
      // Middle left
      { cx: 220, cy: 180, radius: 38, density: 1.0, branchAngle: -20 },
      // Middle right
      { cx: 380, cy: 170, radius: 42, density: 1.1, branchAngle: 15 },
      // Lower left accent
      { cx: 160, cy: 240, radius: 25, density: 0.8, branchAngle: -45 },
      // Lower right accent
      { cx: 440, cy: 230, radius: 28, density: 0.9, branchAngle: 40 },
      // Center high (crown)
      { cx: 300, cy: 80, radius: 35, density: 1.4, branchAngle: 0 },
      // Center mid (heart)
      { cx: 300, cy: 160, radius: 48, density: 1.5, branchAngle: 0 },
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
        minHeight: '420px',
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
      
      {/* Main SVG canvas */}
      <svg
        width="600"
        height="420"
        viewBox="0 0 600 420"
        style={{
          width: '100%',
          height: 'auto',
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
        
        {/* Ground shadow/circle */}
        <ellipse
          cx="300"
          cy="395"
          rx="140"
          ry="20"
          fill="url(#ground-shadow)"
          opacity="0.6"
        />
        
        {/* Tree trunk - grows taller with revenue */}
        <TreeBranch
          id="trunk"
          start={[300, 395]}
          control1={[295, 340 - growthFactor * 30]}
          control2={[305, 290 - growthFactor * 40]}
          end={[300, 240 - growthFactor * 50]}
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
              start={[300, 280 - growthFactor * 35]}
              control1={[250, 250 - growthFactor * 30]}
              control2={[210, 230 - growthFactor * 25]}
              end={[180, 220 - growthFactor * 30]}
              startThickness={16 + growthFactor * 4}
              endThickness={6 + growthFactor * 2}
              growth={Math.min((growthFactor - 0.2) * 1.5, 1)}
              variant="primary"
            />
            
            {/* Right primary branch */}
            <TreeBranch
              id="branch-right-1"
              start={[300, 270 - growthFactor * 35]}
              control1={[350, 245 - growthFactor * 30]}
              control2={[390, 225 - growthFactor * 25]}
              end={[420, 215 - growthFactor * 30]}
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
              start={[240, 240 - growthFactor * 28]}
              control1={[210, 210 - growthFactor * 20]}
              control2={[195, 180 - growthFactor * 15]}
              end={[185, 160 - growthFactor * 20]}
              startThickness={10 + growthFactor * 3}
              endThickness={3 + growthFactor}
              growth={Math.min((growthFactor - 0.4) * 2, 1)}
              variant="secondary"
            />
            
            {/* Right secondary */}
            <TreeBranch
              id="branch-right-2"
              start={[360, 235 - growthFactor * 28]}
              control1={[390, 205 - growthFactor * 20]}
              control2={[405, 175 - growthFactor * 15]}
              end={[415, 155 - growthFactor * 20]}
              startThickness={10 + growthFactor * 3}
              endThickness={3 + growthFactor}
              growth={Math.min((growthFactor - 0.4) * 2, 1)}
              variant="secondary"
            />
            
            {/* Center crown branch */}
            <TreeBranch
              id="branch-center"
              start={[300, 245 - growthFactor * 50]}
              control1={[300, 180 - growthFactor * 35]}
              control2={[302, 130 - growthFactor * 25]}
              end={[300, 100 - growthFactor * 20]}
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
              start={[200, 210 - growthFactor * 22]}
              control1={[180, 190 - growthFactor * 15]}
              control2={[170, 170 - growthFactor * 10]}
              end={[165, 155 - growthFactor * 12]}
              startThickness={6 + growthFactor * 2}
              endThickness={2}
              growth={Math.min((growthFactor - 0.6) * 2.5, 1)}
              variant="young"
            />
            
            <TreeBranch
              id="branch-right-3"
              start={[400, 205 - growthFactor * 22]}
              control1={[420, 185 - growthFactor * 15]}
              control2={[430, 165 - growthFactor * 10]}
              end={[435, 150 - growthFactor * 12]}
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
      
      {/* Stats overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
        }}
      >
        {/* Stage indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 500,
            color: colors.sageDark,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            marginBottom: '12px',
          }}
        >
          <span>{stage.label}</span>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>
            {Math.round(growthPercentage)}%
          </span>
        </div>
        
        {/* Revenue display */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            padding: '16px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '12px',
                color: colors.sageDark,
                opacity: 0.7,
                marginBottom: '4px',
                fontWeight: 500,
              }}
            >
              {monthlyStats.monthName} Revenue
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 600,
                color: colors.sageDark,
                fontFamily: "'Crimson Text', Georgia, serif",
                letterSpacing: '-1px',
              }}
            >
              ${monthlyStats.currentRevenue.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '12px',
                color: colors.sageDark,
                opacity: 0.7,
                marginBottom: '4px',
              }}
            >
              Target
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 500,
                color: colors.sage,
              }}
            >
              ${(monthlyStats.targetRevenue ?? effectiveTarget).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlossomTreeSophisticated;
