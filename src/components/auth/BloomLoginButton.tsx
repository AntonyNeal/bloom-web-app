import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Tier2Flower } from '../flowers/Tier2Flower'

interface BloomLoginButtonProps {
  isMobile: boolean
}

const BloomLoginButton = ({ isMobile }: BloomLoginButtonProps) => {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  const handleClick = async () => {
    console.log('[BloomLoginButton] Button clicked, isAuthenticated:', isAuthenticated)
    
    if (!isAuthenticated) {
      try {
        console.log('[BloomLoginButton] Attempting login...')
        
        // Set a timeout to navigate to join-us if redirect doesn't happen
        const fallbackTimer = setTimeout(() => {
          console.log('[BloomLoginButton] Auth redirect timeout, navigating to /join-us')
          navigate('/join-us')
        }, 2000) // Wait 2 seconds for redirect
        
        await login()
        
        // Clear timeout if login succeeds (though redirect will navigate away)
        clearTimeout(fallbackTimer)
      } catch (error) {
        console.error('[BloomLoginButton] Login error:', error)
        // Fallback to join-us page if auth fails
        navigate('/join-us')
      }
    } else {
      console.log('[BloomLoginButton] Already authenticated, navigating to dashboard')
      navigate('/admin/dashboard')
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      style={{
        position: 'relative',
        padding: isMobile ? '14px 32px' : '16px 40px',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        color: '#9333ea',
        border: '2px solid #9333ea',
        borderRadius: '9999px',
        fontSize: isMobile ? '1rem' : '1.125rem',
        fontWeight: '600',
        cursor: 'pointer',
        overflow: 'visible',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
      whileHover={{
        scale: 1.05,
        backgroundColor: 'rgba(147, 51, 234, 0.2)',
      }}
      whileTap={{ scale: 0.95 }}
    >
      <span>Bloom</span>
      
      {/* Purple Rose - Elevated above the button */}
      <motion.div
        style={{
          position: 'absolute',
          top: isMobile ? '-25px' : '-30px',
          right: isMobile ? '-15px' : '-20px',
          width: isMobile ? '50px' : '60px',
          height: isMobile ? '50px' : '60px',
          zIndex: 10,
        }}
        animate={{
          y: [0, -5, 0],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Tier2Flower 
          isChecked={true} 
          isMobile={isMobile} 
          shouldReduceMotion={false} 
        />
      </motion.div>
    </motion.button>
  )
}

export default BloomLoginButton
