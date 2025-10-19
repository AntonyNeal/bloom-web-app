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

// Watercolor Blob Component - Studio Ghibli atmosphere (static, no animation)
interface WatercolorBlobProps {
  size: string;
  color: string;
  opacity: number;
  position: React.CSSProperties;
  blur: number;
  borderRadius: string;
}

const WatercolorBlob = ({ 
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
};

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
}: FloatingParticleProps) => {
  return (
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
        willChange: 'transform',
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
};

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

// Phase 6: Flower Recognition Components

// Tier 1: Clinical Psychologist - Small pink wildflower
interface Tier1FlowerProps {
  isChecked: boolean;
  isMobile: boolean;
  shouldReduceMotion: boolean | null;
}

function Tier1Flower({ isChecked, isMobile, shouldReduceMotion }: Tier1FlowerProps) {
  if (!isChecked) return null;

  const size = isMobile ? 56 : 88; // Increased from 40/68 (~25% larger)
  const reduceMotion = shouldReduceMotion || false;
  
  // Use plain SVG when reducing motion for performance
  const SvgComponent = reduceMotion ? 'svg' : motion.svg;
  
  return (
    <SvgComponent
      width={size}
      height={size}
      viewBox="0 0 32 32"
      {...(!reduceMotion && {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0, opacity: 0 },
        transition: {
          delay: 0.5,
          duration: 0.8,
          ease: 'easeOut',
        }
      })}
      style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        willChange: 'transform, opacity',
      }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="pinkPetalGradient">
          <stop offset="0%" stopColor="#FFE5ED" />
          <stop offset="30%" stopColor="#FFD4E0" />
          <stop offset="60%" stopColor="#FFB6C1" />
          <stop offset="100%" stopColor="#FF9BAD" />
        </radialGradient>
        <radialGradient id="pinkCenterGradient">
          <stop offset="0%" stopColor="#FFF5F8" />
          <stop offset="40%" stopColor="#E8B8C8" />
          <stop offset="100%" stopColor="#D4A5A5" />
        </radialGradient>
        <radialGradient id="pinkPetalShadow">
          <stop offset="0%" stopColor="#FF9BAD" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#E8668F" stopOpacity="0.8" />
        </radialGradient>
      </defs>
      <g>
        {/* 5 petals radiating from center with enhanced gradients */}
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const x = 16 + Math.cos((angle * Math.PI) / 180) * 8;
          const y = 16 + Math.sin((angle * Math.PI) / 180) * 8;
          return (
            <g key={i}>
              {/* Petal shadow/depth */}
              <ellipse
                cx={x + 0.5}
                cy={y + 0.5}
                rx="5.5"
                ry="8"
                fill="url(#pinkPetalShadow)"
                opacity="0.6"
                transform={`rotate(${angle} ${x} ${y})`}
              />
              {/* Main petal */}
              <ellipse
                cx={x}
                cy={y}
                rx="5"
                ry="7.5"
                fill="url(#pinkPetalGradient)"
                opacity="0.95"
                transform={`rotate(${angle} ${x} ${y})`}
              />
              {/* Petal highlight */}
              <ellipse
                cx={x - 0.8}
                cy={y - 1.5}
                rx="2"
                ry="3.5"
                fill="rgba(255, 255, 255, 0.6)"
                opacity="0.85"
                transform={`rotate(${angle} ${x} ${y})`}
              />
            </g>
          );
        })}
        
        {/* Center circle with gradient */}
        <circle cx="16" cy="16" r="4" fill="url(#pinkCenterGradient)" />
        
        {/* Center highlight */}
        <ellipse cx="15" cy="14.5" rx="2" ry="1.5" fill="rgba(255, 255, 255, 0.8)" opacity="0.9" />
        
        {/* Center detail */}
        <circle cx="16" cy="16" r="1.5" fill="#E8B8C8" opacity="0.6" />
      </g>
    </SvgComponent>
  );
}

// Tier 2: 8+ Years - Larger purple flower with sparkles
interface Tier2FlowerProps {
  isChecked: boolean;
  isMobile: boolean;
  shouldReduceMotion: boolean | null;
  sparkleCount?: number; // Phase 7 optimization: Control sparkle count
  sparkleDelay?: number; // Phase 7 optimization: Delay sparkle start
}

function Tier2Flower({ 
  isChecked, 
  isMobile, 
  shouldReduceMotion, 
  sparkleCount: customSparkleCount,
  sparkleDelay = 0 
}: Tier2FlowerProps) {
  if (!isChecked) return null;

  const size = isMobile ? 60 : 80; // Increased from 48/64 (~25% larger)
  const sparkleCount = customSparkleCount ?? (isMobile ? 2 : 4);
  const reduceMotion = shouldReduceMotion || false;
  
  const SvgComponent = reduceMotion ? 'svg' : motion.svg;
  
  return (
    <div style={{ position: 'absolute', left: 'calc(100% + 16px)', top: '50%', transform: 'translateY(-50%)' }}>
      <SvgComponent
        width={size}
        height={size}
        viewBox="0 0 40 40"
        {...(!reduceMotion && {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0, opacity: 0 },
          transition: {
            delay: 0.5,
            duration: 0.8,
            ease: 'easeOut',
          }
        })}
        style={{ willChange: 'transform, opacity' }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="purplePetalGradient">
            <stop offset="0%" stopColor="#E8D9F5" />
            <stop offset="20%" stopColor="#D4BEED" />
            <stop offset="40%" stopColor="#C7ABD9" />
            <stop offset="60%" stopColor="#B18FC7" />
            <stop offset="75%" stopColor="#9B72AA" />
            <stop offset="90%" stopColor="#85608F" />
            <stop offset="100%" stopColor="#6F4C7A" />
          </radialGradient>
          <radialGradient id="purplePetalInner">
            <stop offset="0%" stopColor="#B18FC7" />
            <stop offset="50%" stopColor="#9B72AA" />
            <stop offset="100%" stopColor="#7A5589" />
          </radialGradient>
          <radialGradient id="goldCenterGradient">
            <stop offset="0%" stopColor="#FFFEF5" />
            <stop offset="25%" stopColor="#FFF8DC" />
            <stop offset="50%" stopColor="#F5E6B8" />
            <stop offset="75%" stopColor="#E8D4A8" />
            <stop offset="100%" stopColor="#D9B380" />
          </radialGradient>
          <radialGradient id="goldCenterOuter">
            <stop offset="0%" stopColor="#E8D4A8" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#B8922E" />
          </radialGradient>
        </defs>
        <g>
          {/* 6 petals - purple with clustered, overlapping petals (rose-like) */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            // Slight variations for organic feel
            const angleVariation = (i % 2 === 0 ? 3 : -3);
            const sizeVariation = i % 3 === 0 ? 0.92 : i % 3 === 1 ? 1.0 : 1.05;
            const adjustedAngle = angle + angleVariation;
            const x = 20 + Math.cos((adjustedAngle * Math.PI) / 180) * 9.5; // Closer together
            const y = 20 + Math.sin((adjustedAngle * Math.PI) / 180) * 9.5;
            
            return (
              <g key={i}>
                {/* Soft shadow */}
                <ellipse
                  cx={x + 0.4}
                  cy={y + 0.8}
                  rx={6.8 * sizeVariation}
                  ry={7.2 * sizeVariation} // Slightly taller than wide
                  fill="#9B72AA"
                  opacity="0.2"
                  transform={`rotate(${adjustedAngle + 10} ${x} ${y})`}
                />
                
                {/* Main petal - slightly oval, clustered */}
                <ellipse
                  cx={x}
                  cy={y}
                  rx={6.2 * sizeVariation}
                  ry={6.8 * sizeVariation} // Slightly taller
                  fill="url(#purplePetalGradient)"
                  opacity="0.92"
                  transform={`rotate(${adjustedAngle + 10} ${x} ${y})`}
                />
                
                {/* Soft highlight - closer to center edge */}
                <ellipse
                  cx={x + (i % 2 === 0 ? -1.2 : 0.9)}
                  cy={y - 1.5}
                  rx={2.8 * sizeVariation}
                  ry={3.2 * sizeVariation}
                  fill="rgba(248, 240, 255, 0.75)"
                  opacity="0.65"
                  transform={`rotate(${adjustedAngle + 5} ${x} ${y})`}
                />
              </g>
            );
          })}
          
          {/* Center circle - flat, low contrast */}
          <circle cx="20" cy="20" r="4.5" fill="url(#goldCenterGradient)" opacity="0.7" />
          
          {/* Subtle center detail */}
          <circle cx="20" cy="20" r="2.8" fill="#D4AF37" opacity="0.3" />
        </g>
      </SvgComponent>
      
      {/* Sparkle burst */}
      {!reduceMotion && sparkleCount > 0 && [...Array(sparkleCount)].map((_, i) => {
        const angle = (i / sparkleCount) * 360;
        const distance = 25;
        return (
          <motion.div
            key={i}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0.8,
              scale: 1,
            }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              opacity: [0.8, 0.8, 0],
              scale: [1, 1, 0.3],
            }}
            transition={{
              duration: 2.5,
              delay: sparkleDelay + 1.2 + (i * 0.15),
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#D9B380',
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </div>
  );
}

// Tier 3: PhD - Golden flower with rotating halo
interface Tier3FlowerProps {
  isChecked: boolean;
  isMobile: boolean;
  shouldReduceMotion: boolean | null;
  sparkleCount?: number; // Phase 7 optimization: Control sparkle count
  sparkleDelay?: number; // Phase 7 optimization: Delay sparkle start
}

function Tier3Flower({ 
  isChecked, 
  isMobile, 
  shouldReduceMotion,
  sparkleCount: customSparkleCount,
  sparkleDelay = 0
}: Tier3FlowerProps) {
  if (!isChecked) return null;

  const size = isMobile ? 58 : 74; // Increased from 44/56 (~25% larger)
  const sparkleCount = customSparkleCount ?? (isMobile ? 4 : 8);
  const reduceMotion = shouldReduceMotion || false;
  
  const SvgComponent = reduceMotion ? 'svg' : motion.svg;
  
  return (
    <div style={{ position: 'absolute', left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' }}>
      <SvgComponent
        width={size}
        height={size}
        viewBox="0 0 40 40"
        {...(!reduceMotion && {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0, opacity: 0 },
          transition: {
            delay: 0.6,
            duration: 0.8,
            ease: 'easeOut',
          }
        })}
        style={{ willChange: 'transform, opacity' }}
        aria-hidden="true"
      >
        <defs>
          {/* Black-eyed Susan / Rudbeckia inspired gradients */}
          <radialGradient id="rudbeckiaPetal">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="30%" stopColor="#FFD54F" />
            <stop offset="60%" stopColor="#FFCA28" />
            <stop offset="85%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#FFB300" />
          </radialGradient>
          <radialGradient id="rudbeckiaPetalBase">
            <stop offset="0%" stopColor="#FFA726" />
            <stop offset="50%" stopColor="#FF9800" />
            <stop offset="100%" stopColor="#F57C00" />
          </radialGradient>
          <radialGradient id="rudbeckiaCenter">
            <stop offset="0%" stopColor="#4A2C2A" />
            <stop offset="40%" stopColor="#3E2723" />
            <stop offset="70%" stopColor="#2C1810" />
            <stop offset="100%" stopColor="#1A0F08" />
          </radialGradient>
          <radialGradient id="rudbeckiaCenterHighlight">
            <stop offset="0%" stopColor="#6D4C41" />
            <stop offset="50%" stopColor="#5D4037" />
            <stop offset="100%" stopColor="#4E342E" />
          </radialGradient>
        </defs>
        
        {/* Black-eyed Susan flower */}
        <g>
          {/* 12 long, narrow petals radiating outward like sun rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
            const angleVariation = (i % 3 === 0 ? 2 : i % 3 === 1 ? -2 : 0);
            const lengthVariation = 0.9 + (Math.sin(i * 1.7) * 0.15); // Natural variation
            const adjustedAngle = angle + angleVariation;
            
            // Petal starts from center edge (r=5.5) and extends outward
            const petalStartDist = 5.5; // Exactly at the dark center edge
            const petalLength = 6.5 * lengthVariation; // How far it extends
            const petalMidDist = petalStartDist + (petalLength / 2);
            
            const x = 20 + Math.cos((adjustedAngle * Math.PI) / 180) * petalMidDist;
            const y = 20 + Math.sin((adjustedAngle * Math.PI) / 180) * petalMidDist;
            
            return (
              <g key={i}>
                {/* Main petal with integrated shadow - long, narrow, radiating outward */}
                <ellipse
                  cx={x}
                  cy={y}
                  rx={1.3 * lengthVariation} // Narrow width
                  ry={petalLength / 2} // Long (extends from center)
                  fill="url(#rudbeckiaPetal)"
                  stroke="url(#rudbeckiaPetalBase)"
                  strokeWidth="0.4"
                  opacity="0.95"
                  transform={`rotate(${adjustedAngle + 90} ${x} ${y})`}
                />
              </g>
            );
          })}
          
          {/* Dark center disk with integrated texture (characteristic of Black-eyed Susan) */}
          <circle cx="20" cy="20" r="5.5" fill="url(#rudbeckiaCenter)" />
          
          {/* Center highlight (subtle 3D depth) */}
          <circle cx="19" cy="19" r="2.2" fill="url(#rudbeckiaCenterHighlight)" opacity="0.35" />
          
          {/* Minimal center texture (disk florets) - optimized to 8 dots */}
          {[...Array(8)].map((_, i) => {
            const centerAngle = (i / 8) * 360;
            const centerDist = 2;
            const cx = 20 + Math.cos((centerAngle * Math.PI) / 180) * centerDist;
            const cy = 20 + Math.sin((centerAngle * Math.PI) / 180) * centerDist;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="0.5"
                fill="#3E2723"
                opacity="0.4"
              />
            );
          })}
        </g>
      </SvgComponent>
      
      {/* Continuous sparkle particles */}
      {!reduceMotion && sparkleCount > 0 && [...Array(sparkleCount)].map((_, i) => {
        const angle = (i / sparkleCount) * 360;
        const distance = 35;
        return (
          <motion.div
            key={i}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0,
              scale: 1,
            }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              opacity: [0, 0.9, 0.9, 0],
              scale: [1, 1.3, 1.3, 0.3],
            }}
            transition={{
              duration: 3,
              delay: sparkleDelay + 1.5 + (i * 0.3),
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#FFB300',
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </div>
  );
}

export function QualificationCheck({ onEligible }: QualificationCheckProps) {
  const [isRegisteredPsychologist, setIsRegisteredPsychologist] = useState(false);
  const [hasPhd, setHasPhd] = useState(false);
  const [yearsRegistered, setYearsRegistered] = useState<number>(0);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  
  // Phase 3: Focus state tracking for interactions
  const [isYearsInputFocused, setIsYearsInputFocused] = useState(false);

  // Phase 4: Button interaction states
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inkSpreadOrigin, setInkSpreadOrigin] = useState({ x: 0, y: 0 });
  const [showInkSpread, setShowInkSpread] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Phase 6: Garden recognition states
  type YearsIcon = 'none' | 'leaf' | 'bud' | 'flower' | 'honored';
  const [yearsIcon, setYearsIcon] = useState<YearsIcon>('none');
  const [showDelayedBloom, setShowDelayedBloom] = useState(false);

  // Phase 6: Calculate years-based recognition
  useEffect(() => {
    if (yearsRegistered >= 16) setYearsIcon('honored');
    else if (yearsRegistered >= 8) setYearsIcon('flower');
    else if (yearsRegistered >= 5) setYearsIcon('bud');
    else if (yearsRegistered >= 3) setYearsIcon('leaf');
    else setYearsIcon('none');
  }, [yearsRegistered]);

  // Phase 6: Track if qualifications are complete
  const hasQualification = isRegisteredPsychologist || hasPhd;
  const allQualified = hasQualification || yearsRegistered >= 8;

  // Phase 6: Trigger delayed bloom when qualifications completed after years entered
  useEffect(() => {
    if (yearsRegistered >= 8 && hasQualification && !showDelayedBloom) {
      setShowDelayedBloom(true);
      setTimeout(() => setShowDelayedBloom(false), 2000);
    }
  }, [hasQualification, yearsRegistered, showDelayedBloom]);

  // Phase 6: Screen reader announcements for qualification recognition
  const [srAnnouncement, setSrAnnouncement] = useState('');
  
  useEffect(() => {
    if (isRegisteredPsychologist) {
      setSrAnnouncement('Clinical Psychologist qualification recognized');
      setTimeout(() => setSrAnnouncement(''), 3000);
    }
  }, [isRegisteredPsychologist]);
  
  useEffect(() => {
    if (hasPhd) {
      setSrAnnouncement('PhD qualification recognized with highest honors');
      setTimeout(() => setSrAnnouncement(''), 3000);
    }
  }, [hasPhd]);
  
  useEffect(() => {
    if (yearsRegistered >= 8) {
      setSrAnnouncement('Eight or more years of experience recognized');
      setTimeout(() => setSrAnnouncement(''), 3000);
    }
  }, [yearsRegistered]);

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
    // Phase 4: Add loading state for dramatic effect
    setIsLoading(true);
    
    // Simulate processing time for better UX (500ms)
    setTimeout(() => {
      const eligible = isRegisteredPsychologist || hasPhd || yearsRegistered >= 8;
      setIsEligible(eligible);
      setIsLoading(false);
      
      if (eligible) {
        // Trigger parent callback after showing success message
        // 5 second delay to let the celebration animations complete and user to feel the pride
        setTimeout(() => onEligible(), 5000);
      }
    }, 500);
  };

  // Phase 4: Handle mobile touch ripple effect
  const handleTouchRipple = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!isMobile) return;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    const rippleId = Date.now();
    setRipples(prev => [...prev, { id: rippleId, x, y }]);
    
    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);
  };

  // Phase 4: Handle desktop ink-spread effect from cursor position
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile || !isButtonHovered) return;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setInkSpreadOrigin({ x, y });
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
      {/* Phase 6: Screen reader announcement region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {srAnnouncement}
      </div>
      
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
                
                <div className="flex-1" style={{ position: 'relative' }}>
                  <div 
                    className="font-semibold mb-1"
                    style={{
                      fontSize: '16px',
                      color: bloomStyles.colors.charcoalText,
                      lineHeight: 1.4,
                      position: 'relative',
                      display: 'inline-block',
                    }}
                  >
                    I am a Registered Clinical Psychologist
                    <Tier1Flower 
                      isChecked={isRegisteredPsychologist} 
                      isMobile={isMobile} 
                      shouldReduceMotion={shouldReduceMotion} 
                    />
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
                      paddingRight: '48px', // Make room for icon
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
                  
                  {/* Phase 6: Progressive years recognition icon */}
                  {yearsIcon !== 'none' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 3,
                        pointerEvents: 'none',
                      }}
                      aria-hidden="true"
                    >
                      {yearsIcon === 'leaf' && (
                        <motion.div
                          animate={shouldReduceMotion ? {} : { 
                            rotate: [0, -5, 5, 0],
                            scale: [1, 1.05, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          style={{ fontSize: '14px' }}
                        >
                          🍃
                        </motion.div>
                      )}
                      {yearsIcon === 'bud' && (
                        <motion.div
                          animate={shouldReduceMotion ? {} : { 
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          style={{ fontSize: '16px' }}
                        >
                          🌼
                        </motion.div>
                      )}
                      {yearsIcon === 'flower' && (
                        <motion.div
                          animate={shouldReduceMotion ? {} : { 
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.08, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          style={{ fontSize: '18px', position: 'relative' }}
                        >
                          💜
                          <Tier2Flower 
                            isChecked={yearsRegistered >= 8} 
                            isMobile={isMobile} 
                            shouldReduceMotion={shouldReduceMotion} 
                          />
                        </motion.div>
                      )}
                      {yearsIcon === 'honored' && (
                        <motion.div
                          style={{ 
                            fontSize: '20px', 
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <motion.div
                            animate={shouldReduceMotion ? {} : { 
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            style={{
                              position: 'absolute',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'radial-gradient(circle, rgba(244, 208, 63, 0.3) 0%, transparent 70%)',
                            }}
                          />
                          💜✨
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                  
                  {/* "Not yet" state: High years but no credentials */}
                  {yearsRegistered >= 8 && !hasQualification && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 3,
                        pointerEvents: 'none',
                      }}
                      aria-hidden="true"
                    >
                      <motion.div
                        animate={shouldReduceMotion ? {} : { 
                          rotate: [0, -3, 3, 0],
                          scale: [1, 0.95, 1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        style={{ fontSize: '16px', opacity: 0.5 }}
                      >
                        🌼
                      </motion.div>
                    </motion.div>
                  )}
                  
                  {/* Delayed bloom flourish */}
                  {showDelayedBloom && !shouldReduceMotion && (
                    <>
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ 
                            x: 0, 
                            y: 0, 
                            opacity: 0.9,
                            scale: 1,
                          }}
                          animate={{
                            x: Math.cos((i * 60 * Math.PI) / 180) * 40,
                            y: Math.sin((i * 60 * Math.PI) / 180) * 40,
                            opacity: 0,
                            scale: 0.3,
                          }}
                          transition={{
                            duration: 2.0,
                            ease: 'easeOut',
                          }}
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#D9B380',
                            pointerEvents: 'none',
                            zIndex: 4,
                          }}
                        />
                      ))}
                    </>
                  )}
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
                
                <div className="flex-1" style={{ position: 'relative' }}>
                  <div 
                    className="font-semibold mb-1"
                    style={{
                      fontSize: '16px',
                      color: bloomStyles.colors.charcoalText,
                      lineHeight: 1.4,
                      position: 'relative',
                      display: 'inline-block',
                    }}
                  >
                    I hold a PhD in Psychology
                    <Tier3Flower 
                      isChecked={hasPhd} 
                      isMobile={isMobile} 
                      shouldReduceMotion={shouldReduceMotion} 
                    />
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
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div
                      className="relative"
                      style={{ 
                        width: isMobile ? '95vw' : '800px',
                        height: isMobile ? '80vh' : '600px',
                        maxWidth: '100%',
                        maxHeight: '100%',
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
                          width: isMobile ? '180px' : '240px',
                          height: isMobile ? '180px' : '240px',
                        }}
                      >
                        {/* Simple SVG flower - reliable rendering */}
                        <motion.svg
                          viewBox="0 0 200 200"
                          className="absolute inset-0 w-full h-full"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            duration: 1.5,
                            delay: 0.8,
                            ease: [0.34, 1.56, 0.64, 1],
                          }}
                        >
                          {/* Outer petal ring */}
                          {[...Array(8)].map((_, i) => {
                            const angle = (i / 8) * 360 - 90;
                            const x = 100 + Math.cos((angle * Math.PI) / 180) * 60;
                            const y = 100 + Math.sin((angle * Math.PI) / 180) * 60;
                            const colors = ['#FFB6C1', '#DDA0DD', '#FFE4E1', '#E6E6FA'];
                            
                            return (
                              <motion.ellipse
                                key={`outer-${i}`}
                                cx={x}
                                cy={y}
                                rx="25"
                                ry="35"
                                fill={colors[i % 4]}
                                opacity="0.5"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 0.5 }}
                                transition={{
                                  duration: 0.8,
                                  delay: 1.0 + (i * 0.08),
                                  ease: [0.34, 1.56, 0.64, 1],
                                }}
                                style={{
                                  transformOrigin: `${x}px ${y}px`,
                                  filter: 'blur(1px)',
                                }}
                              />
                            );
                          })}
                          
                          {/* Main petal ring */}
                          {[...Array(6)].map((_, i) => {
                            const angle = (i / 6) * 360 - 90;
                            const x = 100 + Math.cos((angle * Math.PI) / 180) * 45;
                            const y = 100 + Math.sin((angle * Math.PI) / 180) * 45;
                            
                            return (
                              <motion.ellipse
                                key={`main-${i}`}
                                cx={x}
                                cy={y}
                                rx="22"
                                ry="32"
                                fill={`url(#gradient-${i})`}
                                opacity="0.9"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 0.9 }}
                                transition={{
                                  duration: 0.8,
                                  delay: 1.2 + (i * 0.1),
                                  ease: [0.34, 1.56, 0.64, 1],
                                }}
                                style={{
                                  transformOrigin: `${x}px ${y}px`,
                                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                }}
                              />
                            );
                          })}
                          
                          {/* Gradients for main petals */}
                          <defs>
                            {['#FF9AA2', '#FFB7B2', '#FFDAC1', '#B5EAD7', '#C7CEEA', '#FFB6C1'].map((color, i) => (
                              <linearGradient key={`gradient-${i}`} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={color} stopOpacity="1" />
                                <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                              </linearGradient>
                            ))}
                          </defs>
                          
                          {/* Center */}
                          <motion.circle
                            cx="100"
                            cy="100"
                            r={isMobile ? "28" : "35"}
                            fill={`url(#centerGradient)`}
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.15, 1] }}
                            transition={{
                              duration: 0.8,
                              delay: 1.6,
                              ease: [0.34, 1.56, 0.64, 1],
                            }}
                            style={{
                              filter: `drop-shadow(0 0 15px ${bloomStyles.colors.honeyAmber}60)`,
                            }}
                          />
                          
                          <defs>
                            <radialGradient id="centerGradient">
                              <stop offset="0%" stopColor="#FFFACD" />
                              <stop offset="100%" stopColor={bloomStyles.colors.honeyAmber} />
                            </radialGradient>
                          </defs>
                        </motion.svg>

                        {/* Central sparkle overlay */}
                        <motion.div
                          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ 
                            opacity: [0, 1, 0.9],
                            scale: [0, 1.2, 1],
                            rotate: [0, 180, 360],
                          }}
                          transition={{
                            duration: 2.5,
                            delay: 2.0,
                            repeat: Infinity,
                            repeatDelay: 1,
                          }}
                        >
                          <Sparkles 
                            style={{ 
                              width: isMobile ? '32px' : '42px',
                              height: isMobile ? '32px' : '42px',
                              color: '#FFFFFF',
                              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))',
                            }}
                          />
                        </motion.div>
                      </div>

                      {/* Light rays from flower center */}
                      <motion.div
                        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          width: isMobile ? '300px' : '400px',
                          height: isMobile ? '300px' : '400px',
                          bottom: isMobile ? '100px' : '140px',
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 0.3, 0.2], scale: 1, rotate: 360 }}
                        transition={{
                          opacity: { duration: 2, delay: 2.3 },
                          scale: { duration: 2, delay: 2.3 },
                          rotate: { duration: 40, repeat: Infinity, ease: "linear" },
                        }}
                      >
                        {[...Array(8)].map((_, i) => {
                          const angle = (i / 8) * 360;
                          return (
                            <div
                              key={`ray-${i}`}
                              className="absolute left-1/2 top-1/2"
                              style={{
                                width: '2px',
                                height: '50%',
                                background: `linear-gradient(to bottom, ${bloomStyles.colors.honeyAmber}40, transparent)`,
                                transformOrigin: 'top center',
                                transform: `translateX(-50%) rotate(${angle}deg)`,
                                filter: 'blur(2px)',
                              }}
                            />
                          );
                        })}
                      </motion.div>
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
              whileHover={{ scale: isMobile ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleCheckEligibility}
                onMouseEnter={() => {
                  setIsButtonHovered(true);
                  setShowInkSpread(true);
                }}
                onMouseLeave={() => {
                  setIsButtonHovered(false);
                  setShowInkSpread(false);
                }}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchRipple}
                disabled={isLoading || !allQualified}
                className="w-full relative overflow-hidden group font-semibold flex items-center justify-center gap-2"
                style={{
                  height: '56px',
                  minHeight: '48px', // Touch target size
                  background: allQualified 
                    ? `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage} 0%, ${bloomStyles.colors.softFern} 100%)`
                    : 'linear-gradient(135deg, #9E9E9E 0%, #BDBDBD 100%)',
                  color: '#FEFDFB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: (isButtonHovered && allQualified)
                    ? `0 8px 28px ${bloomStyles.colors.eucalyptusSage}40`
                    : `0 4px 16px ${bloomStyles.colors.eucalyptusSage}25`,
                  opacity: (isLoading || !allQualified) ? 0.7 : 0.95,
                  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  cursor: (isLoading || !allQualified) ? 'not-allowed' : 'pointer',
                  transform: (isButtonHovered && allQualified) ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                {/* Phase 4: Paper texture overlay */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.3'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay',
                  }}
                />
                
                {/* Phase 4: Ink-spread effect (desktop only) */}
                {!isMobile && showInkSpread && (
                  <motion.div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${inkSpreadOrigin.x}%`,
                      top: `${inkSpreadOrigin.y}%`,
                      width: '300%',
                      height: '300%',
                      background: `radial-gradient(circle at center, ${bloomStyles.colors.softFern}30 0%, transparent 70%)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                )}
                
                {/* Phase 4: Shimmer sweep effect (desktop hover) */}
                {!isMobile && (
                  <motion.div
                    className="absolute inset-0 opacity-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    }}
                    animate={isButtonHovered ? { 
                      x: ['-100%', '100%'],
                      opacity: [0, 1, 0]
                    } : {}}
                    transition={{ 
                      duration: 1.2, 
                      ease: 'easeInOut',
                      repeat: isButtonHovered ? Infinity : 0,
                      repeatDelay: 0.5
                    }}
                  />
                )}

                {/* Phase 4: Mobile touch ripples */}
                {isMobile && ripples.map(ripple => (
                  <motion.div
                    key={ripple.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: '10px',
                      height: '10px',
                      background: 'rgba(255, 255, 255, 0.5)',
                      transform: 'translate(-50%, -50%)',
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 20, opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                ))}
                
                {/* Phase 4: Button content with loading state */}
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      {/* Loading spinner */}
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Checking...</span>
                    </>
                  ) : allQualified ? (
                    <>
                      {/* Phase 6: Qualified - Animated sparkle icon */}
                      <motion.div
                        animate={isButtonHovered ? {
                          rotate: [0, -15, 15, -10, 10, 0],
                          scale: [1, 1.2, 1.2, 1.1, 1.1, 1]
                        } : {}}
                        transition={{ 
                          duration: 1.2,
                          repeat: isButtonHovered ? Infinity : 0,
                          repeatDelay: 1
                        }}
                      >
                        <Sparkles 
                          className="w-5 h-5" 
                          style={{ opacity: 0.95 }}
                        />
                      </motion.div>
                      Check Eligibility
                    </>
                  ) : (
                    <>
                      {/* Phase 6: Not qualified - Seedling icon */}
                      <motion.div
                        animate={shouldReduceMotion ? {} : {
                          y: [0, -2, 0],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>🌱</span>
                      </motion.div>
                      Complete Your Garden
                    </>
                  )}
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

// Export flower components for Phase 7 landing page reuse
export { Tier1Flower, Tier2Flower, Tier3Flower };
export type { Tier1FlowerProps, Tier2FlowerProps, Tier3FlowerProps };

// Export ambient background components for Phase 7 landing page reuse
export { WatercolorBlob, FloatingParticle };
export type { WatercolorBlobProps, FloatingParticleProps };

// Export hooks for Phase 7 landing page reuse
export { useIsMobile };
