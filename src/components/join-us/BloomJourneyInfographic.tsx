/**
 * Bloom Journey Infographic
 * 
 * An interactive, multidirectional infographic showing the complete
 * practitioner experience at Bloom - from application to daily operations.
 * 
 * Features:
 * - Clickable journey stages that expand with details
 * - Animated connections between stages
 * - Mobile-responsive design
 * - Framer Motion animations
 */

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Tier1Flower, Tier2Flower, Tier3Flower } from '@/components/flowers';

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

// Journey stage data
interface JourneyStage {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  flowerType: 'tier1' | 'tier2' | 'tier3';
  details: {
    title: string;
    items: string[];
  }[];
  timeframe?: string;
  step?: number;
}

const journeyStages: JourneyStage[] = [
  {
    id: 'apply',
    title: 'Plant Your Seed',
    subtitle: '5-minute application',
    icon: '🌱',
    step: 1,
    color: bloomColors.eucalyptusSage,
    flowerType: 'tier1',
    timeframe: '5 mins',
    details: [
      {
        title: 'Who We\'re Looking For',
        items: [
          'Experienced, well-qualified clinicians',
          'Honest practitioners who value integrity',
          'Comfortable with simple online tools',
          'Community-minded—culture matters here',
        ],
      },
      {
        title: 'Qualifications',
        items: [
          'Clinical Psychologists (AHPRA registered)',
          'Registered Psychologist with 8+ years experience',
          'PhD in Psychology with registration',
        ],
      },
    ],
  },
  {
    id: 'onboard',
    title: 'Take Root',
    subtitle: 'We set you up',
    icon: '🌿',
    step: 2,
    color: bloomColors.softFern,
    flowerType: 'tier1',
    timeframe: '1-2 weeks',
    details: [
      {
        title: 'Practice Setup',
        items: [
          'Your own Bloom practice portal',
          'Telehealth video capability',
          'Calendar & availability system',
          'Billing & Medicare integration',
        ],
      },
      {
        title: 'Bloom Integration',
        items: [
          'Bring your existing clients with you',
          'Professional profile on our site',
          '@life-psychology.com.au email',
          'Fast, personal tech support when you need it',
        ],
      },
    ],
  },
  {
    id: 'practice',
    title: 'Start Growing',
    subtitle: 'See clients your way',
    icon: '🌸',
    step: 3,
    color: bloomColors.softTerracotta,
    flowerType: 'tier2',
    timeframe: 'Ongoing',
    details: [
      {
        title: 'Telehealth Practice',
        items: [
          'All sessions through Bloom are via telehealth',
          'Keep seeing face-to-face clients elsewhere',
          'Bloom fits around your existing practice',
          'Work from home or anywhere with internet',
        ],
      },
      {
        title: 'Bloom Dashboard',
        items: [
          'Smart notes & session prep tools',
          'Secure video consultations',
          'Insights & connections to reach your goals',
          'Built for community collaboration',
        ],
      },
    ],
  },
  {
    id: 'earn',
    title: 'Flourish',
    subtitle: 'Keep 80% of what you bill',
    icon: '🌻',
    step: 4,
    color: bloomColors.honeyAmber,
    flowerType: 'tier2',
    timeframe: 'Monthly',
    details: [
      {
        title: 'Earnings',
        items: [
          '$250 session = $200 to you',
          'No billing targets or quotas',
          'Paid monthly to your account',
          'No tax or super withholding',
        ],
      },
      {
        title: 'Transparent Fees',
        items: [
          'Simple 80/20 split - you keep 80%',
          'No hidden costs or lock-ins',
          'No long-term contracts required',
        ],
      },
    ],
  },
  {
    id: 'grow',
    title: 'Reach New Heights',
    subtitle: 'Professional development',
    icon: '🌳',
    step: 5,
    color: bloomColors.clayTerracotta,
    flowerType: 'tier3',
    timeframe: 'Ongoing',
    details: [
      {
        title: 'Professional Development',
        items: [
          'Supervision access',
          'Peer consultation groups',
          'Training workshops',
          'Professional development tracking',
        ],
      },
      {
        title: 'Marketing Support',
        items: [
          'Google Ads campaigns managed for you',
          'Search-optimised practitioner profiles',
          'New clients matched to your availability',
        ],
      },
    ],
  },
  {
    id: 'community',
    title: 'Thrive Together',
    subtitle: 'Join our garden',
    icon: '🌺',
    step: 6,
    color: bloomColors.softTerracotta,
    flowerType: 'tier3',
    timeframe: 'Always',
    details: [
      {
        title: 'A Supportive Community',
        items: [
          'Connected network of like-minded practitioners',
          'Peer support and consultation',
          'Shape Bloom\'s direction together',
          'Celebrate each other\'s growth',
        ],
      },
      {
        title: 'You\'re Never Alone',
        items: [
          'Fast, personal tech support when you need it',
          'Regular check-ins and guidance',
          'A place where you truly belong',
          'Growing stronger together',
        ],
      },
    ],
  },
];

// Feature highlights for the center
const featureHighlights = [
  { icon: '📱', label: 'Telehealth', description: 'See clients from anywhere' },
  { icon: '📊', label: 'Dashboard', description: 'Your practice at a glance' },
  { icon: '📣', label: 'Marketing', description: 'We fill your calendar' },
  { icon: '💰', label: 'Your Rate', description: '$250-$340 per session' },
  { icon: '⏰', label: 'Flexible Hours', description: 'Mornings, evenings, weekends' },
  { icon: '📈', label: 'Client Insights', description: 'See where clients find you' },
];

interface Props {
  isMobile: boolean;
  onApplyClick: () => void;
}

export function BloomJourneyInfographic({ isMobile, onApplyClick }: Props) {
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const FlowerComponent = ({ type, isActive }: { type: 'tier1' | 'tier2' | 'tier3'; isActive: boolean }) => {
    const props = { isChecked: isActive, isMobile, shouldReduceMotion: prefersReducedMotion ?? false };
    switch (type) {
      case 'tier1': return <Tier1Flower {...props} />;
      case 'tier2': return <Tier2Flower {...props} />;
      case 'tier3': return <Tier3Flower {...props} />;
    }
  };

  return (
    <div style={{ padding: isMobile ? '40px 16px' : '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '60px' }}
      >
        <h2
          style={{
            fontSize: isMobile ? '28px' : '40px',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softTerracotta} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}
        >
          Your Journey with Bloom
        </h2>
        <p
          style={{
            fontSize: isMobile ? '16px' : '18px',
            color: '#4A4A4A',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Click each stage to explore what your experience looks like
        </p>
      </motion.div>

      {/* Journey Timeline - Horizontal on desktop, vertical on mobile */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          gap: isMobile ? '16px' : '8px',
          marginBottom: '48px',
          position: 'relative',
        }}
      >
        {/* Connection Line */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '10%',
              right: '10%',
              height: '3px',
              background: `linear-gradient(90deg, ${bloomColors.eucalyptusSage}40, ${bloomColors.softTerracotta}40)`,
              borderRadius: '2px',
              zIndex: 0,
            }}
          />
        )}

        {journeyStages.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            style={{
              flex: isMobile ? 'none' : 1,
              maxWidth: isMobile ? '100%' : '200px',
              zIndex: activeStage === stage.id ? 10 : 1,
            }}
          >
            {/* Stage Card */}
            <motion.button
              onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: isMobile ? '20px' : '24px 16px',
                background: activeStage === stage.id
                  ? `linear-gradient(135deg, ${stage.color}15, ${stage.color}08)`
                  : 'rgba(255, 255, 255, 0.9)',
                border: `2px solid ${activeStage === stage.id ? stage.color : stage.color + '30'}`,
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeStage === stage.id
                  ? `0 8px 24px ${stage.color}25`
                  : '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: 'center',
                gap: isMobile ? '16px' : '12px',
                textAlign: isMobile ? 'left' : 'center',
              }}
            >
              {/* Icon with Flower */}
              <div
                style={{
                  position: 'relative',
                  width: isMobile ? '48px' : '64px',
                  height: isMobile ? '48px' : '64px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '28px' : '36px',
                    zIndex: 1,
                  }}
                >
                  {stage.icon}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-8px',
                    right: '-8px',
                    width: '28px',
                    height: '28px',
                    opacity: activeStage === stage.id ? 1 : 0.5,
                    transition: 'opacity 0.3s',
                  }}
                >
                  <FlowerComponent type={stage.flowerType} isActive={activeStage === stage.id} />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: isMobile ? '18px' : '17px',
                    fontWeight: 700,
                    color: stage.color,
                    marginBottom: '4px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {stage.title}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {stage.subtitle}
                </p>
                {stage.timeframe && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '2px 8px',
                      background: `${stage.color}15`,
                      color: stage.color,
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '10px',
                    }}
                  >
                    {stage.timeframe}
                  </span>
                )}
              </div>

              {/* Expand indicator */}
              <motion.div
                animate={{ rotate: activeStage === stage.id ? 180 : 0 }}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stage.color,
                  fontSize: '18px',
                }}
              >
                ▾
              </motion.div>
            </motion.button>

            {/* Expanded Details */}
            <AnimatePresence>
              {activeStage === stage.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      border: `1px solid ${stage.color}25`,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    }}
                  >
                    {stage.details.map((detail, detailIndex) => (
                      <div key={detailIndex} style={{ marginBottom: detailIndex < stage.details.length - 1 ? '20px' : 0 }}>
                        <h4
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: stage.color,
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', background: stage.color, borderRadius: '50%' }} />
                          {detail.title}
                        </h4>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                          {detail.items.map((item, itemIndex) => (
                            <li
                              key={itemIndex}
                              style={{
                                fontSize: '13px',
                                color: '#4A4A4A',
                                lineHeight: 1.6,
                                paddingLeft: '14px',
                                position: 'relative',
                                marginBottom: '6px',
                              }}
                            >
                              <span
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  color: stage.color,
                                  fontWeight: 'bold',
                                }}
                              >
                                •
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Feature Highlights Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage}08, ${bloomColors.softTerracotta}05)`,
          borderRadius: '20px',
          padding: isMobile ? '28px 20px' : '40px',
          marginBottom: '48px',
        }}
      >
        <h3
          style={{
            textAlign: 'center',
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 700,
            color: bloomColors.eucalyptusSage,
            marginBottom: '28px',
          }}
        >
          Everything You Need to Practice
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? '12px' : '20px',
          }}
        >
          {featureHighlights.map((feature, index) => (
            <motion.div
              key={index}
              onHoverStart={() => setHoveredFeature(index)}
              onHoverEnd={() => setHoveredFeature(null)}
              whileHover={{ y: -4, scale: 1.02 }}
              style={{
                background: 'white',
                padding: isMobile ? '16px 12px' : '24px 20px',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: hoveredFeature === index
                  ? '0 8px 24px rgba(107, 142, 127, 0.15)'
                  : '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.3s',
                cursor: 'default',
              }}
            >
              <div style={{ fontSize: isMobile ? '28px' : '36px', marginBottom: '8px' }}>
                {feature.icon}
              </div>
              <h4
                style={{
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 700,
                  color: '#3A3A3A',
                  marginBottom: '4px',
                }}
              >
                {feature.label}
              </h4>
              <p
                style={{
                  fontSize: isMobile ? '12px' : '13px',
                  color: '#666',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Value Proposition Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '48px',
        }}
      >
        {[
          {
            icon: '💰',
            value: '80%',
            label: 'Yours',
            sublabel: 'simple fee structure',
            color: bloomColors.eucalyptusSage,
          },
          {
            icon: '🕐',
            value: '0',
            label: 'Quotas',
            sublabel: 'work your own hours',
            color: bloomColors.softTerracotta,
          },
          {
            icon: '🔓',
            value: 'No',
            label: 'Lock-in',
            sublabel: 'leave anytime',
            color: bloomColors.honeyAmber,
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -4 }}
            style={{
              background: 'white',
              padding: '28px 24px',
              borderRadius: '16px',
              textAlign: 'center',
              border: `2px solid ${stat.color}25`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
            <div
              style={{
                fontSize: isMobile ? '36px' : '44px',
                fontWeight: 800,
                color: stat.color,
                lineHeight: 1,
                marginBottom: '4px',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#3A3A3A', marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>{stat.sublabel}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        style={{ textAlign: 'center' }}
      >
        <p
          style={{
            fontSize: isMobile ? '17px' : '19px',
            color: '#4A4A4A',
            marginBottom: '24px',
            lineHeight: 1.6,
          }}
        >
          Ready to practice psychology your way?
        </p>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 8px 28px rgba(107, 142, 127, 0.35)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onApplyClick}
          style={{
            padding: isMobile ? '18px 44px' : '20px 56px',
            fontSize: isMobile ? '17px' : '19px',
            fontWeight: 700,
            color: '#FEFDFB',
            background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softFern} 100%)`,
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(107, 142, 127, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          Check If You Qualify
        </motion.button>
      </motion.div>
    </div>
  );
}

export default BloomJourneyInfographic;
