import { motion, useReducedMotion } from 'framer-motion';
import { colors } from '@/design-system/tokens';

const bloomColors = colors.bloom;

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

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.03 }}
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
                description: 'Your schedule. Your clients. Your specialties.\nSee one client a week or thirty—you decide.\nSupplement your current income or go full-time.\nPick up appointments anytime: early mornings, weekends, evenings.\nCompletely flexible. You make it yours.',
                icon: '🌿',
              },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="p-8 rounded-2xl backdrop-blur-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: `1px solid ${bloomColors.eucalyptusSage}20`,
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
        </motion.section>

        {/* What's Included */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{ marginBottom: isMobile ? '60px' : '100px' }}
        >
          <h2 
            className="text-center font-semibold mb-12"
            style={{
              fontSize: isMobile ? '32px' : '42px',
              color: bloomColors.eucalyptusSage,
            }}
          >
            What's Included
          </h2>
          
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
              {
                title: 'The Freedom',
                items: ['Work from anywhere in Australia', 'Set your own hours and rates', 'No quotas or billing targets', 'No lock-in contracts'],
              },
            ].map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + i * 0.1 }}
                className="p-8 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: `1px solid ${bloomColors.eucalyptusSage}20`,
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
                className="mb-4 p-6 rounded-xl text-center"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${bloomColors.eucalyptusSage}30`,
                }}
              >
                <span style={{ fontSize: '18px', color: bloomColors.charcoalText, fontWeight: 500 }}>{requirement}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

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
            
            <blockquote 
              className="italic p-6 rounded-xl my-8"
              style={{ 
                background: 'rgba(107, 142, 127, 0.1)',
                borderLeft: `4px solid ${bloomColors.eucalyptusSage}`,
                fontSize: '20px',
              }}
            >
              "What if psychologists kept most of what they earned, we provided the technology for a more human-centred practice, and we brought them clients?"
            </blockquote>
            
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
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onApplyClick}
            className="px-12 py-5 rounded-xl font-semibold text-white shadow-lg transition-all duration-300"
            style={{
              fontSize: isMobile ? '17px' : '20px',
              background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softFern} 100%)`,
            }}
          >
            Begin Application
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
