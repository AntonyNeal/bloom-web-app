/**
 * Ghibli Animation Debugger
 * 
 * A step-by-step animation preview for artistic review.
 * Shows each animation layer in isolation with controls to:
 * - Play/pause individual animations
 * - Adjust speed (0.1x to 2x)
 * - Step through keyframes
 * - Toggle layers on/off
 * 
 * For artistic director review only - not for production.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Design tokens matching Bloom
const colors = {
  cream: '#FAF8F3',
  sage: '#7B8D7B',
  sageDark: '#5A6B5A',
  sageLight: '#9BAA9B',
  terracotta: '#D4A59A',
  terracottaLight: '#E8C4BB',
  charcoal: '#3A3A3A',
  charcoalLight: '#5A5A5A',
  lavender: '#E8E2F0',
  lavenderLight: '#F3F0F7',
  white: '#FFFFFF',
  sprout: {
    stem: '#6B8E4E',
    leaf: '#8BC34A',
    leafLight: '#AED581',
  },
  sky: {
    dawn: 'linear-gradient(180deg, #FFE4D4 0%, #FFF5ED 50%, #E8F4F8 100%)',
    morning: 'linear-gradient(180deg, #E8F1F8 0%, #F5F8FA 50%, #FAFAF8 100%)',
    afternoon: 'linear-gradient(180deg, #DCE8F5 0%, #F0F4F8 50%, #FAFBF8 100%)',
    evening: 'linear-gradient(180deg, #FFD5C2 0%, #FFE8DB 50%, #F5EDE8 100%)',
    night: 'linear-gradient(180deg, #C5D4E8 0%, #D8E2EE 50%, #E8EDF2 100%)',
  },
  earth: {
    deep: '#8B7355',
    mid: '#A08B6E',
    light: '#C4B49A',
    highlight: '#D9CCBA',
  },
  blossom: {
    pale: '#FFE8E8',
    light: '#FFD5D5',
    mid: '#FFB5B5',
    rich: '#FF9999',
    deep: '#FF7777',
  },
};

interface AnimationLayer {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  speed: number;
  currentStep: number;
  totalSteps: number;
}

interface GhibliAnimationDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GhibliAnimationDebugger: React.FC<GhibliAnimationDebuggerProps> = ({
  isOpen,
  onClose,
}) => {
  const [layers, setLayers] = useState<AnimationLayer[]>([
    { id: 'sky', name: 'Sky Gradient', description: 'Time-of-day ambient lighting', icon: '🌅', enabled: true, speed: 1, currentStep: 0, totalSteps: 5 },
    { id: 'particles', name: 'Floating Particles', description: 'Pollen, dust motes, magical sparkles', icon: '✨', enabled: true, speed: 1, currentStep: 0, totalSteps: 4 },
    { id: 'petals', name: 'Falling Petals', description: 'Gentle sakura petal drift', icon: '🌸', enabled: true, speed: 1, currentStep: 0, totalSteps: 4 },
    { id: 'plant-sway', name: 'Plant Sway', description: 'Gentle wind-responsive movement', icon: '🌱', enabled: true, speed: 1, currentStep: 0, totalSteps: 3 },
    { id: 'growth', name: 'Growth Animation', description: 'Plant evolves with sessions', icon: '🌿', enabled: true, speed: 1, currentStep: 0, totalSteps: 6 },
    { id: 'hover', name: 'Hover Effects', description: 'Interactive sparkles and glows', icon: '👆', enabled: true, speed: 1, currentStep: 0, totalSteps: 3 },
  ]);
  
  const [activePreview, setActivePreview] = useState<string | null>('sky');
  const [globalSpeed, setGlobalSpeed] = useState(0.5); // Slower for review
  const [isPlaying, setIsPlaying] = useState(true);
  
  const toggleLayer = useCallback((id: string) => {
    setLayers(prev => prev.map(l => 
      l.id === id ? { ...l, enabled: !l.enabled } : l
    ));
  }, []);
  
  const stepLayer = useCallback((id: string, direction: 1 | -1) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== id) return l;
      const newStep = (l.currentStep + direction + l.totalSteps) % l.totalSteps;
      return { ...l, currentStep: newStep };
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {/* Control Panel - Left Side */}
        <div
          style={{
            width: '360px',
            backgroundColor: colors.charcoal,
            color: colors.white,
            padding: '24px',
            overflowY: 'auto',
            borderRight: `1px solid ${colors.charcoalLight}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              🎬 Animation Review
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: colors.charcoalLight,
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              ×
            </button>
          </div>
          
          <p style={{ fontSize: '13px', color: colors.sageLight, marginBottom: '24px', lineHeight: 1.5 }}>
            Review each Ghibli-inspired animation layer individually. 
            Click a layer to preview it in isolation.
          </p>
          
          {/* Global Controls */}
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            borderRadius: '12px', 
            padding: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Global Speed</span>
              <span style={{ fontSize: '12px', color: colors.sageLight }}>{globalSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={globalSpeed}
              onChange={(e) => setGlobalSpeed(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: colors.sage }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: isPlaying ? colors.sage : 'transparent',
                  border: `1px solid ${colors.sage}`,
                  borderRadius: '8px',
                  color: isPlaying ? colors.white : colors.sage,
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {isPlaying ? '⏸ Pause All' : '▶️ Play All'}
              </button>
            </div>
          </div>
          
          {/* Layer Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => setActivePreview(layer.id)}
                style={{
                  backgroundColor: activePreview === layer.id 
                    ? 'rgba(123, 141, 123, 0.3)' 
                    : 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  border: activePreview === layer.id 
                    ? `2px solid ${colors.sage}` 
                    : '2px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{layer.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{layer.name}</div>
                    <div style={{ fontSize: '11px', color: colors.sageLight }}>{layer.description}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLayer(layer.id); }}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: layer.enabled ? colors.sage : colors.charcoalLight,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: colors.white,
                        position: 'absolute',
                        top: '3px',
                        left: layer.enabled ? '23px' : '3px',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
                
                {activePreview === layer.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); stepLayer(layer.id, -1); }}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: `1px solid ${colors.sage}`,
                          backgroundColor: 'transparent',
                          color: colors.sage,
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ◀
                      </button>
                      <div style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: colors.sageLight }}>
                        Step {layer.currentStep + 1} / {layer.totalSteps}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); stepLayer(layer.id, 1); }}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: `1px solid ${colors.sage}`,
                          backgroundColor: 'transparent',
                          color: colors.sage,
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ▶
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {Array.from({ length: layer.totalSteps }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            backgroundColor: i <= layer.currentStep ? colors.sage : 'rgba(255,255,255,0.2)',
                            transition: 'background-color 0.2s',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Preview Area - Right Side */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.cream }}>
          {/* Preview Header */}
          <div style={{ 
            padding: '16px 24px', 
            borderBottom: `1px solid ${colors.lavender}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '24px' }}>
              {layers.find(l => l.id === activePreview)?.icon}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: colors.charcoal, fontWeight: 600 }}>
                {layers.find(l => l.id === activePreview)?.name}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: colors.charcoalLight }}>
                {layers.find(l => l.id === activePreview)?.description}
              </p>
            </div>
          </div>
          
          {/* Animation Preview Canvas */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <AnimationPreview 
              layerId={activePreview || 'sky'} 
              layer={layers.find(l => l.id === activePreview)!}
              globalSpeed={globalSpeed}
              isPlaying={isPlaying}
            />
          </div>
          
          {/* Preview Footer - Notes for AD */}
          <div style={{ 
            padding: '16px 24px', 
            backgroundColor: colors.lavenderLight,
            borderTop: `1px solid ${colors.lavender}`,
          }}>
            <p style={{ margin: 0, fontSize: '12px', color: colors.charcoalLight, fontStyle: 'italic' }}>
              💡 <strong>Note for review:</strong> Each animation can be enabled/disabled independently. 
              In production, all enabled animations play simultaneously at normal speed (1x).
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Individual animation previews
const AnimationPreview: React.FC<{
  layerId: string;
  layer: AnimationLayer;
  globalSpeed: number;
  isPlaying: boolean;
}> = ({ layerId, layer, globalSpeed, isPlaying }) => {
  const speed = globalSpeed * layer.speed;
  const step = layer.currentStep;
  
  switch (layerId) {
    case 'sky':
      return <SkyGradientPreview step={step} speed={speed} isPlaying={isPlaying} />;
    case 'particles':
      return <ParticlesPreview step={step} speed={speed} isPlaying={isPlaying} />;
    case 'petals':
      return <PetalsPreview step={step} speed={speed} isPlaying={isPlaying} />;
    case 'plant-sway':
      return <PlantSwayPreview step={step} speed={speed} isPlaying={isPlaying} />;
    case 'growth':
      return <GrowthPreview step={step} speed={speed} isPlaying={isPlaying} />;
    case 'hover':
      return <HoverEffectsPreview step={step} speed={speed} isPlaying={isPlaying} />;
    default:
      return <div>Select a layer to preview</div>;
  }
};

// === SKY GRADIENT PREVIEW ===
const SkyGradientPreview: React.FC<{ step: number; speed: number; isPlaying: boolean }> = ({ step, speed, isPlaying }) => {
  const times = ['dawn', 'morning', 'afternoon', 'evening', 'night'] as const;
  const timeLabels = ['🌅 Dawn (5-7am)', '☀️ Morning (7am-12pm)', '🌤️ Afternoon (12-5pm)', '🌇 Evening (5-8pm)', '🌙 Night (8pm-5am)'];
  
  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <div
        style={{
          height: '300px',
          borderRadius: '16px',
          background: colors.sky[times[step]],
          transition: isPlaying ? `background ${3 / speed}s ease` : 'none',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Horizon line */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(139,115,85,0.3), transparent)',
        }} />
        {/* Ground */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: `linear-gradient(to top, ${colors.earth.deep}, ${colors.earth.light})`,
          borderRadius: '0 0 16px 16px',
        }} />
        <span style={{ 
          fontSize: '14px', 
          color: colors.charcoal, 
          fontWeight: 500,
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '8px 16px',
          borderRadius: '20px',
          position: 'relative',
          zIndex: 1,
        }}>
          {timeLabels[step]}
        </span>
      </div>
    </div>
  );
};

// === PARTICLES PREVIEW ===
const ParticlesPreview: React.FC<{ step: number; speed: number; isPlaying: boolean }> = ({ step, speed, isPlaying }) => {
  // Pre-generate random positions to avoid calling Math.random during render
  const particlePositions = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      x: 100 + (((i * 17) % 100) / 100) * 400,
      y: 50 + (((i * 31) % 100) / 100) * 200,
    })), []);
  
  const particleTypes = [
    { name: 'None (empty state)', count: 0 },
    { name: 'Light dust motes', count: 5 },
    { name: 'Golden pollen', count: 10 },
    { name: 'Magical sparkles', count: 20 },
  ];
  const current = particleTypes[step];
  
  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <div
        style={{
          height: '300px',
          borderRadius: '16px',
          background: colors.sky.morning,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Particles */}
        {isPlaying && Array.from({ length: current.count }).map((_, i) => {
          const isGolden = i % 3 === 0;
          const delay = (i * 0.5) % 4;
          const pos = particlePositions[i % particlePositions.length];
          return (
            <motion.div
              key={i}
              initial={{ 
                x: pos.x,
                y: pos.y,
                opacity: 0,
              }}
              animate={{ 
                y: [null, -20, 20, -10, 10, 0],
                x: [null, -10, 15, -5, 8, 0],
                opacity: [0, 0.8, 0.6, 0.9, 0.5, 0],
              }}
              transition={{
                duration: 6 / speed,
                delay: delay / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                width: isGolden ? '8px' : '4px',
                height: isGolden ? '8px' : '4px',
                borderRadius: '50%',
                backgroundColor: isGolden ? '#FFD700' : 'rgba(255,255,255,0.8)',
                boxShadow: isGolden 
                  ? '0 0 10px rgba(255,215,0,0.5)' 
                  : '0 0 6px rgba(255,255,255,0.5)',
              }}
            />
          );
        })}
        
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 500,
          color: colors.charcoal,
        }}>
          {current.name} ({current.count} particles)
        </div>
      </div>
    </div>
  );
};

// === PETALS PREVIEW ===
const PetalsPreview: React.FC<{ step: number; speed: number; isPlaying: boolean }> = ({ step, speed, isPlaying }) => {
  // Pre-generate petal animation values to avoid calling Math.random during render
  const petalAnimations = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      startX: 50 + (((i * 37) % 100) / 100) * 500,
      drift: (((i * 53) % 100) / 100 - 0.5) * 100,
      delay: ((i * 19) % 100) / 100 * 3,
      duration: 4 + (((i * 41) % 100) / 100) * 2,
    })), []);
  
  const petalStates = [
    { name: 'No petals (calm)', count: 0, intensity: 0 },
    { name: 'Gentle drift', count: 4, intensity: 0.3 },
    { name: 'Light breeze', count: 8, intensity: 0.6 },
    { name: 'Abundant fall', count: 16, intensity: 1 },
  ];
  const current = petalStates[step];
  
  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <div
        style={{
          height: '300px',
          borderRadius: '16px',
          background: colors.sky.morning,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Falling Petals */}
        {isPlaying && Array.from({ length: current.count }).map((_, i) => {
          const anim = petalAnimations[i % petalAnimations.length];
          const { startX, drift, delay, duration } = anim;
          
          return (
            <motion.div
              key={i}
              initial={{ 
                x: startX,
                y: -20,
                rotate: 0,
                opacity: 0.8,
              }}
              animate={{ 
                x: [startX, startX + drift/2, startX + drift],
                y: [-20, 150, 320],
                rotate: [0, 180, 360],
                opacity: [0.8, 0.6, 0],
              }}
              transition={{
                duration: duration / speed,
                delay: delay / speed,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                width: '12px',
                height: '10px',
                background: `linear-gradient(135deg, ${colors.blossom.light}, ${colors.blossom.mid})`,
                borderRadius: '50% 0 50% 50%',
                boxShadow: '0 2px 4px rgba(255,150,150,0.3)',
              }}
            />
          );
        })}
        
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 500,
          color: colors.charcoal,
        }}>
          🌸 {current.name}
        </div>
      </div>
    </div>
  );
};

// === PLANT SWAY PREVIEW ===
const PlantSwayPreview: React.FC<{ step: number; speed: number; isPlaying: boolean }> = ({ step, speed, isPlaying }) => {
  const swayModes = [
    { name: 'Still (no wind)', angle: 0, duration: 0 },
    { name: 'Gentle breeze', angle: 3, duration: 4 },
    { name: 'Soft wind', angle: 6, duration: 3 },
  ];
  const current = swayModes[step];
  
  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <div
        style={{
          height: '300px',
          borderRadius: '16px',
          background: `linear-gradient(180deg, ${colors.sky.morning.replace('linear-gradient(180deg, ', '').replace(')', '')}`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {/* Ground */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: `linear-gradient(to top, ${colors.earth.deep}, ${colors.earth.light})`,
          borderRadius: '0 0 16px 16px',
        }} />
        
        {/* Plant */}
        <motion.svg
          width="120"
          height="200"
          viewBox="0 0 120 200"
          style={{ 
            position: 'relative',
            bottom: '40px',
            transformOrigin: 'bottom center',
          }}
          animate={isPlaying && current.duration > 0 ? {
            rotate: [-current.angle, current.angle, -current.angle],
          } : {}}
          transition={{
            duration: current.duration / speed,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Pot */}
          <path d="M40 170 L45 200 L75 200 L80 170 Z" fill={colors.terracotta} />
          <ellipse cx="60" cy="170" rx="22" ry="5" fill={colors.terracottaLight} />
          
          {/* Stem */}
          <path d="M60 170 Q58 130 60 80" stroke={colors.sprout.stem} strokeWidth="4" fill="none" />
          
          {/* Leaves */}
          <ellipse cx="48" cy="120" rx="15" ry="8" fill={colors.sprout.leaf} transform="rotate(-30 48 120)" />
          <ellipse cx="72" cy="110" rx="15" ry="8" fill={colors.sprout.leafLight} transform="rotate(25 72 110)" />
          <ellipse cx="55" cy="90" rx="12" ry="6" fill={colors.sprout.leaf} transform="rotate(-15 55 90)" />
        </motion.svg>
        
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 500,
          color: colors.charcoal,
          zIndex: 10,
        }}>
          🍃 {current.name}
        </div>
      </div>
    </div>
  );
};

// === GROWTH PREVIEW ===
const GrowthPreview: React.FC<{ step: number; speed: number; isPlaying: boolean }> = ({ step, speed, isPlaying }) => {
  const growthStages = [
    { name: 'Seed', scale: 0.2, description: 'Just planted' },
    { name: 'Sprout', scale: 0.35, description: 'First growth' },
    { name: 'Seedling', scale: 0.5, description: 'Developing' },
    { name: 'Young plant', scale: 0.7, description: 'Establishing' },
    { name: 'Growing', scale: 0.85, description: 'Thriving' },
    { name: 'Flourishing', scale: 1, description: 'Full bloom' },
  ];
  const current = growthStages[step];
  
  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <div
        style={{
          height: '300px',
          borderRadius: '16px',
          background: colors.sky.morning,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {/* Ground */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: `linear-gradient(to top, ${colors.earth.deep}, ${colors.earth.light})`,
          borderRadius: '0 0 16px 16px',
        }} />
        
        {/* Growing Plant */}
        <motion.div
          animate={isPlaying ? { scale: current.scale } : {}}
          transition={{ duration: 1 / speed, ease: 'easeOut' }}
          style={{
            transformOrigin: 'bottom center',
            position: 'relative',
            bottom: '40px',
          }}
        >
          <svg width="120" height="180" viewBox="0 0 120 180">
            {/* Pot */}
            <path d="M40 140 L45 170 L75 170 L80 140 Z" fill={colors.terracotta} />
            <ellipse cx="60" cy="140" rx="22" ry="5" fill={colors.terracottaLight} />
            
            {/* Stem - grows taller */}
            <path d="M60 140 Q58 90 60 40" stroke={colors.sprout.stem} strokeWidth="4" fill="none" />
            
            {/* Leaves - appear with growth */}
            {step >= 1 && <ellipse cx="48" cy="100" rx="15" ry="8" fill={colors.sprout.leaf} transform="rotate(-30 48 100)" />}
            {step >= 2 && <ellipse cx="72" cy="90" rx="15" ry="8" fill={colors.sprout.leafLight} transform="rotate(25 72 90)" />}
            {step >= 3 && <ellipse cx="52" cy="70" rx="12" ry="6" fill={colors.sprout.leaf} transform="rotate(-20 52 70)" />}
            {step >= 4 && <ellipse cx="68" cy="60" rx="12" ry="6" fill={colors.sprout.leafLight} transform="rotate(15 68 60)" />}
            {step >= 5 && (
              <>
                <circle cx="60" cy="35" r="12" fill={colors.blossom.mid} />
                <circle cx="60" cy="35" r="6" fill={colors.blossom.pale} />
              </>
            )}
          </svg>
        </motion.div>
        
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 500,
          color: colors.charcoal,
          zIndex: 10,
        }}>
          🌱 {current.name} — {current.description}
        </div>
      </div>
    </div>
  );
};

// === HOVER EFFECTS PREVIEW ===
const HoverEffectsPreview: React.FC<{ step: number; speed: number; isPlaying: boolean }> = ({ step, speed, isPlaying }) => {
  const [isHovering, setIsHovering] = useState(false);
  const hoverModes = [
    { name: 'None (default)', glow: false, sparkles: false },
    { name: 'Soft glow', glow: true, sparkles: false },
    { name: 'Sparkles + glow', glow: true, sparkles: true },
  ];
  const current = hoverModes[step];
  
  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <div
        style={{
          height: '300px',
          borderRadius: '16px',
          background: colors.sky.morning,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Interactive Button */}
        <motion.button
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          whileHover={current.glow ? { scale: 1.05 } : {}}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '20px 40px',
            backgroundColor: colors.sage,
            color: colors.white,
            border: 'none',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            position: 'relative',
            boxShadow: isHovering && current.glow 
              ? '0 0 30px rgba(123,141,123,0.5), 0 8px 24px rgba(123,141,123,0.3)'
              : '0 4px 12px rgba(123,141,123,0.2)',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          🌿 Enter Therapy Room
          
          {/* Sparkles on hover */}
          {isHovering && current.sparkles && isPlaying && (
            <>
              {[...Array(6)].map((_, i) => {
                // Use deterministic positions based on index
                const sparkleX = (((i * 47) % 100) / 100 - 0.5) * 100;
                const sparkleY = (((i * 29) % 100) / 100 - 0.5) * 60 - 30;
                return (
                <motion.div
                  key={i}
                  initial={{ 
                    x: 0, y: 0, 
                    scale: 0, 
                    opacity: 1 
                  }}
                  animate={{ 
                    x: sparkleX,
                    y: sparkleY,
                    scale: [0, 1.5, 0],
                    opacity: [1, 0.8, 0],
                  }}
                  transition={{
                    duration: 0.8 / speed,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#FFD700',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px rgba(255,215,0,0.8)',
                    pointerEvents: 'none',
                  }}
                />
              )})}
            </>
          )}
        </motion.button>
        
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 500,
          color: colors.charcoal,
        }}>
          👆 {current.name} — hover to test
        </div>
      </div>
    </div>
  );
};

export default GhibliAnimationDebugger;
