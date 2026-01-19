import { motion, useReducedMotion } from 'framer-motion';
import { colors } from '@/design-system/tokens';
import { Tier1Flower, Tier2Flower, Tier3Flower } from '@/components/flowers';

const bloomColors = colors.bloom;

// Miyazaki-inspired floating particle component - More visible
const FloatingPetal = ({ delay, duration, x, type = 'pink', repeatDelay = 6 }: { delay: number; duration: number; x: string; type?: 'pink' | 'purple' | 'yellow'; repeatDelay?: number }) => {
  const petalColors = {
    pink: 'linear-gradient(135deg, #FFB6C1 0%, #FFA8BA 100%)',
    purple: 'linear-gradient(135deg, #DDA0DD 0%, #C7ABD9 100%)',
    yellow: 'linear-gradient(135deg, #FFE082 0%, #FFD54F 100%)',
  };
  
  return (
    <motion.div
      initial={{ y: -50, x: x, opacity: 0, rotate: 0 }}
      animate={{ 
        y: '100vh',
        opacity: [0, 0.8, 0.7, 0.5, 0],
        rotate: [0, 180, 360, 540],
        x: [x, `calc(${x} + 50px)`, `calc(${x} - 40px)`, x, `calc(${x} + 30px)`]
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: 'easeInOut',
        repeatDelay: repeatDelay
      }}
      style={{
        position: 'absolute',
        width: '14px',
        height: '14px',
        borderRadius: '50% 0 50% 0',
        background: petalColors[type],
        pointerEvents: 'none',
        zIndex: 5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    />
  );
};

// Hand-drawn organic divider with grass - More prominent
const OrganicDivider = ({ isMobile }: { isMobile: boolean }) => (
  <motion.div
    initial={{ opacity: 0, scaleX: 0 }}
    whileInView={{ opacity: 1, scaleX: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 1.2, ease: 'easeOut' }}
    className="relative"
    style={{
      height: '80px',
      maxWidth: isMobile ? '280px' : '400px',
      margin: '80px auto',
      overflow: 'visible'
    }}
  >
    {/* Decorative grass blades */}
    <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
      {/* Center feature - small flower cluster */}
      <g transform="translate(200, 15)">
        {/* Stem */}
        <path d="M 0,20 Q 2,10 0,0" stroke={bloomColors.eucalyptusSage} strokeWidth="2" fill="none" opacity="0.7" />
        {/* Leaves */}
        <ellipse cx="-3" cy="12" rx="5" ry="2" fill={bloomColors.softFern} opacity="0.6" transform="rotate(-45 -3 12)" />
        <ellipse cx="3" cy="12" rx="5" ry="2" fill={bloomColors.softFern} opacity="0.6" transform="rotate(45 3 12)" />
        {/* Flower petals */}
        <circle cx="-4" cy="3" r="3" fill="#FFB6C1" opacity="0.8" />
        <circle cx="4" cy="3" r="3" fill="#FFB6C1" opacity="0.8" />
        <circle cx="0" cy="-2" r="3" fill="#FFB6C1" opacity="0.8" />
        <circle cx="-3" cy="7" r="3" fill="#FFA8BA" opacity="0.8" />
        <circle cx="3" cy="7" r="3" fill="#FFA8BA" opacity="0.8" />
        {/* Center */}
        <circle cx="0" cy="3" r="4" fill="#FFE082" opacity="0.9" />
      </g>
      
      {/* Grass blades - scattered naturally */}
      {[60, 90, 120, 280, 310, 340].map((x, i) => (
        <g key={i} transform={`translate(${x}, 60)`}>
          <path
            d={`M 0,0 Q ${-2 + i},${-15 - i * 2} ${-1 + i * 0.5},${-25 - i * 3}`}
            stroke={bloomColors.eucalyptusSage}
            strokeWidth="2"
            fill="none"
            opacity="0.4"
            strokeLinecap="round"
          />
        </g>
      ))}
      
      {/* Connecting vine/branch */}
      <path
        d="M 50,40 Q 120,35 200,38 Q 280,35 350,40"
        stroke={bloomColors.eucalyptusSage}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
        strokeDasharray="5,5"
      />
    </svg>
  </motion.div>
);

interface MarketingContentProps {
  isMobile: boolean;
  onApplyClick: () => void;
}

/**
 * Marketing section for JoinUs page
 * Extracted from JoinUs.tsx to improve file organization
 */
export function MarketingContent({ isMobile, onApplyClick }: MarketingContentProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className="relative min-h-screen" style={{ background: bloomColors.warmCream }}>
      {/* Subtle paper texture overlay - Miyazaki handcrafted feel */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' /%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Floating petals - more visible Miyazaki environmental detail */}
      {!prefersReducedMotion && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 5 }}>
          <FloatingPetal delay={0} duration={18} x="10%" type="pink" />
          <FloatingPetal delay={4} duration={22} x="25%" type="purple" />
          <FloatingPetal delay={8} duration={20} x="45%" type="yellow" />
          <FloatingPetal delay={2} duration={24} x="60%" type="pink" />
          <FloatingPetal delay={10} duration={19} x="75%" type="purple" />
          <FloatingPetal delay={6} duration={21} x="90%" type="yellow" />
          {/* Second layer for depth */}
          <FloatingPetal delay={12} duration={26} x="18%" type="pink" />
          <FloatingPetal delay={16} duration={23} x="52%" type="purple" />
          <FloatingPetal delay={14} duration={25} x="82%" type="yellow" />
        </div>
      )}

      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[
          { size: '850px', color: bloomColors.eucalyptusSage, opacity: 0.06, top: '-15%', right: '-8%', blur: isMobile ? 140 : 70 },
          { size: '950px', color: bloomColors.softTerracotta, opacity: 0.04, bottom: '-20%', left: '-12%', blur: isMobile ? 150 : 75 },
        ].map((blob, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: blob.opacity,
              scale: (isMobile || prefersReducedMotion) ? 1 : [1, 1.01, 1]
            }}
            transition={{
              opacity: { duration: 0.8, delay: i * 0.2 },
              scale: { 
                duration: 60 + i * 10, 
                repeat: (isMobile || prefersReducedMotion) ? 0 : Infinity,
                ease: 'easeInOut' 
              },
            }}
            className="absolute rounded-full"
            style={{
              width: blob.size,
              height: blob.size,
              background: blob.color,
              filter: `blur(${blob.blur}px)`,
              willChange: (isMobile || prefersReducedMotion) ? 'auto' : 'transform',
              ...(blob.top && { top: blob.top }),
              ...(blob.bottom && { bottom: blob.bottom }),
              ...(blob.left && { left: blob.left }),
              ...(blob.right && { right: blob.right }),
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto" style={{ padding: isMobile ? '40px 20px' : '80px 40px' }}>
        
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
          style={{ marginBottom: isMobile ? '60px' : '100px' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block mb-5"
          >
            <h1 
              className="font-semibold tracking-tight leading-tight"
              style={{
                fontSize: isMobile ? '40px' : '56px',
                background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softTerracotta} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Practice Your Way
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-2xl mx-auto leading-relaxed"
            style={{
              fontSize: isMobile ? '18px' : '22px',
              color: '#4A4A4A',
            }}
          >
            No need to quit your current job. Bloom can supplement your income or become your full-time career—your choice. 
            Work completely on your schedule: weekends, evenings, early mornings, or business hours.
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-2xl mx-auto leading-relaxed mt-4"
            style={{
              fontSize: isMobile ? '17px' : '20px',
              color: '#4A4A4A',
              fontStyle: 'italic',
            }}
          >
            Bloom fits into your life, not the other way around.
          </motion.p>

          {/* Decorative flower - prominent Miyazaki touch */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, rotate: -25 }}
            animate={{ 
              opacity: 0.9, 
              scale: 1.4, 
              rotate: 0,
            }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 180, damping: 12 }}
            style={{
              position: 'absolute',
              top: isMobile ? '-35px' : '-50px',
              right: isMobile ? '5%' : '15%',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 4px 12px rgba(255, 182, 193, 0.3))',
            }}
          >
            <Tier1Flower isChecked={true} isMobile={false} shouldReduceMotion={!!prefersReducedMotion} />
          </motion.div>
          {/* Second decorative flower - adds depth */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, rotate: 25 }}
            animate={{ 
              opacity: 0.7, 
              scale: 1.0, 
              rotate: 5,
            }}
            transition={{ delay: 1.0, type: 'spring', stiffness: 180, damping: 12 }}
            style={{
              position: 'absolute',
              top: isMobile ? '80%' : '85%',
              left: isMobile ? '5%' : '10%',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 4px 12px rgba(221, 160, 221, 0.3))',
            }}
          >
            <Tier2Flower isChecked={true} isMobile={false} shouldReduceMotion={!!prefersReducedMotion} />
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ 
              scale: 1.03,
              rotate: [0, -0.5, 0.5, 0],
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onApplyClick}
            className="mt-8 px-10 py-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-300"
            style={{
              fontSize: isMobile ? '16px' : '18px',
              background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softFern} 100%)`,
            }}
          >
            Apply to Join
          </motion.button>
        </motion.section>

        {/* Benefits Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ marginBottom: isMobile ? '60px' : '100px' }}
        >
          <div className="grid gap-8" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
            {[
              {
                title: 'You keep 80%',
                description: 'Most practices take 40-50%. We take 20%.\nYou do the work. You get paid fairly.',
                icon: '💰',
              },
              {
                title: 'We use Halaxy',
                description: 'Practice management through Halaxy.\nBooking, billing, notes—all in one place.',
                icon: '🔧',
              },
              {
                title: 'Build your own practice',
                description: 'Your schedule. Your clients. Your specialties.\nSee one client a week or thirty—you decide.',
                icon: '🌿',
              },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                whileHover={{
                  y: -12,
                  rotate: i === 0 ? -1.5 : i === 1 ? 0 : 1.5,
                  scale: 1.02,
                  boxShadow: '0 20px 40px -8px rgba(107, 142, 127, 0.25)',
                  transition: { type: 'spring', stiffness: 300, damping: 18 }
                }}
                className="p-8 rounded-2xl backdrop-blur-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: `2px solid ${bloomColors.eucalyptusSage}30`,
                  cursor: 'default',
                  boxShadow: '0 4px 12px -2px rgba(107, 142, 127, 0.1)',
                }}
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="font-semibold mb-3" style={{ fontSize: '22px', color: bloomColors.eucalyptusSage }}>
                  {benefit.title}
                </h3>
                <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
          
          {/* Second row - centered card */}
          <div className="grid gap-8 mt-8" style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr', maxWidth: isMobile ? '100%' : '500px', margin: '32px auto 0' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              whileHover={{
                y: -12,
                rotate: 0,
                scale: 1.02,
                boxShadow: '0 20px 40px -8px rgba(107, 142, 127, 0.25)',
                transition: { type: 'spring', stiffness: 300, damping: 18 }
              }}
              className="p-8 rounded-2xl backdrop-blur-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: `2px solid ${bloomColors.eucalyptusSage}30`,
                cursor: 'default',
                boxShadow: '0 4px 12px -2px rgba(107, 142, 127, 0.1)',
              }}
            >
              <div className="text-5xl mb-4">✨</div>
              <h3 className="font-semibold mb-3" style={{ fontSize: '22px', color: bloomColors.eucalyptusSage }}>
                Complete flexibility
              </h3>
              <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                {`Supplement your current income or go full-time.
Pick up appointments anytime: early mornings, weekends, evenings.
Completely flexible. You make it yours.`}
              </p>
            </motion.div>
          </div>
        </motion.section>

        <OrganicDivider isMobile={isMobile} />

        {/* What's Included */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{ marginBottom: isMobile ? '60px' : '100px' }}
        >
          <div className="relative" style={{ paddingTop: '40px', paddingBottom: '20px' }}>
            <h2 
              className="text-center font-semibold mb-12"
              style={{
                fontSize: isMobile ? '32px' : '42px',
                color: bloomColors.eucalyptusSage,
              }}
            >
              What's Included
            </h2>
            {/* Prominent decorative flowers - better composition */}
            {!isMobile && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -40, rotate: -20 }}
                  whileInView={{ opacity: 0.85, x: 0, rotate: -8 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 12 }}
                  animate={!prefersReducedMotion ? {
                    rotate: [-8, -13, -3, -8],
                    y: [0, -8, 0],
                    transition: {
                      duration: 6,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }
                  } : {}}
                  style={{ 
                    position: 'absolute', 
                    left: '12%', 
                    top: '0px',
                    transform: 'scale(1.3)',
                    filter: 'drop-shadow(0 4px 12px rgba(255, 193, 7, 0.3))'
                  }}
                >
                  <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={!!prefersReducedMotion} />
                </motion.div>
                {/* Subtle connecting dots/pollen */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.4 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  style={{
                    position: 'absolute',
                    left: '20%',
                    top: '20px',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={!prefersReducedMotion ? {
                        y: [0, -5, 0],
                        opacity: [0.3, 0.6, 0.3]
                      } : {}}
                      transition={!prefersReducedMotion ? {
                        duration: 2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3
                      } : {}}
                      style={{
                        position: 'absolute',
                        left: `${i * 12}px`,
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: bloomColors.honeyAmber,
                      }}
                    />
                  ))}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 40, rotate: 20 }}
                  whileInView={{ opacity: 0.85, x: 0, rotate: 8 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 12 }}
                  animate={!prefersReducedMotion ? {
                    rotate: [8, 3, 13, 8],
                    y: [0, -10, 0],
                    transition: {
                      duration: 7,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }
                  } : {}}
                  style={{ 
                    position: 'absolute', 
                    right: '12%', 
                    top: '0px',
                    transform: 'scale(1.3)',
                    filter: 'drop-shadow(0 4px 12px rgba(221, 160, 221, 0.3))'
                  }}
                >
                  <Tier2Flower isChecked={true} isMobile={false} shouldReduceMotion={!!prefersReducedMotion} />
                </motion.div>
                {/* Subtle connecting dots/pollen */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.4 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  style={{
                    position: 'absolute',
                    right: '20%',
                    top: '20px',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={!prefersReducedMotion ? {
                        y: [0, -6, 0],
                        opacity: [0.3, 0.6, 0.3]
                      } : {}}
                      transition={!prefersReducedMotion ? {
                        duration: 2.2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3
                      } : {}}
                      style={{
                        position: 'absolute',
                        right: `${i * 12}px`,
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: bloomColors.softTerracotta,
                      }}
                    />
                  ))}
                </motion.div>
              </>
            )}
          </div>
          
          <div className="grid gap-8" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', maxWidth: '1000px', margin: '0 auto' }}>
            {[
              {
                title: 'The Money',
                items: ['80% of what you bill goes to you', '$250 session = $200 to you'],
              },
              {
                title: 'The Platform',
                items: ['Halaxy for practice management', 'Video sessions, booking, billing', 'Clinical notes and reminders'],
              },
              {
                title: 'Bloom',
                items: ['Track your professional development', 'Access supervision and training', 'Medicare renewal reminders and insurance processing'],
              },
              {
                title: 'The Marketing',
                items: ['We bring you clients', 'Professional website presence'],
              },
            ].map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + i * 0.1 }}
                whileHover={{
                  y: -6,
                  boxShadow: '0 10px 20px -4px rgba(107, 142, 127, 0.12)',
                  transition: { type: 'spring', stiffness: 400, damping: 25 }
                }}
                className="p-8 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: `1px solid ${bloomColors.eucalyptusSage}20`,
                  cursor: 'default',
                }}
              >
                <h3 className="font-semibold mb-4" style={{ fontSize: '24px', color: bloomColors.charcoalText }}>
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span style={{ color: bloomColors.eucalyptusSage, fontSize: '20px', marginTop: '-2px' }}>·</span>
                      <span style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: '1.6' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          
          {/* The Freedom - centered below */}
          <div style={{ maxWidth: isMobile ? '100%' : '480px', margin: '32px auto 0' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              whileHover={{
                y: -6,
                boxShadow: '0 10px 20px -4px rgba(107, 142, 127, 0.12)',
                transition: { type: 'spring', stiffness: 400, damping: 25 }
              }}
              className="p-8 rounded-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: `1px solid ${bloomColors.eucalyptusSage}20`,
                cursor: 'default',
              }}
            >
              <h3 className="font-semibold mb-4" style={{ fontSize: '24px', color: bloomColors.charcoalText }}>
                The Freedom
              </h3>
              <ul className="space-y-2">
                {['Work from anywhere in Australia', 'Set your own hours and rates', 'No quotas or billing targets', 'No lock-in contracts'].map((item, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <span style={{ color: bloomColors.eucalyptusSage, fontSize: '20px', marginTop: '-2px' }}>·</span>
                    <span style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: '1.6' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.section>

        <OrganicDivider isMobile={isMobile} />

        {/* What's Included */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{ marginBottom: isMobile ? '60px' : '100px' }}
        >
          <div className="relative" style={{ paddingTop: '40px', paddingBottom: '20px' }}>
            <h2 
              className="text-center font-semibold mb-12"
              style={{
                fontSize: isMobile ? '32px' : '42px',
                color: bloomColors.eucalyptusSage,
              }}
            >
              What's Included
            </h2>
            {/* Prominent decorative flowers - better composition */}
            {!isMobile && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -40, rotate: -20 }}
                  whileInView={{ opacity: 0.85, x: 0, rotate: -8 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 12 }}
                  animate={!prefersReducedMotion ? {
                    rotate: [-8, -13, -3, -8],
                    y: [0, -8, 0],
                    transition: {
                      duration: 6,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }
                  } : {}}
                  style={{ 
                    position: 'absolute', 
                    left: '12%', 
                    top: '0px',
                    transform: 'scale(1.3)',
                    filter: 'drop-shadow(0 4px 12px rgba(255, 193, 7, 0.3))'
                  }}
                >
                  <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={!!prefersReducedMotion} />
                </motion.div>
                {/* Subtle connecting dots/pollen */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.4 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  style={{
                    position: 'absolute',
                    left: '20%',
                    top: '20px',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={!prefersReducedMotion ? {
                        y: [0, -5, 0],
                        opacity: [0.3, 0.6, 0.3]
                      } : {}}
                      transition={!prefersReducedMotion ? {
                        duration: 2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3
                      } : {}}
                      style={{
                        position: 'absolute',
                        left: `${i * 12}px`,
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: bloomColors.honeyAmber,
                      }}
                    />
                  ))}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 40, rotate: 20 }}
                  whileInView={{ opacity: 0.85, x: 0, rotate: 8 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 12 }}
                  animate={!prefersReducedMotion ? {
                    rotate: [8, 3, 13, 8],
                    y: [0, -10, 0],
                    transition: {
                      duration: 7,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }
                  } : {}}
                  style={{ 
                    position: 'absolute', 
                    right: '12%', 
                    top: '0px',
                    transform: 'scale(1.3)',
                    filter: 'drop-shadow(0 4px 12px rgba(221, 160, 221, 0.3))'
                  }}
                >
                  <Tier2Flower isChecked={true} isMobile={false} shouldReduceMotion={!!prefersReducedMotion} />
                </motion.div>
                {/* Subtle connecting dots/pollen */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.4 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  style={{
                    position: 'absolute',
                    right: '20%',
                    top: '20px',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={!prefersReducedMotion ? {
                        y: [0, -6, 0],
                        opacity: [0.3, 0.6, 0.3]
                      } : {}}
                      transition={!prefersReducedMotion ? {
                        duration: 2.2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3
                      } : {}}
                      style={{
                        position: 'absolute',
                        right: `${i * 12}px`,
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: bloomColors.softTerracotta,
                      }}
                    />
                  ))}
                </motion.div>
              </>
            )}
          </div>
          
          <div className="grid gap-8" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', maxWidth: '1000px', margin: '0 auto' }}>
            {[
              {
                title: 'The Money',
                items: ['80% of what you bill goes to you', '$250 session = $200 to you'],
              },
              {
                title: 'The Platform',
                items: ['Halaxy for practice management', 'Video sessions, booking, billing', 'Clinical notes and reminders'],
              },
              {
                title: 'Bloom',
                items: ['Track your professional development', 'Access supervision and training', 'Medicare renewal reminders and insurance processing'],
              },
              {
                title: 'The Marketing',
                items: ['We bring you clients', 'Professional website presence'],
              },
            ].map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + i * 0.1 }}
                whileHover={{
                  y: -6,
                  boxShadow: '0 10px 20px -4px rgba(107, 142, 127, 0.12)',
                  transition: { type: 'spring', stiffness: 400, damping: 25 }
                }}
                className="p-8 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: `1px solid ${bloomColors.eucalyptusSage}20`,
                  cursor: 'default',
                }}
              >
                <h3 className="font-semibold mb-4" style={{ fontSize: '24px', color: bloomColors.charcoalText }}>
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span style={{ color: bloomColors.eucalyptusSage, fontSize: '20px', marginTop: '-2px' }}>·</span>
                      <span style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: '1.6' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <OrganicDivider isMobile={isMobile} />

        {/* How We Work */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="text-center"
          style={{ marginBottom: isMobile ? '60px' : '100px' }}
        >
          <h2 
            className="font-semibold mb-6"
            style={{
              fontSize: isMobile ? '32px' : '42px',
              color: bloomColors.eucalyptusSage,
            }}
          >
            How We Work
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-4">
            <p style={{ fontSize: '20px', color: '#4A4A4A', lineHeight: '1.7' }}>
              Fair compensation. Halaxy for operations. Marketing support.
            </p>
            <p style={{ fontSize: '20px', color: '#4A4A4A', lineHeight: '1.7' }}>
              Community-driven direction.
            </p>
            <p style={{ fontSize: '20px', color: bloomColors.charcoalText, lineHeight: '1.7', fontWeight: 500, marginTop: '24px' }}>
              Let's build a sustainable practice and make good money doing it.
            </p>
          </div>
        </motion.section>

        {/* Who We're Looking For */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="text-center"
          style={{ marginBottom: isMobile ? '60px' : '100px' }}
        >
          <h2 
            className="font-semibold mb-6"
            style={{
              fontSize: isMobile ? '32px' : '42px',
              color: bloomColors.eucalyptusSage,
            }}
          >
            Who We're Looking For
          </h2>
          
          <p className="max-w-3xl mx-auto mb-12 leading-relaxed" style={{ fontSize: '18px', color: '#4A4A4A' }}>
            To apply, you need at least one of these:
          </p>

          <div className="max-w-2xl mx-auto">
            {[
              'Registered Clinical Psychologist (AHPRA)',
              '8+ years Registered Psychologist (AHPRA)',
              'PhD in Psychology with AHPRA registration',
            ].map((requirement, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + i * 0.1 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: bloomColors.eucalyptusSage + '50',
                  transition: { type: 'spring', stiffness: 300, damping: 20 }
                }}
                className="mb-4 p-6 rounded-xl text-center"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${bloomColors.eucalyptusSage}30`,
                  cursor: 'default',
                }}
              >
                <span style={{ fontSize: '18px', color: bloomColors.charcoalText, fontWeight: 500 }}>{requirement}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <OrganicDivider isMobile={isMobile} />

        {/* Why This Exists */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          style={{ marginBottom: isMobile ? '60px' : '100px' }}
        >
          <h2 
            className="text-center font-semibold mb-8"
            style={{
              fontSize: isMobile ? '32px' : '42px',
              color: bloomColors.eucalyptusSage,
            }}
          >
            Why This Exists
          </h2>

          <div className="max-w-3xl mx-auto space-y-6" style={{ fontSize: '18px', color: '#4A4A4A', lineHeight: '1.8' }}>
            <p>
              I'm Zoe Semmler, a clinical psychologist. I started this because I kept watching talented colleagues burn out—not because they stopped caring, but because the traditional practice model didn't work for them.
            </p>
            
            <motion.blockquote
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ 
                x: 8,
                scale: 1.01,
                borderLeftWidth: '6px',
                transition: { type: 'spring', stiffness: 300, damping: 20 }
              }}
              className="italic p-8 rounded-xl my-8 relative"
              style={{ 
                background: 'rgba(107, 142, 127, 0.15)',
                borderLeft: `5px solid ${bloomColors.eucalyptusSage}`,
                fontSize: '22px',
                cursor: 'default',
                boxShadow: '0 4px 16px -4px rgba(107, 142, 127, 0.2)',
              }}
            >
              {/* Animated decorative leaf */}
              <motion.span
                animate={!prefersReducedMotion ? {
                  rotate: [-5, 5, -5],
                  y: [0, -3, 0]
                } : {}}
                transition={!prefersReducedMotion ? {
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                } : {}}
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '-12px',
                  fontSize: '36px',
                  opacity: 0.85,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                }}
              >
                🍃
              </motion.span>
              "What if psychologists kept most of what they earned, we provided the technology for a more human-centred practice, and we brought them clients?"
            </motion.blockquote>
            
            <p>
              That's the premise. Fair pay. Halaxy for operations. Marketing support.
            </p>
            
            <p style={{ fontWeight: 500, color: bloomColors.charcoalText }}>
              This practice is built on respect—for your expertise, your time, and the community's voice in shaping what we become together.
            </p>
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="text-center pt-16"
          style={{ marginTop: isMobile ? '40px' : '60px' }}
        >
          <p className="text-xl mb-6" style={{ color: bloomColors.charcoalText, fontSize: '22px' }}>
            Interested?
          </p>
          <p className="text-lg mb-8" style={{ color: '#4A4A4A' }}>
            If this approach makes sense to you, let's see if you qualify.
          </p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            animate={!prefersReducedMotion ? {
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 8px 16px -4px rgba(107, 142, 127, 0.2)',
                '0 12px 24px -6px rgba(107, 142, 127, 0.3)',
                '0 8px 16px -4px rgba(107, 142, 127, 0.2)',
              ]
            } : {}}
            transition={!prefersReducedMotion ? {
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut'
            } : {}}
            whileHover={{ 
              scale: 1.08,
              rotate: [0, -1.5, 1.5, 0],
              boxShadow: '0 20px 40px -8px rgba(107, 142, 127, 0.4)',
              background: `linear-gradient(135deg, ${bloomColors.softFern} 0%, ${bloomColors.eucalyptusSage} 100%)`,
              transition: { type: 'spring', stiffness: 300, damping: 15 }
            }}
            whileTap={{ scale: 0.96 }}
            onClick={onApplyClick}
            className="px-14 py-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-300"
            style={{
              fontSize: isMobile ? '18px' : '22px',
              background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softFern} 100%)`,
              border: `2px solid rgba(255, 255, 255, 0.3)`,
            }}
          >
            Begin Application
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
