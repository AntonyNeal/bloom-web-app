/**
 * Onboarding Page
 * 
 * Allows accepted practitioners to:
 * 1. Verify their information
 * 2. Create a secure password and accept contract
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, AlertCircle, Loader2, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { WildflowerMeadow } from '../components/flowers';
import { API_BASE_URL } from '../config/api';

// API URL - uses centralized config (fails fast if not set)
const API_URL = API_BASE_URL;

// Bloom colors
const colors = {
  eucalyptusSage: '#6B8E7F',
  softTerracotta: '#D4A28F',
  warmCream: '#FAF7F2',
  charcoalText: '#3A3A3A',
  success: '#10b981',
  error: '#ef4444',
};

interface PractitionerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ahpraNumber?: string;
  specializations?: string[];
  experienceYears?: number;
  profilePhotoUrl?: string;
  displayName?: string;
  bio?: string;
  contractUrl?: string;
  favoriteFlower?: string; // Zoe's surprise ≡ƒî╕
}

type OnboardingStep = 'loading' | 'welcome' | 'password' | 'complete' | 'error';

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // State
  const [step, setStep] = useState<OnboardingStep>('loading');
  const [practitioner, setPractitioner] = useState<PractitionerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [companyEmail, setCompanyEmail] = useState<string | null>(null);
  
  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('No onboarding token provided');
      setStep('error');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/onboarding/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Invalid token');
          setErrorCode(data.code);
          setStep('error');
          return;
        }

        setPractitioner(data.practitioner);
        setStep('welcome');
      } catch {
        setError('Failed to validate token. Please try again later.');
        setStep('error');
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async () => {
    if (!isPasswordValid) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/onboarding/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to complete onboarding');
        return;
      }

      // Capture the new company email from the response
      if (data.practitioner?.companyEmail) {
        setCompanyEmail(data.practitioner.companyEmail);
      } else if (data.account?.email) {
        setCompanyEmail(data.account.email);
      }

      setStep('complete');
    } catch {
      setError('Failed to complete onboarding. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (step === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.warmCream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <Loader2 size={48} color={colors.eucalyptusSage} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 16, color: colors.charcoalText }}>Validating your invitation...</p>
        </motion.div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.warmCream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'white',
            borderRadius: 16,
            padding: 40,
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <AlertCircle size={32} color={colors.error} />
          </div>
          <h1 style={{ fontSize: 24, color: colors.charcoalText, marginBottom: 12 }}>
            {errorCode === 'ALREADY_COMPLETED' ? 'Already Completed' : 'Invitation Invalid'}
          </h1>
          <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            {errorCode === 'ALREADY_COMPLETED' 
              ? 'You have already completed your onboarding. You can now log in to access your account.'
              : errorCode === 'TOKEN_EXPIRED'
              ? 'This invitation link has expired. Please contact us to request a new one.'
              : error
            }
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: colors.eucalyptusSage,
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {errorCode === 'ALREADY_COMPLETED' ? 'Go to Login' : 'Return Home'}
          </button>
        </motion.div>
      </div>
    );
  }

  // Complete state
  if (step === 'complete') {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.warmCream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white',
            borderRadius: 16,
            padding: 40,
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <CheckCircle2 size={48} color={colors.success} />
          </motion.div>
          <h1 style={{ fontSize: 28, color: colors.charcoalText, marginBottom: 12 }}>
            ≡ƒÄë Welcome to Bloom!
          </h1>
          <p style={{ color: '#666', marginBottom: 8, fontSize: 18 }}>
            Hi {practitioner?.firstName}, your account is ready!
          </p>
          {companyEmail && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #10b981',
              borderRadius: 8,
              padding: '16px 20px',
              marginBottom: 16,
            }}>
              <p style={{ color: '#065f46', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
                Your new company email:
              </p>
              <p style={{ color: '#047857', fontSize: 18, fontWeight: 700 }}>
                {companyEmail}
              </p>
              <p style={{ color: '#059669', fontSize: 13, marginTop: 8 }}>
                Use this email to sign in to Bloom and Outlook.
              </p>
            </div>
          )}
          <p style={{ color: '#888', marginBottom: 32, lineHeight: 1.6 }}>
            Your admin will activate your profile soon, 
            and you'll appear on the Life Psychology Australia website.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: colors.eucalyptusSage,
              color: 'white',
              border: 'none',
              padding: '14px 40px',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Go to Login <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  // Main onboarding flow
  return (
    <div style={{
      height: '100vh',
      background: step === 'welcome' 
        ? `
          radial-gradient(ellipse at 50% 40%, rgba(255, 253, 250, 0.3) 0%, transparent 50%),
          linear-gradient(180deg, 
            #e8e2d8 0%, 
            #e3dcd2 15%,
            #ded7cd 30%,
            #e5ded4 45%,
            #dfd8ce 60%,
            #e2dbd1 75%,
            #ddd6cc 90%,
            #d8d1c7 100%
          )
        `
        : 'transparent',
      padding: '20px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Subtle stone texture overlay - organic, weathered, Miyazaki-style */}
      {step === 'welcome' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}>
          {/* SVG texture for organic stone weathering */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
            <defs>
              {/* Organic noise for stone texture */}
              <filter id="stoneWeather" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="6" seed="15" result="noise" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.7  0 0 0 0 0.65  0 0 0 0 0.6  0 0 0 0.4 0" />
              </filter>
              {/* Scattered weathering marks */}
              <pattern id="weatherMarks" patternUnits="userSpaceOnUse" width="300" height="300">
                <rect width="300" height="300" fill="transparent" />
                {/* Random organic spots - like lichen, age marks, mineral deposits */}
                <circle cx="45" cy="30" r="3" fill="#c8c0b5" opacity="0.3" />
                <ellipse cx="120" cy="85" rx="5" ry="3" fill="#bfb8ad" opacity="0.25" transform="rotate(15 120 85)" />
                <circle cx="230" cy="45" r="2" fill="#d5cec4" opacity="0.2" />
                <ellipse cx="75" cy="140" rx="4" ry="6" fill="#c2bab0" opacity="0.2" transform="rotate(-20 75 140)" />
                <circle cx="180" cy="170" r="4" fill="#ccc5ba" opacity="0.25" />
                <ellipse cx="260" cy="120" rx="6" ry="4" fill="#b8b1a6" opacity="0.15" transform="rotate(40 260 120)" />
                <circle cx="30" cy="220" r="3" fill="#d0c9bf" opacity="0.2" />
                <ellipse cx="150" cy="250" rx="5" ry="3" fill="#c5beb4" opacity="0.25" transform="rotate(-10 150 250)" />
                <circle cx="210" cy="210" r="2" fill="#bdb6ab" opacity="0.3" />
                <ellipse cx="95" cy="280" rx="4" ry="5" fill="#c8c1b7" opacity="0.2" transform="rotate(25 95 280)" />
                <circle cx="280" cy="260" r="3" fill="#d2cbc1" opacity="0.15" />
                {/* Faint cracks - organic, not straight */}
                <path d="M20 60 Q25 65 22 75 Q18 82 24 90" stroke="#b5aea3" strokeWidth="0.5" fill="none" opacity="0.2" />
                <path d="M190 30 Q195 38 192 45" stroke="#bab3a8" strokeWidth="0.4" fill="none" opacity="0.15" />
                <path d="M250 180 Q245 190 250 200 Q255 208 248 215" stroke="#b8b1a6" strokeWidth="0.5" fill="none" opacity="0.2" />
                {/* Subtle color variations - like minerals in stone */}
                <ellipse cx="100" cy="50" rx="15" ry="10" fill="#d8d2c8" opacity="0.1" transform="rotate(30 100 50)" />
                <ellipse cx="220" cy="150" rx="20" ry="12" fill="#cfc8bd" opacity="0.08" transform="rotate(-15 220 150)" />
                <ellipse cx="50" cy="180" rx="12" ry="18" fill="#d5cfc5" opacity="0.1" transform="rotate(45 50 180)" />
              </pattern>
            </defs>
            {/* Base noise texture */}
            <rect width="100%" height="100%" filter="url(#stoneWeather)" opacity="0.3" />
            {/* Organic weathering marks */}
            <rect width="100%" height="100%" fill="url(#weatherMarks)" />
          </svg>
          {/* Soft vignette - aged, not uniform */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse 80% 70% at 30% 20%, transparent 0%, transparent 60%, rgba(180, 170, 155, 0.08) 100%),
              radial-gradient(ellipse 70% 80% at 75% 80%, transparent 0%, transparent 50%, rgba(190, 180, 165, 0.1) 100%),
              radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(175, 165, 150, 0.12) 100%)
            `,
          }} />
        </div>
      )}
      
      {/* Ivy on the stone wall - flower-quality detail with gradients, shadows, veins */}
      {step === 'welcome' && (
        <>
          {/* RIGHT SIDE - UPPER VINE */}
          <svg
            style={{
              position: 'absolute',
              top: '0%',
              left: 'calc(50% + 115px)',
              width: 380,
              height: 280,
              opacity: 0.85,
              pointerEvents: 'none',
              zIndex: 1,
            }}
            viewBox="-60 -20 400 280"
          >
            <defs>
              {/* Ivy leaf gradient - dark edge to lighter center like real leaves */}
              <radialGradient id="ivyLeafGradientR1" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#7A9E7A" />
                <stop offset="40%" stopColor="#5C7A52" />
                <stop offset="75%" stopColor="#4A5944" />
                <stop offset="100%" stopColor="#3D4A38" />
              </radialGradient>
              <radialGradient id="ivyLeafGradientR2" cx="35%" cy="25%">
                <stop offset="0%" stopColor="#8BAA7E" />
                <stop offset="45%" stopColor="#6B8A5E" />
                <stop offset="80%" stopColor="#526B4A" />
                <stop offset="100%" stopColor="#445A3E" />
              </radialGradient>
              <radialGradient id="ivyLeafGradientR3" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#9AB88D" />
                <stop offset="50%" stopColor="#7A9A6E" />
                <stop offset="85%" stopColor="#5C7A52" />
                <stop offset="100%" stopColor="#4A6445" />
              </radialGradient>
              {/* Leaf shadow */}
              <filter id="leafShadowR" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#2A3A28" floodOpacity="0.3" />
              </filter>
              {/* Detailed ivy leaf with lobes and veins */}
              <g id="ivyLeafDetailR">
                {/* Shadow layer */}
                <path d="M0 -12 C-3 -14 -8 -12 -11 -6 C-14 0 -12 6 -8 9 C-5 11 -2 10 0 14 C2 10 5 11 8 9 C12 6 14 0 11 -6 C8 -12 3 -14 0 -12" 
                      fill="#2A3A28" opacity="0.25" transform="translate(1.5, 2)" />
                {/* Main leaf shape - classic ivy 3-lobe */}
                <path d="M0 -12 C-3 -14 -8 -12 -11 -6 C-14 0 -12 6 -8 9 C-5 11 -2 10 0 14 C2 10 5 11 8 9 C12 6 14 0 11 -6 C8 -12 3 -14 0 -12" 
                      fill="url(#ivyLeafGradientR1)" />
                {/* Light highlight */}
                <ellipse cx="-3" cy="-4" rx="4" ry="5" fill="rgba(180, 220, 170, 0.4)" />
                {/* Central vein */}
                <path d="M0 -10 L0 12" stroke="#3D4A38" strokeWidth="0.6" fill="none" opacity="0.6" />
                {/* Side veins */}
                <path d="M0 -6 L-6 -3" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 -6 L6 -3" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 0 L-5 5" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 0 L5 5" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
              </g>
            </defs>
            
            {/* Vine stems - woody texture with thickness variation */}
            <path d="M-15 70 Q10 65 45 80 Q80 100 100 150 Q110 190 105 240" fill="none" stroke="#5C4A3A" strokeWidth="4" strokeLinecap="round" />
            <path d="M-15 70 Q10 65 45 80 Q80 100 100 150 Q110 190 105 240" fill="none" stroke="#6B5A4A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M45 80 Q90 65 150 85 Q210 105 270 90" fill="none" stroke="#5C4A3A" strokeWidth="3" strokeLinecap="round" />
            <path d="M45 80 Q90 65 150 85 Q210 105 270 90" fill="none" stroke="#6B5A4A" strokeWidth="1.8" strokeLinecap="round" />
            
            {/* Tendrils - thin curly bits */}
            <path d="M30 75 Q35 68 32 62 Q28 58 35 55" fill="none" stroke="#7A6A5A" strokeWidth="1" strokeLinecap="round" />
            <path d="M100 145 Q108 138 105 130" fill="none" stroke="#7A6A5A" strokeWidth="1" strokeLinecap="round" />
            
            {/* Dense cluster at arch edge */}
            <g transform="translate(-12, 65) rotate(-35)" filter="url(#leafShadowR)"><use href="#ivyLeafDetailR" transform="scale(1.8)" /></g>
            <g transform="translate(-8, 85) rotate(-10)"><use href="#ivyLeafDetailR" transform="scale(1.6)" style={{ fill: 'url(#ivyLeafGradientR2)' }} /></g>
            <g transform="translate(-5, 50) rotate(-50)"><use href="#ivyLeafDetailR" transform="scale(1.5)" /></g>
            <g transform="translate(10, 72) rotate(-25)" filter="url(#leafShadowR)"><use href="#ivyLeafDetailR" transform="scale(1.4)" style={{ fill: 'url(#ivyLeafGradientR3)' }} /></g>
            <g transform="translate(5, 95) rotate(5)"><use href="#ivyLeafDetailR" transform="scale(1.3)" /></g>
            
            {/* Along main vine */}
            <g transform="translate(35, 78) rotate(10)" filter="url(#leafShadowR)"><use href="#ivyLeafDetailR" transform="scale(1.4)" style={{ fill: 'url(#ivyLeafGradientR2)' }} /></g>
            <g transform="translate(55, 88) rotate(25)"><use href="#ivyLeafDetailR" transform="scale(1.2)" /></g>
            <g transform="translate(75, 105) rotate(40)"><use href="#ivyLeafDetailR" transform="scale(1.3)" style={{ fill: 'url(#ivyLeafGradientR3)' }} /></g>
            <g transform="translate(95, 135) rotate(55)" filter="url(#leafShadowR)"><use href="#ivyLeafDetailR" transform="scale(1.1)" /></g>
            <g transform="translate(105, 175) rotate(70)"><use href="#ivyLeafDetailR" transform="scale(1.0)" style={{ fill: 'url(#ivyLeafGradientR2)' }} /></g>
            <g transform="translate(108, 215) rotate(80)"><use href="#ivyLeafDetailR" transform="scale(0.95)" /></g>
            
            {/* Upper branch leaves - getting smaller toward tips */}
            <g transform="translate(85, 72) rotate(20)" filter="url(#leafShadowR)"><use href="#ivyLeafDetailR" transform="scale(1.1)" style={{ fill: 'url(#ivyLeafGradientR3)' }} /></g>
            <g transform="translate(120, 78) rotate(8)"><use href="#ivyLeafDetailR" transform="scale(1.0)" /></g>
            <g transform="translate(155, 82) rotate(15)"><use href="#ivyLeafDetailR" transform="scale(0.9)" style={{ fill: 'url(#ivyLeafGradientR2)' }} /></g>
            <g transform="translate(195, 95) rotate(25)"><use href="#ivyLeafDetailR" transform="scale(0.8)" /></g>
            <g transform="translate(235, 92) rotate(12)"><use href="#ivyLeafDetailR" transform="scale(0.7)" style={{ fill: 'url(#ivyLeafGradientR3)' }} /></g>
            <g transform="translate(265, 88) rotate(18)"><use href="#ivyLeafDetailR" transform="scale(0.6)" /></g>
          </svg>
          
          {/* RIGHT SIDE - LOWER VINE */}
          <svg
            style={{
              position: 'absolute',
              top: '32%',
              left: 'calc(50% + 115px)',
              width: 500,
              height: 450,
              opacity: 0.75,
              pointerEvents: 'none',
              zIndex: 1,
            }}
            viewBox="-60 -20 530 450"
          >
            <defs>
              <radialGradient id="ivyLeafGradientRL1" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#7A9E7A" />
                <stop offset="40%" stopColor="#5C7A52" />
                <stop offset="75%" stopColor="#4A5944" />
                <stop offset="100%" stopColor="#3D4A38" />
              </radialGradient>
              <radialGradient id="ivyLeafGradientRL2" cx="35%" cy="25%">
                <stop offset="0%" stopColor="#8BAA7E" />
                <stop offset="45%" stopColor="#6B8A5E" />
                <stop offset="80%" stopColor="#526B4A" />
                <stop offset="100%" stopColor="#445A3E" />
              </radialGradient>
              <filter id="leafShadowRL" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#2A3A28" floodOpacity="0.3" />
              </filter>
              <g id="ivyLeafDetailRL">
                <path d="M0 -12 C-3 -14 -8 -12 -11 -6 C-14 0 -12 6 -8 9 C-5 11 -2 10 0 14 C2 10 5 11 8 9 C12 6 14 0 11 -6 C8 -12 3 -14 0 -12" 
                      fill="#2A3A28" opacity="0.25" transform="translate(1.5, 2)" />
                <path d="M0 -12 C-3 -14 -8 -12 -11 -6 C-14 0 -12 6 -8 9 C-5 11 -2 10 0 14 C2 10 5 11 8 9 C12 6 14 0 11 -6 C8 -12 3 -14 0 -12" 
                      fill="url(#ivyLeafGradientRL1)" />
                <ellipse cx="-3" cy="-4" rx="4" ry="5" fill="rgba(180, 220, 170, 0.4)" />
                <path d="M0 -10 L0 12" stroke="#3D4A38" strokeWidth="0.6" fill="none" opacity="0.6" />
                <path d="M0 -6 L-6 -3" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 -6 L6 -3" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 0 L-5 5" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 0 L5 5" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
              </g>
            </defs>
            
            {/* Vine stems */}
            <path d="M-5 10 Q25 25 50 70 Q75 130 60 180 Q45 230 70 290 Q95 350 80 400" fill="none" stroke="#5C4A3A" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M-5 10 Q25 25 50 70 Q75 130 60 180 Q45 230 70 290 Q95 350 80 400" fill="none" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round" />
            <path d="M50 70 Q100 60 160 85 Q220 115 290 100 Q350 88 400 110" fill="none" stroke="#5C4A3A" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M50 70 Q100 60 160 85 Q220 115 290 100 Q350 88 400 110" fill="none" stroke="#6B5A4A" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M60 180 Q110 170 170 195 Q230 220 280 205" fill="none" stroke="#5C4A3A" strokeWidth="2" strokeLinecap="round" />
            <path d="M60 180 Q110 170 170 195 Q230 220 280 205" fill="none" stroke="#6B5A4A" strokeWidth="1.2" strokeLinecap="round" />
            
            {/* Tendrils */}
            <path d="M25 40 Q30 32 26 25 Q22 20 28 15" fill="none" stroke="#7A6A5A" strokeWidth="1" strokeLinecap="round" />
            <path d="M70 125 Q78 118 75 110" fill="none" stroke="#7A6A5A" strokeWidth="1" strokeLinecap="round" />
            
            {/* Origin cluster */}
            <g transform="translate(-2, 8) rotate(-25)" filter="url(#leafShadowRL)"><use href="#ivyLeafDetailRL" transform="scale(1.5)" /></g>
            <g transform="translate(12, 22) rotate(5)"><use href="#ivyLeafDetailRL" transform="scale(1.4)" style={{ fill: 'url(#ivyLeafGradientRL2)' }} /></g>
            <g transform="translate(28, 45) rotate(20)" filter="url(#leafShadowRL)"><use href="#ivyLeafDetailRL" transform="scale(1.3)" /></g>
            
            {/* Main vine leaves */}
            <g transform="translate(45, 65) rotate(30)"><use href="#ivyLeafDetailRL" transform="scale(1.2)" style={{ fill: 'url(#ivyLeafGradientRL2)' }} /></g>
            <g transform="translate(62, 110) rotate(50)" filter="url(#leafShadowRL)"><use href="#ivyLeafDetailRL" transform="scale(1.1)" /></g>
            <g transform="translate(55, 155) rotate(65)"><use href="#ivyLeafDetailRL" transform="scale(1.0)" /></g>
            <g transform="translate(50, 200) rotate(75)"><use href="#ivyLeafDetailRL" transform="scale(0.95)" style={{ fill: 'url(#ivyLeafGradientRL2)' }} /></g>
            <g transform="translate(58, 250) rotate(80)" filter="url(#leafShadowRL)"><use href="#ivyLeafDetailRL" transform="scale(0.9)" /></g>
            <g transform="translate(72, 310) rotate(70)"><use href="#ivyLeafDetailRL" transform="scale(0.85)" /></g>
            <g transform="translate(85, 360) rotate(78)"><use href="#ivyLeafDetailRL" transform="scale(0.8)" style={{ fill: 'url(#ivyLeafGradientRL2)' }} /></g>
            <g transform="translate(78, 395) rotate(82)"><use href="#ivyLeafDetailRL" transform="scale(0.75)" /></g>
            
            {/* Secondary vine leaves */}
            <g transform="translate(95, 62) rotate(15)" filter="url(#leafShadowRL)"><use href="#ivyLeafDetailRL" transform="scale(1.1)" /></g>
            <g transform="translate(140, 78) rotate(25)"><use href="#ivyLeafDetailRL" transform="scale(1.0)" style={{ fill: 'url(#ivyLeafGradientRL2)' }} /></g>
            <g transform="translate(195, 100) rotate(10)"><use href="#ivyLeafDetailRL" transform="scale(0.9)" /></g>
            <g transform="translate(255, 105) rotate(20)"><use href="#ivyLeafDetailRL" transform="scale(0.8)" /></g>
            <g transform="translate(320, 98) rotate(8)"><use href="#ivyLeafDetailRL" transform="scale(0.7)" style={{ fill: 'url(#ivyLeafGradientRL2)' }} /></g>
            <g transform="translate(380, 108) rotate(18)"><use href="#ivyLeafDetailRL" transform="scale(0.6)" /></g>
            
            {/* Tertiary vine leaves */}
            <g transform="translate(105, 175) rotate(22)" filter="url(#leafShadowRL)"><use href="#ivyLeafDetailRL" transform="scale(0.85)" /></g>
            <g transform="translate(155, 190) rotate(12)"><use href="#ivyLeafDetailRL" transform="scale(0.75)" style={{ fill: 'url(#ivyLeafGradientRL2)' }} /></g>
            <g transform="translate(215, 210) rotate(28)"><use href="#ivyLeafDetailRL" transform="scale(0.7)" /></g>
            <g transform="translate(265, 205) rotate(15)"><use href="#ivyLeafDetailRL" transform="scale(0.6)" /></g>
          </svg>
          
          {/* LEFT SIDE - UPPER VINE */}
          <svg
            style={{
              position: 'absolute',
              top: '5%',
              right: 'calc(50% + 115px)',
              width: 340,
              height: 250,
              opacity: 0.8,
              pointerEvents: 'none',
              zIndex: 1,
            }}
            viewBox="-20 -20 360 260"
          >
            <defs>
              <radialGradient id="ivyLeafGradientLU1" cx="70%" cy="30%">
                <stop offset="0%" stopColor="#7A9E7A" />
                <stop offset="40%" stopColor="#5C7A52" />
                <stop offset="75%" stopColor="#4A5944" />
                <stop offset="100%" stopColor="#3D4A38" />
              </radialGradient>
              <radialGradient id="ivyLeafGradientLU2" cx="65%" cy="25%">
                <stop offset="0%" stopColor="#8BAA7E" />
                <stop offset="45%" stopColor="#6B8A5E" />
                <stop offset="80%" stopColor="#526B4A" />
                <stop offset="100%" stopColor="#445A3E" />
              </radialGradient>
              <filter id="leafShadowLU" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="-1" dy="2" stdDeviation="1.5" floodColor="#2A3A28" floodOpacity="0.3" />
              </filter>
              <g id="ivyLeafDetailLU">
                <path d="M0 -12 C-3 -14 -8 -12 -11 -6 C-14 0 -12 6 -8 9 C-5 11 -2 10 0 14 C2 10 5 11 8 9 C12 6 14 0 11 -6 C8 -12 3 -14 0 -12" 
                      fill="#2A3A28" opacity="0.25" transform="translate(-1.5, 2)" />
                <path d="M0 -12 C-3 -14 -8 -12 -11 -6 C-14 0 -12 6 -8 9 C-5 11 -2 10 0 14 C2 10 5 11 8 9 C12 6 14 0 11 -6 C8 -12 3 -14 0 -12" 
                      fill="url(#ivyLeafGradientLU1)" />
                <ellipse cx="3" cy="-4" rx="4" ry="5" fill="rgba(180, 220, 170, 0.4)" />
                <path d="M0 -10 L0 12" stroke="#3D4A38" strokeWidth="0.6" fill="none" opacity="0.6" />
                <path d="M0 -6 L-6 -3" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 -6 L6 -3" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 0 L-5 5" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 0 L5 5" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
              </g>
            </defs>
            
            {/* Vine stems */}
            <path d="M295 55 Q265 50 235 70 Q200 95 185 145 Q178 185 180 210" fill="none" stroke="#5C4A3A" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M295 55 Q265 50 235 70 Q200 95 185 145 Q178 185 180 210" fill="none" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round" />
            <path d="M235 70 Q185 55 130 75 Q80 92 35 78" fill="none" stroke="#5C4A3A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M235 70 Q185 55 130 75 Q80 92 35 78" fill="none" stroke="#6B5A4A" strokeWidth="1.4" strokeLinecap="round" />
            
            {/* Tendrils */}
            <path d="M250 62 Q245 55 248 48 Q252 42 245 38" fill="none" stroke="#7A6A5A" strokeWidth="1" strokeLinecap="round" />
            
            {/* Dense cluster at arch edge */}
            <g transform="translate(292, 50) rotate(30)" filter="url(#leafShadowLU)"><use href="#ivyLeafDetailLU" transform="scale(1.6)" /></g>
            <g transform="translate(288, 68) rotate(5)"><use href="#ivyLeafDetailLU" transform="scale(1.5)" style={{ fill: 'url(#ivyLeafGradientLU2)' }} /></g>
            <g transform="translate(285, 42) rotate(45)"><use href="#ivyLeafDetailLU" transform="scale(1.4)" /></g>
            <g transform="translate(268, 58) rotate(20)" filter="url(#leafShadowLU)"><use href="#ivyLeafDetailLU" transform="scale(1.3)" /></g>
            <g transform="translate(275, 80) rotate(-5)"><use href="#ivyLeafDetailLU" transform="scale(1.2)" style={{ fill: 'url(#ivyLeafGradientLU2)' }} /></g>
            
            {/* Main vine leaves */}
            <g transform="translate(245, 65) rotate(-15)"><use href="#ivyLeafDetailLU" transform="scale(1.3)" /></g>
            <g transform="translate(215, 85) rotate(-35)" filter="url(#leafShadowLU)"><use href="#ivyLeafDetailLU" transform="scale(1.2)" style={{ fill: 'url(#ivyLeafGradientLU2)' }} /></g>
            <g transform="translate(195, 120) rotate(-55)"><use href="#ivyLeafDetailLU" transform="scale(1.1)" /></g>
            <g transform="translate(185, 165) rotate(-72)"><use href="#ivyLeafDetailLU" transform="scale(1.0)" /></g>
            <g transform="translate(180, 200) rotate(-80)"><use href="#ivyLeafDetailLU" transform="scale(0.9)" style={{ fill: 'url(#ivyLeafGradientLU2)' }} /></g>
            
            {/* Branch leaves */}
            <g transform="translate(200, 60) rotate(-22)" filter="url(#leafShadowLU)"><use href="#ivyLeafDetailLU" transform="scale(1.0)" /></g>
            <g transform="translate(150, 68) rotate(-10)"><use href="#ivyLeafDetailLU" transform="scale(0.9)" style={{ fill: 'url(#ivyLeafGradientLU2)' }} /></g>
            <g transform="translate(100, 80) rotate(-28)"><use href="#ivyLeafDetailLU" transform="scale(0.8)" /></g>
            <g transform="translate(55, 78) rotate(-15)"><use href="#ivyLeafDetailLU" transform="scale(0.7)" /></g>
          </svg>
          
          {/* LEFT SIDE - LOWER VINE */}
          <svg
            style={{
              position: 'absolute',
              top: '35%',
              right: 'calc(50% + 95px)',
              width: 480,
              height: 410,
              opacity: 0.7,
              pointerEvents: 'none',
              zIndex: 1,
            }}
            viewBox="-20 -20 470 410"
          >
            <defs>
              <radialGradient id="ivyLeafGradientLL1" cx="70%" cy="30%">
                <stop offset="0%" stopColor="#7A9E7A" />
                <stop offset="40%" stopColor="#5C7A52" />
                <stop offset="75%" stopColor="#4A5944" />
                <stop offset="100%" stopColor="#3D4A38" />
              </radialGradient>
              <radialGradient id="ivyLeafGradientLL2" cx="65%" cy="25%">
                <stop offset="0%" stopColor="#8BAA7E" />
                <stop offset="45%" stopColor="#6B8A5E" />
                <stop offset="80%" stopColor="#526B4A" />
                <stop offset="100%" stopColor="#445A3E" />
              </radialGradient>
              <filter id="leafShadowLL" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="-1" dy="2" stdDeviation="1.5" floodColor="#2A3A28" floodOpacity="0.3" />
              </filter>
              <g id="ivyLeafDetailLL">
                <path d="M0 -12 C-3 -14 -8 -12 -11 -6 C-14 0 -12 6 -8 9 C-5 11 -2 10 0 14 C2 10 5 11 8 9 C12 6 14 0 11 -6 C8 -12 3 -14 0 -12" 
                      fill="#2A3A28" opacity="0.25" transform="translate(-1.5, 2)" />
                <path d="M0 -12 C-3 -14 -8 -12 -11 -6 C-14 0 -12 6 -8 9 C-5 11 -2 10 0 14 C2 10 5 11 8 9 C12 6 14 0 11 -6 C8 -12 3 -14 0 -12" 
                      fill="url(#ivyLeafGradientLL1)" />
                <ellipse cx="3" cy="-4" rx="4" ry="5" fill="rgba(180, 220, 170, 0.4)" />
                <path d="M0 -10 L0 12" stroke="#3D4A38" strokeWidth="0.6" fill="none" opacity="0.6" />
                <path d="M0 -6 L-6 -3" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 -6 L6 -3" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 0 L-5 5" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
                <path d="M0 0 L5 5" stroke="#3D4A38" strokeWidth="0.4" fill="none" opacity="0.5" />
              </g>
            </defs>
            
            {/* Vine stems */}
            <path d="M385 10 Q355 25 330 70 Q305 130 320 180 Q335 230 310 290 Q285 350 300 370" fill="none" stroke="#5C4A3A" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M385 10 Q355 25 330 70 Q305 130 320 180 Q335 230 310 290 Q285 350 300 370" fill="none" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round" />
            <path d="M330 70 Q280 55 220 80 Q160 110 90 95 Q30 82 -10 105" fill="none" stroke="#5C4A3A" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M330 70 Q280 55 220 80 Q160 110 90 95 Q30 82 -10 105" fill="none" stroke="#6B5A4A" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M320 180 Q270 170 210 190 Q150 215 100 200" fill="none" stroke="#5C4A3A" strokeWidth="2" strokeLinecap="round" />
            <path d="M320 180 Q270 170 210 190 Q150 215 100 200" fill="none" stroke="#6B5A4A" strokeWidth="1.2" strokeLinecap="round" />
            
            {/* Tendrils */}
            <path d="M355 35 Q350 28 354 20 Q358 14 352 10" fill="none" stroke="#7A6A5A" strokeWidth="1" strokeLinecap="round" />
            <path d="M310 125 Q302 118 305 110" fill="none" stroke="#7A6A5A" strokeWidth="1" strokeLinecap="round" />
            
            {/* Origin cluster */}
            <g transform="translate(382, 8) rotate(25)" filter="url(#leafShadowLL)"><use href="#ivyLeafDetailLL" transform="scale(1.5)" /></g>
            <g transform="translate(368, 22) rotate(-5)"><use href="#ivyLeafDetailLL" transform="scale(1.4)" style={{ fill: 'url(#ivyLeafGradientLL2)' }} /></g>
            <g transform="translate(352, 45) rotate(-20)" filter="url(#leafShadowLL)"><use href="#ivyLeafDetailLL" transform="scale(1.3)" /></g>
            
            {/* Main vine leaves */}
            <g transform="translate(335, 65) rotate(-30)"><use href="#ivyLeafDetailLL" transform="scale(1.2)" style={{ fill: 'url(#ivyLeafGradientLL2)' }} /></g>
            <g transform="translate(315, 110) rotate(-50)" filter="url(#leafShadowLL)"><use href="#ivyLeafDetailLL" transform="scale(1.1)" /></g>
            <g transform="translate(322, 155) rotate(-65)"><use href="#ivyLeafDetailLL" transform="scale(1.0)" /></g>
            <g transform="translate(330, 200) rotate(-75)"><use href="#ivyLeafDetailLL" transform="scale(0.95)" style={{ fill: 'url(#ivyLeafGradientLL2)' }} /></g>
            <g transform="translate(320, 250) rotate(-80)" filter="url(#leafShadowLL)"><use href="#ivyLeafDetailLL" transform="scale(0.9)" /></g>
            <g transform="translate(305, 305) rotate(-70)"><use href="#ivyLeafDetailLL" transform="scale(0.85)" /></g>
            <g transform="translate(295, 345) rotate(-78)"><use href="#ivyLeafDetailLL" transform="scale(0.8)" style={{ fill: 'url(#ivyLeafGradientLL2)' }} /></g>
            
            {/* Secondary vine leaves */}
            <g transform="translate(285, 58) rotate(-15)" filter="url(#leafShadowLL)"><use href="#ivyLeafDetailLL" transform="scale(1.1)" /></g>
            <g transform="translate(235, 72) rotate(-25)"><use href="#ivyLeafDetailLL" transform="scale(1.0)" style={{ fill: 'url(#ivyLeafGradientLL2)' }} /></g>
            <g transform="translate(180, 95) rotate(-10)"><use href="#ivyLeafDetailLL" transform="scale(0.9)" /></g>
            <g transform="translate(125, 100) rotate(-22)"><use href="#ivyLeafDetailLL" transform="scale(0.8)" /></g>
            <g transform="translate(60, 92) rotate(-8)"><use href="#ivyLeafDetailLL" transform="scale(0.7)" style={{ fill: 'url(#ivyLeafGradientLL2)' }} /></g>
            <g transform="translate(5, 102) rotate(-18)"><use href="#ivyLeafDetailLL" transform="scale(0.6)" /></g>
            
            {/* Tertiary vine leaves */}
            <g transform="translate(275, 175) rotate(-22)" filter="url(#leafShadowLL)"><use href="#ivyLeafDetailLL" transform="scale(0.85)" /></g>
            <g transform="translate(225, 185) rotate(-12)"><use href="#ivyLeafDetailLL" transform="scale(0.75)" style={{ fill: 'url(#ivyLeafGradientLL2)' }} /></g>
            <g transform="translate(165, 205) rotate(-28)"><use href="#ivyLeafDetailLL" transform="scale(0.7)" /></g>
            <g transform="translate(115, 198) rotate(-15)"><use href="#ivyLeafDetailLL" transform="scale(0.6)" /></g>
          </svg>
        </>
      )}

      {/* Full-screen meadow background for password/profile steps */}
      {step !== 'welcome' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}>
          <WildflowerMeadow
            heroFlower={practitioner?.favoriteFlower}
            practitionerName={practitioner?.firstName}
            height="100vh"
            animate={true}
            borderRadius={0}
          />
        </div>
      )}
      
      <div style={{ maxWidth: step === 'welcome' ? 900 : 400, margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: step === 'welcome' ? 'flex-start' : 'center', padding: step === 'welcome' ? 0 : '20px 0', position: 'relative', zIndex: 2 }}>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: step === 'welcome' ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: step === 'welcome' ? 'none' : 'blur(8px)',
            borderRadius: step === 'welcome' ? 16 : 10,
            padding: step === 'welcome' ? 0 : '10px 12px',
            boxShadow: step === 'welcome' ? 'none' : '0 8px 32px rgba(0,0,0,0.12)',
            border: step === 'welcome' ? 'none' : '1px solid rgba(255, 255, 255, 0.8)',
            flex: step === 'welcome' ? 1 : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome - A moment to breathe */}
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: 16,
                  flex: 1,
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'visible',
                }}
              >
                {/* The meadow - the opening in the stone wall */}
                <div style={{ 
                  position: 'absolute',
                  top: 0,
                  left: -20,
                  right: -20,
                  bottom: -40,
                  overflow: 'hidden',
                  borderRadius: '140px 140px 0 0',
                  boxShadow: `
                    inset 8px 0 20px -8px rgba(0,0,0,0.25),
                    inset -8px 0 20px -8px rgba(0,0,0,0.25),
                    inset 0 15px 30px -10px rgba(0,0,0,0.2),
                    inset 0 0 60px rgba(0,0,0,0.08)
                  `,
                }}>
                  <WildflowerMeadow
                    heroFlower={practitioner?.favoriteFlower}
                    practitionerName={practitioner?.firstName}
                    height="100%"
                    animate={true}
                  />
                </div>
                
                {/* The message - a simple frosted glass invitation */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    maxWidth: 300,
                  }}
                >
                  {/* Simple frosted glass card */}
                  <div
                    style={{
                      position: 'relative',
                      textAlign: 'center',
                      padding: '18px 24px',
                      background: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: 20,
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    
                    <motion.h2 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.8 }}
                      style={{ 
                        fontSize: 22, 
                        color: '#2d3b2f', 
                        marginBottom: 8,
                        fontWeight: 600,
                        lineHeight: 1.2,
                        letterSpacing: '-0.01em',
                        textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                      }}
                    >
                      Hi {practitioner?.firstName}
                    </motion.h2>
                    
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0, duration: 0.8 }}
                      style={{ 
                        color: '#3d4d3f', 
                        fontSize: 14, 
                        lineHeight: 1.5,
                        margin: 0,
                        fontWeight: 500,
                        textShadow: '0 1px 2px rgba(255,255,255,0.4)',
                      }}
                    >
                      You're joining a community that believes in mutual support and growth.
                    </motion.p>
                  
                    {/* Button appears after they've had time to read */}
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.0, duration: 0.6 }}
                      onClick={() => setStep('password')}
                      style={{
                        marginTop: 16,
                        background: `linear-gradient(135deg, ${colors.eucalyptusSage} 0%, #7A9E8F 100%)`,
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        boxShadow: '0 4px 16px rgba(107, 142, 127, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        letterSpacing: '0.02em',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(107, 142, 127, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 142, 127, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
                      }}
                    >
                      Join Our Community <ArrowRight size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Password */}
            {step === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#fef3c7',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                  }}>
                    <Lock size={16} color="#d97706" />
                  </div>
                  <h2 style={{ fontSize: 14, color: colors.charcoalText, marginBottom: 0 }}>
                    Create Your Password
                  </h2>
                  <p style={{ color: '#666', fontSize: 10, margin: 0 }}>This will be your login for Bloom and Outlook</p>
                </div>

                {/* Login info box */}
                <div style={{
                  background: '#f0f7f4',
                  border: '1px solid #d4e5dc',
                  borderRadius: 4,
                  padding: '6px 8px',
                  marginBottom: 6,
                }}>
                  <p style={{ color: '#4a6355', fontSize: 9, margin: '0 0 4px 0', lineHeight: 1.3 }}>
                    ≡ƒî╕ Your login email: <span style={{ color: '#1e3a8a', fontWeight: 600, fontFamily: 'monospace', fontSize: 10 }}>
                    {practitioner ? `${practitioner.firstName.toLowerCase()}.${practitioner.lastName.toLowerCase()}@life-psychology.com.au`.replace(/[^a-z.@-]/g, '') : '...'}</span>
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ color: '#4a6355', fontSize: 9, margin: 0, lineHeight: 1.2, flex: 1 }}>
                      To log in later, click the flower in the top-right corner of the homepage.
                    </p>
                    <a
                      href="https://bloom.life-psychology.com.au/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: colors.eucalyptusSage,
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 500,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Open Homepage
                    </a>
                  </div>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label style={{ display: 'block', marginBottom: 2, color: colors.charcoalText, fontWeight: 500, fontSize: 10 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      style={{
                        width: '100%',
                        padding: '6px 28px 6px 8px',
                        borderRadius: 4,
                        border: '1px solid #ddd',
                        fontSize: 11,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#888',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label style={{ display: 'block', marginBottom: 2, color: colors.charcoalText, fontWeight: 500, fontSize: 10 }}>
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 4,
                      border: `1px solid ${confirmPassword && !passwordChecks.match ? colors.error : '#ddd'}`,
                      fontSize: 11,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Password requirements */}
                <div style={{
                  background: '#f9fafb',
                  borderRadius: 4,
                  padding: '4px 6px',
                  marginBottom: 6,
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0px 5px', fontSize: 9 }}>
                    {[
                      { check: passwordChecks.length, label: '8+ chars' },
                      { check: passwordChecks.uppercase, label: 'Uppercase' },
                      { check: passwordChecks.lowercase, label: 'Lowercase' },
                      { check: passwordChecks.number, label: 'Number' },
                      { check: passwordChecks.match, label: 'Match' },
                    ].map(({ check, label }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Check size={8} color={check ? colors.success : '#ccc'} />
                        <span style={{ fontSize: 9, color: check ? colors.success : '#888' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2',
                    color: colors.error,
                    padding: 6,
                    borderRadius: 4,
                    marginBottom: 6,
                    fontSize: 10,
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 5 }}>
                  <button
                    onClick={() => setStep('welcome')}
                    style={{
                      flex: 1,
                      background: 'white',
                      color: colors.charcoalText,
                      border: '1px solid #ddd',
                      padding: '6px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!isPasswordValid || submitting}
                    style={{
                      flex: 2,
                      background: (isPasswordValid && !submitting) ? colors.eucalyptusSage : '#ccc',
                      color: 'white',
                      border: 'none',
                      padding: '6px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: (isPasswordValid && !submitting) ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Complete Setup <Check size={11} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
