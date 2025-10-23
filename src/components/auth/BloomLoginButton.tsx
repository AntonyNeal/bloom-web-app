import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Tier2Flower } from '../flowers/Tier2Flower';
import { useState } from 'react';

interface BloomLoginButtonProps {
  isMobile: boolean;
}

const BloomLoginButton = ({ isMobile }: BloomLoginButtonProps) => {
  const navigate = useNavigate();
  const [isClicked, setIsClicked] = useState(false);

  console.log('[BloomLoginButton] Component mounting/rendering...');
  console.log('[BloomLoginButton] Environment check:', {
    VITE_B2C_ENABLED: import.meta.env.VITE_B2C_ENABLED,
    VITE_B2C_CLIENT_ID: import.meta.env.VITE_B2C_CLIENT_ID ? 'SET' : 'NOT SET',
    VITE_B2C_AUTHORITY: import.meta.env.VITE_B2C_AUTHORITY ? 'SET' : 'NOT SET',
  });

  // Try-catch around useAuth to prevent component from crashing
  let isAuthenticated = false;
  let login = () => console.log('Auth not available');

  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    login = auth.login;
    console.log('[BloomLoginButton] Auth state:', { isAuthenticated });
  } catch (error) {
    console.error('[BloomLoginButton] Error getting auth state:', error);
  }

  const handleClick = async () => {
    console.log('[BloomLoginButton] Button clicked, isAuthenticated:', isAuthenticated);

    // Trigger rainbow bloom animation
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 2000); // Reset after 2 seconds

    if (!isAuthenticated) {
      // Trigger Azure AD authentication directly
      // Note: login() will redirect to Microsoft, so we don't navigate afterwards
      console.log('[BloomLoginButton] Triggering Azure AD login - will redirect to Microsoft');
      try {
        await login();
        // Don't navigate here - the login redirect will handle navigation
        // After successful auth, user can click Bloom again or navigate directly
      } catch (error) {
        console.error('[BloomLoginButton] Login failed:', error);
      }
    } else {
      console.log('[BloomLoginButton] Already authenticated, navigating to dashboard');
      navigate('/admin/dashboard');
    }
  };

  return (
    <motion.div
      style={{
        position: 'relative',
        width: isMobile ? '100%' : '200px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Glass Bloom Button - subtle until clicked */}
      <motion.button
        onClick={handleClick}
        style={{
          position: 'relative',
          width: '140px',
          height: '50px',
          borderRadius: '25px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          zIndex: 10,
          overflow: 'hidden',
        }}
        whileHover={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          color: 'rgba(255, 255, 255, 0.9)',
        }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {/* Dreamy Rainbow Bloom Effect - covers entire button on click */}
        <motion.div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '140px',
            height: '50px',
            borderRadius: '25px',
            background: `
              radial-gradient(ellipse at center,
                rgba(255, 182, 193, 0.9) 0%,
                rgba(255, 160, 122, 0.8) 20%,
                rgba(255, 255, 224, 0.7) 40%,
                rgba(221, 255, 221, 0.6) 60%,
                rgba(173, 216, 230, 0.5) 80%,
                rgba(221, 160, 221, 0.4) 100%
              )
            `,
            filter: 'blur(2px)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
          animate={
            isClicked
              ? {
                  opacity: [0, 0.8, 0.6, 0],
                  scale: [0.3, 1.1, 1, 0.8],
                }
              : {
                  opacity: 0,
                  scale: 0.3,
                }
          }
          transition={{
            duration: 1,
            ease: 'easeOut',
          }}
        />

        {/* Secondary rotating rainbow layer */}
        <motion.div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '140px',
            height: '50px',
            borderRadius: '25px',
            background: `
              conic-gradient(from 0deg,
                rgba(255, 182, 193, 0.5) 0deg,
                rgba(255, 228, 196, 0.5) 60deg,
                rgba(255, 255, 224, 0.5) 120deg,
                rgba(221, 255, 221, 0.5) 180deg,
                rgba(173, 216, 230, 0.5) 240deg,
                rgba(221, 160, 221, 0.5) 300deg,
                rgba(255, 182, 193, 0.5) 360deg
              )
            `,
            filter: 'blur(3px)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
          animate={
            isClicked
              ? {
                  opacity: [0, 0.6, 0.4, 0],
                  rotate: [0, 180, 360],
                  scale: [0.8, 1.05, 0.9],
                }
              : {
                  opacity: 0,
                  rotate: 0,
                  scale: 0.8,
                }
          }
          transition={{
            duration: 1,
            ease: 'easeInOut',
          }}
        />
      </motion.button>

      {/* Decorative flower - no longer clickable */}
      <motion.div
        style={{
          position: 'absolute',
          left: '-25px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
        animate={{
          rotate: [0, 1, 0, -1, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Tier2Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={false} />
      </motion.div>
    </motion.div>
  );
};

export default BloomLoginButton;
