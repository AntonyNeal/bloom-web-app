/**
 * Bloom Journey Infographic - Redesigned v2
 * 
 * Rich, warm, visually engaging journey through the practitioner experience.
 * Fixed-height content area with hover/tap reveals, decorated with 
 * botanical illustrations and soft gradients.
 */

import { useState, useRef } from 'react';
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

// SVG Icons for each stage - simple, warm botanical style
const StageIcons = {
  apply: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C12 3 12 8 12 10C12 12 10 14 8 14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 10C12 10 14 12 16 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="18" r="3" fill={color} opacity="0.3"/>
      <circle cx="12" cy="18" r="1.5" fill={color}/>
    </svg>
  ),
  setup: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21V8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 8C12 8 8 6 8 4C8 2 10 2 12 4C14 2 16 2 16 4C16 6 12 8 12 8Z" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5"/>
      <path d="M8 16L12 14L16 16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 20L12 18L18 20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  practice: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="10" r="6" fill={color} opacity="0.2"/>
      <circle cx="12" cy="10" r="3" fill={color} opacity="0.4"/>
      <circle cx="12" cy="10" r="1.5" fill={color}/>
      <path d="M12 16V21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 19L12 21L15 19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  earn: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill={color} opacity="0.15"/>
      <circle cx="12" cy="12" r="5" fill={color} opacity="0.25"/>
      <path d="M12 8V16M9 10.5H15M9 13.5H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  grow: (color: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21V12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 12C12 12 8 10 8 6C8 3 12 3 12 6" stroke={color} strokeWidth="1.5" fill={color} opacity="0.2"/>
      <path d="M12 12C12 12 16 10 16 6C16 3 12 3 12 6" stroke={color} strokeWidth="1.5" fill={color} opacity="0.2"/>
      <path d="M12 8C12 8 10 6 10 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 8C12 8 14 6 14 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="18" r="2" fill={color} opacity="0.3"/>
      <circle cx="16" cy="19" r="1.5" fill={color} opacity="0.3"/>
    </svg>
  ),
};

// Journey stage data with story-like copy
interface JourneyStage {
  id: 'apply' | 'setup' | 'practice' | 'earn' | 'grow';
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
    timeframe: '5 mins',
    color: bloomColors.eucalyptusSage,
    lightColor: `${bloomColors.eucalyptusSage}15`,
    story: "Three questions. That's it. We just want to know you're registered and ready. No cover letters, no hoops.",
    details: [
      'Clinical Psychologist, or',
      '8+ years registered, or',
      'PhD with AHPRA registration',
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
      'Telehealth video built in',
      'Medicare billing handled',
      '@life-psychology email',
    ],
  },
  {
    id: 'practice',
    title: 'See Clients',
    timeframe: 'Ongoing',
    color: bloomColors.softTerracotta,
    lightColor: `${bloomColors.softTerracotta}15`,
    story: "Your mornings look different now. Check your calendar over coffee. See clients from your couch. Notes done before dinner.",
    details: [
      'Run sessions from anywhere',
      'Clinical notes in one place',
      'Automated reminders & invoicing',
      'Your schedule, always',
    ],
  },
  {
    id: 'earn',
    title: 'Get Paid',
    timeframe: 'Monthly',
    color: bloomColors.honeyAmber,
    lightColor: `${bloomColors.honeyAmber}15`,
    story: "No targets. No quotas. Just fair pay for good work. $250 session means $200 in your pocket.",
    details: [
      '80% to you, 20% covers everything',
      'No hidden fees',
      'Leave anytime—clients stay yours',
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
];

// Decorative floating elements
const FloatingLeaf = ({ delay = 0, left = '10%', color = bloomColors.eucalyptusSage }) => (
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
  onApplyClick: () => void;
}

export function BloomJourneyInfographic({ isMobile, onApplyClick }: Props) {
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const carouselRef = useRef<HTMLDivElement>(null);

  const currentStage = activeStage 
    ? journeyStages.find(s => s.id === activeStage) 
    : null;

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && mobileIndex < journeyStages.length - 1) {
      setMobileIndex(mobileIndex + 1);
    } else if (direction === 'right' && mobileIndex > 0) {
      setMobileIndex(mobileIndex - 1);
    }
  };

  const currentMobileStage = journeyStages[mobileIndex];
  const IconComponent = StageIcons[currentMobileStage.id];

  return (
    <section
      style={{
        padding: isMobile ? '48px 20px 64px' : '72px 24px 80px',
        maxWidth: '1000px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Decorative background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 30% 20%, ${bloomColors.eucalyptusSage}08 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, ${bloomColors.softTerracotta}06 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: 'center',
          marginBottom: isMobile ? '36px' : '48px',
          position: 'relative',
        }}
      >
        {/* Decorative line */}
        <div
          style={{
            width: '60px',
            height: '3px',
            background: `linear-gradient(90deg, ${bloomColors.eucalyptusSage}, ${bloomColors.softTerracotta})`,
            margin: '0 auto 20px',
            borderRadius: '2px',
          }}
        />
        <h2
          style={{
            fontSize: isMobile ? '32px' : '42px',
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
            fontSize: isMobile ? '16px' : '18px',
            color: '#666',
            maxWidth: '450px',
            margin: '0 auto',
            lineHeight: 1.6,
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
              gap: '12px',
              marginBottom: '32px',
              flexWrap: 'wrap',
            }}
          >
            {journeyStages.map((stage) => {
              const Icon = StageIcons[stage.id];
              const isActive = activeStage === stage.id;
              
              return (
                <motion.button
                  key={stage.id}
                  onMouseEnter={() => setActiveStage(stage.id)}
                  onMouseLeave={() => setActiveStage(null)}
                  onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '14px 22px',
                    background: isActive 
                      ? `linear-gradient(135deg, ${stage.color}18, ${stage.color}08)`
                      : 'rgba(255, 255, 255, 0.85)',
                    border: `2px solid ${isActive ? stage.color : stage.color + '35'}`,
                    borderRadius: '28px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: isActive 
                      ? `0 4px 16px ${stage.color}25`
                      : '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ 
                    opacity: isActive ? 1 : 0.7,
                    transition: 'opacity 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {Icon(stage.color)}
                  </div>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isActive ? stage.color : '#4A4A4A',
                      transition: 'color 0.3s',
                    }}
                  >
                    {stage.title}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '3px 10px',
                      background: `${stage.color}18`,
                      color: stage.color,
                      borderRadius: '12px',
                    }}
                  >
                    {stage.timeframe}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Fixed-Height Content Area */}
          <div
            style={{
              minHeight: '320px',
              background: `linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, ${bloomColors.warmCream}90 100%)`,
              backdropFilter: 'blur(10px)',
              borderRadius: '28px',
              border: `1px solid ${currentStage ? currentStage.color + '25' : 'rgba(107, 142, 127, 0.12)'}`,
              padding: '56px 48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(107, 142, 127, 0.08)',
              transition: 'border-color 0.4s ease',
            }}
          >
            {/* Decorative corner elements */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                width: '40px',
                height: '40px',
                borderTop: `2px solid ${currentStage ? currentStage.color + '30' : bloomColors.eucalyptusSage + '20'}`,
                borderLeft: `2px solid ${currentStage ? currentStage.color + '30' : bloomColors.eucalyptusSage + '20'}`,
                borderRadius: '8px 0 0 0',
                transition: 'border-color 0.4s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
                borderBottom: `2px solid ${currentStage ? currentStage.color + '30' : bloomColors.softTerracotta + '20'}`,
                borderRight: `2px solid ${currentStage ? currentStage.color + '30' : bloomColors.softTerracotta + '20'}`,
                borderRadius: '0 0 8px 0',
                transition: 'border-color 0.4s',
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
                  }}
                >
                  {/* Stage icon large */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      margin: '0 auto 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${currentStage.color}12`,
                      borderRadius: '20px',
                      transform: 'scale(2)',
                    }}
                  >
                    {StageIcons[currentStage.id](currentStage.color)}
                  </div>

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
                  
                  {/* Details as soft tags */}
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
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          padding: '10px 18px',
                          background: `${currentStage.color}10`,
                          color: currentStage.color,
                          fontSize: '14px',
                          fontWeight: 500,
                          borderRadius: '20px',
                          border: `1px solid ${currentStage.color}20`,
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
                  style={{ textAlign: 'center' }}
                >
                  {/* Combined icon representation */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '16px',
                      marginBottom: '28px',
                    }}
                  >
                    {journeyStages.map((stage, i) => (
                      <motion.div
                        key={stage.id}
                        animate={{ 
                          y: [0, -4, 0],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{ 
                          duration: 2,
                          delay: i * 0.3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        style={{
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${stage.color}10`,
                          borderRadius: '12px',
                        }}
                      >
                        {StageIcons[stage.id](stage.color)}
                      </motion.div>
                    ))}
                  </div>

                  <p
                    style={{
                      fontSize: '36px',
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softTerracotta} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '12px',
                      lineHeight: 1.2,
                    }}
                  >
                    80% to you.
                    <br />
                    <span style={{ fontSize: '28px', opacity: 0.8 }}>We handle the rest.</span>
                  </p>
                  <p
                    style={{
                      fontSize: '15px',
                      color: '#888',
                      marginTop: '16px',
                    }}
                  >
                    Hover over each stage above
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
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '24px',
              marginBottom: '24px',
            }}
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) handleSwipe('left');
                if (info.offset.x > 50) handleSwipe('right');
              }}
              style={{
                background: `linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, ${bloomColors.warmCream} 100%)`,
                borderRadius: '24px',
                border: `2px solid ${currentMobileStage.color}30`,
                padding: '36px 24px 28px',
                minHeight: '380px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'grab',
                boxShadow: `0 8px 24px ${currentMobileStage.color}15`,
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
                  background: `linear-gradient(90deg, ${currentMobileStage.color}60, ${currentMobileStage.color}20)`,
                }}
              />

              <AnimatePresence mode="wait">
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
              </AnimatePresence>
            </motion.div>

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
                color: currentMobileStage.color,
                pointerEvents: 'none',
                fontWeight: 500,
              }}
            >
              ← swipe →
            </motion.div>
          </div>

          {/* Dot indicators with stage colors */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
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

          {/* Stage labels below dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 4px',
            }}
          >
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
                  padding: '6px 4px',
                  transition: 'all 0.3s',
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
