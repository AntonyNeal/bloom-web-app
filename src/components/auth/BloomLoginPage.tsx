import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Tier1Flower } from '../flowers/Tier1Flower';
import { Tier2Flower } from '../flowers/Tier2Flower';
import { Tier3Flower } from '../flowers/Tier3Flower';
import { ArrowLeft, Sparkles } from 'lucide-react';

/**
 * Custom Bloom-styled login page that appears before Azure AD redirect
 * Provides a seamless brand experience before Microsoft authentication
 */
const BloomLoginPage = () => {
  const { isAuthenticated, login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('[BloomLoginPage] Login failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FAF7F2 0%, #F8F5F0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            textAlign: 'center',
            color: '#6B8E7F',
            fontSize: '18px',
            fontWeight: '500',
          }}
        >
          Preparing your garden...
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FAF7F2 0%, #F8F5F0 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background elements */}
      <div
        style={{
          position: 'absolute',
          top: '-200px',
          right: '-200px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(107, 142, 127, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(212, 162, 143, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Back to Home */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          position: 'absolute',
          top: '32px',
          left: '32px',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(107, 142, 127, 0.2)',
            borderRadius: '24px',
            color: '#6B8E7F',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.transform = 'translateX(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <ArrowLeft size={16} />
          Back to Garden
        </button>
      </motion.div>

      {/* Decorative flowers */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        style={{
          position: 'absolute',
          top: '15%',
          right: '15%',
          width: '60px',
          height: '60px',
        }}
      >
        <Tier1Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: '80px',
          height: '80px',
        }}
      >
        <Tier3Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        style={{
          position: 'absolute',
          top: '60%',
          right: '25%',
          width: '40px',
          height: '40px',
        }}
      >
        <Tier2Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
      </motion.div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '32px',
            border: '1px solid rgba(107, 142, 127, 0.1)',
            padding: '48px',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(107, 142, 127, 0.08)',
            position: 'relative',
          }}
        >
          {/* Bloom logo/icon */}
          <motion.div
            animate={{
              y: [0, -8, 0],
              rotate: [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 32px',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(147, 51, 234, 0.3)',
                position: 'relative',
              }}
            >
              <Sparkles size={32} color="white" />

              {/* Floating purple flower */}
              <motion.div
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
                style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  width: '50px',
                  height: '50px',
                }}
              >
                <Tier2Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#3A3A3A',
              marginBottom: '16px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Welcome to Bloom
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              fontSize: '18px',
              color: '#6B8E7F',
              marginBottom: '40px',
              lineHeight: '1.6',
            }}
          >
            Your gateway to the Life Psychology Australia practitioner portal.
            <br />
            <span style={{ fontSize: '16px', opacity: 0.8 }}>
              Secure authentication powered by Microsoft
            </span>
          </motion.p>

          {/* Custom login button */}
          <motion.button
            onClick={handleLogin}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(107, 142, 127, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <Sparkles size={20} />
            Enter the Garden
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            style={{
              fontSize: '14px',
              color: '#999',
              marginTop: '24px',
              lineHeight: '1.5',
            }}
          >
            You'll be securely redirected to Microsoft for authentication.
            <br />
            Your credentials are never stored by Bloom.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default BloomLoginPage;
