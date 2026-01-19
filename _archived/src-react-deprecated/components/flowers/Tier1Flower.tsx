/**
 * Tier 1 Flower: Clinical Psychologist - Pink Cherry Blossom
 * 
 * Extracted from QualificationCheck.tsx for better code organization
 * and bundle size optimization.
 * 
 * Visual characteristics:
 * - 5 delicate pink petals with soft gradients
 * - 10 fine stamens for cherry blossom characteristic
 * - Luminous white highlights for ethereal quality
 * - Reversed gradient (pale edges → deeper pink center)
 */

import { memo } from "react";

export interface Tier1FlowerProps {
  isChecked: boolean;
  isMobile: boolean;
  shouldReduceMotion: boolean | null;
}

export const Tier1Flower = memo(({ 
  isChecked, 
  isMobile, 
  shouldReduceMotion
}: Tier1FlowerProps) => {
  if (!isChecked) return null;

  const size = isMobile ? 56 : 88;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={!shouldReduceMotion ? "tier1-flower-enter" : ""}
      style={{
        position: 'absolute',
        right: '-8px',
        top: '50%',
        transform: 'translateY(-50%)',
        willChange: shouldReduceMotion ? 'auto' : 'transform, opacity',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Reversed gradient: pale/white edges → deeper pink toward center */}
        <radialGradient id="pinkPetalGradient">
          <stop offset="0%" stopColor="#FFFBFC" />
          <stop offset="25%" stopColor="#FFE5ED" />
          <stop offset="60%" stopColor="#FFD4E0" />
          <stop offset="85%" stopColor="#FFB6C1" />
          <stop offset="100%" stopColor="#FFA8BA" />
        </radialGradient>
        {/* Softer center gradient */}
        <radialGradient id="pinkCenterGradient">
          <stop offset="0%" stopColor="#FFF5F8" />
          <stop offset="50%" stopColor="#FFE5ED" />
          <stop offset="100%" stopColor="#FFD4E0" />
        </radialGradient>
        {/* Subtle shadow */}
        <radialGradient id="pinkPetalShadow">
          <stop offset="0%" stopColor="#FFB6C1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF9BAD" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <g>
        {/* 5 petals radiating from center - slightly more spaced for cherry blossom feel */}
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const x = 16 + Math.cos((angle * Math.PI) / 180) * 9; // Increased from 8 to 9
          const y = 16 + Math.sin((angle * Math.PI) / 180) * 9;
          return (
            <g key={i}>
              {/* Petal shadow/depth */}
              <ellipse
                cx={x + 0.3}
                cy={y + 0.4}
                rx="5.5"
                ry="8"
                fill="url(#pinkPetalShadow)"
                transform={`rotate(${angle} ${x} ${y})`}
              />
              {/* Main petal - slightly rounder */}
              <ellipse
                cx={x}
                cy={y}
                rx="5.2"
                ry="7.8"
                fill="url(#pinkPetalGradient)"
                opacity="0.98"
                transform={`rotate(${angle} ${x} ${y})`}
              />
              {/* Larger, softer highlight for luminous quality */}
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
        
        {/* Center circle - softer gradient */}
        <circle cx="16" cy="16" r="3.5" fill="url(#pinkCenterGradient)" opacity="0.9" />
        
        {/* Delicate stamens - cherry blossom characteristic (10 stamens) */}
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle, i) => {
          const stamenLength = i % 2 === 0 ? 2.8 : 2.4; // Varied lengths
          const x1 = 16 + Math.cos((angle * Math.PI) / 180) * 0.5;
          const y1 = 16 + Math.sin((angle * Math.PI) / 180) * 0.5;
          const x2 = 16 + Math.cos((angle * Math.PI) / 180) * stamenLength;
          const y2 = 16 + Math.sin((angle * Math.PI) / 180) * stamenLength;
          
          return (
            <g key={`stamen-${i}`}>
              {/* Stamen filament - thin line */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FFB6C1"
                strokeWidth="0.4"
                opacity="0.8"
              />
              {/* Stamen anther - darker tip */}
              <circle
                cx={x2}
                cy={y2}
                r="0.5"
                fill="#C85A7A"
                opacity="0.9"
              />
            </g>
          );
        })}
        
        {/* Center highlight */}
        <ellipse cx="15.5" cy="15" rx="1.5" ry="1.2" fill="rgba(255, 255, 255, 0.7)" opacity="0.8" />
      </g>
    </svg>
  );
});

Tier1Flower.displayName = 'Tier1Flower';
