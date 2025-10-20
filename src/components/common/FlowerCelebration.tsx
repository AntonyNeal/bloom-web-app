/**
 * Flower Celebration Component
 * 
 * Celebration animation with three Bloom flowers being blown upwards
 * Replaces the transition delay after qualification check
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface FlowerCelebrationProps {
  onComplete: () => void;
  isMobile: boolean;
}

export const FlowerCelebration = memo(({ onComplete, isMobile }: FlowerCelebrationProps) => {
  // Generate random flower positions and properties
  const flowers = useMemo(() => {
    const flowerCount = isMobile ? 15 : 25;
    const types = ['tier1', 'tier2', 'tier3']; // cherry blossom, rose, daisy
    
    return Array.from({ length: flowerCount }, (_, i) => ({
      id: i,
      type: types[i % 3],
      startX: Math.random() * 100, // Start position across screen width
      drift: (Math.random() - 0.5) * 30, // Horizontal drift during rise
      delay: Math.random() * 0.8, // Stagger the start times
      duration: 2.5 + Math.random() * 1.5, // Variation in rise speed
      rotation: Math.random() * 360, // Initial rotation
      spin: (Math.random() - 0.5) * 720, // Spin during rise
      size: 0.6 + Math.random() * 0.8, // Size variation
    }));
  }, [isMobile]);

  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => {
        // Call onComplete after 3 seconds total (time for flowers to rise)
        setTimeout(onComplete, 3000);
      }}
    >
      {flowers.map((flower) => (
        <motion.div
          key={flower.id}
          className="absolute"
          style={{
            left: `${flower.startX}%`,
            bottom: '-10%',
          }}
          initial={{
            y: 0,
            x: 0,
            opacity: 0,
            rotate: flower.rotation,
            scale: flower.size,
          }}
          animate={{
            y: [0, -window.innerHeight * 1.2],
            x: [0, flower.drift],
            opacity: [0, 1, 1, 0.8, 0],
            rotate: [flower.rotation, flower.rotation + flower.spin],
          }}
          transition={{
            duration: flower.duration,
            delay: flower.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {flower.type === 'tier1' && <CherryBlossomSVG size={isMobile ? 40 : 56} />}
          {flower.type === 'tier2' && <RoseSVG size={isMobile ? 44 : 60} />}
          {flower.type === 'tier3' && <DaisySVG size={isMobile ? 42 : 58} />}
        </motion.div>
      ))}
    </motion.div>
  );
});

FlowerCelebration.displayName = 'FlowerCelebration';

// Simplified SVG components for the celebration (lightweight versions)

const CherryBlossomSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <defs>
      <radialGradient id="pinkGrad">
        <stop offset="0%" stopColor="#FFFBFC" />
        <stop offset="50%" stopColor="#FFD4E0" />
        <stop offset="100%" stopColor="#FFA8BA" />
      </radialGradient>
    </defs>
    {[0, 72, 144, 216, 288].map((angle, i) => {
      const x = 16 + Math.cos((angle * Math.PI) / 180) * 9;
      const y = 16 + Math.sin((angle * Math.PI) / 180) * 9;
      return (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="5.5"
          ry="8"
          fill="url(#pinkGrad)"
          transform={`rotate(${angle} ${x} ${y})`}
        />
      );
    })}
    <circle cx="16" cy="16" r="3" fill="#FFE5ED" />
  </svg>
);

const RoseSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <defs>
      <radialGradient id="purpleGrad">
        <stop offset="0%" stopColor="#F0E5F9" />
        <stop offset="50%" stopColor="#C7ABD9" />
        <stop offset="100%" stopColor="#9B7BB0" />
      </radialGradient>
    </defs>
    {/* Outer petals */}
    {[0, 60, 120, 180, 240, 300].map((angle, i) => {
      const x = 20 + Math.cos((angle * Math.PI) / 180) * 10;
      const y = 20 + Math.sin((angle * Math.PI) / 180) * 10;
      return (
        <ellipse
          key={`outer-${i}`}
          cx={x}
          cy={y}
          rx="6"
          ry="8.5"
          fill="url(#purpleGrad)"
          transform={`rotate(${angle} ${x} ${y})`}
        />
      );
    })}
    {/* Inner petals */}
    {[30, 90, 150, 210, 270, 330].map((angle, i) => {
      const x = 20 + Math.cos((angle * Math.PI) / 180) * 5.5;
      const y = 20 + Math.sin((angle * Math.PI) / 180) * 5.5;
      return (
        <ellipse
          key={`inner-${i}`}
          cx={x}
          cy={y}
          rx="4.5"
          ry="6.5"
          fill="#B18FC7"
          transform={`rotate(${angle} ${x} ${y})`}
        />
      );
    })}
    <circle cx="20" cy="20" r="3" fill="#9B7BB0" />
  </svg>
);

const DaisySVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <defs>
      <radialGradient id="goldenGrad">
        <stop offset="0%" stopColor="#FFE082" />
        <stop offset="50%" stopColor="#FFCA28" />
        <stop offset="100%" stopColor="#FFA000" />
      </radialGradient>
    </defs>
    {/* 12 narrow golden petals */}
    {Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30);
      const x = 20 + Math.cos((angle * Math.PI) / 180) * 11;
      const y = 20 + Math.sin((angle * Math.PI) / 180) * 11;
      return (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="2.5"
          ry="7"
          fill="url(#goldenGrad)"
          transform={`rotate(${angle} ${x} ${y})`}
        />
      );
    })}
    {/* Dark brown center */}
    <circle cx="20" cy="20" r="4.5" fill="#5D4E37" />
    {/* Floret texture */}
    {Array.from({ length: 8 }, (_, i) => {
      const angle = (i * 45);
      const x = 20 + Math.cos((angle * Math.PI) / 180) * 1.5;
      const y = 20 + Math.sin((angle * Math.PI) / 180) * 1.5;
      return <circle key={`floret-${i}`} cx={x} cy={y} r="0.5" fill="#4A3C28" />;
    })}
  </svg>
);
