/**
 * BLOOM DESIGN CHECK
 * Before committing, ask:
 * 1. Does this feel handmade or mass-produced?
 * 2. Would Miyazaki spend time on this detail?
 * 3. Does this feel lived-in or sterile?
 * 4. Is this loud or quiet? (Ghibli's magic is quiet)
 * 5. Does this respect the user's humanity?
 * 6. Would this work in Kiki's Delivery Service?
 */

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GraduationCap, AlertCircle, CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

// Mobile detection hook for performance optimizations
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

interface QualificationCheckProps {
  onEligible: () => void;
}

// Watercolor Blob Component - Studio Ghibli atmosphere
interface WatercolorBlobProps {
  size: string;
  color: string;
  opacity: number;
  position: React.CSSProperties;
  blur: number;
  borderRadius: string;
  animationDuration: number;
  rotateSequence?: number[];
  scaleSequence?: number[];
}

const WatercolorBlob = ({ 
  size, 
  color, 
  opacity, 
  position, 
  blur, 
  borderRadius, 
  animationDuration,
  rotateSequence = [0, 10, -5, 0],
  scaleSequence = [1, 1.05, 0.98, 1],
}: WatercolorBlobProps) => (
  <motion.div
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
    animate={{
      rotate: rotateSequence,
      scale: scaleSequence,
    }}
    transition={{
      duration: animationDuration,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// Floating Particle Component - organic drift
interface FloatingParticleProps {
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

const FloatingParticle = ({ 
  size, 
  color, 
  opacity, 
  position, 
  duration, 
  delay,
  blur = 3,
  xSequence = [0, 30, -20, 15, 0],
  ySequence = [0, -40, -80, -120, -160],
}: FloatingParticleProps) => (
  <motion.div
    style={{
      position: 'absolute',
      width: size,
      height: size,
      background: color,
      opacity: opacity,
      filter: `blur(${blur}px)`,
      borderRadius: '50%',
      ...position,
      pointerEvents: 'none',
      zIndex: 0,
    }}
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

// Bloom/Ghibli design tokens
const bloomStyles = {
  colors: {
    creamBase: '#FAF7F2',
    charcoalText: '#3A3A3A',
    mutedText: '#5A5A5A',
    eucalyptusSage: '#6B8E7F',
    softFern: '#8FA892',
    honeyAmber: '#D9B380',
    clayTerracotta: '#C89B7B',
  },
  ease: {
    gentle: [0.25, 0.46, 0.45, 0.94],
    settle: [0.34, 1.56, 0.64, 1],
    exhale: [0.16, 1, 0.3, 1],
  }
};

export function QualificationCheck({ onEligible }: QualificationCheckProps) {
  const [isRegisteredPsychologist, setIsRegisteredPsychologist] = useState(false);
  const [hasPhd, setHasPhd] = useState(false);
  const [yearsRegistered, setYearsRegistered] = useState<number>(0);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  
  // Phase 3: Focus state tracking for interactions
  const [isYearsInputFocused, setIsYearsInputFocused] = useState(false);

  // Phase 2: Mobile-first entrance animations
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();

  // Animation configuration based on device and user preferences
  const animationConfig = {
    // Particle count optimization
    particleCount: isMobile ? 6 : 10,
    
    // Blob blur optimization
    blobBlur: isMobile ? [100, 110, 120] : [150, 160, 180],
    
    // Timing configuration
    blobDuration: shouldReduceMotion ? 0.1 : (isMobile ? 0.4 : 0.6),
    blobStagger: shouldReduceMotion ? 0 : (isMobile ? 0.1 : 0.15),
    
    particleDuration: shouldReduceMotion ? 0.1 : (isMobile ? 0.3 : 0.5),
    particleDelay: shouldReduceMotion ? 0 : 0.3,
    
    cardDelay: shouldReduceMotion ? 0 : (isMobile ? 0.6 : 0.8),
    cardDuration: shouldReduceMotion ? 0.1 : (isMobile ? 0.4 : 0.6),
    
    contentDelay: shouldReduceMotion ? 0 : (isMobile ? 0.8 : 1.0),
    contentDuration: shouldReduceMotion ? 0.1 : (isMobile ? 0.2 : 0.3),
    contentStagger: shouldReduceMotion ? 0 : (isMobile ? 0.05 : 0.08),
    
    // Easing - use "easeOut" string for Framer Motion compatibility
    bounceEasing: 'easeOut' as const,
  };

  // Stable random values for floating seeds (prevents recalculation on each render)
  const seedValues = useMemo(() => {
    const count = isMobile ? 15 : 25;
    // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/purity
    return Array.from({ length: count }, (_, i) => {
      const startX = (i / count) * 100 + (Math.random() - 0.5) * 20;
      return {
        startX,
        endX: startX + (Math.random() - 0.5) * 30,
        duration: 10 + Math.random() * 8,
        delay: Math.random() * 2,
        width: 2 + Math.random() * 3,
        height: 2 + Math.random() * 3,
        blur: 0.5 + Math.random() * 0.5,
      };
    });
  }, [isMobile]);

  // Stable random values for ground wildflowers (prevents recalculation on each render)
  const wildflowerValues = useMemo(() => {
    const count = isMobile ? 12 : 20;
    // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/purity
    return Array.from({ length: count }, () => ({
      stemHeight: 30 + Math.random() * 50,
      flowerSize: 6 + Math.random() * 8,
    }));
  }, [isMobile]);

  const handleCheckEligibility = () => {
    const eligible = isRegisteredPsychologist || hasPhd || yearsRegistered >= 8;
    setIsEligible(eligible);
    
    if (eligible) {
      // Trigger parent callback after showing success message
      // 5 second delay to let the celebration animations complete and user to feel the pride
      setTimeout(() => onEligible(), 5000);
    }
  };

  // Ambient background configuration - Studio Ghibli watercolor atmosphere
  // MASSIVE, DIFFUSE blobs to avoid "grub" look
  // Mobile-optimized blur values for better performance
  const watercolorBlobs = [
    {
      // BLOB 1 - Top Right (Eucalyptus) - MASSIVE & DIFFUSE
      size: '850px',
      color: bloomStyles.colors.eucalyptusSage,
      opacity: 0.08,
      position: { top: '-20%', right: '-10%' },
      blur: animationConfig.blobBlur[0], // 150px desktop, 100px mobile
      borderRadius: '50%', // Perfect circle, heavily blurred
      animationDuration: 60,
      rotateSequence: [0, 2, -1, 0], // Minimal rotation
      scaleSequence: [1, 1.02, 0.99, 1], // Subtle breathing
    },
    {
      // BLOB 2 - Bottom Left (Softer Terracotta) - MASSIVE & DIFFUSE
      size: '950px',
      color: '#D4B5A4', // Softer terracotta
      opacity: 0.06,
      position: { bottom: '-25%', left: '-15%' },
      blur: animationConfig.blobBlur[1], // 160px desktop, 110px mobile
      borderRadius: '50%',
      animationDuration: 75,
      rotateSequence: [0, 2, -1, 0],
      scaleSequence: [1, 1.02, 0.99, 1],
    },
    {
      // BLOB 3 - Center Behind Card (Very Pale Amber) - MASSIVE & DIFFUSE
      size: '750px',
      color: '#E8D5B8', // Very pale amber
      opacity: 0.05,
      position: { top: '25%', left: '50%', transform: 'translateX(-50%)' },
      blur: animationConfig.blobBlur[2], // 180px desktop, 120px mobile
      borderRadius: '50%',
      animationDuration: 90,
      rotateSequence: [0, 2, -1, 0],
      scaleSequence: [1, 1.02, 0.99, 1],
    },
  ];

  // ENHANCED particles - 10 particles with increased visibility
  const floatingParticles = [
    {
      size: 10,
      color: bloomStyles.colors.eucalyptusSage,
      opacity: 0.38,
      position: { top: '15%', left: '20%' },
      duration: 35,
      delay: 0,
      blur: 3,
      xSequence: [0, 35, -18, 22, 0],
      ySequence: [0, -55, -110, -165, -220],
    },
    {
      size: 12,
      color: bloomStyles.colors.honeyAmber,
      opacity: 0.35,
      position: { top: '40%', left: '70%' },
      duration: 42,
      delay: 3,
      blur: 4,
      xSequence: [0, -25, 30, -15, 0],
      ySequence: [0, -55, -110, -165, -220],
    },
    {
      size: 14,
      color: bloomStyles.colors.eucalyptusSage,
      opacity: 0.32,
      position: { top: '60%', left: '15%' },
      duration: 30,
      delay: 7,
      blur: 4,
      xSequence: [0, 28, -22, 18, 0],
      ySequence: [0, -55, -110, -165, -220],
    },
    {
      size: 8,
      color: bloomStyles.colors.honeyAmber,
      opacity: 0.40,
      position: { top: '25%', left: '85%' },
      duration: 45,
      delay: 2,
      blur: 3,
      xSequence: [0, -32, 20, -12, 0],
      ySequence: [0, -55, -110, -165, -220],
    },
    {
      size: 14,
      color: bloomStyles.colors.eucalyptusSage,
      opacity: 0.30,
      position: { top: '75%', left: '45%' },
      duration: 38,
      delay: 9,
      blur: 4,
      xSequence: [0, 25, -28, 15, 0],
      ySequence: [0, -55, -110, -165, -220],
    },
    {
      size: 10,
      color: bloomStyles.colors.honeyAmber,
      opacity: 0.36,
      position: { top: '50%', left: '30%' },
      duration: 40,
      delay: 5,
      blur: 3,
      xSequence: [0, -20, 32, -18, 0],
      ySequence: [0, -55, -110, -165, -220],
    },
    {
      size: 12,
      color: bloomStyles.colors.eucalyptusSage,
      opacity: 0.34,
      position: { top: '35%', left: '50%' },
      duration: 36,
      delay: 12,
      blur: 4,
      xSequence: [0, 30, -25, 20, 0],
      ySequence: [0, -55, -110, -165, -220],
    },
    {
      size: 8,
      color: bloomStyles.colors.honeyAmber,
      opacity: 0.42,
      position: { top: '20%', left: '65%' },
      duration: 33,
      delay: 8,
      blur: 3,
      xSequence: [0, -28, 35, -20, 0],
      ySequence: [0, -55, -110, -165, -220],
    },
    {
      size: 10,
      color: bloomStyles.colors.honeyAmber,
      opacity: 0.37,
      position: { top: '80%', left: '25%' },
      duration: 44,
      delay: 15,
      blur: 3,
      xSequence: [0, 22, -30, 18, 0],
      ySequence: [0, -55, -110, -165, -220],
    },
    {
      size: 12,
      color: '#FAF7F2', // Light cream particle
      opacity: 0.45,
      position: { top: '45%', left: '80%' },
      duration: 39,
      delay: 10,
      blur: 4,
      xSequence: [0, -18, 26, -15, 0],
      ySequence: [0, -55, -110, -165, -220],
    },
  ];

  return (
    <div 
      className="min-h-screen py-12 px-4 relative overflow-hidden"
      style={{ 
        backgroundColor: bloomStyles.colors.creamBase,
      }}
    >
      {/* Subtle paper texture overlay - wabi-sabi imperfection */}
      <div 
        className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5' /%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* PHASE 1 & 2: Studio Ghibli Ambient Background Layer with Entrance Animations */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none" 
        style={{ zIndex: 0 }}
      >
        {/* Stage 1: Three large watercolor wash blobs - staggered fade in */}
        {watercolorBlobs.map((blob, index) => (
          <motion.div
            key={`blob-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: blob.opacity, scale: 1 }}
            transition={{
              duration: animationConfig.blobDuration,
              delay: index * animationConfig.blobStagger,
              ease: 'easeOut',
            }}
            style={{ willChange: 'transform, opacity' }}
            onAnimationComplete={(definition: { opacity?: number }) => {
              if (definition.opacity === blob.opacity) {
                const element = document.querySelector(`[data-blob="${index}"]`);
                if (element instanceof HTMLElement) {
                  element.style.willChange = 'auto';
                }
              }
            }}
          >
            <div data-blob={index}>
              <WatercolorBlob {...blob} />
            </div>
          </motion.div>
        ))}
        
        {/* Stage 2: Floating ambient particles - sequential fade in (mobile: 6 particles, desktop: 10) */}
        {floatingParticles.slice(0, animationConfig.particleCount).map((particle, index) => (
          <motion.div
            key={`particle-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: particle.opacity }}
            transition={{
              duration: animationConfig.particleDuration,
              delay: animationConfig.particleDelay + (index * 0.05),
              ease: 'easeOut',
            }}
            style={{ willChange: 'opacity' }}
            onAnimationComplete={(definition: { opacity?: number }) => {
              if (definition.opacity === particle.opacity) {
                const element = document.querySelector(`[data-particle="${index}"]`);
                if (element instanceof HTMLElement) {
                  element.style.willChange = 'auto';
                }
              }
            }}
          >
            <div data-particle={index}>
              <FloatingParticle {...particle} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stage 3: Main container settles onto page */}
      <motion.div 
        className="mx-auto"
        style={{ maxWidth: '600px', willChange: 'transform, opacity' }}
        initial={{ 
          opacity: 0, 
          y: isMobile ? -15 : -20,
          scale: 0.98
        }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: 1
        }}
        transition={{ 
          duration: animationConfig.cardDuration,
          delay: animationConfig.cardDelay,
          ease: animationConfig.bounceEasing,
        }}
        onAnimationComplete={() => {
          const element = document.querySelector('[data-main-container="true"]');
          if (element instanceof HTMLElement) {
            element.style.willChange = 'auto';
          }
        }}
      >
        <div data-main-container="true">
        {/* Back to Home Button - quiet competence */}
        <motion.a
          href="#/"
          className="mb-8 flex items-center gap-2 font-medium transition-colors group no-underline"
          style={{
            color: bloomStyles.colors.eucalyptusSage,
            fontSize: '15px',
            opacity: 0.95,
          }}
          whileHover={{ 
            x: -4,
            color: bloomStyles.colors.charcoalText,
          }}
          whileTap={{ scale: 0.98 }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
        >
          <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Home
        </motion.a>

        <Card 
          className="border overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FEFDFB 100%)',
            boxShadow: `0 4px 24px rgba(107, 142, 127, 0.08), 0 2px 8px rgba(107, 142, 127, 0.04)`,
            borderRadius: '12px',
            borderColor: `${bloomStyles.colors.eucalyptusSage}1A`, // 10% opacity
            padding: '48px',
          }}
        >
          <CardHeader className="text-center pb-12" style={{ paddingTop: 0 }}>
            {/* Stage 4a: Icon - entrance animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: animationConfig.contentDuration,
                delay: animationConfig.contentDelay,
                ease: 'easeOut',
              }}
            >
              <div 
                className="mx-auto w-20 h-20 rounded-full flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage} 0%, ${bloomStyles.colors.softFern} 100%)`,
                  boxShadow: `0 8px 24px ${bloomStyles.colors.eucalyptusSage}25`,
                  opacity: 0.95, // organic, not perfect
                }}
              >
                <div 
                  className="absolute inset-0 rounded-full opacity-20" 
                  style={{
                    background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                  }}
                />
                <GraduationCap 
                  className="w-10 h-10 relative z-10" 
                  style={{ 
                    color: '#FEFDFB',
                    opacity: 0.98,
                  }} 
                />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.6, 0.9, 0.6],
                    rotate: [0, 5, 0, -5, 0],
                  }}
                  transition={{ 
                    duration: 3.5, 
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles 
                    className="w-4 h-4" 
                    style={{ color: bloomStyles.colors.honeyAmber }}
                  />
                </motion.div>
              </div>
            </motion.div>
            
            {/* Stage 4b: Heading - entrance animation */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: animationConfig.contentDuration,
                delay: animationConfig.contentDelay + (isMobile ? 0.1 : 0.2),
                ease: 'easeOut',
              }}
            >
              <CardTitle 
                className="font-semibold pt-6"
                style={{
                  fontSize: '24px',
                  letterSpacing: '-0.02em',
                  color: bloomStyles.colors.charcoalText,
                  lineHeight: 1.3,
                }}
              >
                Qualification Check
              </CardTitle>
            </motion.div>
            
            {/* Stage 4c: Body text - entrance animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: animationConfig.contentDuration,
                delay: animationConfig.contentDelay + (isMobile ? 0.2 : 0.4),
                ease: 'easeOut',
              }}
            >
              <CardDescription 
                className="pt-3 max-w-md mx-auto"
                style={{
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: bloomStyles.colors.charcoalText,
                  opacity: 0.85,
                }}
              >
                We're looking for experienced psychologists who are passionate about their work. To join us, you'll need:
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent style={{ padding: 0 }}>
            <div style={{ marginTop: '32px' }}>
            {/* Stage 4d: Minimum Requirements Banner - entrance animation */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: animationConfig.contentDuration,
                delay: animationConfig.contentDelay + (isMobile ? 0.3 : 0.6),
                ease: 'easeOut',
              }}
            >
              <div 
                className="relative rounded-xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${bloomStyles.colors.creamBase} 0%, #FFFFFF 50%, ${bloomStyles.colors.eucalyptusSage}08 100%)`,
                  border: `2px solid ${bloomStyles.colors.eucalyptusSage}25`,
                  padding: '24px',
                  boxShadow: `0 2px 12px ${bloomStyles.colors.eucalyptusSage}10`,
                }}
              >
              {/* Decorative organic shape - wabi-sabi asymmetry */}
              <div 
                className="absolute -top-2 -left-2 w-5 h-5 rounded-full blur-sm"
                style={{
                  background: bloomStyles.colors.honeyAmber,
                  opacity: 0.15,
                }}
              />
              <div className="relative z-10">
                <h3 
                  className="font-semibold mb-4 flex items-center gap-2"
                  style={{
                    fontSize: '18px',
                    color: bloomStyles.colors.charcoalText,
                    letterSpacing: '-0.01em',
                  }}
                >
                  <Sparkles 
                    className="w-4 h-4" 
                    style={{ color: bloomStyles.colors.eucalyptusSage, opacity: 0.9 }}
                  />
                  Minimum Requirements
                </h3>
                <p 
                  className="mb-5"
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.65,
                    color: bloomStyles.colors.mutedText,
                  }}
                >
                  To apply, you must meet at least <strong style={{ color: bloomStyles.colors.charcoalText }}>ONE</strong> of these criteria:
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 
                      className="w-5 h-5 mt-0.5 flex-shrink-0" 
                      style={{ color: bloomStyles.colors.eucalyptusSage, opacity: 0.95 }}
                    />
                    <span style={{ fontSize: '15px', lineHeight: 1.65, color: bloomStyles.colors.charcoalText }}>
                      <strong>Registered Clinical Psychologist</strong> with AHPRA
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 
                      className="w-5 h-5 mt-0.5 flex-shrink-0" 
                      style={{ color: bloomStyles.colors.eucalyptusSage, opacity: 0.95 }}
                    />
                    <span style={{ fontSize: '15px', lineHeight: 1.65, color: bloomStyles.colors.charcoalText }}>
                      <strong>8+ years</strong> as a registered psychologist with AHPRA
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 
                      className="w-5 h-5 mt-0.5 flex-shrink-0" 
                      style={{ color: bloomStyles.colors.eucalyptusSage, opacity: 0.95 }}
                    />
                    <span style={{ fontSize: '15px', lineHeight: 1.65, color: bloomStyles.colors.charcoalText }}>
                      <strong>PhD in Psychology</strong> with current AHPRA registration
                    </span>
                  </li>
                </ul>
              </div>
              </div>
            </motion.div>

            {/* Stage 4e: Form fields - staggered entrance animation */}
            {/* Phase 3: Registered Clinical Psychologist with interaction animations */}
            <motion.div
              style={{ marginTop: '24px' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: animationConfig.contentDuration,
                delay: animationConfig.contentDelay + (isMobile ? 0.4 : 0.8),
                ease: 'easeOut',
              }}
            >
              <motion.label 
                className="flex items-start gap-4 rounded-xl cursor-pointer"
                whileHover={!isMobile && !shouldReduceMotion ? {
                  backgroundColor: `${bloomStyles.colors.eucalyptusSage}08`,
                } : {}}
                whileTap={!shouldReduceMotion ? { scale: 0.98 } : {}}
                transition={{
                  duration: 0.15,
                  ease: 'easeOut'
                }}
                style={{
                  padding: '20px',
                  minHeight: '44px',
                  border: `2px solid ${bloomStyles.colors.eucalyptusSage}30`,
                  backgroundColor: isRegisteredPsychologist ? `${bloomStyles.colors.eucalyptusSage}08` : 'transparent',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Custom checkbox wrapper with glow and bounce */}
                <motion.div
                  animate={isRegisteredPsychologist ? 'checked' : 'unchecked'}
                  variants={{
                    unchecked: { 
                      scale: 1,
                      boxShadow: 'none',
                    },
                    checked: shouldReduceMotion ? {
                      scale: 1,
                      boxShadow: '0 0 0 2px rgba(107, 142, 127, 0.1)',
                    } : {
                      scale: [1, 1.1, 0.95, 1.02, 1],
                      boxShadow: [
                        'none',
                        '0 0 0 4px rgba(107, 142, 127, 0.15)',
                        '0 0 0 2px rgba(107, 142, 127, 0.1)',
                      ]
                    }
                  }}
                  transition={{
                    duration: isMobile ? 0.3 : 0.4,
                    ease: 'easeOut'
                  }}
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    border: `2px solid ${isRegisteredPsychologist ? bloomStyles.colors.eucalyptusSage : `${bloomStyles.colors.eucalyptusSage}30`}`,
                    backgroundColor: isRegisteredPsychologist ? `${bloomStyles.colors.eucalyptusSage}08` : 'transparent',
                    transition: 'background-color 0.2s, border-color 0.2s',
                    position: 'relative',
                  }}
                >
                  {/* Hidden native checkbox for accessibility */}
                  <input
                    type="checkbox"
                    checked={isRegisteredPsychologist}
                    onChange={(e) => setIsRegisteredPsychologist(e.target.checked)}
                    style={{ 
                      position: 'absolute', 
                      opacity: 0,
                      width: '44px',
                      height: '44px',
                      cursor: 'pointer',
                    }}
                    aria-label="I am a Registered Clinical Psychologist"
                    aria-checked={isRegisteredPsychologist}
                  />
                  
                  {/* Custom checkmark with draw animation */}
                  <motion.svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    style={{ pointerEvents: 'none' }}
                  >
                    <motion.path
                      d="M4 10l4 4l8-8"
                      fill="none"
                      stroke={bloomStyles.colors.eucalyptusSage}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={isRegisteredPsychologist ? { 
                        pathLength: 1, 
                        opacity: 0.95 
                      } : { 
                        pathLength: 0, 
                        opacity: 0 
                      }}
                      transition={{
                        pathLength: { 
                          duration: isMobile ? 0.2 : 0.3,
                          ease: 'easeOut'
                        },
                        opacity: { duration: 0.1 }
                      }}
                    />
                  </motion.svg>
                </motion.div>
                
                <div className="flex-1">
                  <div 
                    className="font-semibold mb-1"
                    style={{
                      fontSize: '16px',
                      color: bloomStyles.colors.charcoalText,
                      lineHeight: 1.4,
                    }}
                  >
                    I am a Registered Clinical Psychologist
                  </div>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: bloomStyles.colors.mutedText,
                    opacity: 0.9,
                  }}>
                    Current AHPRA Clinical Psychology registration
                  </p>
                </div>
              </motion.label>
            </motion.div>

            {/* Phase 3: Years Registered with focus interaction animations */}
            <motion.div
              style={{ marginTop: '24px' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: animationConfig.contentDuration,
                delay: animationConfig.contentDelay + (isMobile ? 0.45 : 0.88),
                ease: 'easeOut',
              }}
            >
              <Label 
                htmlFor="years" 
                className="font-medium block mb-2"
                style={{
                  fontSize: '16px',
                  color: bloomStyles.colors.charcoalText,
                }}
              >
                Years Registered with AHPRA <span style={{ color: '#F5A097' }}>*</span>
              </Label>
              
              {/* Input wrapper with shadow and texture */}
              <div style={{ position: 'relative', width: '100%' }}>
                {/* Shadow wrapper */}
                <motion.div
                  animate={isYearsInputFocused ? 'focused' : 'blurred'}
                  variants={{
                    blurred: {
                      boxShadow: '0 2px 8px rgba(107, 142, 127, 0.05)',
                    },
                    focused: {
                      boxShadow: '0 4px 16px rgba(107, 142, 127, 0.15)',
                    }
                  }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{ borderRadius: '8px', position: 'relative' }}
                >
                  {/* Paper texture overlay */}
                  <motion.div
                    animate={isYearsInputFocused ? { opacity: 0.05 } : { opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '8px',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5' /%3E%3C/svg%3E")`,
                      backgroundSize: '200px 200px',
                      pointerEvents: 'none',
                      mixBlendMode: 'multiply',
                      zIndex: 1,
                    }}
                  />
                  
                  {/* Animated input */}
                  <motion.input
                    id="years"
                    type="number"
                    min="0"
                    max="50"
                    value={yearsRegistered || ""}
                    onChange={(e) => setYearsRegistered(parseInt(e.target.value) || 0)}
                    onFocus={() => setIsYearsInputFocused(true)}
                    onBlur={() => setIsYearsInputFocused(false)}
                    placeholder="0"
                    animate={isYearsInputFocused ? 'focused' : 'blurred'}
                    variants={{
                      blurred: {
                        scale: 1,
                        borderColor: `${bloomStyles.colors.eucalyptusSage}30`,
                      },
                      focused: shouldReduceMotion ? {
                        scale: 1,
                        borderColor: bloomStyles.colors.eucalyptusSage,
                      } : {
                        scale: isMobile ? 1.01 : 1.02,
                        borderColor: bloomStyles.colors.eucalyptusSage,
                      }
                    }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '16px', // Prevents iOS zoom
                      minHeight: '48px',
                      borderRadius: '8px',
                      border: '2px solid',
                      backgroundColor: '#FEFDFB',
                      color: bloomStyles.colors.charcoalText,
                      outline: 'none',
                      position: 'relative',
                      zIndex: 2,
                      willChange: isYearsInputFocused ? 'transform, border-color' : 'auto',
                    }}
                    aria-label="Years Registered with AHPRA"
                  />
                </motion.div>
              </div>
              
              <p 
                className="mt-2"
                style={{
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: bloomStyles.colors.mutedText,
                  opacity: 0.85,
                }}
              >
                Must be 8+ years if not a Clinical Psychologist or PhD holder
              </p>
            </motion.div>

            {/* Phase 3: PhD Holder with interaction animations */}
            <motion.div
              style={{ marginTop: '24px' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: animationConfig.contentDuration,
                delay: animationConfig.contentDelay + (isMobile ? 0.5 : 0.96),
                ease: 'easeOut',
              }}
            >
              <motion.label 
                className="flex items-start gap-4 rounded-xl cursor-pointer"
                whileHover={!isMobile && !shouldReduceMotion ? {
                  backgroundColor: `${bloomStyles.colors.eucalyptusSage}08`,
                } : {}}
                whileTap={!shouldReduceMotion ? { scale: 0.98 } : {}}
                transition={{
                  duration: 0.15,
                  ease: 'easeOut'
                }}
                style={{
                  padding: '20px',
                  minHeight: '44px',
                  border: `2px solid ${bloomStyles.colors.eucalyptusSage}30`,
                  backgroundColor: hasPhd ? `${bloomStyles.colors.eucalyptusSage}08` : 'transparent',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Custom checkbox wrapper with glow and bounce */}
                <motion.div
                  animate={hasPhd ? 'checked' : 'unchecked'}
                  variants={{
                    unchecked: { 
                      scale: 1,
                      boxShadow: 'none',
                    },
                    checked: shouldReduceMotion ? {
                      scale: 1,
                      boxShadow: '0 0 0 2px rgba(107, 142, 127, 0.1)',
                    } : {
                      scale: [1, 1.1, 0.95, 1.02, 1],
                      boxShadow: [
                        'none',
                        '0 0 0 4px rgba(107, 142, 127, 0.15)',
                        '0 0 0 2px rgba(107, 142, 127, 0.1)',
                      ]
                    }
                  }}
                  transition={{
                    duration: isMobile ? 0.3 : 0.4,
                    ease: 'easeOut'
                  }}
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    border: `2px solid ${hasPhd ? bloomStyles.colors.eucalyptusSage : `${bloomStyles.colors.eucalyptusSage}30`}`,
                    backgroundColor: hasPhd ? `${bloomStyles.colors.eucalyptusSage}08` : 'transparent',
                    transition: 'background-color 0.2s, border-color 0.2s',
                    position: 'relative',
                  }}
                >
                  {/* Hidden native checkbox for accessibility */}
                  <input
                    type="checkbox"
                    checked={hasPhd}
                    onChange={(e) => setHasPhd(e.target.checked)}
                    style={{ 
                      position: 'absolute', 
                      opacity: 0,
                      width: '44px',
                      height: '44px',
                      cursor: 'pointer',
                    }}
                    aria-label="I hold a PhD in Psychology"
                    aria-checked={hasPhd}
                  />
                  
                  {/* Custom checkmark with draw animation */}
                  <motion.svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    style={{ pointerEvents: 'none' }}
                  >
                    <motion.path
                      d="M4 10l4 4l8-8"
                      fill="none"
                      stroke={bloomStyles.colors.eucalyptusSage}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={hasPhd ? { 
                        pathLength: 1, 
                        opacity: 0.95 
                      } : { 
                        pathLength: 0, 
                        opacity: 0 
                      }}
                      transition={{
                        pathLength: { 
                          duration: isMobile ? 0.2 : 0.3,
                          ease: 'easeOut'
                        },
                        opacity: { duration: 0.1 }
                      }}
                    />
                  </motion.svg>
                </motion.div>
                
                <div className="flex-1">
                  <div 
                    className="font-semibold mb-1"
                    style={{
                      fontSize: '16px',
                      color: bloomStyles.colors.charcoalText,
                      lineHeight: 1.4,
                    }}
                  >
                    I hold a PhD in Psychology
                  </div>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: bloomStyles.colors.mutedText,
                    opacity: 0.9,
                  }}>
                    Doctoral degree in psychology with current AHPRA registration
                  </p>
                </div>
              </motion.label>
            </motion.div>

            {/* Eligibility Result - human, warm feedback */}
            {isEligible === false && (
              <motion.div 
                className="flex items-start gap-3 rounded-xl"
                style={{
                  marginTop: '32px',
                  padding: '20px',
                  backgroundColor: '#FFF5F4',
                  border: `2px solid #F5A09730`,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <AlertCircle 
                  className="w-6 h-6 flex-shrink-0 mt-0.5" 
                  style={{ color: '#F5A097', opacity: 0.9 }}
                />
                <div>
                  <h4 
                    className="font-semibold mb-1"
                    style={{
                      fontSize: '16px',
                      color: bloomStyles.colors.charcoalText,
                    }}
                  >
                    Minimum criteria not met
                  </h4>
                  <p style={{
                    fontSize: '15px',
                    lineHeight: 1.65,
                    color: bloomStyles.colors.mutedText,
                  }}>
                    We encourage you to continue building your experience and reapply when you meet one of our criteria. We're excited to potentially work with you in the future!
                  </p>
                </div>
              </motion.div>
            )}

            {isEligible === true && (
              <>
                {/* Full-screen artistic canvas */}
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: '#FAF7F2',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Layered watercolor atmosphere */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    style={{
                      background: `
                        radial-gradient(ellipse 80% 60% at 50% 45%, ${bloomStyles.colors.honeyAmber}12 0%, transparent 60%),
                        radial-gradient(ellipse 60% 80% at 30% 60%, ${bloomStyles.colors.softFern}08 0%, transparent 70%),
                        radial-gradient(ellipse 70% 70% at 70% 40%, ${bloomStyles.colors.clayTerracotta}06 0%, transparent 65%),
                        radial-gradient(circle at 50% 50%, #FFFFFF 0%, #FAF7F2 100%)
                      `,
                    }}
                  />

                  {/* Gentle floating seeds - reduced for performance */}
                  {seedValues.map((seed, i) => (
                    <motion.div
                      key={`seed-${i}`}
                      className="absolute"
                      style={{
                        width: `${seed.width}px`,
                        height: `${seed.height}px`,
                        borderRadius: '50%',
                        backgroundColor: ['#88C399', '#D9B380', '#FFB6C1', '#FFFFFF'][i % 4],
                        opacity: 0.25,
                        filter: `blur(${seed.blur}px)`,
                        left: `${seed.startX}%`,
                        top: '-5%',
                        willChange: 'transform',
                      }}
                      animate={{
                        y: ['0vh', '105vh'],
                        x: [`0vw`, `${seed.endX - seed.startX}vw`],
                        opacity: [0, 0.3, 0.3, 0],
                      }}
                      transition={{
                        duration: seed.duration,
                        delay: seed.delay,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  ))}

                  {/* Main centered composition - proper container structure */}
                  <div 
                    className="relative flex items-center justify-center"
                    style={{ 
                      width: '100%',
                      height: '100%',
                      maxWidth: isMobile ? '95vw' : '800px',
                      maxHeight: isMobile ? '80vh' : '600px',
                    }}
                  >
                    {/* Ground layer - wildflower garden base */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 flex items-end justify-around"
                      style={{ height: '25%' }}
                    >
                      {wildflowerValues.map((flower, i) => {
                        const flowerColor = ['#FFB6C1', '#DDA0DD', '#FFE4E1', '#E6E6FA'][i % 4];
                        
                        return (
                          <motion.div
                            key={`wildflower-${i}`}
                            className="relative"
                            style={{
                              width: '2px',
                              height: `${flower.stemHeight}px`,
                              backgroundColor: bloomStyles.colors.eucalyptusSage,
                              opacity: 0.5,
                            }}
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 0.5 }}
                            transition={{
                              duration: 0.6,
                              delay: 1.5 + (i * 0.02),
                              ease: "easeOut",
                            }}
                          >
                            <motion.div
                              className="absolute top-0 left-1/2 transform -translate-x-1/2"
                              style={{
                                width: `${flower.flowerSize}px`,
                                height: `${flower.flowerSize}px`,
                                backgroundColor: flowerColor,
                                borderRadius: '50%',
                                opacity: 0.7,
                              }}
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.2, 1] }}
                              transition={{
                                duration: 0.4,
                                delay: 1.8 + (i * 0.02),
                                ease: [0.34, 1.56, 0.64, 1],
                              }}
                            />
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Hero flower - centered and properly structured */}
                    <div 
                      className="relative flex items-center justify-center"
                      style={{ 
                        width: isMobile ? '300px' : '450px',
                        height: isMobile ? '400px' : '550px',
                      }}
                    >
                      {/* Stem - properly centered */}
                      <motion.div
                        className="absolute left-1/2 transform -translate-x-1/2"
                        style={{
                          width: isMobile ? '10px' : '14px',
                          height: isMobile ? '200px' : '280px',
                          bottom: 0,
                          background: `linear-gradient(to bottom, ${bloomStyles.colors.softFern} 0%, ${bloomStyles.colors.eucalyptusSage} 100%)`,
                          borderRadius: '8px',
                          boxShadow: `
                            inset 2px 0 6px rgba(0, 0, 0, 0.08),
                            inset -2px 0 6px rgba(255, 255, 255, 0.3)
                          `,
                          transformOrigin: 'bottom center',
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{
                          duration: 1.2,
                          delay: 0.2,
                          ease: "easeOut",
                        }}
                      />

                      {/* Stem leaves - positioned relative to stem */}
                      {[
                        { side: 'left', bottom: '55%', delay: 0.8, size: 1 },
                        { side: 'right', bottom: '70%', delay: 1.0, size: 0.85 },
                      ].map((leaf, idx) => (
                        <motion.div
                          key={`leaf-${idx}`}
                          className="absolute left-1/2"
                          style={{
                            width: `${(isMobile ? 45 : 65) * leaf.size}px`,
                            height: `${(isMobile ? 28 : 40) * leaf.size}px`,
                            bottom: leaf.bottom,
                            [leaf.side]: isMobile ? '-50px' : '-70px',
                            background: `linear-gradient(${leaf.side === 'left' ? '135deg' : '225deg'}, ${bloomStyles.colors.softFern} 0%, ${bloomStyles.colors.eucalyptusSage} 100%)`,
                            borderRadius: leaf.side === 'left' 
                              ? '0% 60% 60% 50% / 0% 80% 80% 20%'
                              : '60% 0% 50% 60% / 80% 0% 20% 80%',
                            opacity: 0.85,
                            boxShadow: `0 2px 10px rgba(0, 0, 0, 0.08)`,
                            transformOrigin: leaf.side === 'left' ? 'right center' : 'left center',
                          }}
                          initial={{ scale: 0, rotate: 0 }}
                          animate={{ 
                            scale: [0, 1.1, 1],
                            rotate: leaf.side === 'left' ? [-25, 0] : [25, 0],
                          }}
                          transition={{
                            duration: 1.0,
                            delay: leaf.delay,
                            ease: [0.34, 1.56, 0.64, 1],
                          }}
                        />
                      ))}

                      {/* Flower head container - centered on stem top */}
                      <div 
                        className="absolute left-1/2 transform -translate-x-1/2"
                        style={{ 
                          bottom: isMobile ? '200px' : '280px',
                          width: isMobile ? '200px' : '280px',
                          height: isMobile ? '200px' : '280px',
                        }}
                      >
                        {/* Outer petal layer */}
                        {[...Array(8)].map((_, i) => {
                          const angle = (i / 8) * 360;
                          const colors = ['#FFB6C1', '#DDA0DD', '#B5EAD7', '#FFDAC1'];
                          
                          return (
                            <motion.div
                              key={`outer-petal-${i}`}
                              className="absolute left-1/2 top-1/2"
                              style={{
                                width: isMobile ? '55px' : '75px',
                                height: isMobile ? '75px' : '105px',
                                marginLeft: isMobile ? '-27.5px' : '-37.5px',
                                marginTop: isMobile ? '-37.5px' : '-52.5px',
                                borderRadius: '45% 55% 50% 50% / 60% 60% 40% 40%',
                                backgroundColor: colors[i % 4],
                                opacity: 0.4,
                                filter: 'blur(2px)',
                                transformOrigin: 'center center',
                              }}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ 
                                scale: 1,
                                opacity: 0.4,
                                rotate: angle,
                              }}
                              transition={{
                                duration: 1.5,
                                delay: 0.8 + (i * 0.08),
                                ease: [0.34, 1.56, 0.64, 1],
                              }}
                            />
                          );
                        })}

                        {/* Main petal layer */}
                        {[...Array(6)].map((_, i) => {
                          const angle = (i / 6) * 360;
                          const colors = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#B5EAD7', '#C7CEEA'];
                          
                          return (
                            <motion.div
                              key={`main-petal-${i}`}
                              className="absolute left-1/2 top-1/2"
                              style={{
                                width: isMobile ? '45px' : '60px',
                                height: isMobile ? '60px' : '85px',
                                marginLeft: isMobile ? '-22.5px' : '-30px',
                                marginTop: isMobile ? '-30px' : '-42.5px',
                                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                                background: `linear-gradient(135deg, ${colors[i % colors.length]} 0%, ${colors[(i + 1) % colors.length]} 100%)`,
                                opacity: 0.85,
                                boxShadow: `0 4px 15px ${colors[i % colors.length]}30`,
                                transformOrigin: 'center center',
                              }}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ 
                                scale: 1,
                                opacity: 0.85,
                                rotate: angle + 30,
                              }}
                              transition={{
                                duration: 1.2,
                                delay: 1.0 + (i * 0.1),
                                ease: [0.34, 1.56, 0.64, 1],
                              }}
                            >
                              {/* Petal highlight */}
                              <div
                                className="absolute inset-0 rounded-[inherit]"
                                style={{
                                  background: `linear-gradient(to top, transparent 40%, rgba(255, 255, 255, 0.4) 70%, transparent 100%)`,
                                }}
                              />
                            </motion.div>
                          );
                        })}

                        {/* Flower center - pistil and stamens */}
                        <motion.div
                          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            width: isMobile ? '60px' : '80px',
                            height: isMobile ? '60px' : '80px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle at 35% 35%, #FFFACD 0%, ${bloomStyles.colors.honeyAmber} 100%)`,
                            boxShadow: `
                              0 0 25px ${bloomStyles.colors.honeyAmber}50,
                              inset 0 -8px 20px rgba(0, 0, 0, 0.08),
                              inset 0 8px 20px rgba(255, 255, 255, 0.5)
                            `,
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.15, 1] }}
                          transition={{
                            duration: 1.0,
                            delay: 1.4,
                            ease: [0.34, 1.56, 0.64, 1],
                          }}
                        >
                          {/* Center texture details */}
                          {[...Array(12)].map((_, i) => {
                            const angle = (i / 12) * Math.PI * 2;
                            const distance = isMobile ? 18 : 24;
                            
                            return (
                              <motion.div
                                key={`stamen-${i}`}
                                className="absolute left-1/2 top-1/2"
                                style={{
                                  width: '3px',
                                  height: isMobile ? '12px' : '16px',
                                  backgroundColor: bloomStyles.colors.honeyAmber,
                                  opacity: 0.6,
                                  transformOrigin: 'bottom center',
                                  transform: `
                                    translate(-50%, 0)
                                    translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)
                                  `,
                                }}
                                initial={{ scaleY: 0, opacity: 0 }}
                                animate={{ scaleY: 1, opacity: 0.6 }}
                                transition={{
                                  duration: 0.5,
                                  delay: 1.8 + (i * 0.03),
                                }}
                              >
                                <div
                                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                  style={{
                                    width: '4px',
                                    height: '4px',
                                    backgroundColor: '#FFD700',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 6px rgba(255, 215, 0, 0.6)',
                                  }}
                                />
                              </motion.div>
                            );
                          })}

                          {/* Central sparkle */}
                          <motion.div
                            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ 
                              opacity: [0, 1, 0.9],
                              scale: [0, 1.2, 1],
                              rotate: 360,
                            }}
                            transition={{
                              duration: 2.5,
                              delay: 2.2,
                              repeat: Infinity,
                              repeatDelay: 1,
                            }}
                          >
                            <Sparkles 
                              style={{ 
                                width: isMobile ? '28px' : '38px',
                                height: isMobile ? '28px' : '38px',
                                color: '#FFFFFF',
                                filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))',
                              }}
                            />
                          </motion.div>
                        </motion.div>
                      </div>

                      {/* Light rays from center */}
                      {[...Array(8)].map((_, i) => {
                        const angle = (i / 8) * 360;
                        
                        return (
                          <motion.div
                            key={`ray-${i}`}
                            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                              width: '2px',
                              height: isMobile ? '150px' : '220px',
                              background: `linear-gradient(to bottom, ${bloomStyles.colors.honeyAmber}00, ${bloomStyles.colors.honeyAmber}20, ${bloomStyles.colors.honeyAmber}00)`,
                              transformOrigin: 'top center',
                              filter: 'blur(2px)',
                            }}
                            initial={{ opacity: 0, scaleY: 0, rotate: angle }}
                            animate={{ 
                              opacity: 0.5,
                              scaleY: 1,
                              rotate: angle,
                            }}
                            transition={{
                              duration: 1.5,
                              delay: 2.5 + (i * 0.05),
                              ease: "easeOut",
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Minimal text - just essence */}
                    <motion.div
                      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1, delay: 3.5 }}
                    >
                      <p 
                        style={{
                          fontSize: isMobile ? '32px' : '48px',
                        }}
                      >
                        🌸
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              </>
            )}

            {/* Stage 4f: Check Eligibility Button - entrance animation with bounce */}
            <motion.div
              style={{ marginTop: '32px' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: animationConfig.contentDuration,
                delay: animationConfig.contentDelay + (isMobile ? 0.6 : 1.2),
                ease: animationConfig.bounceEasing,
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleCheckEligibility}
                className="w-full relative overflow-hidden group font-semibold flex items-center justify-center gap-2"
                style={{
                  height: '56px',
                  background: `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage} 0%, ${bloomStyles.colors.softFern} 100%)`,
                  color: '#FEFDFB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: `0 4px 16px ${bloomStyles.colors.eucalyptusSage}25`,
                  opacity: 0.95,
                  transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 8px 24px ${bloomStyles.colors.eucalyptusSage}35`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 4px 16px ${bloomStyles.colors.eucalyptusSage}25`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.3'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay',
                  }}
                />
                
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
                  }}
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
                
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles 
                    className="w-5 h-5" 
                    style={{ opacity: 0.95 }}
                  />
                  Check Eligibility
                </span>
              </Button>
            </motion.div>
            </div>
          </CardContent>
        </Card>
        </div>
      </motion.div>
    </div>
  );
}