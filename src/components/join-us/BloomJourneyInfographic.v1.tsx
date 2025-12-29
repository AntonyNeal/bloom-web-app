/**
 * Bloom Journey Infographic - Redesigned
 * 
 * A calm, non-demanding infographic that shows the practitioner journey
 * through gentle hover/tap reveals. Nothing moves or pushes - content
 * crossfades in a fixed-height container.
 * 
 * Philosophy: Like looking through a window that changes what you see.
 * 
 * Features:
 * - Fixed-height content area (no layout shift)
 * - Desktop: Hover to reveal stage details
 * - Mobile: Horizontal swipe carousel
 * - Story-like copy that breathes
 * - Crossfade animations
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

// Journey stage data with story-like copy
interface JourneyStage {
  id: string;
  title: string;
  timeframe: string;
  color: string;
  story: string;
  details: string[];
}

const journeyStages: JourneyStage[] = [
  {
    id: 'apply',
    title: 'Apply',
    timeframe: '5 mins',
    color: bloomColors.eucalyptusSage,
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
    story: "Supervision when you need it. Peers who understand. A community that grows together.",
    details: [
      'Supervision access',
      'Peer consultation groups',
      'CPD tracking',
      'Shape what Bloom becomes',
    ],
  },
];

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

  // Mobile swipe handlers
  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && mobileIndex < journeyStages.length - 1) {
      setMobileIndex(mobileIndex + 1);
    } else if (direction === 'right' && mobileIndex > 0) {
      setMobileIndex(mobileIndex - 1);
    }
  };

  const currentMobileStage = journeyStages[mobileIndex];

  return (
    <section
      style={{
        padding: isMobile ? '48px 20px' : '64px 24px',
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: 'center',
          marginBottom: isMobile ? '32px' : '48px',
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softTerracotta} 100%)`,
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
            maxWidth: '500px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          From application to practice—here's what it looks like
        </p>
      </motion.div>

      {/* Main Content - Desktop */}
      {!isMobile && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Stage Navigation Pills */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '32px',
              flexWrap: 'wrap',
            }}
          >
            {journeyStages.map((stage) => (
              <motion.button
                key={stage.id}
                onMouseEnter={() => setActiveStage(stage.id)}
                onMouseLeave={() => setActiveStage(null)}
                onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
                whileHover={{ y: -2 }}
                style={{
                  padding: '12px 20px',
                  background: activeStage === stage.id 
                    ? `linear-gradient(135deg, ${stage.color}20, ${stage.color}10)`
                    : 'rgba(255, 255, 255, 0.8)',
                  border: `2px solid ${activeStage === stage.id ? stage.color : stage.color + '30'}`,
                  borderRadius: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: activeStage === stage.id ? stage.color : '#4A4A4A',
                    transition: 'color 0.3s',
                  }}
                >
                  {stage.title}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    background: `${stage.color}15`,
                    color: stage.color,
                    borderRadius: '10px',
                  }}
                >
                  {stage.timeframe}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Fixed-Height Content Area */}
          <div
            style={{
              minHeight: '280px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              border: '1px solid rgba(107, 142, 127, 0.1)',
              padding: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <AnimatePresence mode="wait">
              {currentStage ? (
                <motion.div
                  key={currentStage.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  style={{
                    textAlign: 'center',
                    maxWidth: '600px',
                  }}
                >
                  {/* Stage Story */}
                  <p
                    style={{
                      fontSize: '22px',
                      lineHeight: 1.7,
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
                      <span
                        key={i}
                        style={{
                          padding: '8px 16px',
                          background: `${currentStage.color}10`,
                          color: currentStage.color,
                          fontSize: '14px',
                          fontWeight: 500,
                          borderRadius: '20px',
                          border: `1px solid ${currentStage.color}25`,
                        }}
                      >
                        {detail}
                      </span>
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
                  <p
                    style={{
                      fontSize: '32px',
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softTerracotta} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '16px',
                    }}
                  >
                    80% to you. We handle the rest.
                  </p>
                  <p
                    style={{
                      fontSize: '16px',
                      color: '#666',
                    }}
                  >
                    Hover over each stage to see what your journey looks like
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
              borderRadius: '20px',
              marginBottom: '20px',
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
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: `2px solid ${currentMobileStage.color}30`,
                padding: '32px 24px',
                minHeight: '320px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'grab',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMobileStage.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
                >
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3
                      style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: currentMobileStage.color,
                        marginBottom: '8px',
                      }}
                    >
                      {currentMobileStage.title}
                    </h3>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: `${currentMobileStage.color}15`,
                        color: currentMobileStage.color,
                        fontSize: '13px',
                        fontWeight: 600,
                        borderRadius: '12px',
                      }}
                    >
                      {currentMobileStage.timeframe}
                    </span>
                  </div>

                  {/* Story */}
                  <p
                    style={{
                      fontSize: '18px',
                      lineHeight: 1.7,
                      color: '#3A3A3A',
                      textAlign: 'center',
                      marginBottom: '24px',
                      flex: 1,
                    }}
                  >
                    {currentMobileStage.story}
                  </p>

                  {/* Details */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {currentMobileStage.details.map((detail, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '10px 16px',
                          background: `${currentMobileStage.color}08`,
                          color: '#4A4A4A',
                          fontSize: '14px',
                          borderRadius: '12px',
                          borderLeft: `3px solid ${currentMobileStage.color}`,
                        }}
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Swipe hint */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '12px',
                color: '#999',
                pointerEvents: 'none',
              }}
            >
              ← swipe →
            </div>
          </div>

          {/* Dot indicators */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {journeyStages.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => setMobileIndex(index)}
                style={{
                  width: index === mobileIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: index === mobileIndex ? stage.color : '#D1D5DB',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
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
              padding: '0 8px',
              marginBottom: '8px',
            }}
          >
            {journeyStages.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => setMobileIndex(index)}
                style={{
                  fontSize: '11px',
                  fontWeight: index === mobileIndex ? 600 : 400,
                  color: index === mobileIndex ? stage.color : '#999',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  transition: 'all 0.3s',
                }}
              >
                {stage.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Stats - Simplified */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? '24px' : '48px',
          marginTop: isMobile ? '40px' : '56px',
          paddingTop: '32px',
          borderTop: '1px solid rgba(107, 142, 127, 0.15)',
        }}
      >
        {[
          { value: '80%', label: 'You keep' },
          { value: '0', label: 'Quotas' },
          { value: 'No', label: 'Lock-in' },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: isMobile ? '28px' : '36px',
                fontWeight: 700,
                color: bloomColors.eucalyptusSage,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: isMobile ? '13px' : '14px',
                color: '#666',
                marginTop: '4px',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          textAlign: 'center',
          marginTop: isMobile ? '40px' : '48px',
        }}
      >
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 8px 28px rgba(107, 142, 127, 0.35)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onApplyClick}
          style={{
            padding: isMobile ? '16px 36px' : '18px 48px',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 600,
            color: '#FEFDFB',
            background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softFern} 100%)`,
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(107, 142, 127, 0.25)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          See If You Qualify
        </motion.button>
      </motion.div>
    </section>
  );
}

export default BloomJourneyInfographic;
