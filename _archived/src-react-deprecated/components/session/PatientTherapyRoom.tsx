/**
 * Patient Therapy Room
 * 
 * Token-based access for patients to join telehealth sessions.
 * Flow: Validate token → Consent prompt → Waiting room → Video call
 * 
 * URL: /session/:token
 */

import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { SessionConsent } from './SessionConsent';

// Lazy load VideoCall to handle ACS SDK loading gracefully
const VideoCall = lazy(() => import('./VideoCall').then(m => ({ default: m.VideoCall })));

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

// ============================================================================
// Component
// ============================================================================

export function PatientTherapyRoom() {
  const { token } = useParams<{ token: string }>();
  
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);

  // ============================================================================
  // Validate token and load session info
  // ============================================================================

  const loadSession = useCallback(async () => {
    if (!token) {
      setError('No session link provided');
      setPageState('error');
      return;
    }

    try {
      const response = await fetch(`/api/session/token/validate/${token}`);
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
      } else if (info.consentStatus === 'declined') {
        // If they declined recording, they can still join (just no recording)
        setPageState('waiting');
      } else {
        // Consented, ready for waiting room
        setPageState('waiting');
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Unable to connect. Please check your internet connection.');
      setPageState('error');
    }
  }, [token]);

  // Load session on mount and when token changes
  useEffect(() => {
    // Use IIFE to handle async in effect
    void (async () => {
      await loadSession();
    })();
  }, [loadSession]);

  // ============================================================================
  // Countdown timer for early arrival
  // ============================================================================

  useEffect(() => {
    if (pageState !== 'early' || !sessionInfo) return;

    const updateCountdown = () => {
      const appointmentTime = new Date(sessionInfo.appointmentTime);
      const earliestJoin = new Date(appointmentTime.getTime() - 30 * 60 * 1000);
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

  const handleConsentComplete = useCallback((consented: boolean) => {
    if (sessionInfo) {
      setSessionInfo({
        ...sessionInfo,
        consentStatus: consented ? 'consented' : 'declined',
      });
    }
    setPageState('waiting');
  }, [sessionInfo]);

  // ============================================================================
  // Join video call
  // ============================================================================

  const joinCall = useCallback(async () => {
    if (!sessionInfo) return;

    setPageState('joining');

    try {
      const response = await fetch('/api/telehealth/room/join', {
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
        await fetch('/api/telehealth/room/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId: joinInfo.participantId }),
        });
      } catch (err) {
        console.error('Error leaving room:', err);
      }
    }
    setPageState('ended');
  }, [joinInfo]);

  // ============================================================================
  // Render based on state
  // ============================================================================

  // Loading
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bloom-sage-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bloom-primary mx-auto mb-4" />
          <p className="text-bloom-text-secondary">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Error
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bloom-sage-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-bloom p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-bloom-text mb-2">Session Unavailable</h1>
          <p className="text-bloom-text-secondary mb-6">{error}</p>
          <p className="text-sm text-bloom-text-secondary">
            Need help? Contact us at{' '}
            <a href="mailto:hello@life-psychology.com.au" className="text-bloom-primary hover:underline">
              hello@life-psychology.com.au
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Early arrival
  if (pageState === 'early' && sessionInfo) {
    const appointmentTime = new Date(sessionInfo.appointmentTime);
    return (
      <div className="min-h-screen bg-gradient-to-b from-bloom-sage-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-bloom p-8 text-center">
          <div className="w-16 h-16 bg-bloom-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-bloom-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-bloom-text mb-2">
            You're a bit early, {sessionInfo.patientFirstName}
          </h1>
          <p className="text-bloom-text-secondary mb-6">
            Your session with {sessionInfo.practitionerName} is scheduled for{' '}
            <strong>
              {appointmentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </strong>
          </p>
          <div className="bg-bloom-sage-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-bloom-text-secondary mb-2">You can join in</p>
            <p className="text-3xl font-bold text-bloom-primary">{countdown}</p>
          </div>
          <p className="text-sm text-bloom-text-secondary">
            This page will automatically update when you can enter the waiting room.
          </p>
        </div>
      </div>
    );
  }

  // Consent
  if (pageState === 'consent' && sessionInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bloom-sage-50 to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-bloom-text mb-2">
              Welcome, {sessionInfo.patientFirstName}
            </h1>
            <p className="text-bloom-text-secondary">
              Session with {sessionInfo.practitionerName}
            </p>
          </div>
          <SessionConsent 
            appointmentId={sessionInfo.appointmentId}
            practitionerName={sessionInfo.practitionerName}
            onConsentComplete={handleConsentComplete}
          />
        </div>
      </div>
    );
  }

  // Waiting room
  if (pageState === 'waiting' && sessionInfo) {
    const appointmentTime = new Date(sessionInfo.appointmentTime);
    const isDeclined = sessionInfo.consentStatus === 'declined';
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-bloom-sage-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-bloom p-8 text-center">
          {/* Bloom logo placeholder */}
          <div className="w-20 h-20 bg-bloom-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-bloom-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-bloom-text mb-2">
            Waiting Room
          </h1>
          <p className="text-bloom-text-secondary mb-2">
            Your session with <strong>{sessionInfo.practitionerName}</strong>
          </p>
          <p className="text-bloom-primary font-medium mb-6">
            {appointmentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} •{' '}
            {sessionInfo.durationMinutes} minutes
          </p>

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-amber-800 text-sm">{error}</p>
            </div>
          )}

          {isDeclined && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> You've chosen not to have this session recorded. 
                Your privacy preferences have been saved.
              </p>
            </div>
          )}

          <div className="bg-bloom-sage-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="animate-pulse w-3 h-3 bg-bloom-sage-500 rounded-full mr-2" />
              <span className="text-bloom-text-secondary text-sm">
                Waiting for {sessionInfo.practitionerName} to start
              </span>
            </div>
            <p className="text-xs text-bloom-text-secondary">
              Please ensure your camera and microphone are ready
            </p>
          </div>

          <button
            onClick={joinCall}
            disabled={!sessionInfo.canJoin}
            className="w-full py-4 bg-bloom-primary text-white rounded-xl font-medium
                       hover:bg-bloom-primary-dark transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sessionInfo.canJoin ? 'Join Session' : 'Waiting for Session to Start'}
          </button>

          <div className="mt-6 pt-6 border-t border-bloom-border">
            <p className="text-xs text-bloom-text-secondary mb-2">
              Having trouble?
            </p>
            <p className="text-xs text-bloom-text-secondary">
              Make sure your browser allows camera and microphone access.
              <br />
              Try using Chrome or Safari for best results.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Joining
  if (pageState === 'joining') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bloom-sage-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bloom-primary mx-auto mb-4" />
          <p className="text-bloom-text-secondary">Connecting to session...</p>
        </div>
      </div>
    );
  }

  // In call
  if (pageState === 'in-call' && joinInfo && sessionInfo) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p>Loading video call...</p>
          </div>
        </div>
      }>
        <VideoCall
          token={joinInfo.token}
          userId={joinInfo.userId}
          roomId={joinInfo.acsRoomId}
          endpoint={joinInfo.endpoint}
          displayName={sessionInfo.patientFirstName}
          isPatient={true}
          onCallEnded={leaveCall}
        />
      </Suspense>
    );
  }

  // Session ended
  if (pageState === 'ended') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bloom-sage-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-bloom p-8 text-center">
          <div className="w-16 h-16 bg-bloom-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-bloom-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-bloom-text mb-2">
            Session Complete
          </h1>
          <p className="text-bloom-text-secondary mb-6">
            Thank you for your session. We hope it was helpful.
          </p>
          <p className="text-sm text-bloom-text-secondary">
            You can close this window now.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default PatientTherapyRoom;
