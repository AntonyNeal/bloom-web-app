/**
 * Session Lobby - Therapy Room Entry
 * 
 * A calm, welcoming space where clinicians can see their upcoming sessions
 * and join when ready. Follows Miyazaki design principles - peaceful yet purposeful.
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config/api';
import LoadingState from '../../components/common/LoadingState';

// Bloom color palette
const colors = {
  sage: '#7c9a92',
  sageLight: '#a8c5bb',
  sageDark: '#5d7a72',
  warmWhite: '#faf9f7',
  cream: '#f5f3ef',
  charcoal: '#2d3436',
  charcoalLight: '#636e72',
  white: '#ffffff',
  gold: '#d4a574',
  errorRed: '#c0392b',
};

interface UpcomingSession {
  id: string;
  clientName: string;
  clientInitials: string;
  time: string;
  sessionType: string;
  duration: number;
  isNext: boolean;
}

// Gentle leaf icon
const LeafIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z"/>
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

export function SessionLobby() {
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();
  
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Load today's sessions
  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      
      const response = await fetch(`${API_BASE_URL}/clinician/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await response.json();
      const todaySessions = data.data?.today?.sessions || [];

      // Parse and sort sessions
      const parsed: UpcomingSession[] = todaySessions.map((s: {
        id: string;
        clientName: string;
        clientInitials?: string;
        time: string;
        sessionType: string;
        duration?: number;
      }) => ({
        id: s.id,
        clientName: s.clientName,
        clientInitials: s.clientInitials || s.clientName.split(' ').map((n: string) => n[0]).join(''),
        time: s.time,
        sessionType: s.sessionType,
        duration: s.duration || 50,
        isNext: false,
      }));

      // Sort by time
      parsed.sort((a, b) => parseTime(a.time) - parseTime(b.time));

      // Mark the next upcoming session
      const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      for (const session of parsed) {
        const sessionMinutes = parseTime(session.time);
        if (sessionMinutes > nowMinutes - 15) { // Include sessions starting within 15 min ago
          session.isNext = true;
          break;
        }
      }

      setSessions(parsed);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour = hours;
    if (period === 'PM' && hours !== 12) hour += 12;
    if (period === 'AM' && hours === 12) hour = 0;
    return hour * 60 + (minutes || 0);
  };

  const handleJoinSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [currentTime]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.warmWhite,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <LoadingState message="Preparing your therapy room..." />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.warmWhite,
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
      }}>
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/app')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: colors.charcoalLight,
            cursor: 'pointer',
            padding: '8px 0',
            marginBottom: '24px',
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontSize: '14px',
          }}
        >
          <ArrowLeftIcon />
          Back to dashboard
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: `${colors.sage}15`,
            marginBottom: '20px',
          }}>
            <span style={{ fontSize: '32px' }}>🌿</span>
          </div>
          
          <h1 style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '32px',
            fontWeight: 600,
            color: colors.charcoal,
            marginBottom: '8px',
          }}>
            {greeting}, {firstName}
          </h1>
          
          <p style={{
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontSize: '16px',
            color: colors.charcoalLight,
            maxWidth: '400px',
            margin: '0 auto',
          }}>
            {sessions.length > 0 
              ? `You have ${sessions.length} session${sessions.length === 1 ? '' : 's'} today. Take a moment to center yourself before joining.`
              : 'Your schedule is clear. Enjoy this peaceful moment.'}
          </p>
        </motion.div>

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: `${colors.errorRed}10`,
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              color: colors.errorRed,
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: '14px',
            }}
          >
            {error}
          </motion.div>
        )}

        {/* Sessions list */}
        <AnimatePresence>
          {sessions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <h2 style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: colors.charcoalLight,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}>
                Today's Sessions
              </h2>

              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: session.isNext 
                      ? `0 4px 20px ${colors.sage}30`
                      : '0 2px 8px rgba(0,0,0,0.04)',
                    border: session.isNext ? `2px solid ${colors.sage}` : '1px solid #f0f0f0',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}>
                    {/* Client avatar */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: session.isNext ? colors.sage : colors.cream,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Crimson Text', Georgia, serif",
                      fontSize: '18px',
                      fontWeight: 600,
                      color: session.isNext ? colors.white : colors.charcoal,
                      flexShrink: 0,
                    }}>
                      {session.clientInitials}
                    </div>

                    {/* Session details */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}>
                        <h3 style={{
                          fontFamily: "'Crimson Text', Georgia, serif",
                          fontSize: '18px',
                          fontWeight: 600,
                          color: colors.charcoal,
                          margin: 0,
                        }}>
                          {session.clientName}
                        </h3>
                        {session.isNext && (
                          <span style={{
                            backgroundColor: colors.sage,
                            color: colors.white,
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontFamily: "'Inter', -apple-system, sans-serif",
                          }}>
                            UP NEXT
                          </span>
                        )}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        color: colors.charcoalLight,
                        fontFamily: "'Inter', -apple-system, sans-serif",
                        fontSize: '14px',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ClockIcon />
                          {session.time}
                        </span>
                        <span>{session.duration} min</span>
                        <span style={{ color: colors.sage }}>
                          {session.sessionType}
                        </span>
                      </div>
                    </div>

                    {/* Join button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleJoinSession(session.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: session.isNext ? colors.sage : colors.cream,
                        color: session.isNext ? colors.white : colors.charcoal,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        fontFamily: "'Inter', -apple-system, sans-serif",
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <VideoIcon />
                      Join
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                backgroundColor: colors.white,
                borderRadius: '20px',
                padding: '48px 32px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: colors.cream,
                marginBottom: '20px',
              }}>
                <span style={{ color: colors.sage }}>
                  <LeafIcon />
                </span>
              </div>

              <h2 style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '24px',
                fontWeight: 600,
                color: colors.charcoal,
                marginBottom: '8px',
              }}>
                No sessions scheduled
              </h2>

              <p style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: '15px',
                color: colors.charcoalLight,
                maxWidth: '300px',
                margin: '0 auto 24px',
              }}>
                Your therapy room is ready and waiting. When sessions are scheduled, they'll appear here.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/app')}
                style={{
                  backgroundColor: colors.cream,
                  color: colors.charcoal,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Return to dashboard
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Peaceful footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: 'center',
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '14px',
            fontStyle: 'italic',
            color: colors.charcoalLight,
            marginTop: '48px',
          }}
        >
          "The quieter you become, the more you can hear."
        </motion.p>
      </div>
    </div>
  );
}

export default SessionLobby;
