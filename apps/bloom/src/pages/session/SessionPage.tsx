/**
 * Clinician Session Page
 * 
 * Entry point for telehealth sessions from the clinician's perspective.
 * Flow:
 * 1. Load appointment details
 * 2. Create/join room
 * 3. Video call with patient
 * 4. Session ends → Notes review
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ClinicianVideoCall } from './ClinicianVideoCall';
import { NotesReview } from './NotesReview';
import LoadingState from '../../components/common/LoadingState';
import { API_BASE_URL } from '../../config/api';

interface SessionData {
  appointmentId: string;
  patientName: string;
  patientInitials: string;
  sessionType: string;
  scheduledTime: string;
  durationMinutes: number;
  roomId?: string;
  acsRoomId?: string;
}

interface CallCredentials {
  token: string;
  userId: string;
  endpoint: string;
  roomId: string;
  acsRoomId: string;
}

type SessionPhase = 'loading' | 'ready' | 'in-call' | 'notes-review' | 'completed' | 'error';

export function SessionPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();
  
  const [phase, setPhase] = useState<SessionPhase>('loading');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [credentials, setCredentials] = useState<CallCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roomCreated, setRoomCreated] = useState(false);

  // Load session data on mount
  useEffect(() => {
    if (!appointmentId || !user) return;
    loadSessionData();
  }, [appointmentId, user]);

  /**
   * Load appointment details and create room if needed
   */
  const loadSessionData = async () => {
    if (!appointmentId) return;
    
    try {
      const token = await getAccessToken();
      
      // Get appointment details from dashboard endpoint
      const dashboardRes = await fetch(`${API_BASE_URL}/clinician/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!dashboardRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const dashboardData = await dashboardRes.json();
      
      // Find this appointment in today's sessions
      const appointment = dashboardData.data?.today?.sessions?.find(
        (s: { id: string }) => s.id === appointmentId
      );

      if (!appointment) {
        throw new Error('Appointment not found in your schedule');
      }

      // Create room for this appointment
      const roomRes = await fetch(`${API_BASE_URL}/telehealth/room/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          practitionerId: (user?.idTokenClaims as Record<string, unknown>)?.sub || (user?.idTokenClaims as Record<string, unknown>)?.oid || user?.localAccountId,
          appointmentTime: appointment.time,
          durationMinutes: appointment.duration || 50,
        }),
      });

      if (!roomRes.ok) {
        throw new Error('Failed to create telehealth room');
      }

      const roomData = await roomRes.json();

      setSessionData({
        appointmentId,
        patientName: appointment.clientName,
        patientInitials: appointment.clientInitials,
        sessionType: appointment.sessionType,
        scheduledTime: appointment.time,
        durationMinutes: appointment.duration || 50,
        roomId: roomData.data.roomId,
        acsRoomId: roomData.data.acsRoomId,
      });

      setRoomCreated(true);
      setPhase('ready');
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
      setPhase('error');
    }
  };

  /**
   * Join the call - get ACS token and switch to video phase
   */
  const handleStartSession = async () => {
    if (!sessionData || !user) return;

    try {
      setPhase('loading');
      const token = await getAccessToken();

      const joinRes = await fetch(`${API_BASE_URL}/telehealth/room/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: sessionData.appointmentId,
          participantType: 'clinician',
          participantId: (user.idTokenClaims as Record<string, unknown>)?.sub || (user.idTokenClaims as Record<string, unknown>)?.oid || user.localAccountId,
          participantName: user.name || 'Clinician',
        }),
      });

      if (!joinRes.ok) {
        const errorData = await joinRes.json();
        throw new Error(errorData.error || 'Failed to join room');
      }

      const joinData = await joinRes.json();

      setCredentials({
        token: joinData.data.token,
        userId: joinData.data.userId,
        endpoint: joinData.data.endpoint,
        roomId: sessionData.roomId!,
        acsRoomId: sessionData.acsRoomId!,
      });

      setPhase('in-call');
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err instanceof Error ? err.message : 'Failed to join session');
      setPhase('error');
    }
  };

  /**
   * Called when the video call ends
   */
  const handleCallEnded = () => {
    setPhase('notes-review');
  };

  /**
   * Called when notes review is complete
   */
  const handleNotesComplete = () => {
    setPhase('completed');
    // Navigate back to dashboard after a brief delay
    setTimeout(() => {
      navigate('/admin/dashboard');
    }, 2000);
  };

  // Render based on phase
  if (phase === 'loading') {
    return (
      <div style={styles.container}>
        <LoadingState message="Preparing session..." />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Session Error</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            style={styles.backButton}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'ready' && sessionData) {
    return (
      <div style={styles.container}>
        <div style={styles.readyCard}>
          <h1 style={styles.title}>Ready to Start Session</h1>
          
          <div style={styles.sessionInfo}>
            <div style={styles.patientAvatar}>
              {sessionData.patientInitials}
            </div>
            <div style={styles.sessionDetails}>
              <h2 style={styles.patientName}>{sessionData.patientName}</h2>
              <p style={styles.sessionType}>{sessionData.sessionType}</p>
              <p style={styles.sessionTime}>
                {sessionData.scheduledTime} • {sessionData.durationMinutes} min
              </p>
            </div>
          </div>

          <div style={styles.checklistBox}>
            <h3 style={styles.checklistTitle}>Pre-session Checklist</h3>
            <ul style={styles.checklist}>
              <li>✓ Camera and microphone ready</li>
              <li>✓ Quiet environment</li>
              <li>✓ Previous session notes reviewed</li>
              <li>✓ Room created: {roomCreated ? 'Yes' : 'Creating...'}</li>
            </ul>
          </div>

          <p style={styles.waitingNote}>
            Your patient will join when they&apos;re ready. Recording begins automatically when they consent.
          </p>

          <button 
            onClick={handleStartSession}
            style={styles.startButton}
            disabled={!roomCreated}
          >
            Start Session
          </button>

          <button 
            onClick={() => navigate('/admin/dashboard')}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'in-call' && sessionData && credentials) {
    return (
      <ClinicianVideoCall
        credentials={credentials}
        sessionData={sessionData}
        onCallEnded={handleCallEnded}
      />
    );
  }

  if (phase === 'notes-review' && sessionData) {
    return (
      <NotesReview
        appointmentId={sessionData.appointmentId}
        patientName={sessionData.patientName}
        sessionDate={sessionData.scheduledTime}
        onComplete={handleNotesComplete}
      />
    );
  }

  if (phase === 'completed') {
    return (
      <div style={styles.container}>
        <div style={styles.completedCard}>
          <div style={styles.checkIcon}>✓</div>
          <h2 style={styles.completedTitle}>Session Complete</h2>
          <p style={styles.completedMessage}>
            Notes have been saved. Returning to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #FAF7F2 0%, #F0EBE3 100%)',
  },
  readyCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: '24px',
  },
  sessionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: '#F7FAFC',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  patientAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 600,
  },
  sessionDetails: {
    textAlign: 'left',
  },
  patientName: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#2D3748',
    margin: 0,
  },
  sessionType: {
    fontSize: '14px',
    color: '#718096',
    margin: '4px 0 0 0',
  },
  sessionTime: {
    fontSize: '14px',
    color: '#A0AEC0',
    margin: '4px 0 0 0',
  },
  checklistBox: {
    background: '#F0FFF4',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  checklistTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#276749',
    margin: '0 0 12px 0',
  },
  checklist: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  waitingNote: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '24px',
    fontStyle: 'italic',
  },
  startButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '12px',
  },
  cancelButton: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: '#718096',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  errorCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#C53030',
    marginBottom: '12px',
  },
  errorMessage: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '24px',
  },
  backButton: {
    padding: '12px 24px',
    background: '#EDF2F7',
    color: '#4A5568',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  completedCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
  },
  checkIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    margin: '0 auto 20px',
  },
  completedTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: '8px',
  },
  completedMessage: {
    fontSize: '14px',
    color: '#718096',
  },
};

export default SessionPage;
