import { motion } from 'framer-motion';
import { colors } from '@/design-system/tokens';

const bloomColors = colors.bloom;

interface SuccessStateProps {
  isMobile: boolean;
  onReturnHome: () => void;
}

export function SuccessState({ isMobile, onReturnHome }: SuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'linear-gradient(135deg, #F0F9F3 0%, #FAF7F2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '24px',
      }}
    >
      {/* Garden illustration grows */}
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 1, ease: 'easeOut', type: 'spring', bounce: 0.4 }}
        style={{
          fontSize: isMobile ? '80px' : '120px',
          marginBottom: '24px',
        }}
      >
        🌺
      </motion.div>
      
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          fontSize: isMobile ? '28px' : '36px',
          fontWeight: 600,
          color: '#3A3A3A',
          marginBottom: '16px',
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}
      >
        Your Story is Planted
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{
          fontSize: isMobile ? '16px' : '18px',
          color: '#4A4A4A',
          textAlign: 'center',
          maxWidth: '500px',
          lineHeight: 1.6,
          marginBottom: '32px',
        }}
      >
        We'll nurture your application with care. 
        Expect to hear from us within 5-7 days.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReturnHome}
        style={{
          padding: '12px 32px',
          borderRadius: '8px',
          border: `2px solid ${bloomColors.eucalyptusSage}`,
          background: 'white',
          color: bloomColors.eucalyptusSage,
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        Return Home
      </motion.button>
    </motion.div>
  );
}
