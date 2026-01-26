/**
 * Patient Join Session Page
 * 
 * Token-based access for patients to join telehealth sessions.
 * Flow: Validate token → Consent prompt → Waiting room → Video call
 * 
 * URL: /join/:token
 * 
 * MVP Critical: This enables patients to join video calls!
 */

import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RecordingConsentDialog } from '../../components/session/RecordingConsent';
import { API_BASE_URL } from '../../config/api';

// Lazy load PatientVideoCall to handle ACS SDK loading gracefully
const PatientVideoCall = lazy(() => 
  import('./PatientVideoCall')
);

// ============================================================================
// Types
// ============================================================================

interface SessionInfo {
  appointmentId: string;
  patientId: string;
  patientFirstName: string;
  practitionerName: string;
  appointmentTime: string;
  durationMinutes: number;
  status: 'early' | 'ready' | 'active' | 'ended';
  consentStatus: 'pending' | 'consented' | 'declined';
  roomId: string | null;
  canJoin: boolean;
  message: string | null;
}

interface JoinInfo {
  roomId: string;
  acsRoomId: string;
  token: string;
  tokenExpiresOn: string;
  userId: string;
  participantId: string;
  endpoint: string;
}

type PageState = 
  | 'loading' 
  | 'error' 
  | 'early' 
  | 'consent' 
  | 'waiting' 
  | 'joining'
  | 'in-call' 
  | 'ended';

// Design system colors
const colors = {
  sage: '#6B8E7F',
  sageDark: '#5A7D6E',
  sageLight: '#E8F0EC',
  lavender: '#9B8BC4',
  cream: '#FAF7F2',
  text: '#3A3A3A',
  textSecondary: '#6B7280',
  error: '#DC2626',
  warning: '#D97706',
};

// ============================================================================
// Component
// ============================================================================

export function PatientJoinSession() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const urlToken = token || searchParams.get('token');
  
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  // ============================================================================
  // Validate token and load session info
  // ============================================================================

  const loadSession = useCallback(async () => {
    if (!urlToken) {
      setError('No session link provided');
      setPageState('error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/session/token/validate/${urlToken}`);
      const data = await response.json();

      if (!data.success) {
        if (data.code === 'TOKEN_EXPIRED') {
          setError('This session link has expired. Please contact your therapist for a new link.');
        } else if (data.code === 'INVALID_TOKEN') {
          setError('This session link is not valid. Please check your email for the correct link.');
        } else {
          setError(data.error || 'Unable to load session');
        }
        setPageState('error');
        return;
      }

      const info = data.data as SessionInfo;
      setSessionInfo(info);

      // Determine page state based on session status
      if (info.status === 'early') {
        setPageState('early');
      } else if (info.status === 'ended') {
        setPageState('ended');
      } else if (info.consentStatus === 'pending') {
        setPageState('consent');
        setShowConsentDialog(true);
      } else {
        // Already consented or declined, go to waiting room
        setPageState('waiting');
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Unable to connect. Please check your internet connection.');
      setPageState('error');
    }
  }, [urlToken]);

  // Load session on mount
  useEffect(() => {
    void loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // Countdown timer for early arrival
  // ============================================================================

  useEffect(() => {
    if (pageState !== 'early' || !sessionInfo) return;

    const updateCountdown = () => {
      const appointmentTime = new Date(sessionInfo.appointmentTime);
      // Patients can join 15 minutes early
      const earliestJoin = new Date(appointmentTime.getTime() - 15 * 60 * 1000);
      const now = new Date();
      const diff = earliestJoin.getTime() - now.getTime();

      if (diff <= 0) {
        // Can enter waiting room now
        loadSession();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${mins}m`);
      } else if (mins > 0) {
        setCountdown(`${mins}m ${secs}s`);
      } else {
        setCountdown(`${secs}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [pageState, sessionInfo, loadSession]);

  // ============================================================================
  // Handle consent completion
  // ============================================================================

  const handleConsentComplete = useCallback(async (consented: boolean) => {
    if (!sessionInfo) return;

    try {
      // Record consent preference
      await fetch(`${API_BASE_URL}/session/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: sessionInfo.appointmentId,
          patientId: sessionInfo.patientId,
          consented,
          consentType: 'verbal',
        }),
      });
    } catch (err) {
      console.error('Failed to record consent:', err);
      // Continue anyway - consent preference is informational
    }

    setSessionInfo({
      ...sessionInfo,
      consentStatus: consented ? 'consented' : 'declined',
    });
    setShowConsentDialog(false);
    setPageState('waiting');
  }, [sessionInfo]);

  // ============================================================================
  // Join video call
  // ============================================================================

  const joinCall = useCallback(async () => {
    if (!sessionInfo) return;

    setPageState('joining');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/telehealth/room/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: sessionInfo.appointmentId,
          participantType: 'patient',
          participantId: sessionInfo.patientId,
          participantName: sessionInfo.patientFirstName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.code === 'ROOM_NOT_OPEN') {
          setError('The video room is not open yet. Please wait for your therapist to start the session.');
        } else {
          setError(data.error || 'Unable to join session');
        }
        setPageState('waiting');
        return;
      }

      setJoinInfo(data.data);
      setPageState('in-call');
    } catch (err) {
      console.error('Failed to join call:', err);
      setError('Unable to join the session. Please try again.');
      setPageState('waiting');
    }
  }, [sessionInfo]);

  // ============================================================================
  // Leave call
  // ============================================================================

  const leaveCall = useCallback(async () => {
    if (joinInfo) {
      try {
        await fetch(`${API_BASE_URL}/telehealth/room/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            appointmentId: sessionInfo?.appointmentId,
            participantId: joinInfo.participantId,
          }),
        });
      } catch (err) {
        console.error('Error leaving room:', err);
      }
    }
    setPageState('ended');
  }, [joinInfo, sessionInfo]);

  // ============================================================================
  // Render based on state
  // ============================================================================

  // Loading
  if (pageState === 'loading') {
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.centerContent}
        >
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Loading your session...</p>
        </motion.div>
      </div>
    );
  }

  // Error
  if (pageState === 'error') {
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.card}
        >
          <div style={styles.errorIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 style={styles.title}>Session Unavailable</h1>
          <p style={styles.errorMessage}>{error}</p>
          <p style={styles.helpText}>
            Need help? Contact us at{' '}
            <a href="mailto:hello@life-psychology.com.au" style={styles.link}>
              hello@life-psychology.com.au
            </a>
          </p>
        </motion.div>
      </div>
    );
  }

  // Early arrival
  if (pageState === 'early' && sessionInfo) {
    const appointmentTime = new Date(sessionInfo.appointmentTime);
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.card}
        >
          <div style={styles.clockIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.sage} strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h1 style={styles.title}>
            You&apos;re a bit early, {sessionInfo.patientFirstName}
          </h1>
          <p style={styles.subtitle}>
            Your session with <strong>{sessionInfo.practitionerName}</strong> is scheduled for{' '}
            <strong>
              {appointmentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </strong>
          </p>
          <div style={styles.countdownBox}>
            <p style={styles.countdownLabel}>You can join in</p>
            <p style={styles.countdownValue}>{countdown}</p>
          </div>
          <p style={styles.helpText}>
            This page will automatically update when you can enter the waiting room.
          </p>
        </motion.div>
      </div>
    );
  }

  // Consent dialog
  if (pageState === 'consent' && sessionInfo) {
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={styles.welcomeHeader}
        >
          <h1 style={styles.welcomeTitle}>
            Welcome, {sessionInfo.patientFirstName}
          </h1>
          <p style={styles.welcomeSubtitle}>
            Session with {sessionInfo.practitionerName}
          </p>
        </motion.div>

        <RecordingConsentDialog
          isOpen={showConsentDialog}
          patientName={sessionInfo.patientFirstName}
          onConsent={(_type: 'verbal' | 'written') => handleConsentComplete(true)}
          onDecline={() => handleConsentComplete(false)}
        />
      </div>
    );
  }

  // Waiting room
  if (pageState === 'waiting' && sessionInfo) {
    const appointmentTime = new Date(sessionInfo.appointmentTime);
    const isDeclined = sessionInfo.consentStatus === 'declined';
    
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.card}
        >
          {/* Bloom logo */}
          <div style={styles.logoCircle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill={colors.sage}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>

          <h1 style={styles.title}>Waiting Room</h1>
          <p style={styles.subtitle}>
            Your session with <strong>{sessionInfo.practitionerName}</strong>
          </p>
          <p style={styles.timeInfo}>
            {appointmentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} • {sessionInfo.durationMinutes} minutes
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={styles.warningBox}
              >
                <p style={styles.warningText}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {isDeclined && (
            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                <strong>Note:</strong> You&apos;ve chosen not to have this session recorded. 
                Your privacy preferences have been saved.
              </p>
            </div>
          )}

          <div style={styles.waitingIndicator}>
            <div style={styles.pulsingDot} />
            <span style={styles.waitingText}>
              Waiting for {sessionInfo.practitionerName} to start
            </span>
          </div>
          <p style={styles.deviceCheck}>
            Please ensure your camera and microphone are ready
          </p>

          <button
            onClick={joinCall}
            disabled={!sessionInfo.canJoin}
            style={{
              ...styles.joinButton,
              opacity: sessionInfo.canJoin ? 1 : 0.5,
              cursor: sessionInfo.canJoin ? 'pointer' : 'not-allowed',
            }}
          >
            {sessionInfo.canJoin ? 'Join Session' : 'Waiting for Session to Start'}
          </button>

          <div style={styles.troubleSection}>
            <p style={styles.troubleTitle}>Having trouble?</p>
            <p style={styles.troubleText}>
              Make sure your browser allows camera and microphone access.
              <br />
              Try using Chrome or Safari for best results.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Joining
  if (pageState === 'joining') {
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.centerContent}
        >
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Connecting to session...</p>
        </motion.div>
      </div>
    );
  }

  // In call
  if (pageState === 'in-call' && joinInfo && sessionInfo) {
    return (
      <Suspense fallback={
        <div style={{ ...styles.container, background: '#000' }}>
          <div style={styles.centerContent}>
            <div style={{ ...styles.loadingSpinner, borderColor: '#fff transparent transparent transparent' }} />
            <p style={{ ...styles.loadingText, color: '#fff' }}>Loading video call...</p>
          </div>
        </div>
      }>
        <PatientVideoCall
          credentials={{
            token: joinInfo.token,
            userId: joinInfo.userId,
            endpoint: joinInfo.endpoint,
            roomId: joinInfo.roomId,
            acsRoomId: joinInfo.acsRoomId,
          }}
          sessionInfo={{
            practitionerName: sessionInfo.practitionerName,
            patientName: sessionInfo.patientFirstName,
            durationMinutes: sessionInfo.durationMinutes,
          }}
          onCallEnded={leaveCall}
        />
      </Suspense>
    );
  }

  // Session ended
  if (pageState === 'ended') {
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.card}
        >
          <div style={styles.successIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.sage} strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <h1 style={styles.title}>Session Complete</h1>
          <p style={styles.subtitle}>
            Thank you for your session. We hope it was helpful.
          </p>
          <p style={styles.helpText}>
            You can close this window now.
          </p>
        </motion.div>
      </div>
    );
  }

  return null;
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: `linear-gradient(135deg, ${colors.sageLight} 0%, ${colors.cream} 100%)`,
  },
  centerContent: {
    textAlign: 'center',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: `3px solid ${colors.sageLight}`,
    borderTop: `3px solid ${colors.sage}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: '16px',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
  },
  welcomeHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '8px',
  },
  welcomeSubtitle: {
    fontSize: '16px',
    color: colors.textSecondary,
  },
  errorIcon: {
    width: '64px',
    height: '64px',
    background: '#FEE2E2',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  clockIcon: {
    width: '64px',
    height: '64px',
    background: colors.sageLight,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    background: colors.sageLight,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  logoCircle: {
    width: '80px',
    height: '80px',
    background: `${colors.sage}15`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: colors.text,
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: colors.textSecondary,
    margin: '0 0 8px 0',
  },
  timeInfo: {
    fontSize: '16px',
    fontWeight: 500,
    color: colors.sage,
    margin: '0 0 24px 0',
  },
  errorMessage: {
    fontSize: '16px',
    color: colors.textSecondary,
    margin: '0 0 24px 0',
    lineHeight: 1.6,
  },
  helpText: {
    fontSize: '14px',
    color: colors.textSecondary,
  },
  link: {
    color: colors.sage,
    textDecoration: 'none',
  },
  countdownBox: {
    background: colors.sageLight,
    borderRadius: '16px',
    padding: '24px',
    margin: '24px 0',
  },
  countdownLabel: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: '0 0 8px 0',
  },
  countdownValue: {
    fontSize: '36px',
    fontWeight: 700,
    color: colors.sage,
    margin: 0,
  },
  warningBox: {
    background: '#FEF3C7',
    border: '1px solid #F59E0B',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  warningText: {
    color: '#92400E',
    fontSize: '14px',
    margin: 0,
  },
  infoBox: {
    background: '#EFF6FF',
    border: '1px solid #3B82F6',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  infoText: {
    color: '#1E40AF',
    fontSize: '14px',
    margin: 0,
  },
  waitingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  pulsingDot: {
    width: '12px',
    height: '12px',
    background: colors.sage,
    borderRadius: '50%',
    animation: 'pulse 2s ease-in-out infinite',
  },
  waitingText: {
    fontSize: '14px',
    color: colors.textSecondary,
  },
  deviceCheck: {
    fontSize: '12px',
    color: colors.textSecondary,
    marginBottom: '24px',
  },
  joinButton: {
    width: '100%',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'white',
    background: colors.sage,
    border: 'none',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    marginBottom: '24px',
  },
  troubleSection: {
    paddingTop: '24px',
    borderTop: '1px solid #E5E7EB',
  },
  troubleTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: colors.textSecondary,
    marginBottom: '8px',
  },
  troubleText: {
    fontSize: '12px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
`;
document.head.appendChild(styleSheet);

export default PatientJoinSession;
