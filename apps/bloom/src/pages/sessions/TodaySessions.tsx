/**
 * Today's Sessions - Focused Session View
 * 
 * A minimal, focused view of today's sessions. No distractions,
 * just what you need to run your day.
 * 
 * Replaces the old "Practice" dashboard with a cleaner approach.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingState from '../../components/common/LoadingState';
import { API_BASE_URL } from '../../config/api';
import { BloomHeader } from '../../components/layout/BloomHeader';

// ============================================================================
// TYPES
// ============================================================================
interface Session {
  id: string;
  time: string;
  clientInitials: string;
  clientName: string;
  sessionType: string;
  duration: number;
  status: 'booked' | 'confirmed' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  isUpNext: boolean;
  locationType: 'telehealth' | 'in-person';
  notes?: string;
}

interface DashboardData {
  practitioner?: {
    displayName: string;
    email: string;
    halaxyId: string;
  };
  user?: {
    displayName: string;
    email: string;
    role: string;
  };
  today: {
    date: string;
    sessions: Session[];
    summary: {
      totalSessions: number;
      completedSessions: number;
      upcomingSessions: number;
      cancelledSessions: number;
    };
  };
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const colors = {
  cream: '#FAF8F3',
  sage: '#7B8D7B',
  sageLight: '#9BAA9B',
  charcoal: '#3A3A3A',
  charcoalLight: '#5A5A5A',
  lavender: '#E8E2F0',
  white: '#FFFFFF',
  terracotta: '#D4A59A',
  
  // Status colors
  success: '#059669',
  successBg: '#D1FAE5',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  info: '#2563EB',
  infoBg: '#DBEAFE',
};

// ============================================================================
// ICONS
// ============================================================================
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

// ============================================================================
// SESSION CARD COMPONENT
// ============================================================================
interface SessionCardProps {
  session: Session;
  onStartSession: (id: string) => void;
}

const SessionCard = ({ session, onStartSession }: SessionCardProps) => {
  const statusConfig = {
    'booked': { label: 'Booked', color: colors.info, bg: colors.infoBg },
    'confirmed': { label: 'Confirmed', color: colors.info, bg: colors.infoBg },
    'arrived': { label: 'Arrived', color: colors.success, bg: colors.successBg },
    'in-progress': { label: 'In Progress', color: colors.success, bg: colors.successBg },
    'completed': { label: 'Completed', color: colors.charcoalLight, bg: colors.lavender },
    'cancelled': { label: 'Cancelled', color: colors.charcoalLight, bg: colors.lavender },
    'no-show': { label: 'No Show', color: colors.warning, bg: colors.warningBg },
  };

  const config = statusConfig[session.status];
  const isActive = ['booked', 'confirmed', 'arrived'].includes(session.status);

  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: '12px',
      padding: '16px 20px',
      border: `1px solid ${session.isUpNext ? colors.sage : colors.lavender}`,
      boxShadow: session.isUpNext ? `0 2px 8px ${colors.sage}20` : 'none',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Up Next indicator */}
      {session.isUpNext && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: colors.sage,
        }} />
      )}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* Time */}
        <div style={{
          minWidth: '70px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: colors.charcoal,
          }}>
            {session.time}
          </div>
          <div style={{
            fontSize: '12px',
            color: colors.charcoalLight,
          }}>
            {session.duration} min
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '40px',
          backgroundColor: colors.lavender,
        }} />

        {/* Client Info */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px',
          }}>
            {/* Avatar */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: `${colors.terracotta}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.terracotta,
              fontSize: '13px',
              fontWeight: 600,
            }}>
              {session.clientInitials}
            </div>
            
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: colors.charcoal,
              }}>
                {session.clientName}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: colors.charcoalLight,
              }}>
                {session.locationType === 'telehealth' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <VideoIcon /> Telehealth
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPinIcon /> In-person
                  </span>
                )}
                <span>•</span>
                <span>{session.sessionType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status / Action */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: config.color,
            backgroundColor: config.bg,
            padding: '4px 10px',
            borderRadius: '10px',
          }}>
            {config.label}
          </span>
          
          {isActive && session.locationType === 'telehealth' && (
            <button
              onClick={() => onStartSession(session.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: colors.sage,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6B7D6B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.sage;
              }}
            >
              Start <ChevronRightIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================
const EmptyState = () => (
  <div style={{
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '48px 24px',
    textAlign: 'center',
    border: `1px solid ${colors.lavender}`,
  }}>
    <div style={{
      fontSize: '48px',
      marginBottom: '16px',
    }}>
      🌿
    </div>
    <h3 style={{
      fontFamily: "'Crimson Text', Georgia, serif",
      fontSize: '20px',
      fontWeight: 600,
      color: colors.charcoal,
      marginBottom: '8px',
    }}>
      A clear day ahead
    </h3>
    <p style={{
      fontSize: '14px',
      color: colors.charcoalLight,
      margin: 0,
    }}>
      No sessions scheduled. Time for notes, planning, or a well-deserved break.
    </p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function TodaySessions() {
  const navigate = useNavigate();
  const { getAccessToken, user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const token = await getAccessToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (user?.localAccountId) {
        headers['X-Azure-User-Id'] = user.localAccountId;
      } else if (user?.homeAccountId) {
        headers['X-Azure-User-Id'] = user.homeAccountId.split('.')[0];
      }
      
      const res = await fetch(`${API_BASE_URL}/clinician/dashboard`, { headers });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load sessions');
      }

      const result = await res.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartSession = (appointmentId: string) => {
    navigate(`/session/${appointmentId}`);
  };

  const displayName = data?.practitioner?.displayName || data?.user?.displayName || 'there';
  const sessions = data?.today?.sessions || [];
  const summary = data?.today?.summary;

  // Format today's date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-AU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.cream }}>
        <BloomHeader />
        <div style={{ padding: '64px 24px', textAlign: 'center' }}>
          <LoadingState message="Loading your sessions..." />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.cream,
    }}>
      <BloomHeader />
      
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '32px 24px 64px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Crimson Text', Georgia, serif",
              fontSize: '24px',
              fontWeight: 600,
              color: colors.charcoal,
              margin: 0,
              marginBottom: '4px',
            }}>
              Today's Sessions
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.charcoalLight,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CalendarIcon />
              {dateStr}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                color: colors.charcoalLight,
                border: `1px solid ${colors.lavender}`,
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: refreshing ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.sage;
                e.currentTarget.style.color = colors.sage;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.lavender;
                e.currentTarget.style.color = colors.charcoalLight;
              }}
            >
              <RefreshIcon />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <button
              onClick={() => navigate('/calendar')}
              style={{
                padding: '8px 16px',
                backgroundColor: colors.sage,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6B7D6B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.sage;
              }}
            >
              View Calendar
            </button>
          </div>
        </div>

        {/* Summary */}
        {summary && sessions.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{
              padding: '12px 16px',
              backgroundColor: colors.white,
              borderRadius: '10px',
              border: `1px solid ${colors.lavender}`,
            }}>
              <span style={{ fontSize: '13px', color: colors.charcoalLight }}>Total: </span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: colors.charcoal }}>
                {summary.totalSessions}
              </span>
            </div>
            <div style={{
              padding: '12px 16px',
              backgroundColor: colors.white,
              borderRadius: '10px',
              border: `1px solid ${colors.lavender}`,
            }}>
              <span style={{ fontSize: '13px', color: colors.charcoalLight }}>Upcoming: </span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: colors.sage }}>
                {summary.upcomingSessions}
              </span>
            </div>
            <div style={{
              padding: '12px 16px',
              backgroundColor: colors.white,
              borderRadius: '10px',
              border: `1px solid ${colors.lavender}`,
            }}>
              <span style={{ fontSize: '13px', color: colors.charcoalLight }}>Completed: </span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: colors.success }}>
                {summary.completedSessions}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            color: '#DC2626',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Sessions List */}
        {sessions.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onStartSession={handleStartSession}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

export default TodaySessions;
