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
            Join a collective of independent psychologists who value autonomy, 
            fair compensation, and doing work that matters.
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

        {/* CTA at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center pt-16"
          style={{ marginTop: isMobile ? '60px' : '100px' }}
        >
          <p className="text-lg mb-6" style={{ color: bloomColors.charcoalText }}>
            Ready to grow your practice your way?
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onApplyClick}
            className="px-10 py-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-300"
            style={{
              fontSize: isMobile ? '16px' : '18px',
              background: `linear-gradient(135deg, ${bloomColors.eucalyptusSage} 0%, ${bloomColors.softFern} 100%)`,
            }}
          >
            Start Your Application
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
