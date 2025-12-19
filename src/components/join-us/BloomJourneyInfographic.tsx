/**
 * Bloom Journey Infographic
 * 
 * Studio Ghibli meets Linear - warm, inviting professionalism.
 * "What would Miyazaki do?" - gentle movement, organic asymmetry,
 * nature peeking through, depth through layering.
 */

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Bloom design system - warm, organic palette
const colors = {
  // Primary sage greens
  sage50: '#F7F9F7',
  sage100: '#EFF3EE',
  sage200: '#D9E4D7',
  sage400: '#8FB48E',
  sage500: '#6B8066',
  sage600: '#5A6C55',
  // Secondary lavender
  lavender100: '#F2F0F7',
  lavender300: '#CFC5DC',
  lavender400: '#B4A7D6',
  // Warm accents
  terracotta: '#D4A59A',
  terracottaLight: '#E8C4BB',
  amber: '#E8B77D',
  amberLight: '#FEF7ED',
  // Neutrals
  cream: '#FAF8F3',
  cream100: '#F5F3EE',
  charcoal: '#3D3D3A',
  charcoalLight: '#5C5C57',
};

// Journey stages - factual labels, community focus
interface JourneyStage {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bgColor: string;
  timeframe: string;
  details: string[];
}

const journeyStages: JourneyStage[] = [
  {
    id: 'apply',
    title: 'Apply Online',
    subtitle: 'Quick eligibility check',
    icon: '📝',
    color: colors.sage500,
    bgColor: colors.sage100,
    timeframe: '5 minutes',
    details: [
      'Clinical Psychologists (AHPRA registered)',
      'Registered Psychologists with 8+ years',
      'PhD in Psychology with registration',
      'Community-minded practitioners',
    ],
  },
  {
    id: 'onboard',
    title: 'Get Set Up',
    subtitle: 'We handle the admin',
    icon: '⚙️',
    color: colors.sage600,
    bgColor: colors.sage50,
    timeframe: '1-2 weeks',
    details: [
      'Your own Bloom practice portal',
      'Telehealth & calendar system',
      'Medicare billing integration',
      '@life-psychology.com.au email',
    ],
  },
  {
    id: 'telehealth',
    title: 'Telehealth',
    subtitle: 'See clients from anywhere',
    icon: '💻',
    color: colors.terracotta,
    bgColor: colors.terracottaLight + '30',
    timeframe: 'Your schedule',
    details: [
      'Secure HD video consultations',
      'Work from home or anywhere',
      'Fits around existing practice',
      'Smart notes & session tools',
    ],
  },
  {
    id: 'clients',
    title: 'Client Matching',
    subtitle: 'We fill your calendar',
    icon: '👥',
    color: colors.amber,
    bgColor: colors.amberLight,
    timeframe: 'Ongoing',
    details: [
      'Google Ads managed for you',
      'SEO-optimised profile page',
      'Matched to your availability',
      'See where clients find you',
    ],
  },
  {
    id: 'earnings',
    title: 'Earnings',
    subtitle: 'Keep 80% of billings',
    icon: '💵',
    color: colors.sage500,
    bgColor: colors.sage100,
    timeframe: 'Paid monthly',
    details: [
      '$250 session = $200 to you',
      'No billing targets or quotas',
      'Direct deposit monthly',
      'Transparent fee structure',
    ],
  },
  {
    id: 'rates',
    title: 'Set Your Rate',
    subtitle: '$250-$340 per session',
    icon: '📊',
    color: colors.lavender400,
    bgColor: colors.lavender100,
    timeframe: 'You decide',
    details: [
      '$250/session → keep $200',
      '$280/session → keep $224',
      '$310/session → keep $248',
      '$340/session → keep $272',
    ],
  },
  {
    id: 'development',
    title: 'Development',
    subtitle: 'Professional growth',
    icon: '📚',
    color: colors.terracotta,
    bgColor: colors.terracottaLight + '30',
    timeframe: 'Year-round',
    details: [
      'Supervision access',
      'Peer consultation groups',
      'Training workshops',
      'CPD tracking',
    ],
  },
  {
    id: 'community',
    title: 'Shape Bloom',
    subtitle: 'Your voice builds our tools',
    icon: '🌱',
    color: colors.sage600,
    bgColor: colors.sage100,
    timeframe: 'Always',
    details: [
      'Your feedback shapes new features',
      'Vote on what we build next',
      'Practitioner-led development',
      'A platform that grows with you',
    ],
  },
  {
    id: 'flexibility',
    title: 'Flexibility',
    subtitle: 'Work on your terms',
    icon: '🕐',
    color: colors.amber,
    bgColor: colors.amberLight,
    timeframe: 'Your choice',
    details: [
      'No minimum hours required',
      'Mornings, evenings, weekends',
      'Pause or leave anytime',
      'No long-term contracts',
    ],
  },
  {
    id: 'security',
    title: 'Security',
    subtitle: 'Enterprise protection',
    icon: '🔒',
    color: colors.lavender400,
    bgColor: colors.lavender100,
    timeframe: 'Always',
    details: [
      'Microsoft Azure security',
      'Bank-level encryption',
      'Australian data sovereignty',
      'Full regulatory compliance',
    ],
  },
];

interface Props {
  isMobile: boolean;
  onApplyClick: () => void;
}

// Decorative leaf SVG - organic, Ghibli-inspired
const FloatingLeaf = ({ delay = 0, x = 0, size = 20 }: { delay?: number; x?: number; size?: number }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    initial={{ opacity: 0, y: -10, rotate: -20 }}
    animate={{ 
      opacity: [0, 0.6, 0.4],
      y: [0, 8, 0],
      rotate: [-20, 5, -20],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    style={{ position: 'absolute', left: `${x}%`, top: '-10px' }}
  >
    <path
      d="M12 2C6 8 4 14 8 18C10 16 11 14 12 12C13 14 14 16 16 18C20 14 18 8 12 2Z"
      fill={colors.sage400}
      opacity={0.7}
    />
    <path
      d="M12 12V18"
      stroke={colors.sage500}
      strokeWidth="1"
      opacity={0.5}
    />
  </motion.svg>
);

// Soft blob background - organic depth
const BackgroundBlob = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 1.5, delay }}
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '60% 40% 50% 50% / 50% 60% 40% 50%',
      background: `radial-gradient(circle at 30% 30%, ${color} 0%, transparent 70%)`,
      top,
      left,
      filter: 'blur(40px)',
      opacity: 0.4,
      pointerEvents: 'none',
    }}
  />
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
        padding: isMobile ? '40px 16px' : '60px 32px', 
        maxWidth: '1100px', 
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background blobs - Ghibli-style depth */}
      {!prefersReducedMotion && (
        <>
          <BackgroundBlob color={colors.sage200} size={400} top="-100px" left="-100px" delay={0} />
          <BackgroundBlob color={colors.lavender300} size={300} top="200px" left="80%" delay={0.3} />
          <BackgroundBlob color={colors.terracottaLight} size={250} top="60%" left="-50px" delay={0.5} />
        </>
      )}

      {/* Header with organic feel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ 
          textAlign: 'center', 
          marginBottom: isMobile ? '40px' : '56px',
          position: 'relative',
        }}
      >
        {/* Floating leaves decoration */}
        {!prefersReducedMotion && !isMobile && (
          <div style={{ position: 'absolute', width: '100%', height: '40px', top: '-20px' }}>
            <FloatingLeaf delay={0} x={15} size={18} />
            <FloatingLeaf delay={1} x={45} size={14} />
            <FloatingLeaf delay={2} x={75} size={16} />
          </div>
        )}
        
        <h2
          style={{
            fontSize: isMobile ? '28px' : '40px',
            fontWeight: 600,
            color: colors.charcoal,
            marginBottom: '16px',
            letterSpacing: '-0.02em',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          How Bloom Works
        </h2>
        <p
          style={{
            fontSize: isMobile ? '16px' : '18px',
            color: colors.charcoalLight,
            maxWidth: '500px',
            margin: '0 auto',
            lineHeight: 1.7,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Tap any card to learn more
        </p>
      </motion.div>

      {/* Journey Grid - organic layout with varied card sizes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)',
          gap: isMobile ? '14px' : '18px',
          marginBottom: '48px',
          position: 'relative',
        }}
      >
        {journeyStages.map((stage, index) => {
          const isExpanded = expandedStage === stage.id;
          const row = Math.floor(index / 5);
          const isOffset = !isMobile && row === 1; // Second row offset for organic feel
          
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.06,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{
                gridColumn: isExpanded && !isMobile ? 'span 2' : 'span 1',
                gridRow: isExpanded && !isMobile ? 'span 2' : 'span 1',
                marginTop: isOffset ? '12px' : 0,
              }}
            >
              <motion.button
                onClick={() => handleStageClick(stage.id)}
                whileHover={prefersReducedMotion ? {} : { 
                  y: -4, 
                  boxShadow: `0 12px 32px ${stage.color}20`,
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: isExpanded ? (isMobile ? 'auto' : '300px') : (isMobile ? '130px' : '150px'),
                  padding: isMobile ? '18px 14px' : '22px 18px',
                  background: isExpanded
                    ? `linear-gradient(145deg, ${stage.bgColor}, ${colors.cream})`
                    : `linear-gradient(145deg, ${colors.cream}, ${colors.cream100})`,
                  border: `2px solid ${isExpanded ? stage.color + '60' : colors.sage200}`,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  boxShadow: isExpanded
                    ? `0 16px 40px ${stage.color}15, 0 4px 12px rgba(0,0,0,0.06)`
                    : '0 2px 8px rgba(107, 128, 102, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isExpanded ? 'flex-start' : 'center',
                  justifyContent: 'flex-start',
                  textAlign: isExpanded ? 'left' : 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative gradient overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '60%',
                    height: '60%',
                    background: `radial-gradient(circle at top right, ${stage.bgColor}60 0%, transparent 70%)`,
                    borderRadius: '20px',
                    pointerEvents: 'none',
                  }}
                />

                {/* Expand indicator - organic circle */}
                <motion.div
                  animate={{ 
                    scale: isExpanded ? 1.1 : 1,
                    backgroundColor: isExpanded ? stage.color : colors.sage100,
                  }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isExpanded ? colors.cream : colors.sage500,
                    boxShadow: isExpanded 
                      ? `0 4px 12px ${stage.color}30`
                      : '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isExpanded ? '−' : '+'}
                </motion.div>

                {/* Icon with subtle animation */}
                <motion.div
                  animate={prefersReducedMotion ? {} : { 
                    y: isExpanded ? 0 : [0, -3, 0],
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: 'easeInOut',
                    delay: index * 0.2,
                  }}
                  style={{
                    fontSize: isMobile ? '36px' : '44px',
                    marginBottom: '12px',
                    filter: isExpanded ? 'none' : 'saturate(0.9)',
                    transition: 'filter 0.3s',
                  }}
                >
                  {stage.icon}
                </motion.div>

                {/* Title & Subtitle */}
                <h3
                  style={{
                    fontSize: isMobile ? '15px' : '16px',
                    fontWeight: 600,
                    color: isExpanded ? stage.color : colors.charcoal,
                    marginBottom: '4px',
                    transition: 'color 0.3s',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {stage.title}
                </h3>
                <p
                  style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: colors.charcoalLight,
                    margin: 0,
                    lineHeight: 1.4,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {stage.subtitle}
                </p>

                {/* Timeframe badge - organic pill */}
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '10px',
                    padding: '4px 12px',
                    background: isExpanded 
                      ? `linear-gradient(135deg, ${stage.color}20, ${stage.color}10)`
                      : colors.sage50,
                    color: isExpanded ? stage.color : colors.sage600,
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '20px',
                    transition: 'all 0.3s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {stage.timeframe}
                </span>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      style={{
                        marginTop: '20px',
                        width: '100%',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          borderTop: `1px solid ${stage.color}25`,
                          paddingTop: '16px',
                        }}
                      >
                        {stage.details.map((detail, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              marginBottom: '10px',
                              fontSize: isMobile ? '13px' : '14px',
                              color: colors.charcoal,
                              lineHeight: 1.5,
                              fontFamily: 'Inter, sans-serif',
                            }}
                          >
                            <span
                              style={{
                                color: stage.color,
                                fontSize: '14px',
                                flexShrink: 0,
                                marginTop: '2px',
                              }}
                            >
                              ✓
                            </span>
                            {detail}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Key Stats - warm gradient background */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isMobile ? '16px' : '24px',
          marginBottom: '48px',
          padding: isMobile ? '24px 20px' : '36px 40px',
          background: `linear-gradient(135deg, ${colors.sage100} 0%, ${colors.lavender100} 50%, ${colors.cream} 100%)`,
          borderRadius: '24px',
          border: `1px solid ${colors.sage200}`,
          boxShadow: '0 8px 32px rgba(107, 128, 102, 0.08)',
        }}
      >
        {[
          { value: '80%', label: 'You Keep', sublabel: 'of session fees' },
          { value: '0', label: 'Quotas', sublabel: 'no minimums' },
          { value: '∞', label: 'Flexibility', sublabel: 'your schedule' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            style={{ textAlign: 'center' }}
            whileHover={{ scale: 1.02 }}
          >
            <div
              style={{
                fontSize: isMobile ? '32px' : '48px',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${colors.sage600} 0%, ${colors.sage500} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
                marginBottom: '8px',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: isMobile ? '14px' : '17px',
                fontWeight: 600,
                color: colors.charcoal,
                marginBottom: '4px',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {stat.label}
            </div>
            <div 
              style={{ 
                fontSize: isMobile ? '12px' : '14px', 
                color: colors.charcoalLight,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {stat.sublabel}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA - warm and inviting */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ textAlign: 'center' }}
      >
        <p
          style={{
            fontSize: isMobile ? '17px' : '19px',
            color: colors.charcoal,
            marginBottom: '24px',
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Ready to practice psychology on your terms?
        </p>
        <motion.button
          whileHover={{ 
            scale: 1.03, 
            boxShadow: '0 12px 36px rgba(90, 108, 85, 0.35)',
          }}
          whileTap={{ scale: 0.98 }}
          onClick={onApplyClick}
          style={{
            padding: isMobile ? '18px 44px' : '20px 52px',
            fontSize: isMobile ? '17px' : '18px',
            fontWeight: 600,
            color: colors.cream,
            background: `linear-gradient(135deg, ${colors.sage600} 0%, ${colors.sage500} 100%)`,
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(90, 108, 85, 0.25)',
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
