/**
 * Tier 2 Flower: 8+ Years Registered - Purple Rose with Sparkles
 * 
 * Extracted from QualificationCheck.tsx for better code organization
 * and bundle size optimization.
 * 
 * Visual characteristics:
 * - Layered petals (6 outer + 4 inner) for depth
 * - Deep purple with gradient from pale edges to rich center
 * - Organic variations in petal size and angle (Miyazaki touch)
 * - Sparkling particle burst animation
 */

import { memo } from "react";

export interface Tier2FlowerProps {
  isChecked: boolean;
  isMobile: boolean;
  shouldReduceMotion: boolean | null;
}

export const Tier2Flower = memo(({ 
  isChecked, 
  isMobile, 
  shouldReduceMotion
}: Tier2FlowerProps) => {
  if (!isChecked) return null;

  const size = isMobile ? 60 : 80;
  const reduceMotion = shouldReduceMotion || false;
  
  return (
    <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className={!reduceMotion ? "tier2-flower-enter" : ""}
        style={{
          willChange: reduceMotion ? 'auto' : 'transform, opacity',
        }}
        aria-hidden="true"
      >
        <defs>
          {/* Outer petal gradient - lighter, more exposed */}
          <radialGradient id="purplePetalOuter">
            <stop offset="0%" stopColor="#F0E5F9" />
            <stop offset="30%" stopColor="#E0CEF0" />
            <stop offset="60%" stopColor="#C7ABD9" />
            <stop offset="85%" stopColor="#B18FC7" />
            <stop offset="100%" stopColor="#9B72AA" />
          </radialGradient>
          {/* Inner petal gradient - deeper, more shadowed */}
          <radialGradient id="purplePetalInner">
            <stop offset="0%" stopColor="#D4BEED" />
            <stop offset="40%" stopColor="#B18FC7" />
            <stop offset="70%" stopColor="#9B72AA" />
            <stop offset="100%" stopColor="#7A5589" />
          </radialGradient>
          {/* Deep shadow for petal overlaps */}
          <radialGradient id="purpleShadow">
            <stop offset="0%" stopColor="#6F4C7A" opacity="0.6" />
            <stop offset="100%" stopColor="#4A3350" opacity="0.8" />
          </radialGradient>
          {/* Softer center - partially hidden */}
          <radialGradient id="roseCenterGradient">
            <stop offset="0%" stopColor="#F5E6B8" />
            <stop offset="60%" stopColor="#E8D4A8" />
            <stop offset="100%" stopColor="#C9A87C" />
          </radialGradient>
        </defs>
        <g>
          {/* Outer ring: 6 petals - larger, lighter, more exposed */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            // Organic variations
            const angleVariation = [5, -3, 4, -4, 3, -5][i];
            const sizeVariation = [1.05, 0.95, 1.0, 1.08, 0.98, 1.02][i];
            const adjustedAngle = angle + angleVariation;
            const petalDistance = 10.5;
            const x = 20 + Math.cos((adjustedAngle * Math.PI) / 180) * petalDistance;
            const y = 20 + Math.sin((adjustedAngle * Math.PI) / 180) * petalDistance;
            
            const petalWidth = 6.5 * sizeVariation;
            const petalHeight = 7.2 * sizeVariation;
            
            return (
              <g key={`outer-${i}`}>
                {/* Soft shadow beneath petal */}
                <ellipse
                  cx={x + 0.5}
                  cy={y + 1.0}
                  rx={petalWidth}
                  ry={petalHeight}
                  fill="url(#purpleShadow)"
                  transform={`rotate(${adjustedAngle + 8} ${x} ${y})`}
                />
                
                {/* Main outer petal - lighter gradient */}
                <ellipse
                  cx={x}
                  cy={y}
                  rx={petalWidth}
                  ry={petalHeight}
                  fill="url(#purplePetalOuter)"
                  opacity="0.95"
                  transform={`rotate(${adjustedAngle + 8} ${x} ${y})`}
                />
                
                {/* Soft highlight - captures light on petal edge */}
                <ellipse
                  cx={x + (i % 2 === 0 ? -1.4 : 1.2)}
                  cy={y - 2.0}
                  rx={2.5 * sizeVariation}
                  ry={3.0 * sizeVariation}
                  fill="rgba(255, 250, 255, 0.7)"
                  opacity="0.6"
                  transform={`rotate(${adjustedAngle + 5} ${x} ${y})`}
                />
              </g>
            );
          })}
          
          {/* Inner ring: 4 petals - smaller, deeper color, spiraling inward */}
          {[30, 100, 190, 280].map((angle, i) => {
            const angleVariation = [4, -6, 5, -4][i];
            const sizeVariation = [0.88, 0.92, 0.85, 0.90][i];
            const adjustedAngle = angle + angleVariation;
            const petalDistance = 6.2;
            const x = 20 + Math.cos((adjustedAngle * Math.PI) / 180) * petalDistance;
            const y = 20 + Math.sin((adjustedAngle * Math.PI) / 180) * petalDistance;
            
            const petalWidth = 5.0 * sizeVariation;
            const petalHeight = 5.8 * sizeVariation;
            
            return (
              <g key={`inner-${i}`}>
                {/* Inner petal - deeper gradient, more saturated */}
                <ellipse
                  cx={x}
                  cy={y}
                  rx={petalWidth}
                  ry={petalHeight}
                  fill="url(#purplePetalInner)"
                  opacity="0.92"
                  transform={`rotate(${adjustedAngle + 15} ${x} ${y})`}
                />
                
                {/* Subtle highlight on inner petals */}
                <ellipse
                  cx={x + (i % 2 === 0 ? -0.8 : 0.7)}
                  cy={y - 1.2}
                  rx={1.8 * sizeVariation}
                  ry={2.2 * sizeVariation}
                  fill="rgba(230, 215, 240, 0.65)"
                  opacity="0.5"
                  transform={`rotate(${adjustedAngle + 10} ${x} ${y})`}
                />
              </g>
            );
          })}
          
          {/* Center - mostly hidden by inner petals */}
          <circle cx="20" cy="20" r="2.8" fill="url(#roseCenterGradient)" opacity="0.6" />
          
          {/* Tiny center detail */}
          <circle cx="19.5" cy="19.5" r="1.2" fill="#C9A87C" opacity="0.4" />
        </g>
      </svg>
      
      {/* Sparkles removed for cleaner composition */}
    </div>
  );
});

Tier2Flower.displayName = 'Tier2Flower';
