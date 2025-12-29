/**
 * Bloom Journey Infographic - Redesigned v2
 * 
 * Rich, warm, visually engaging journey through the practitioner experience.
 * Fixed-height content area with hover/tap reveals, decorated with 
 * botanical illustrations and soft gradients.
 */

import { useState, useRef, Fragment } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Bloom design system colors
const bloomColors = {
  eucalyptusSage: '#6B8E7F',
  softFern: '#8FA892',
  paleAmber: '#F5E6D3',
  softTerracotta: '#D4A28F',
  honeyAmber: '#E8B77D',
  clayTerracotta: '#C89B7B',
  warmCream: '#FAF7F2',
  paperWhite: '#FEFDFB',
};

// SVG Icons for each stage - bold, warm botanical style
const StageIcons = {
  apply: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="17" r="4" fill={color} opacity="0.4"/>
      <path d="M12 4V13" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 8C12 8 8 10 7 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 8C12 8 16 10 17 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="2" fill={color}/>
    </svg>
  ),
  setup: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21V10" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 10C12 10 7 7 7 4C7 2 9 1.5 12 4C15 1.5 17 2 17 4C17 7 12 10 12 10Z" fill={color} opacity="0.5" stroke={color} strokeWidth="2"/>
      <path d="M6 17L12 15L18 17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 20L12 18L16 20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  practice: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="9" r="6" fill={color} opacity="0.35"/>
      <circle cx="12" cy="9" r="3.5" fill={color} opacity="0.6"/>
      <circle cx="12" cy="9" r="1.5" fill={color}/>
      <path d="M12 15V22" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M8 19L12 21L16 19" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  earn: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill={color} opacity="0.25"/>
      <circle cx="12" cy="12" r="6" fill={color} opacity="0.35"/>
      <path d="M12 7V17" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M9 9.5H15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 14.5H14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  grow: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22V11" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 11C12 11 7 9 7 5C7 2 11 2 12 5" fill={color} opacity="0.4" stroke={color} strokeWidth="2"/>
      <path d="M12 11C12 11 17 9 17 5C17 2 13 2 12 5" fill={color} opacity="0.4" stroke={color} strokeWidth="2"/>
      <circle cx="7" cy="18" r="2.5" fill={color} opacity="0.5"/>
      <circle cx="17" cy="19" r="2" fill={color} opacity="0.5"/>
    </svg>
  ),
  security: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 6V11C4 16.5 7.5 21.5 12 23C16.5 21.5 20 16.5 20 11V6L12 2Z" fill={color} opacity="0.25" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  marketing: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Megaphone/spotlight icon */}
      <path d="M3 11V13C3 14.1 3.9 15 5 15H6L9 19H11V15H12C13.1 15 14 14.1 14 13V11C14 9.9 13.1 9 12 9H5C3.9 9 3 9.9 3 11Z" fill={color} opacity="0.35"/>
      <path d="M14 10L19 6V18L14 14" fill={color} opacity="0.5"/>
      <circle cx="20" cy="12" r="2" fill={color} opacity="0.6"/>
      {/* Sparkle/attention lines */}
      <path d="M17 5L18 4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 7L21.5 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M17 19L18 20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

// Journey stage data with story-like copy
interface JourneyStage {
  id: 'apply' | 'setup' | 'marketing' | 'practice' | 'earn' | 'grow' | 'security';
  title: string;
  timeframe: string;
  color: string;
  lightColor: string;
  story: string;
  details: string[];
}

const journeyStages: JourneyStage[] = [
  {
    id: 'apply',
    title: 'Apply',
    timeframe: '10-15 mins',
    color: bloomColors.eucalyptusSage,
    lightColor: `${bloomColors.eucalyptusSage}15`,
    story: "We're not just hiring—we're building a community of clinicians who care deeply about their craft and each other. If you value autonomy, collaboration, and doing meaningful work on your own terms, we'd love to hear from you. The application is simple: a quick eligibility check, your CV, and a short note about why Bloom feels right. Every application is read. Every applicant gets a reply.",
    details: [
      'Clinical Psychologist',
      '8+ years registered General Psych',
      'PhD + AHPRA registration',
    ],
  },
  {
    id: 'setup',
    title: 'Get Set Up',
    timeframe: '1-2 weeks',
    color: bloomColors.softFern,
    lightColor: `${bloomColors.softFern}15`,
    story: "We handle the admin. Your portal, your calendar, your billing—all ready before your first client.",
    details: [
      'Your own Bloom practice portal',
      'Medicare billing handled',
      '@life-psychology email',
      'Calendar & booking system',
    ],
  },
  {
    id: 'marketing',
    title: 'Get Noticed',
    timeframe: 'Ongoing',
    color: '#9B7BB8', // Soft purple for creativity/visibility
    lightColor: 'rgba(155, 123, 184, 0.15)',
    story: "We invest in your visibility. A professional profile, a professional photoshoot, and sophisticated marketing—all covered.",
    details: [
      'Professional profile on Life Psychology Australia',
      'Professional photoshoot (we pay)',
      'SEO-optimised online presence',
      'Google & Instagram ad campaigns',
    ],
  },
  {
    id: 'practice',
    title: 'See Clients',
    timeframe: 'Your schedule',
    color: bloomColors.softTerracotta,
    lightColor: `${bloomColors.softTerracotta}15`,
    story: "Your mornings look different now. Check your calendar over coffee. See clients from your couch. Evenings, weekends, school hours—you decide.",
    details: [
      'Run sessions from anywhere',
      'Work evenings & weekends if you like',
      'Clinical notes in one place',
      'Automated reminders & invoicing',
    ],
  },
  {
    id: 'earn',
    title: 'Get Paid',
    timeframe: 'Monthly',
    color: bloomColors.honeyAmber,
    lightColor: `${bloomColors.honeyAmber}15`,
    story: "No targets. No quotas. Set your own rate—$250, $280, $310, or $340 per session. You keep 80%.",
    details: [
      '80% to you, 20% covers everything',
      'Set your own session rate',
      'No hidden fees or lock-in',
    ],
  },
  {
    id: 'grow',
    title: 'Develop',
    timeframe: 'Year-round',
    color: bloomColors.clayTerracotta,
    lightColor: `${bloomColors.clayTerracotta}15`,
    story: "Supervision when you need it. Peers who understand. A community that grows together.",
    details: [
      'Supervision access',
      'Peer consultation groups',
      'CPD tracking',
      'Shape what Bloom becomes',
    ],
  },
  {
    id: 'security',
    title: 'Security',
    timeframe: 'Always',
    color: '#5B7B9A', // Steel blue for trust/security
    lightColor: 'rgba(91, 123, 154, 0.15)',
    story: "Your clients' data is protected to the highest standards. We comply with all legislation and peak body recommendations.",
    details: [
      'Microsoft security best practices',
      'Australian Privacy Act compliant',
      'AHPRA guidelines followed',
      'Data encrypted & secure',
    ],
  },
];

// Miyazaki-style floating seed/dandelion puff
const FloatingSeed = ({ delay = 0, startX = 20, color = bloomColors.eucalyptusSage }: { delay?: number; startX?: number; color?: string }) => (
  <motion.div
    initial={{ opacity: 0, x: startX, y: 100 }}
    animate={{ 
      opacity: [0, 0.6, 0.5, 0.3, 0],
      x: [startX, startX + 30, startX + 15, startX + 40],
      y: [100, 40, -20, -80],
      rotate: [0, 45, 90, 180],
    }}
    transition={{
      duration: 12,
      delay,
      repeat: Infinity,
      ease: 'easeOut',
    }}
    style={{
      position: 'absolute',
      left: `${startX}%`,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 1,
    }}
  >
    {/* Seed body */}
    <div style={{
      width: '3px',
      height: '8px',
      background: color,
      borderRadius: '50%',
      opacity: 0.6,
    }} />
    {/* Fluffy top */}
    <div style={{
      position: 'absolute',
      top: '-6px',
      left: '-4px',
      width: '10px',
      height: '10px',
      background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
      borderRadius: '50%',
    }} />
  </motion.div>
);

// Soft dust mote catching light
const DustMote = ({ delay = 0, x = 50, y = 50, size = 4, duration = 5 }: { delay?: number; x?: number; y?: number; size?: number; duration?: number }) => (
  <motion.div
    animate={{ 
      opacity: [0.2, 0.6, 0.3, 0.5, 0.2],
      scale: [1, 1.2, 0.9, 1.1, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)`,
      boxShadow: '0 0 8px rgba(255,255,255,0.5)',
      pointerEvents: 'none',
    }}
  />
);

// Decorative floating leaf
const FloatingLeaf = ({ delay = 0, left = '10%', color = bloomColors.eucalyptusSage }: { delay?: number; left?: string; color?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, rotate: -10 }}
    animate={{ 
      opacity: [0, 0.4, 0.4, 0],
      y: [20, -20, -40, -60],
      rotate: [-10, 5, -5, 10],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    style={{
      position: 'absolute',
      left,
      bottom: '20%',
      width: '12px',
      height: '12px',
      borderRadius: '50% 0',
      background: color,
      opacity: 0.3,
      pointerEvents: 'none',
    }}
  />
);

interface Props {
  isMobile: boolean;
  onApplyClick?: () => void; // Optional - CTA now in parent page
}

export function BloomJourneyInfographic({ isMobile }: Props) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [lockedStage, setLockedStage] = useState<string | null>(null);
  // Start at -1 for intro card, 0-5 for stages
  const [mobileIndex, setMobileIndex] = useState(-1);
  const prefersReducedMotion = useReducedMotion();
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Active stage is locked stage if set, otherwise hovered stage
  // When locked, ONLY show locked content (ignore hover completely)
  const activeStage = lockedStage ? lockedStage : hoveredStage;
  
  const currentStage = activeStage 
    ? journeyStages.find(s => s.id === activeStage) 
    : null;

  const handleStageClick = (stageId: string) => {
    // Toggle lock: if already locked on this stage, unlock; otherwise lock to this stage
    if (lockedStage === stageId) {
      setLockedStage(null);
    } else {
      setLockedStage(stageId);
      setHoveredStage(null); // Clear hover state when locking
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    // -1 is intro, 0 to journeyStages.length - 1 are stages
    if (direction === 'left' && mobileIndex < journeyStages.length - 1) {
      setMobileIndex(mobileIndex + 1);
    } else if (direction === 'right' && mobileIndex > -1) {
      setMobileIndex(mobileIndex - 1);
    }
  };

  // Touch handlers for better mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) {
      handleSwipe('left');
    } else if (diff < -threshold) {
      handleSwipe('right');
    }
  };

  // mobileIndex -1 = intro card, 0+ = stages
  const currentMobileStage = mobileIndex >= 0 ? journeyStages[mobileIndex] : null;
  const IconComponent = currentMobileStage ? StageIcons[currentMobileStage.id] : null;
  const isIntroCard = mobileIndex === -1;

  return (
    <section
      style={{
        padding: isMobile ? '32px 20px 40px' : '40px 24px 48px',
        maxWidth: '1000px',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Miyazaki-style atmospheric background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 20% 10%, ${bloomColors.eucalyptusSage}18 0%, transparent 45%),
                       radial-gradient(ellipse at 80% 30%, ${bloomColors.honeyAmber}15 0%, transparent 40%),
                       radial-gradient(ellipse at 60% 90%, ${bloomColors.softTerracotta}12 0%, transparent 45%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Paper texture overlay - subtle grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }}
      />

      {/* Floating seeds - Miyazaki magic */}
      {!prefersReducedMotion && !isMobile && (
        <>
          <FloatingSeed delay={0} startX={10} color={bloomColors.eucalyptusSage} />
          <FloatingSeed delay={3} startX={30} color={bloomColors.softFern} />
          <FloatingSeed delay={6} startX={70} color={bloomColors.softTerracotta} />
          <FloatingSeed delay={9} startX={85} color={bloomColors.honeyAmber} />
        </>
      )}

      {/* Dust motes catching light */}
      {!prefersReducedMotion && !isMobile && (
        <>
          <DustMote delay={0} x={15} y={20} size={3} duration={4.5} />
          <DustMote delay={1} x={75} y={35} size={4} duration={5.5} />
          <DustMote delay={2} x={45} y={60} size={3} duration={6} />
          <DustMote delay={0.5} x={85} y={75} size={5} duration={4} />
          <DustMote delay={1.5} x={25} y={80} size={3} duration={5} />
        </>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: 'center',
          marginBottom: isMobile ? '24px' : '28px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Decorative botanical accent */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
          {/* Left leaf */}
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: [-2, 2, -2], y: [0, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: '-28px',
              top: '50%',
              transform: 'translateY(-50%) rotate(-30deg)',
              width: '20px',
              height: '10px',
              background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage}60, ${bloomColors.softFern}40)`,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            }}
          />
          {/* Right leaf */}
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: [2, -2, 2], y: [0, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{
              position: 'absolute',
              right: '-28px',
              top: '50%',
              transform: 'translateY(-50%) rotate(30deg)',
              width: '20px',
              height: '10px',
              background: `linear-gradient(135deg, ${bloomColors.softTerracotta}60, ${bloomColors.honeyAmber}40)`,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            }}
          />
          {/* Center line with glow */}
          <div
            style={{
              width: '80px',
              height: '4px',
              background: `linear-gradient(90deg, ${bloomColors.eucalyptusSage}, ${bloomColors.honeyAmber}, ${bloomColors.softTerracotta})`,
              borderRadius: '2px',
              boxShadow: `0 2px 12px ${bloomColors.eucalyptusSage}50, 0 0 20px ${bloomColors.honeyAmber}30`,
            }}
          />
        </div>
        <h2
          style={{
            fontSize: isMobile ? '28px' : '34px',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.clayTerracotta} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
          }}
        >
          Your Journey
        </h2>
        <p
          style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#666',
            maxWidth: '450px',
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          From application to thriving practice
        </p>
      </motion.div>

      {/* Main Content - Desktop */}
      {!isMobile && (
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          {/* Stage Navigation Pills */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            {journeyStages.map((stage) => {
              const Icon = StageIcons[stage.id];
              const isActive = activeStage === stage.id;
              const isLocked = lockedStage === stage.id;
              
              return (
                <motion.button
                  key={stage.id}
                  onMouseEnter={() => !lockedStage && setHoveredStage(stage.id)}
                  onMouseLeave={() => !lockedStage && setHoveredStage(null)}
                  onClick={() => handleStageClick(stage.id)}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '10px 16px',
                    background: isActive 
                      ? `linear-gradient(135deg, ${stage.color}40, ${stage.color}25)`
                      : `linear-gradient(135deg, white, ${stage.color}15)`,
                    border: `2px solid ${isActive ? stage.color : stage.color + '80'}`,
                    borderRadius: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: isActive 
                      ? `0 8px 24px ${stage.color}45`
                      : `0 4px 16px ${stage.color}25`,
                    position: 'relative',
                  }}
                >
                  {/* Lock indicator */}
                  {isLocked && (
                    <div style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      width: '18px',
                      height: '18px',
                      background: stage.color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ 
                    opacity: 1,
                    transition: 'transform 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  }}>
                    {Icon(stage.color)}
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isActive ? stage.color : '#3A3A3A',
                      transition: 'color 0.3s',
                    }}
                  >
                    {stage.title}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      background: isActive ? stage.color : `${stage.color}50`,
                      color: isActive ? 'white' : stage.color,
                      borderRadius: '12px',
                      transition: 'all 0.3s',
                    }}
                  >
                    {stage.timeframe}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Fixed-Height Content Area - Miyazaki-style window */}
          <div
            style={{
              minHeight: '260px',
              background: `linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, ${bloomColors.warmCream} 100%)`,
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              border: `2px solid ${currentStage ? currentStage.color + '40' : 'rgba(107, 142, 127, 0.2)'}`,
              padding: '32px 36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: currentStage 
                ? `0 12px 40px ${currentStage.color}20, inset 0 1px 0 rgba(255,255,255,0.8)`
                : '0 8px 32px rgba(107, 142, 127, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
              transition: 'all 0.4s ease',
            }}
          >
            {/* Soft inner glow */}
            <div
              style={{
                position: 'absolute',
                inset: '10px',
                borderRadius: '20px',
                background: currentStage 
                  ? `radial-gradient(ellipse at center, ${currentStage.color}08 0%, transparent 70%)`
                  : 'radial-gradient(ellipse at center, rgba(107, 142, 127, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
                transition: 'background 0.4s',
              }}
            />

            {/* Decorative corner flourishes */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                width: '50px',
                height: '50px',
                borderTop: `2px solid ${currentStage ? currentStage.color + '50' : bloomColors.eucalyptusSage + '30'}`,
                borderLeft: `2px solid ${currentStage ? currentStage.color + '50' : bloomColors.eucalyptusSage + '30'}`,
                borderRadius: '12px 0 0 0',
                transition: 'border-color 0.4s',
              }}
            />
            {/* Small accent dot */}
            <div
              style={{
                position: 'absolute',
                top: '24px',
                left: '24px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: currentStage ? currentStage.color : bloomColors.eucalyptusSage,
                opacity: 0.4,
                transition: 'background 0.4s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                width: '50px',
                height: '50px',
                borderBottom: `2px solid ${currentStage ? currentStage.color + '50' : bloomColors.softTerracotta + '30'}`,
                borderRight: `2px solid ${currentStage ? currentStage.color + '50' : bloomColors.softTerracotta + '30'}`,
                borderRadius: '0 0 12px 0',
                transition: 'border-color 0.4s',
              }}
            />
            {/* Small accent dot */}
            <div
              style={{
                position: 'absolute',
                bottom: '24px',
                right: '24px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: currentStage ? currentStage.color : bloomColors.softTerracotta,
                opacity: 0.4,
                transition: 'background 0.4s',
              }}
            />

            {/* Floating decorative elements */}
            {!prefersReducedMotion && (
              <>
                <FloatingLeaf delay={0} left="15%" color={bloomColors.eucalyptusSage} />
                <FloatingLeaf delay={2} left="75%" color={bloomColors.softTerracotta} />
                <FloatingLeaf delay={4} left="45%" color={bloomColors.honeyAmber} />
              </>
            )}

            <AnimatePresence mode="wait">
              {currentStage ? (
                <motion.div
                  key={currentStage.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
                  style={{
                    textAlign: 'center',
                    maxWidth: '600px',
                    position: 'relative',
                  }}
                >
                  {/* Soft radiant glow behind icon */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      position: 'absolute',
                      top: '-30px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '200px',
                      height: '200px',
                      background: `radial-gradient(circle, ${currentStage.color}18 0%, ${currentStage.color}08 40%, transparent 70%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  
                  {/* Tiny sparkle particles around icon */}
                  {!prefersReducedMotion && [0, 1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        x: [0, Math.cos(i * 72 * Math.PI / 180) * 60],
                        y: [0, Math.sin(i * 72 * Math.PI / 180) * 60 - 40],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.15,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: 'easeOut',
                      }}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: currentStage.color,
                        boxShadow: `0 0 6px ${currentStage.color}`,
                        pointerEvents: 'none',
                      }}
                    />
                  ))}

                  {/* Stage icon large */}
                  <motion.div
                    animate={prefersReducedMotion ? {} : { scale: [1, 1.03, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      width: '64px',
                      height: '64px',
                      margin: '0 auto 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(145deg, ${currentStage.color}15, ${currentStage.color}08)`,
                      borderRadius: '20px',
                      transform: 'scale(2)',
                      boxShadow: `0 8px 24px ${currentStage.color}20`,
                      border: `1px solid ${currentStage.color}15`,
                    }}
                  >
                    {StageIcons[currentStage.id](currentStage.color)}
                  </motion.div>

                  {/* Stage Story */}
                  <p
                    style={{
                      fontSize: '21px',
                      lineHeight: 1.75,
                      color: '#3A3A3A',
                      marginBottom: '28px',
                      fontWeight: 400,
                    }}
                  >
                    {currentStage.story}
                  </p>
                  
                  {/* Details as soft tags - like little petals */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '10px',
                    }}
                  >
                    {currentStage.details.map((detail, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.85, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ 
                          delay: i * 0.08,
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                        }}
                        whileHover={prefersReducedMotion ? {} : { 
                          scale: 1.05,
                          boxShadow: `0 4px 16px ${currentStage.color}30`,
                        }}
                        style={{
                          padding: '10px 18px',
                          background: `linear-gradient(135deg, ${currentStage.color}12, ${currentStage.color}08)`,
                          color: currentStage.color,
                          fontSize: '14px',
                          fontWeight: 500,
                          borderRadius: '20px',
                          border: `1px solid ${currentStage.color}25`,
                          boxShadow: `0 2px 8px ${currentStage.color}10`,
                          cursor: 'default',
                          transition: 'box-shadow 0.2s',
                        }}
                      >
                        {detail}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  style={{ textAlign: 'center', position: 'relative' }}
                >
                  {/* Soft glow behind icons */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -60%)',
                      width: '300px',
                      height: '120px',
                      background: `radial-gradient(ellipse, ${bloomColors.honeyAmber}20 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  
                  {/* Five steps visual */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '28px',
                      position: 'relative',
                    }}
                  >
                    {journeyStages.map((stage, i) => (
                      <Fragment key={stage.id}>
                        <motion.div
                          animate={{ 
                            y: [0, -4, 0],
                          }}
                          transition={{ 
                            duration: 2.5,
                            delay: i * 0.3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          style={{
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(145deg, ${stage.color}30, ${stage.color}15)`,
                            borderRadius: '14px',
                            border: `2px solid ${stage.color}60`,
                            boxShadow: `0 4px 16px ${stage.color}25`,
                          }}
                        >
                          {StageIcons[stage.id](stage.color)}
                        </motion.div>
                        {i < journeyStages.length - 1 && (
                          <div style={{
                            width: '16px',
                            height: '2px',
                            background: `linear-gradient(90deg, ${stage.color}50, ${journeyStages[i + 1].color}50)`,
                            borderRadius: '1px',
                          }} />
                        )}
                      </Fragment>
                    ))}
                  </div>

                  {/* Value proposition - 80% */}
                  <motion.div
                    animate={prefersReducedMotion ? {} : { scale: [1, 1.01, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      display: 'inline-block',
                      padding: '16px 28px',
                      background: 'linear-gradient(135deg, #2D5A4A 0%, #3D7A5A 100%)',
                      borderRadius: '16px',
                      boxShadow: '0 6px 24px rgba(45, 90, 74, 0.3)',
                      marginBottom: '20px',
                    }}
                  >
                    <p style={{
                      fontSize: '42px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      margin: 0,
                      lineHeight: 1,
                    }}>
                      80%
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.9)',
                      margin: '4px 0 0 0',
                      fontWeight: 500,
                    }}>
                      of session fees to you
                    </p>
                  </motion.div>

                  {/* Industry comparison - compact */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    marginBottom: '24px',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Industry avg</p>
                      <p style={{ 
                        fontSize: '20px', 
                        fontWeight: 600, 
                        color: '#aaa',
                        margin: '2px 0 0 0',
                        textDecoration: 'line-through',
                        textDecorationColor: bloomColors.softTerracotta,
                      }}>
                        40-55%
                      </p>
                    </div>
                    <div style={{ 
                      width: '1px', 
                      background: 'rgba(0,0,0,0.1)',
                    }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', color: bloomColors.eucalyptusSage, margin: 0, fontWeight: 500 }}>With Bloom</p>
                      <p style={{ 
                        fontSize: '20px', 
                        fontWeight: 700, 
                        color: bloomColors.eucalyptusSage,
                        margin: '2px 0 0 0',
                      }}>
                        80%
                      </p>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: '15px',
                      color: '#666',
                      lineHeight: 1.7,
                      marginBottom: '16px',
                      maxWidth: '440px',
                      margin: '0 auto 16px',
                    }}
                  >
                    Join <strong style={{ color: '#3A3A3A' }}>Life Psychology Australia</strong>, our telehealth clinic.
                    <br />
                    <span style={{ color: bloomColors.eucalyptusSage }}>Bloom</span> is the app that powers your practice.
                  </p>
                  
                  {/* Minimum criteria */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '16px',
                  }}>
                    <span style={{
                      padding: '6px 14px',
                      background: `${bloomColors.eucalyptusSage}12`,
                      color: bloomColors.eucalyptusSage,
                      fontSize: '13px',
                      fontWeight: 500,
                      borderRadius: '16px',
                      border: `1px solid ${bloomColors.eucalyptusSage}30`,
                    }}>
                      Clinical Psych
                    </span>
                    <span style={{ color: '#999', fontSize: '13px', alignSelf: 'center' }}>or</span>
                    <span style={{
                      padding: '6px 14px',
                      background: `${bloomColors.softFern}12`,
                      color: bloomColors.softFern,
                      fontSize: '13px',
                      fontWeight: 500,
                      borderRadius: '16px',
                      border: `1px solid ${bloomColors.softFern}30`,
                    }}>
                      8+ yrs General Psych
                    </span>
                    <span style={{ color: '#999', fontSize: '13px', alignSelf: 'center' }}>or</span>
                    <span style={{
                      padding: '6px 14px',
                      background: `${bloomColors.honeyAmber}12`,
                      color: bloomColors.clayTerracotta,
                      fontSize: '13px',
                      fontWeight: 500,
                      borderRadius: '16px',
                      border: `1px solid ${bloomColors.honeyAmber}30`,
                    }}>
                      PhD + AHPRA
                    </span>
                  </div>
                  
                  <p
                    style={{
                      fontSize: '14px',
                      color: bloomColors.eucalyptusSage,
                      fontWeight: 500,
                    }}
                  >
                    Every application receives a reply.
                  </p>
                  
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#999',
                      marginTop: '24px',
                      fontStyle: 'italic',
                    }}
                  >
                    Click any stage to explore
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Main Content - Mobile */}
      {isMobile && (
        <div>
          {/* Swipeable Carousel */}
          <div
            ref={carouselRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '24px',
              marginBottom: '24px',
              touchAction: 'pan-y', // Allow vertical scroll, capture horizontal
            }}
          >
            <div
              style={{
                background: `linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, ${bloomColors.warmCream} 100%)`,
                borderRadius: '24px',
                border: `2px solid ${isIntroCard ? bloomColors.eucalyptusSage : currentMobileStage?.color}30`,
                padding: '36px 24px 28px',
                minHeight: '420px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: `0 8px 24px ${isIntroCard ? bloomColors.eucalyptusSage : currentMobileStage?.color}15`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative top accent */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, ${isIntroCard ? bloomColors.eucalyptusSage : currentMobileStage?.color}60, ${isIntroCard ? bloomColors.honeyAmber : currentMobileStage?.color}20)`,
                }}
              />

              <AnimatePresence mode="wait">
                {isIntroCard ? (
                  /* INTRO CARD - 80% value proposition */
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                  >
                    {/* Value proposition - 80% */}
                    <motion.div
                      animate={prefersReducedMotion ? {} : { scale: [1, 1.02, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        display: 'block',
                        padding: '20px 24px',
                        background: 'linear-gradient(135deg, #2D5A4A 0%, #3D7A5A 100%)',
                        borderRadius: '18px',
                        boxShadow: '0 8px 28px rgba(45, 90, 74, 0.35)',
                        marginBottom: '24px',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{
                        fontSize: '52px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        margin: 0,
                        lineHeight: 1,
                      }}>
                        80%
                      </p>
                      <p style={{
                        fontSize: '15px',
                        color: 'rgba(255,255,255,0.92)',
                        margin: '6px 0 0 0',
                        fontWeight: 500,
                      }}>
                        of session fees to you
                      </p>
                    </motion.div>

                    {/* Industry comparison */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '24px',
                      marginBottom: '24px',
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Industry avg</p>
                        <p style={{ 
                          fontSize: '22px', 
                          fontWeight: 600, 
                          color: '#aaa',
                          margin: '4px 0 0 0',
                          textDecoration: 'line-through',
                          textDecorationColor: bloomColors.softTerracotta,
                        }}>
                          40-55%
                        </p>
                      </div>
                      <div style={{ 
                        width: '1px', 
                        background: 'rgba(0,0,0,0.1)',
                      }} />
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', color: bloomColors.eucalyptusSage, margin: 0, fontWeight: 500 }}>With Bloom</p>
                        <p style={{ 
                          fontSize: '22px', 
                          fontWeight: 700, 
                          color: bloomColors.eucalyptusSage,
                          margin: '4px 0 0 0',
                        }}>
                          80%
                        </p>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: '15px',
                        color: '#555',
                        lineHeight: 1.7,
                        textAlign: 'center',
                        marginBottom: '20px',
                      }}
                    >
                      Join <strong style={{ color: '#3A3A3A' }}>Life Psychology Australia</strong>, our telehealth clinic.
                      <br />
                      <span style={{ color: bloomColors.eucalyptusSage }}>Bloom</span> is the app that powers your practice.
                    </p>
                    
                    {/* Minimum criteria */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        padding: '8px 16px',
                        background: `${bloomColors.eucalyptusSage}12`,
                        color: bloomColors.eucalyptusSage,
                        fontSize: '14px',
                        fontWeight: 500,
                        borderRadius: '16px',
                        border: `1px solid ${bloomColors.eucalyptusSage}30`,
                      }}>
                        Clinical Psych
                      </span>
                      <span style={{ color: '#999', fontSize: '12px' }}>or</span>
                      <span style={{
                        padding: '8px 16px',
                        background: `${bloomColors.softFern}12`,
                        color: bloomColors.softFern,
                        fontSize: '14px',
                        fontWeight: 500,
                        borderRadius: '16px',
                        border: `1px solid ${bloomColors.softFern}30`,
                      }}>
                        8+ yrs General Psych
                      </span>
                      <span style={{ color: '#999', fontSize: '12px' }}>or</span>
                      <span style={{
                        padding: '8px 16px',
                        background: `${bloomColors.honeyAmber}12`,
                        color: bloomColors.clayTerracotta,
                        fontSize: '14px',
                        fontWeight: 500,
                        borderRadius: '16px',
                        border: `1px solid ${bloomColors.honeyAmber}30`,
                      }}>
                        PhD + AHPRA
                      </span>
                    </div>
                  </motion.div>
                ) : currentMobileStage && IconComponent && (
                  /* STAGE CARDS */
                  <motion.div
                    key={currentMobileStage.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                  >
                    {/* Header with icon */}
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          margin: '0 auto 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${currentMobileStage.color}15`,
                          borderRadius: '16px',
                          transform: 'scale(1.5)',
                        }}
                      >
                        {IconComponent(currentMobileStage.color)}
                      </div>
                      <h3
                        style={{
                          fontSize: '26px',
                          fontWeight: 700,
                          color: currentMobileStage.color,
                          marginBottom: '6px',
                        }}
                      >
                        {currentMobileStage.title}
                      </h3>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '5px 14px',
                          background: `${currentMobileStage.color}15`,
                          color: currentMobileStage.color,
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: '14px',
                        }}
                      >
                        {currentMobileStage.timeframe}
                      </span>
                    </div>

                    {/* Story */}
                    <p
                      style={{
                        fontSize: '17px',
                        lineHeight: 1.7,
                        color: '#3A3A3A',
                        textAlign: 'center',
                        marginBottom: '24px',
                      }}
                    >
                      {currentMobileStage.story}
                    </p>

                    {/* Details */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        marginTop: 'auto',
                      }}
                    >
                      {currentMobileStage.details.map((detail, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '12px 16px',
                            background: `${currentMobileStage.color}08`,
                            color: '#4A4A4A',
                            fontSize: '14px',
                            borderRadius: '14px',
                            borderLeft: `3px solid ${currentMobileStage.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: currentMobileStage.color,
                              flexShrink: 0,
                            }}
                          />
                          {detail}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Swipe hint */}
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '13px',
                color: isIntroCard ? bloomColors.eucalyptusSage : currentMobileStage?.color,
                pointerEvents: 'none',
                fontWeight: 500,
              }}
            >
              ← swipe →
            </motion.div>
          </div>

          {/* Dot indicators with stage colors - includes intro dot */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            {/* Intro dot */}
            <button
              onClick={() => setMobileIndex(-1)}
              style={{
                width: mobileIndex === -1 ? '28px' : '10px',
                height: '10px',
                borderRadius: '5px',
                background: mobileIndex === -1 
                  ? `linear-gradient(90deg, ${bloomColors.eucalyptusSage}, ${bloomColors.honeyAmber})`
                  : '#D1D5DB',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: mobileIndex === -1 ? `0 2px 8px ${bloomColors.eucalyptusSage}40` : 'none',
              }}
              aria-label="Go to intro"
            />
            {journeyStages.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => setMobileIndex(index)}
                style={{
                  width: index === mobileIndex ? '28px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  background: index === mobileIndex ? stage.color : '#D1D5DB',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: index === mobileIndex ? `0 2px 8px ${stage.color}40` : 'none',
                }}
                aria-label={`Go to ${stage.title}`}
              />
            ))}
          </div>

          {/* Stage labels below dots - scrollable */}
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '4px',
              padding: '0 4px 8px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <button
              onClick={() => setMobileIndex(-1)}
              style={{
                fontSize: '11px',
                fontWeight: mobileIndex === -1 ? 700 : 400,
                color: mobileIndex === -1 ? bloomColors.eucalyptusSage : '#999',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 8px',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              80%
            </button>
            {journeyStages.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => setMobileIndex(index)}
                style={{
                  fontSize: '11px',
                  fontWeight: index === mobileIndex ? 700 : 400,
                  color: index === mobileIndex ? stage.color : '#999',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {stage.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Stats - Enhanced */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? '20px' : '40px',
          marginTop: isMobile ? '48px' : '64px',
          padding: isMobile ? '28px 16px' : '36px 32px',
          background: `linear-gradient(135deg, ${bloomColors.warmCream} 0%, white 100%)`,
          borderRadius: '20px',
          border: '1px solid rgba(107, 142, 127, 0.1)',
        }}
      >
        {[
          { value: '80%', label: 'You keep', color: bloomColors.eucalyptusSage, icon: '💰' },
          { value: '0', label: 'Quotas', color: bloomColors.softTerracotta, icon: '🎯' },
          { value: 'No', label: 'Lock-in', color: bloomColors.honeyAmber, icon: '🔓' },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: 'center', flex: 1, maxWidth: '120px' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
            <div
              style={{
                fontSize: isMobile ? '32px' : '40px',
                fontWeight: 700,
                color: stat.color,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: isMobile ? '13px' : '14px',
                color: '#666',
                marginTop: '6px',
                fontWeight: 500,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

export default BloomJourneyInfographic;
