import { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * Watercolor Blob Component - Studio Ghibli atmosphere (static, no animation)
 * Creates soft, painterly backgrounds
 */
export interface WatercolorBlobProps {
  size: string;
  color: string;
  opacity: number;
  position: React.CSSProperties;
  blur: number;
  borderRadius: string;
}

export const WatercolorBlob = memo(({ 
  size, 
  color, 
  opacity, 
  position, 
  blur, 
  borderRadius, 
}: WatercolorBlobProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: opacity,
        filter: `blur(${blur}px)`,
        borderRadius: borderRadius,
        ...position,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
});
WatercolorBlob.displayName = 'WatercolorBlob';

/**
 * Floating Particle Component - organic drift
 * Creates gentle, animated particles for ambient backgrounds
 */
export interface FloatingParticleProps {
  size: number;
  color: string;
  opacity: number;
  position: React.CSSProperties;
  duration: number;
  delay: number;
  blur?: number;
  xSequence?: number[];
  ySequence?: number[];
}

export const FloatingParticle = memo(({ 
  size, 
  color, 
  opacity, 
  position, 
  duration, 
  delay,
  blur = 3,
  xSequence = [0, 30, -20, 15, 0],
  ySequence = [0, -40, -80, -120, -160],
}: FloatingParticleProps) => {
  // Position can be handled by parent wrapper or applied directly
  const positionStyles = position ? { position: 'absolute' as const, ...position } : {};
  
  return (
    <motion.div
      style={{
        width: size,
        height: size,
        background: color,
        opacity: opacity,
        filter: `blur(${blur}px)`,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0,
        willChange: 'transform',
        ...positionStyles,
      }}
      initial={{ x: xSequence[0], y: ySequence[0], rotate: 0 }}
      animate={{
        x: xSequence,
        y: ySequence,
        rotate: [0, 360],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: 'linear',
        delay: delay,
      }}
    />
  );
});
FloatingParticle.displayName = 'FloatingParticle';
