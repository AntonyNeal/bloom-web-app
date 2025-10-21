import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tier1Flower, Tier2Flower, Tier3Flower } from '@/components/flowers';
import { useState, useEffect } from 'react';

// Bloom design system colors
const bloomStyles = {
  colors: {
    eucalyptusSage: '#6B8E7F',
    softFern: '#8FA892',
    paleAmber: '#F5E6D3',
    softTerracotta: '#D4A28F',
    honeyAmber: '#E8B77D',
    clayTerracotta: '#C89B7B',
    warmCream: '#FAF7F2',
    paperWhite: '#FEFDFB',
    charcoalText: '#3A3A3A',
    mutedText: '#5A5A5A',
  },
};

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(false);

  // Generate floating particles once on mount
  const [particles] = useState(() => {
    return Array.from({ length: isMobile ? 8 : 12 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      xOffset: (Math.random() - 0.5) * 20,
      xOffset2: (Math.random() - 0.5) * 20,
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 2,
      size: 4 + Math.random() * 4,
    }));
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: bloomStyles.colors.warmCream, overflow: 'hidden' }}>
      {/* Ambient Background - Optimized for desktop performance */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[
          { size: '850px', color: bloomStyles.colors.eucalyptusSage, opacity: 0.06, top: '-15%', right: '-8%', blur: isMobile ? 140 : 70 },
          { size: '950px', color: bloomStyles.colors.softTerracotta, opacity: 0.04, bottom: '-20%', left: '-12%', blur: isMobile ? 150 : 75 },
          { size: '750px', color: bloomStyles.colors.honeyAmber, opacity: 0.05, top: '40%', left: '5%', blur: isMobile ? 120 : 60 },
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
            style={{
              position: 'absolute',
              width: blob.size,
              height: blob.size,
              borderRadius: '50%',
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

        {/* Floating Particles */}
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.6, 0.6, 0],
              y: ['100vh', '-20vh'],
              x: [
                `${particle.x}vw`,
                `${particle.x + particle.xOffset}vw`,
                `${particle.x + particle.xOffset2}vw`,
                `${particle.x}vw`,
              ],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              background: bloomStyles.colors.eucalyptusSage,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '40px 20px' : '60px 40px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            maxWidth: '900px',
            width: '100%',
            padding: isMobile ? '48px 32px' : '64px 56px',
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 247, 242, 0.9) 100%)`,
            backdropFilter: isMobile ? 'blur(10px)' : 'blur(5px)',
            borderRadius: '24px',
            border: `2px solid ${bloomStyles.colors.eucalyptusSage}20`,
            boxShadow: '0 8px 32px rgba(107, 142, 127, 0.12)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${bloomStyles.colors.eucalyptusSage}, ${bloomStyles.colors.softTerracotta})`,
          }} />

          {/* Three Flowers at Top */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '24px' : '40px',
            marginBottom: isMobile ? '32px' : '48px',
          }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{ width: isMobile ? '60px' : '80px', height: isMobile ? '60px' : '80px' }}
            >
              <Tier1Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={prefersReducedMotion} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{ width: isMobile ? '70px' : '90px', height: isMobile ? '70px' : '90px' }}
            >
              <Tier2Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={prefersReducedMotion} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              style={{ width: isMobile ? '60px' : '80px', height: isMobile ? '60px' : '80px' }}
            >
              <Tier3Flower isChecked={true} isMobile={isMobile} shouldReduceMotion={prefersReducedMotion} />
            </motion.div>
          </div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px' }}
          >
            <h1 style={{
              fontSize: isMobile ? '32px' : '40px',
              fontWeight: 600,
              color: bloomStyles.colors.charcoalText,
              marginBottom: '16px',
              lineHeight: 1.2,
            }}>
              Welcome to Your Garden
            </h1>
            <p style={{
              fontSize: isMobile ? '16px' : '18px',
              color: bloomStyles.colors.mutedText,
              lineHeight: 1.6,
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              Where experienced psychologists grow, collaborate, and bloom together
            </p>
          </motion.div>

          {/* Culture Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? '24px' : '32px',
              marginBottom: isMobile ? '40px' : '56px',
            }}
          >
            {[
              {
                icon: '🌿',
                title: 'Your Practice, Your Way',
                description: 'Set your own schedule. Choose your clients. Work from anywhere. Full autonomy.',
              },
              {
                icon: '🌸',
                title: 'Quiet Competence',
                description: 'Recognition without fanfare. Support when needed. Space to do your best work.',
              },
              {
                icon: '✨',
                title: 'Thoughtful Tools',
                description: 'Systems that work for you, not against you. Handcrafted with care.',
              },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.1 }}
                style={{
                  padding: isMobile ? '24px' : '28px',
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(5px)',
                  borderRadius: '16px',
                  border: `1px solid ${bloomStyles.colors.eucalyptusSage}20`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: isMobile ? '32px' : '40px', marginBottom: '12px' }}>
                  {value.icon}
                </div>
                <h3 style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 600,
                  color: bloomStyles.colors.charcoalText,
                  marginBottom: '8px',
                }}>
                  {value.title}
                </h3>
                <p style={{
                  fontSize: isMobile ? '14px' : '15px',
                  color: bloomStyles.colors.mutedText,
                  lineHeight: 1.6,
                }}>
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            style={{ textAlign: 'center' }}
          >
            <motion.button
              onClick={handleLogin}
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              style={{
                padding: isMobile ? '16px 48px' : '18px 64px',
                background: isLoading 
                  ? `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage}80, ${bloomStyles.colors.softFern}80)`
                  : `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage}, ${bloomStyles.colors.softFern})`,
                color: bloomStyles.colors.paperWhite,
                border: 'none',
                borderRadius: '12px',
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(107, 142, 127, 0.3)',
                transition: 'all 0.3s ease',
                opacity: isLoading ? 0.7 : 0.95,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '3px solid white',
                      borderRadius: '50%',
                    }}
                  />
                  <span>Opening the Garden Gate...</span>
                </>
              ) : (
                <>
                  <span>Enter Your Garden</span>
                  <span style={{ fontSize: '20px' }}>🌸</span>
                </>
              )}
            </motion.button>

            {/* Helper text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              style={{
                marginTop: '24px',
                fontSize: '14px',
                color: bloomStyles.colors.mutedText,
                opacity: 0.85,
              }}
            >
              For Life Psychology Australia team members
            </motion.p>
          </motion.div>

          {/* Bottom decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            style={{
              marginTop: isMobile ? '40px' : '56px',
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${bloomStyles.colors.eucalyptusSage}40, transparent)`,
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
