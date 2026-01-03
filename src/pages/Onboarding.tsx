/**
 * Onboarding Page
 * 
 * Allows accepted practitioners to:
 * 1. Verify their information
 * 2. Create a secure password
 * 3. Complete their profile
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, AlertCircle, Loader2, User, Lock, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'https://bloom-functions-staging-new.azurewebsites.net/api';

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
  favoriteFlower?: string; // Zoe's surprise 🌸
}

type OnboardingStep = 'loading' | 'welcome' | 'password' | 'profile' | 'complete' | 'error';

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // State
  const [step, setStep] = useState<OnboardingStep>('loading');
  const [practitioner, setPractitioner] = useState<PractitionerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  
  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [contractAccepted, setContractAccepted] = useState(false);
  
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
        setDisplayName(data.practitioner.displayName || `${data.practitioner.firstName} ${data.practitioner.lastName}`);
        setBio(data.practitioner.bio || '');
        setPhone(data.practitioner.phone || '');
        setStep('welcome');
      } catch {
        setError('Failed to validate token. Please try again later.');
        setStep('error');
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async () => {
    if (!isPasswordValid || !contractAccepted) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/onboarding/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          displayName,
          bio,
          phone,
          contractAccepted: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to complete onboarding');
        return;
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
            🎉 Welcome to Bloom!
          </h1>
          <p style={{ color: '#666', marginBottom: 8, fontSize: 18 }}>
            Hi {practitioner?.firstName}, your account is ready!
          </p>
          <p style={{ color: '#888', marginBottom: 32, lineHeight: 1.6 }}>
            You can now log in to access the Bloom platform. Your admin will activate your profile soon, 
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
      minHeight: '100vh',
      background: colors.warmCream,
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          <h1 style={{ fontSize: 32, color: colors.eucalyptusSage, marginBottom: 8 }}>
            🌸 Welcome to Bloom
          </h1>
          <p style={{ color: '#666', fontSize: 16 }}>
            Let's set up your practitioner account
          </p>
        </motion.div>

        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 32,
        }}>
          {['welcome', 'password', 'profile'].map((s, i) => (
            <div
              key={s}
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: ['welcome', 'password', 'profile'].indexOf(step) >= i
                  ? colors.eucalyptusSage
                  : '#ddd',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <User size={32} color={colors.success} />
                  </div>
                  <h2 style={{ fontSize: 24, color: colors.charcoalText, marginBottom: 8 }}>
                    Hi {practitioner?.firstName}!
                  </h2>
                  <p style={{ color: '#666' }}>
                    We're excited to have you join Bloom. Let's confirm your details.
                  </p>
                </div>

                <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Name</label>
                    <p style={{ fontSize: 16, color: colors.charcoalText, fontWeight: 500 }}>
                      {practitioner?.firstName} {practitioner?.lastName}
                    </p>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Email</label>
                    <p style={{ fontSize: 16, color: colors.charcoalText }}>{practitioner?.email}</p>
                  </div>
                  {practitioner?.ahpraNumber && (
                    <div>
                      <label style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>AHPRA Registration</label>
                      <p style={{ fontSize: 16, color: colors.charcoalText }}>{practitioner.ahpraNumber}</p>
                    </div>
                  )}
                </div>

                {/* Zoe's surprise - their favorite flower! 🌸 */}
                {practitioner?.favoriteFlower && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ 
                      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', 
                      borderRadius: 12, 
                      padding: 20, 
                      marginBottom: 24,
                      textAlign: 'center',
                      border: '1px solid #fbcfe8',
                    }}
                  >
                    <p style={{ fontSize: 32, marginBottom: 8 }}>🌸</p>
                    <p style={{ fontSize: 14, color: '#9d174d', fontWeight: 500 }}>
                      We heard you love {practitioner.favoriteFlower.toLowerCase().endsWith('s') ? '' : 'a '}<strong>{practitioner.favoriteFlower}</strong>!
                    </p>
                    <p style={{ fontSize: 12, color: '#be185d', marginTop: 4 }}>
                      Here's to growing something beautiful together 🌱
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={() => setStep('password')}
                  style={{
                    width: '100%',
                    background: colors.eucalyptusSage,
                    color: 'white',
                    border: 'none',
                    padding: '14px 24px',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  Continue <ArrowRight size={18} />
                </button>
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
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <Lock size={32} color="#d97706" />
                  </div>
                  <h2 style={{ fontSize: 24, color: colors.charcoalText, marginBottom: 8 }}>
                    Create Your Password
                  </h2>
                  <p style={{ color: '#666' }}>
                    Choose a secure password for your account
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: colors.charcoalText, fontWeight: 500 }}>
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
                        padding: '12px 44px 12px 12px',
                        borderRadius: 8,
                        border: '1px solid #ddd',
                        fontSize: 16,
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
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: colors.charcoalText, fontWeight: 500 }}>
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: `1px solid ${confirmPassword && !passwordChecks.match ? colors.error : '#ddd'}`,
                      fontSize: 16,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Password requirements */}
                <div style={{
                  background: '#f9fafb',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                }}>
                  <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: colors.charcoalText }}>
                    Password requirements:
                  </p>
                  {[
                    { check: passwordChecks.length, label: 'At least 8 characters' },
                    { check: passwordChecks.uppercase, label: 'One uppercase letter' },
                    { check: passwordChecks.lowercase, label: 'One lowercase letter' },
                    { check: passwordChecks.number, label: 'One number' },
                    { check: passwordChecks.match, label: 'Passwords match' },
                  ].map(({ check, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Check size={16} color={check ? colors.success : '#ccc'} />
                      <span style={{ fontSize: 14, color: check ? colors.success : '#888' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2',
                    color: colors.error,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 14,
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setStep('welcome')}
                    style={{
                      flex: 1,
                      background: 'white',
                      color: colors.charcoalText,
                      border: '1px solid #ddd',
                      padding: '14px 24px',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('profile')}
                    disabled={!isPasswordValid}
                    style={{
                      flex: 2,
                      background: isPasswordValid ? colors.eucalyptusSage : '#ccc',
                      color: 'white',
                      border: 'none',
                      padding: '14px 24px',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: isPasswordValid ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Profile */}
            {step === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#ede9fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <FileText size={32} color="#7c3aed" />
                  </div>
                  <h2 style={{ fontSize: 24, color: colors.charcoalText, marginBottom: 8 }}>
                    Complete Your Profile
                  </h2>
                  <p style={{ color: '#666' }}>
                    This information will appear on your public profile
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: colors.charcoalText, fontWeight: 500 }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 16,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    How you want your name to appear on the website
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: colors.charcoalText, fontWeight: 500 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+61 400 000 000"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 16,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: colors.charcoalText, fontWeight: 500 }}>
                    Professional Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell clients about your experience, approach, and specializations..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 16,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    You can update this later from your dashboard
                  </p>
                </div>

                {/* Contract Acceptance */}
                <div style={{
                  background: '#fef3c7',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 8,
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={contractAccepted}
                      onChange={(e) => setContractAccepted(e.target.checked)}
                      style={{
                        width: 20,
                        height: 20,
                        marginTop: 2,
                        accentColor: colors.eucalyptusSage,
                      }}
                    />
                    <span style={{ fontSize: 14, color: colors.charcoalText, lineHeight: 1.5 }}>
                      I confirm that I have read and agree to the{' '}
                      {practitioner?.contractUrl ? (
                        <a
                          href={practitioner.contractUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: colors.eucalyptusSage, fontWeight: 600 }}
                        >
                          Practitioner Agreement
                        </a>
                      ) : (
                        <strong>Practitioner Agreement</strong>
                      )}{' '}
                      that was sent to me prior to my interview.
                    </span>
                  </label>
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2',
                    color: colors.error,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 14,
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setStep('password')}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      background: 'white',
                      color: colors.charcoalText,
                      border: '1px solid #ddd',
                      padding: '14px 24px',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 500,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.5 : 1,
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !contractAccepted}
                    style={{
                      flex: 2,
                      background: (submitting || !contractAccepted) ? '#ccc' : colors.eucalyptusSage,
                      color: 'white',
                      border: 'none',
                      padding: '14px 24px',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: (submitting || !contractAccepted) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Setup <Check size={18} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 24, color: '#888', fontSize: 14 }}>
          Need help? Contact us at{' '}
          <a href="mailto:support@life-psychology.com.au" style={{ color: colors.eucalyptusSage }}>
            support@life-psychology.com.au
          </a>
        </p>
      </div>
    </div>
  );
}
