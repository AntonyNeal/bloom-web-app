import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface BloomLoginButtonProps {
  isMobile: boolean;
}

const BloomLoginButton = ({ isMobile }: BloomLoginButtonProps) => {
  const navigate = useNavigate();
  const [isClicked, setIsClicked] = useState(false);

  console.log('[BloomLoginButton] Component mounting/rendering...');

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
    setTimeout(() => setIsClicked(false), 2000);

    if (!isAuthenticated) {
      console.log('[BloomLoginButton] Triggering Azure AD login');
      try {
        await login();
        // If login() returns without redirecting (stub auth), navigate to bloom home
        console.log('[BloomLoginButton] Login completed, navigating to bloom home');
        navigate('/bloom-home');
      } catch (error) {
        console.error('[BloomLoginButton] Login failed:', error);
        // Still navigate to bloom home for dev experience
        navigate('/bloom-home');
      }
    } else {
      console.log('[BloomLoginButton] Already authenticated, navigating to bloom home');
      navigate('/bloom-home');
    }
  };

  const buttonSize = isMobile ? 90 : 120;

  return (
    <motion.div
      style={{
        position: 'relative',
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: [0, 0.5, 0, -0.5, 0] }}
      transition={{
        delay: 0.4,
        duration: 1.8,
        ease: [0.34, 1.56, 0.64, 1], // Bouncy easing like other flowers
        rotate: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2.2 }, // Start gentle rotation after entrance
      }}
    >
      {/* Perfect Circle Bloom Button - Extremely Subtle Glass Effect */}
      <motion.button
        onClick={handleClick}
        style={{
          position: 'relative',
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.005)', // Almost invisible
          border: '1px solid rgba(155, 114, 170, 0.02)', // Barely visible border
          boxShadow: '0 1px 2px rgba(155, 114, 170, 0.05)', // Minimal shadow
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(1px)', // Minimal blur
          transition: 'all 0.4s ease',
          zIndex: 10,
          overflow: 'hidden',
        }}
        whileHover={{
          background: 'rgba(255, 255, 255, 0.02)', // Slight visibility on hover
          borderColor: 'rgba(155, 114, 170, 0.05)',
          scale: 1.01,
          boxShadow: '0 2px 4px rgba(155, 114, 170, 0.08)',
        }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: [0, 1, 0, -1, 0],
        }}
        transition={{
          delay: 0.6,
          rotate: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        {/* Rainbow Bloom Effect on click */}
        <motion.div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: `${buttonSize}px`,
            height: `${buttonSize}px`,
            borderRadius: '50%',
            background: `
              radial-gradient(circle at center,
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
      </motion.button>

      {/* Purple Rose - positioned ON TOP of the button, perfectly centered and vibrant */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          pointerEvents: 'none',
          zIndex: 100, // Much higher to ensure it's on top
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '70px',
          height: '70px',
          // Removed opacity: 0.7 - let the rose show at full vibrancy
        }}
        animate={{
          rotate: [0, 0.8, 0, -0.8, 0],
          scale: [1, 1.01, 1, 1.005, 1],
          x: ['-50%', 'calc(-50% + 0.3px)', '-50%', 'calc(-50% - 0.3px)', '-50%'],
          y: ['-50%', 'calc(-50% - 0.2px)', '-50%', 'calc(-50% + 0.2px)', '-50%'],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Purple Rose SVG - Vibrant and Distinct */}
        <svg
          width={isMobile ? 50 : 65}
          height={isMobile ? 50 : 65}
          viewBox="0 0 40 40"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="purplePetalOuter">
              <stop offset="0%" stopColor="#F0E5F9" />
              <stop offset="30%" stopColor="#E0CEF0" />
              <stop offset="60%" stopColor="#C7ABD9" />
              <stop offset="85%" stopColor="#B18FC7" />
              <stop offset="100%" stopColor="#9B72AA" />
            </radialGradient>
            <radialGradient id="purplePetalInner">
              <stop offset="0%" stopColor="#D4BEED" />
              <stop offset="40%" stopColor="#B18FC7" />
              <stop offset="70%" stopColor="#9B72AA" />
              <stop offset="100%" stopColor="#7A5589" />
            </radialGradient>
            <radialGradient id="roseCenterGradient">
              <stop offset="0%" stopColor="#F5E6B8" />
              <stop offset="60%" stopColor="#E8D4A8" />
              <stop offset="100%" stopColor="#C9A87C" />
            </radialGradient>
          </defs>
          <g>
            {/* Outer ring: 6 petals */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const angleVariation = [5, -3, 4, -4, 3, -5][i];
              const sizeVariation = [1.05, 0.95, 1.0, 1.08, 0.98, 1.02][i];
              const adjustedAngle = angle + angleVariation;
              const petalDistance = 10.5;
              const x = 20 + Math.cos((adjustedAngle * Math.PI) / 180) * petalDistance;
              const y = 20 + Math.sin((adjustedAngle * Math.PI) / 180) * petalDistance;

              const petalWidth = 6.5 * sizeVariation;
              const petalHeight = 7.2 * sizeVariation;

              return (
                <ellipse
                  key={`outer-${i}`}
                  cx={x}
                  cy={y}
                  rx={petalWidth}
                  ry={petalHeight}
                  fill="url(#purplePetalOuter)"
                  opacity="0.98"
                  transform={`rotate(${adjustedAngle + 8} ${x} ${y})`}
                />
              );
            })}

            {/* Inner ring: 4 petals */}
            {[30, 100, 190, 280].map((angle, i) => {
              const angleVariation = [4, -6, 5, -4][i];
              const sizeVariation = [0.88, 0.92, 0.85, 0.9][i];
              const adjustedAngle = angle + angleVariation;
              const petalDistance = 6.2;
              const x = 20 + Math.cos((adjustedAngle * Math.PI) / 180) * petalDistance;
              const y = 20 + Math.sin((adjustedAngle * Math.PI) / 180) * petalDistance;

              const petalWidth = 5.0 * sizeVariation;
              const petalHeight = 5.8 * sizeVariation;

              return (
                <ellipse
                  key={`inner-${i}`}
                  cx={x}
                  cy={y}
                  rx={petalWidth}
                  ry={petalHeight}
                  fill="url(#purplePetalInner)"
                  opacity="0.96"
                  transform={`rotate(${adjustedAngle + 15} ${x} ${y})`}
                />
              );
            })}

            {/* Center */}
            <circle cx="20" cy="20" r="2.8" fill="url(#roseCenterGradient)" opacity="0.6" />
            <circle cx="19.5" cy="19.5" r="1.2" fill="#C9A87C" opacity="0.4" />
          </g>
        </svg>
      </motion.div>
    </motion.div>
  );
};

export default BloomLoginButton;
