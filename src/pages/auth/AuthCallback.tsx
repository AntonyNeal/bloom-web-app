import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { Tier2Flower } from '@/components/flowers/Tier2Flower';

// Bloom colors
const bloomStyles = {
  colors: {
    eucalyptusSage: '#6B8E7F',
    softTerracotta: '#D4A28F',
    warmCream: '#FAF7F2',
    charcoalText: '#3A3A3A',
  },
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Processing authentication callback...');
        console.log('[AuthCallback] Current URL:', window.location.href);
        console.log('[AuthCallback] Is authenticated:', isAuthenticated);

        // Handle the redirect promise from MSAL
        const response = await instance.handleRedirectPromise();
        console.log('[AuthCallback] MSAL response:', response);

        if (response) {
          console.log(
            '[AuthCallback] Authentication successful, account:',
            response.account?.username
          );
          // Wait a moment for the auth state to update
          setTimeout(() => {
            navigate('/bloom-home');
          }, 500);
        } else if (isAuthenticated) {
          console.log('[AuthCallback] Already authenticated, navigating to bloom home');
          navigate('/bloom-home');
        } else {
          console.log('[AuthCallback] No authentication response, redirecting to home');
          navigate('/');
        }
      } catch (err) {
        console.error('[AuthCallback] Authentication error:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate, instance, isAuthenticated]);

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: bloomStyles.colors.warmCream,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '48px 32px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            border: `2px solid ${bloomStyles.colors.softTerracotta}40`,
            maxWidth: '500px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌸</div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 600,
              marginBottom: '16px',
              color: bloomStyles.colors.charcoalText,
            }}
          >
            We're having a small hiccup
          </h2>
          <p
            style={{
              color: bloomStyles.colors.softTerracotta,
              marginBottom: '24px',
              fontSize: '16px',
            }}
          >
            {error}
          </p>
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '12px 32px',
              background: `linear-gradient(135deg, ${bloomStyles.colors.eucalyptusSage}, ${bloomStyles.colors.softTerracotta})`,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(107, 142, 127, 0.2)',
            }}
          >
            Return Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bloomStyles.colors.warmCream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          textAlign: 'center',
          padding: '48px 32px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          border: `2px solid ${bloomStyles.colors.eucalyptusSage}40`,
          maxWidth: '500px',
        }}
      >
        {/* Animated Flower */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
          }}
        >
          <Tier2Flower isChecked={true} isMobile={false} shouldReduceMotion={false} />
        </motion.div>

        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontSize: '18px',
            color: bloomStyles.colors.charcoalText,
            fontWeight: 500,
          }}
        >
          Opening the garden gate...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AuthCallback;
