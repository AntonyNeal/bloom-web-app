/**
 * Bloom Journey Infographic
 * 
 * Timeline-based design - warm, inviting professionalism.
 * Cards stay fixed when expanded (no layout shifts).
 * Horizontal timeline connectors between stages.
 */

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Bloom design system - warm, organic palette
const colors = {
  sage50: '#F7F9F7',
  sage100: '#EFF3EE',
  sage200: '#D9E4D7',
  sage400: '#8FB48E',
  sage500: '#6B8066',
  sage600: '#5A6C55',
  lavender100: '#F2F0F7',
  lavender300: '#CFC5DC',
  lavender400: '#B4A7D6',
  terracotta: '#D4A59A',
  terracottaLight: '#E8C4BB',
  amber: '#E8B77D',
  amberLight: '#FEF7ED',
  cream: '#FAF8F3',
  cream100: '#F5F3EE',
  charcoal: '#3D3D3A',
  charcoalLight: '#5C5C57',
};

// Journey organized by phases for clearer narrative
const journeyPhases = [
  {
    id: 'start',
    title: 'Getting Started',
    color: colors.sage500,
    stages: [
      {
        id: 'apply',
        title: 'Apply',
        subtitle: 'Quick check',
        icon: '📝',
        color: colors.sage500,
        bgColor: colors.sage100,
        timeframe: '5 mins',
        details: ['Simple online form', 'Check your eligibility', 'No lengthy interviews', 'Community-minded welcome'],
      },
      {
        id: 'onboard',
        title: 'Onboard',
        subtitle: 'Get set up',
        icon: '⚙️',
        color: colors.sage600,
        bgColor: colors.sage50,
        timeframe: '1-2 days',
        details: ['Digital verification', 'Platform walkthrough', 'Set your preferences', 'Configure your profile'],
      },
    ],
  },
  {
    id: 'practice',
    title: 'Practice Your Way',
    color: colors.lavender400,
    stages: [
      {
        id: 'telehealth',
        title: 'See Clients',
        subtitle: 'HD video calls',
        icon: '🎥',
        color: colors.lavender400,
        bgColor: colors.lavender100,
        timeframe: 'Always',
        details: ['Crystal-clear video', 'Secure screen share', 'Built-in notes', 'Any device'],
      },
      {
        id: 'clients',
        title: 'Get Matched',
        subtitle: 'Fit your specialty',
        icon: '🤝',
        color: colors.terracotta,
        bgColor: colors.terracottaLight,
        timeframe: 'Ongoing',
        details: ['Matched to specialty', 'Pre-screened clients', 'Streamlined intake', 'Focus on treatment'],
      },
      {
        id: 'flexibility',
        title: 'Your Hours',
        subtitle: 'No minimums',
        icon: '🕐',
        color: colors.amber,
        bgColor: colors.amberLight,
        timeframe: 'Your choice',
        details: ['No hour requirements', 'Any time of day', 'Pause anytime', 'No contracts'],
      },
    ],
  },
  {
    id: 'earn',
    title: 'Earn & Grow',
    color: colors.terracotta,
    stages: [
      {
        id: 'earnings',
        title: 'Keep 80%',
        subtitle: 'Fair split',
        icon: '💚',
        color: colors.sage500,
        bgColor: colors.sage100,
        timeframe: 'Every session',
        details: ['Transparent 80/20', 'Weekly deposits', 'No hidden fees', 'Medicare supported'],
      },
      {
        id: 'rates',
        title: 'Set Rates',
        subtitle: 'Your fees',
        icon: '⚖️',
        color: colors.lavender400,
        bgColor: colors.lavender100,
        timeframe: 'Your choice',
        details: ['Full fee control', 'Gap collection built-in', 'Rate guidance', 'Adjust anytime'],
      },
      {
        id: 'development',
        title: 'Learn',
        subtitle: 'Free supervision',
        icon: '📚',
        color: colors.amber,
        bgColor: colors.amberLight,
        timeframe: 'Ongoing',
        details: ['Free supervision', 'Peer consultation', 'Workshops', 'CPD tracking'],
      },
    ],
  },
  {
    id: 'trust',
    title: 'Trust & Community',
    color: colors.sage600,
    stages: [
      {
        id: 'security',
        title: 'Secure',
        subtitle: 'Bank-level',
        icon: '🔒',
        color: colors.sage600,
        bgColor: colors.sage100,
        timeframe: 'Always',
        details: ['Azure security', 'Encrypted data', 'AU sovereignty', 'Full compliance'],
      },
      {
        id: 'community',
        title: 'Shape Bloom',
        subtitle: 'Your voice',
        icon: '🌱',
        color: colors.sage500,
        bgColor: colors.sage50,
        timeframe: 'Always',
        details: ['Feedback matters', 'Vote on features', 'Practitioner-led', 'Grows with you'],
      },
    ],
  },
];

interface Props {
  isMobile: boolean;
  onApplyClick: () => void;
}

// Timeline connector between cards
const TimelineConnector = ({ color, isVisible }: { color: string; isVisible: boolean }) => (
  <div
    style={{
      width: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}
  >
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        width: '100%',
        height: '2px',
        background: `linear-gradient(90deg, ${color}40, ${color}60, ${color}40)`,
        borderRadius: '1px',
      }}
    />
  </div>
);

// Stage card component - fixed position, accordion expansion
const StageCard = ({
  stage,
  isExpanded,
  onClick,
  index,
  isMobile,
  prefersReducedMotion,
}: {
  stage: typeof journeyPhases[0]['stages'][0];
  isExpanded: boolean;
  onClick: () => void;
  index: number;
  isMobile: boolean;
  prefersReducedMotion: boolean | null;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
    onClick={onClick}
    whileHover={prefersReducedMotion ? {} : { y: -3, boxShadow: `0 8px 24px ${stage.color}15` }}
    whileTap={{ scale: 0.98 }}
    style={{
      width: isMobile ? '100%' : '140px',
      minWidth: isMobile ? 'unset' : '140px',
      padding: isMobile ? '16px' : '16px 12px',
      background: isExpanded
        ? `linear-gradient(145deg, ${stage.bgColor}, ${colors.cream})`
        : colors.cream,
      border: `2px solid ${isExpanded ? stage.color + '60' : colors.sage200}`,
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
      boxShadow: isExpanded
        ? `0 12px 32px ${stage.color}15`
        : '0 2px 8px rgba(107, 128, 102, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Expand indicator */}
    <motion.div
      animate={{
        scale: isExpanded ? 1.1 : 1,
        backgroundColor: isExpanded ? stage.color : colors.sage100,
      }}
      style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 600,
        color: isExpanded ? colors.cream : colors.sage500,
        transition: 'all 0.3s ease',
      }}
    >
      {isExpanded ? '−' : '+'}
    </motion.div>

    {/* Icon */}
    <motion.div
      animate={
        prefersReducedMotion
          ? {}
          : {
              y: isExpanded ? 0 : [0, -2, 0],
            }
      }
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }}
      style={{
        fontSize: isMobile ? '32px' : '36px',
        marginBottom: '8px',
        lineHeight: 1,
      }}
    >
      {stage.icon}
    </motion.div>

    {/* Title & Subtitle */}
    <h4
      style={{
        fontSize: '14px',
        fontWeight: 600,
        color: isExpanded ? stage.color : colors.charcoal,
        marginBottom: '2px',
        fontFamily: 'Poppins, sans-serif',
        transition: 'color 0.3s',
      }}
    >
      {stage.title}
    </h4>
    <p
      style={{
        fontSize: '11px',
        color: colors.charcoalLight,
        margin: 0,
        lineHeight: 1.3,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {stage.subtitle}
    </p>

    {/* Timeframe badge */}
    <span
      style={{
        display: 'inline-block',
        marginTop: '8px',
        padding: '3px 8px',
        background: isExpanded ? `${stage.color}15` : colors.sage50,
        color: isExpanded ? stage.color : colors.sage600,
        fontSize: '10px',
        fontWeight: 600,
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        transition: 'all 0.3s',
      }}
    >
      {stage.timeframe}
    </span>

    {/* Expanded details - appears below card */}
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            marginTop: '12px',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              borderTop: `1px solid ${stage.color}30`,
              paddingTop: '12px',
            }}
          >
            {stage.details.map((detail, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  marginBottom: '6px',
                  fontSize: '12px',
                  color: colors.charcoal,
                  lineHeight: 1.4,
                  fontFamily: 'Inter, sans-serif',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: stage.color, fontSize: '11px', flexShrink: 0 }}>✓</span>
                {detail}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
);

export function BloomJourneyInfographic({ isMobile, onApplyClick }: Props) {
  const [expandedStage, setExpandedStage] = useState<string | null>('apply');
  const prefersReducedMotion = useReducedMotion();

  const handleStageClick = (stageId: string) => {
    setExpandedStage(expandedStage === stageId ? null : stageId);
  };

  return (
    <div
      style={{
        padding: isMobile ? '32px 16px' : '48px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          textAlign: 'center',
          marginBottom: isMobile ? '32px' : '40px',
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? '26px' : '36px',
            fontWeight: 600,
            color: colors.charcoal,
            marginBottom: '12px',
            letterSpacing: '-0.02em',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Your Journey with Bloom
        </h2>
        <p
          style={{
            fontSize: isMobile ? '15px' : '17px',
            color: colors.charcoalLight,
            maxWidth: '400px',
            margin: '0 auto',
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Tap any stage to learn more
        </p>
      </motion.div>

      {/* Timeline by phases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '24px' : '32px' }}>
        {journeyPhases.map((phase, phaseIndex) => (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: phaseIndex * 0.1 }}
          >
            {/* Phase label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '24px',
                  background: `linear-gradient(180deg, ${phase.color}, ${phase.color}60)`,
                  borderRadius: '2px',
                }}
              />
              <span
                style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  color: phase.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {phase.title}
              </span>
            </div>

            {/* Stage cards in a row with connectors */}
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'flex-start',
                gap: isMobile ? '12px' : '0',
                paddingLeft: isMobile ? '0' : '16px',
              }}
            >
              {phase.stages.map((stage, stageIndex) => (
                <div
                  key={stage.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                >
                  <StageCard
                    stage={stage}
                    isExpanded={expandedStage === stage.id}
                    onClick={() => handleStageClick(stage.id)}
                    index={phaseIndex * 3 + stageIndex}
                    isMobile={isMobile}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                  {/* Connector (not after last stage in phase) */}
                  {!isMobile && stageIndex < phase.stages.length - 1 && (
                    <TimelineConnector color={phase.color} isVisible={true} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Key Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isMobile ? '12px' : '20px',
          marginTop: isMobile ? '32px' : '48px',
          padding: isMobile ? '20px 16px' : '28px 32px',
          background: `linear-gradient(135deg, ${colors.sage100} 0%, ${colors.lavender100} 50%, ${colors.cream} 100%)`,
          borderRadius: '20px',
          border: `1px solid ${colors.sage200}`,
        }}
      >
        {[
          { value: '80%', label: 'You Keep', sublabel: 'of fees' },
          { value: '0', label: 'Quotas', sublabel: 'no minimums' },
          { value: '∞', label: 'Flexibility', sublabel: 'your hours' },
        ].map((stat, i) => (
          <motion.div key={i} style={{ textAlign: 'center' }} whileHover={{ scale: 1.02 }}>
            <div
              style={{
                fontSize: isMobile ? '28px' : '40px',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${colors.sage600} 0%, ${colors.sage500} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
                marginBottom: '6px',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: isMobile ? '13px' : '15px',
                fontWeight: 600,
                color: colors.charcoal,
                marginBottom: '2px',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: isMobile ? '11px' : '13px',
                color: colors.charcoalLight,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {stat.sublabel}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ textAlign: 'center', marginTop: isMobile ? '28px' : '40px' }}
      >
        <p
          style={{
            fontSize: isMobile ? '16px' : '18px',
            color: colors.charcoal,
            marginBottom: '20px',
            lineHeight: 1.5,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Ready to practice psychology on your terms?
        </p>
        <motion.button
          whileHover={{
            scale: 1.03,
            boxShadow: '0 12px 32px rgba(90, 108, 85, 0.3)',
          }}
          whileTap={{ scale: 0.98 }}
          onClick={onApplyClick}
          style={{
            padding: isMobile ? '16px 36px' : '18px 44px',
            fontSize: isMobile ? '16px' : '17px',
            fontWeight: 600,
            color: colors.cream,
            background: `linear-gradient(135deg, ${colors.sage600} 0%, ${colors.sage500} 100%)`,
            border: 'none',
            borderRadius: '14px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(90, 108, 85, 0.25)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Check If You Qualify →
        </motion.button>
      </motion.div>
    </div>
  );
}

export default BloomJourneyInfographic;
