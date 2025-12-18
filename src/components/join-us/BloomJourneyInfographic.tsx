/**
 * Bloom Journey Infographic
 * 
 * A clean, spacious infographic showing the practitioner journey at Bloom.
 * Uses factual labels with subtle visual growth decoration.
 */

import { useState } from 'react';
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

// Journey stages - factual, clear labels
interface JourneyStage {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  timeframe: string;
  details: string[];
}

const journeyStages: JourneyStage[] = [
  {
    id: 'apply',
    title: 'Apply Online',
    subtitle: 'Quick eligibility check',
    icon: '📝',
    color: bloomColors.eucalyptusSage,
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
    color: bloomColors.softFern,
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
    color: bloomColors.softTerracotta,
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
    color: bloomColors.honeyAmber,
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
    subtitle: 'Keep 80% of what you bill',
    icon: '💵',
    color: bloomColors.eucalyptusSage,
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
    color: bloomColors.softFern,
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
    color: bloomColors.clayTerracotta,
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
    title: 'Community',
    subtitle: 'Never practice alone',
    icon: '🤝',
    color: bloomColors.softTerracotta,
    timeframe: 'Always',
    details: [
      'Connected practitioner network',
      'Peer support & collaboration',
      'Shape Bloom\'s direction',
      'Fast, personal tech support',
    ],
  },
  {
    id: 'flexibility',
    title: 'Flexibility',
    subtitle: 'Work on your terms',
    icon: '🕐',
    color: bloomColors.honeyAmber,
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
    subtitle: 'Enterprise-grade protection',
    icon: '🔒',
    color: bloomColors.eucalyptusSage,
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

// Decorative growing dots - subtle visual growth metaphor
const GrowingDots = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px 0' }}>
    {[8, 10, 12, 14, 12, 10, 8].map((size, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 + (i === 3 ? 0.3 : 0) }}
        transition={{ delay: i * 0.1, duration: 0.3 }}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: i <= 3 
            ? `linear-gradient(135deg, ${bloomColors.eucalyptusSage}, ${bloomColors.softFern})`
            : `linear-gradient(135deg, ${bloomColors.softFern}, ${bloomColors.softTerracotta})`,
        }}
      />
    ))}
  </div>
);

export function BloomJourneyInfographic({ isMobile, onApplyClick }: Props) {
  const [expandedStage, setExpandedStage] = useState<string | null>('apply');
  const prefersReducedMotion = useReducedMotion();

  const handleStageClick = (stageId: string) => {
    setExpandedStage(expandedStage === stageId ? null : stageId);
  };

  return (
    <div style={{ padding: isMobile ? '32px 16px' : '48px 24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px' }}
      >
        <h2
          style={{
            fontSize: isMobile ? '26px' : '36px',
            fontWeight: 700,
            color: bloomColors.eucalyptusSage,
            marginBottom: '12px',
            letterSpacing: '-0.02em',
          }}
        >
          How It Works
        </h2>
        <p
          style={{
            fontSize: isMobile ? '15px' : '17px',
            color: '#666',
            maxWidth: '500px',
            margin: '0 auto 8px',
            lineHeight: 1.5,
          }}
        >
          Tap any card to see more details
        </p>
        {/* Subtle growth decoration */}
        <GrowingDots />
      </motion.div>

      {/* Journey Grid - 2 columns on mobile, 5 columns on desktop */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
          gap: isMobile ? '12px' : '16px',
          marginBottom: '40px',
        }}
      >
        {journeyStages.map((stage, index) => {
          const isExpanded = expandedStage === stage.id;
          
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              style={{
                gridColumn: isExpanded && !isMobile ? 'span 2' : 'span 1',
                gridRow: isExpanded && !isMobile ? 'span 2' : 'span 1',
              }}
            >
              <motion.button
                onClick={() => handleStageClick(stage.id)}
                whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: isExpanded ? (isMobile ? 'auto' : '280px') : (isMobile ? '120px' : '140px'),
                  padding: isMobile ? '16px 12px' : '20px 16px',
                  background: isExpanded
                    ? `linear-gradient(145deg, ${stage.color}12, white)`
                    : 'white',
                  border: `2px solid ${isExpanded ? stage.color : '#e5e7eb'}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isExpanded
                    ? `0 12px 32px ${stage.color}20, 0 4px 12px rgba(0,0,0,0.08)`
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isExpanded ? 'flex-start' : 'center',
                  justifyContent: 'flex-start',
                  textAlign: isExpanded ? 'left' : 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Expand indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isExpanded ? stage.color : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: isExpanded ? 'white' : '#94a3b8',
                    transition: 'all 0.3s',
                  }}
                >
                  {isExpanded ? '−' : '+'}
                </div>

                {/* Icon */}
                <div
                  style={{
                    fontSize: isMobile ? '32px' : '40px',
                    marginBottom: '8px',
                    filter: isExpanded ? 'none' : 'grayscale(20%)',
                    transition: 'filter 0.3s',
                  }}
                >
                  {stage.icon}
                </div>

                {/* Title & Subtitle */}
                <h3
                  style={{
                    fontSize: isMobile ? '14px' : '15px',
                    fontWeight: 700,
                    color: isExpanded ? stage.color : '#374151',
                    marginBottom: '2px',
                    transition: 'color 0.3s',
                  }}
                >
                  {stage.title}
                </h3>
                <p
                  style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#6b7280',
                    margin: 0,
                    lineHeight: 1.3,
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
                    background: isExpanded ? `${stage.color}15` : '#f3f4f6',
                    color: isExpanded ? stage.color : '#6b7280',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    transition: 'all 0.3s',
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
                      transition={{ duration: 0.2 }}
                      style={{
                        marginTop: '16px',
                        width: '100%',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          borderTop: `1px solid ${stage.color}20`,
                          paddingTop: '12px',
                        }}
                      >
                        {stage.details.map((detail, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              marginBottom: '8px',
                              fontSize: isMobile ? '12px' : '13px',
                              color: '#4b5563',
                              lineHeight: 1.4,
                            }}
                          >
                            <span
                              style={{
                                color: stage.color,
                                fontWeight: 'bold',
                                flexShrink: 0,
                              }}
                            >
                              ✓
                            </span>
                            {detail}
                          </div>
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

      {/* Key Stats Row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '12px' : '24px',
          marginBottom: '40px',
          padding: isMobile ? '20px 16px' : '32px',
          background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage}06, ${bloomColors.softTerracotta}04)`,
          borderRadius: '20px',
        }}
      >
        {[
          { value: '80%', label: 'You Keep', sublabel: 'of session fees' },
          { value: '0', label: 'Quotas', sublabel: 'no minimums' },
          { value: '∞', label: 'Flexibility', sublabel: 'your schedule' },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: isMobile ? '28px' : '40px',
                fontWeight: 800,
                color: bloomColors.eucalyptusSage,
                lineHeight: 1,
                marginBottom: '4px',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: isMobile ? '13px' : '16px',
                fontWeight: 700,
                color: '#374151',
                marginBottom: '2px',
              }}
            >
              {stat.label}
            </div>
            <div style={{ fontSize: isMobile ? '11px' : '13px', color: '#6b7280' }}>
              {stat.sublabel}
            </div>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ textAlign: 'center' }}
      >
        <p
          style={{
            fontSize: isMobile ? '16px' : '18px',
            color: '#4b5563',
            marginBottom: '20px',
          }}
        >
          Ready to practice psychology on your terms?
        </p>
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 8px 28px rgba(107, 142, 127, 0.35)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onApplyClick}
          style={{
            padding: isMobile ? '16px 40px' : '18px 48px',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 700,
            color: 'white',
            background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softFern} 100%)`,
            border: 'none',
            borderRadius: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(107, 142, 127, 0.25)',
            transition: 'all 0.3s',
          }}
        >
          Check If You Qualify →
        </motion.button>
      </motion.div>
    </div>
  );
}

export default BloomJourneyInfographic;
