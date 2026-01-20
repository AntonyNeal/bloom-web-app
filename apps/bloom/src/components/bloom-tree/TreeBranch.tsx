/**
 * Tree Branch Component - Organic curved branches with natural taper
 * 
 * Uses cubic Bezier curves to create naturalistic branch growth.
 * Branches taper from thick at base to thin at tips.
 * Includes bark texture simulation and growth animation.
 */

import { memo } from 'react';

export interface TreeBranchProps {
  /** Start point [x, y] */
  start: [number, number];
  /** Control point 1 for Bezier curve [x, y] */
  control1: [number, number];
  /** Control point 2 for Bezier curve [x, y] */
  control2: [number, number];
  /** End point [x, y] */
  end: [number, number];
  /** Starting thickness at base */
  startThickness: number;
  /** Ending thickness at tip */
  endThickness: number;
  /** Growth progress 0-1 (for animation) */
  growth?: number;
  /** Unique ID for gradients */
  id: string;
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'young';
  /** Optional child branches */
  children?: React.ReactNode;
}

export const TreeBranch = memo(({
  start,
  control1,
  control2,
  end,
  startThickness,
  endThickness,
  growth = 1,
  id,
  variant = 'primary',
  children,
}: TreeBranchProps) => {
  // Branch colors by age/variant
  const getColors = () => {
    switch (variant) {
      case 'primary': // Main structural branches - darker, mature bark
        return {
          base: '#3A2F2F',
          dark: '#2A1F1F',
          highlight: '#5A4A4A',
          shadow: 'rgba(0, 0, 0, 0.3)',
        };
      case 'secondary': // Medium branches
        return {
          base: '#4A3838',
          dark: '#3A2828',
          highlight: '#6A5050',
          shadow: 'rgba(0, 0, 0, 0.25)',
        };
      case 'young': // New growth - greener, smoother
        return {
          base: '#5A4F40',
          dark: '#4A3F30',
          highlight: '#7A6A55',
          shadow: 'rgba(0, 0, 0, 0.2)',
        };
    }
  };
  
  const colors = getColors();
  
  // Calculate path for branch
  const pathD = `M ${start[0]} ${start[1]} C ${control1[0]} ${control1[1]}, ${control2[0]} ${control2[1]}, ${end[0]} ${end[1]}`;
  
  // Calculate length for stroke-dasharray animation
  const estimatedLength = Math.hypot(end[0] - start[0], end[1] - start[1]) * 1.5;
  
  // Create tapered stroke by using multiple paths with varying thickness
  const createTaperedPath = () => {
    const segments = 8;
    const paths = [];
    
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * growth;
      const thickness = startThickness + (endThickness - startThickness) * (i / segments);
      const opacity = 1 - (i / segments) * 0.2; // Slight fade toward tips
      
      // Calculate point along Bezier curve using de Casteljau's algorithm
      const getBezierPoint = (t: number) => {
        const x = Math.pow(1 - t, 3) * start[0] +
                  3 * Math.pow(1 - t, 2) * t * control1[0] +
                  3 * (1 - t) * Math.pow(t, 2) * control2[0] +
                  Math.pow(t, 3) * end[0];
        const y = Math.pow(1 - t, 3) * start[1] +
                  3 * Math.pow(1 - t, 2) * t * control1[1] +
                  3 * (1 - t) * Math.pow(t, 2) * control2[1] +
                  Math.pow(t, 3) * end[1];
        return [x, y];
      };
      
      const segmentStart = getBezierPoint(t);
      const segmentEnd = getBezierPoint(Math.min(t + 1 / segments, 1) * growth);
      
      paths.push(
        <line
          key={`segment-${i}`}
          x1={segmentStart[0]}
          y1={segmentStart[1]}
          x2={segmentEnd[0]}
          y2={segmentEnd[1]}
          stroke={colors.base}
          strokeWidth={thickness}
          strokeLinecap="round"
          opacity={opacity}
        />
      );
    }
    
    return paths;
  };
  
  return (
    <g>
      <defs>
        {/* Bark texture gradient - vertical */}
        <linearGradient id={`bark-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.dark} />
          <stop offset="20%" stopColor={colors.base} />
          <stop offset="60%" stopColor={colors.highlight} />
          <stop offset="80%" stopColor={colors.base} />
          <stop offset="100%" stopColor={colors.shadow} />
        </linearGradient>
        
        {/* Subtle bark texture pattern */}
        <pattern id={`bark-texture-${id}`} x="0" y="0" width="4" height="8" patternUnits="userSpaceOnUse">
          <line x1="1" y1="0" x2="1" y2="8" stroke={colors.dark} strokeWidth="0.5" opacity="0.3" />
          <line x1="3" y1="2" x2="3" y2="8" stroke={colors.dark} strokeWidth="0.3" opacity="0.2" />
        </pattern>
      </defs>
      
      {/* Shadow path - slightly offset */}
      <path
        d={pathD}
        fill="none"
        stroke={colors.shadow}
        strokeWidth={startThickness + 1}
        strokeLinecap="round"
        opacity="0.3"
        transform="translate(1, 2)"
        style={{
          strokeDasharray: growth < 1 ? estimatedLength : undefined,
          strokeDashoffset: growth < 1 ? estimatedLength * (1 - growth) : undefined,
          transition: 'stroke-dashoffset 0.8s ease-out',
        }}
      />
      
      {/* Main branch path - base color */}
      <path
        d={pathD}
        fill="none"
        stroke={colors.base}
        strokeWidth={startThickness}
        strokeLinecap="round"
        style={{
          strokeDasharray: growth < 1 ? estimatedLength : undefined,
          strokeDashoffset: growth < 1 ? estimatedLength * (1 - growth) : undefined,
          transition: 'stroke-dashoffset 0.8s ease-out',
        }}
      />
      
      {/* Tapered segments for thickness variation */}
      {createTaperedPath()}
      
      {/* Highlight path - creates roundness/dimension */}
      <path
        d={pathD}
        fill="none"
        stroke={colors.highlight}
        strokeWidth={startThickness * 0.35}
        strokeLinecap="round"
        opacity="0.6"
        transform="translate(-0.5, -0.5)"
        style={{
          strokeDasharray: growth < 1 ? estimatedLength * 0.7 : undefined,
          strokeDashoffset: growth < 1 ? estimatedLength * 0.7 * (1 - growth) : undefined,
          transition: 'stroke-dashoffset 0.8s ease-out 0.1s',
        }}
      />
      
      {/* Bark texture overlay */}
      {growth > 0.5 && (
        <path
          d={pathD}
          fill="none"
          stroke={`url(#bark-texture-${id})`}
          strokeWidth={startThickness * 0.9}
          strokeLinecap="round"
          opacity="0.4"
        />
      )}
      
      {/* Dark crevices for aged bark (primary branches only) */}
      {variant === 'primary' && growth > 0.7 && (
        <>
          {[0.2, 0.5, 0.8].map((position, i) => {
            const t = position;
            const x = Math.pow(1 - t, 3) * start[0] +
                      3 * Math.pow(1 - t, 2) * t * control1[0] +
                      3 * (1 - t) * Math.pow(t, 2) * control2[0] +
                      Math.pow(t, 3) * end[0];
            const y = Math.pow(1 - t, 3) * start[1] +
                      3 * Math.pow(1 - t, 2) * t * control1[1] +
                      3 * (1 - t) * Math.pow(t, 2) * control2[1] +
                      Math.pow(t, 3) * end[1];
            
            return (
              <ellipse
                key={`crevice-${i}`}
                cx={x + (i % 2 === 0 ? 1 : -1)}
                cy={y}
                rx="1.5"
                ry="0.8"
                fill={colors.dark}
                opacity="0.4"
                transform={`rotate(${i * 30} ${x} ${y})`}
              />
            );
          })}
        </>
      )}
      
      {/* Child branches (blossoms, leaves, or sub-branches) */}
      {children}
    </g>
  );
});

TreeBranch.displayName = 'TreeBranch';
