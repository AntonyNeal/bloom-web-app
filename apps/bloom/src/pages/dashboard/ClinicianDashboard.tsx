/**
 * Clinician Dashboard
 * 
 * Shows today's sessions and week calendar with ability to start telehealth calls.
 * Replaces the basic AdminDashboard for practitioners.
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingState } from '../../components/common/LoadingState';
import { API_BASE_URL } from '../../config/api';

// Today's session format
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

// Week schedule format
interface WeekSession {
  id: string;
  date: string;
  time: string;
  endTime: string;
  clientInitials: string;
  clientName: string;
  sessionType: string;
  duration: number;
  status: 'booked' | 'confirmed' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  locationType: 'telehealth' | 'in-person';
}

interface DaySessions {
  date: string;
  dayName: string;
  sessions: WeekSession[];
  totalMinutes: number;
}

interface WeekSchedule {
  startDate: string;
  endDate: string;
  days: DaySessions[];
  totalSessions: number;
  totalMinutes: number;
}

interface DashboardData {
  practitioner: {
    displayName: string;
    email: string;
    halaxyId: string;
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
  fetchedAt: string;
}

type ViewMode = 'today' | 'week';

export function ClinicianDashboard() {
  const navigate = useNavigate();
  const { user, logout, getAccessToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, etc.
  const [loadingWeek, setLoadingWeek] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  // Load week schedule when switching to week view or changing week
  useEffect(() => {
    if (viewMode === 'week') {
      loadWeekSchedule();
    }
  }, [viewMode, weekOffset]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      
      const res = await fetch(`${API_BASE_URL}/clinician/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load dashboard');
      }

      const data = await res.json();
      setDashboard(data.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadWeekSchedule = useCallback(async () => {
    try {
      setLoadingWeek(true);
      const token = await getAccessToken();
      
      // Calculate start date based on week offset
      const startDate = new Date();
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
      startDate.setDate(diff);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
      
      const res = await fetch(`${API_BASE_URL}/clinician/schedule?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load week schedule');
      }

      const data = await res.json();
      setWeekSchedule(data.data);
    } catch (err) {
      console.error('Error loading week schedule:', err);
    } finally {
      setLoadingWeek(false);
    }
  }, [getAccessToken, weekOffset]);

  const handleStartSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  const formatWeekRange = () => {
    if (!weekSchedule) return '';
    const start = new Date(weekSchedule.startDate);
    const end = new Date(weekSchedule.endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-AU', options)} - ${end.toLocaleDateString('en-AU', options)}`;
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'completed':
        return { background: '#DEF7EC', color: '#03543F' };
      case 'confirmed':
        return { background: '#E1EFFE', color: '#1E429F' };
      case 'arrived':
        return { background: '#FDF6B2', color: '#723B13' };
      case 'in-progress':
        return { background: '#EDEBFE', color: '#5521B5' };
      case 'cancelled':
      case 'no-show':
        return { background: '#FDE8E8', color: '#9B1C1C' };
      default:
        return { background: '#F3F4F6', color: '#374151' };
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <LoadingState message="Loading your schedule..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Unable to Load Dashboard</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button onClick={loadDashboard} style={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const activeSessions = dashboard.today.sessions.filter(
    s => !['completed', 'cancelled', 'no-show'].includes(s.status)
  );

  const completedSessions = dashboard.today.sessions.filter(
    s => s.status === 'completed'
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.practitionerInfo}>
            <div style={styles.avatar}>
              {dashboard.practitioner.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h1 style={styles.practitionerName}>{dashboard.practitioner.displayName}</h1>
              <p style={styles.headerSubtext}>{dashboard.today.date}</p>
            </div>
          </div>
          <button onClick={logout} style={styles.logoutButton}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.main}>
        {/* View Toggle */}
        <div style={styles.viewToggle}>
          <button
            onClick={() => setViewMode('today')}
            style={{
              ...styles.viewToggleButton,
              ...(viewMode === 'today' ? styles.viewToggleButtonActive : {}),
            }}
          >
            Today
          </button>
          <button
            onClick={() => setViewMode('week')}
            style={{
              ...styles.viewToggleButton,
              ...(viewMode === 'week' ? styles.viewToggleButtonActive : {}),
            }}
          >
            Week
          </button>
        </div>

        {viewMode === 'today' ? (
          <>
            {/* Summary cards */}
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <div style={styles.summaryNumber}>{dashboard.today.summary.totalSessions}</div>
                <div style={styles.summaryLabel}>Total Sessions</div>
              </div>
              <div style={{ ...styles.summaryCard, ...styles.summaryCardHighlight }}>
                <div style={styles.summaryNumber}>{dashboard.today.summary.upcomingSessions}</div>
                <div style={styles.summaryLabel}>Upcoming</div>
              </div>
              <div style={styles.summaryCard}>
                <div style={styles.summaryNumber}>{dashboard.today.summary.completedSessions}</div>
                <div style={styles.summaryLabel}>Completed</div>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Upcoming Sessions</h2>
          
          {activeSessions.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No upcoming sessions today</p>
            </div>
          ) : (
            <div style={styles.sessionList}>
              {activeSessions.map((session) => (
                <div 
                  key={session.id} 
                  style={{
                    ...styles.sessionCard,
                    ...(session.isUpNext ? styles.sessionCardUpNext : {}),
                  }}
                >
                  <div style={styles.sessionLeft}>
                    <div style={styles.sessionTime}>{session.time}</div>
                    {session.isUpNext && (
                      <span style={styles.upNextBadge}>Up Next</span>
                    )}
                  </div>
                  
                  <div style={styles.sessionCenter}>
                    <div style={styles.clientInfo}>
                      <div style={styles.clientAvatar}>{session.clientInitials}</div>
                      <div>
                        <div style={styles.clientName}>{session.clientName}</div>
                        <div style={styles.sessionMeta}>
                          {session.sessionType} • {session.duration} min
                          <span style={{
                            ...styles.locationBadge,
                            ...(session.locationType === 'telehealth' ? styles.telehealthBadge : styles.inPersonBadge),
                          }}>
                            {session.locationType === 'telehealth' ? '📹 Telehealth' : '🏢 In-person'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.sessionRight}>
                    {session.locationType === 'telehealth' && (
                      <button
                        onClick={() => handleStartSession(session.id)}
                        style={styles.startButton}
                      >
                        Start Session
                      </button>
                    )}
                    {session.locationType === 'in-person' && (
                      <span style={styles.statusText}>In-person</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed Sessions */}
        {completedSessions.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Completed Today</h2>
            <div style={styles.sessionList}>
              {completedSessions.map((session) => (
                <div key={session.id} style={{ ...styles.sessionCard, ...styles.sessionCardCompleted }}>
                  <div style={styles.sessionLeft}>
                    <div style={styles.sessionTime}>{session.time}</div>
                    <span style={styles.completedBadge}>✓ Done</span>
                  </div>
                  
                  <div style={styles.sessionCenter}>
                    <div style={styles.clientInfo}>
                      <div style={{ ...styles.clientAvatar, opacity: 0.6 }}>{session.clientInitials}</div>
                      <div>
                        <div style={{ ...styles.clientName, opacity: 0.7 }}>{session.clientName}</div>
                        <div style={styles.sessionMeta}>
                          {session.sessionType} • {session.duration} min
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.sessionRight}>
                    {/* Could add "View Notes" button here */}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick links */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Links</h2>
          <div style={styles.quickLinks}>
            <button
              onClick={() => navigate('/admin/applications')}
              style={styles.quickLinkButton}
            >
              📋 Applications
            </button>
            <button
              onClick={() => navigate('/admin/ab-tests')}
              style={styles.quickLinkButton}
            >
              📊 A/B Tests
            </button>
          </div>
        </section>
          </>
        ) : (
          /* Week Calendar View */
          <div style={styles.weekViewContainer}>
            {/* Week Navigation */}
            <div style={styles.weekNavigation}>
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                style={styles.weekNavButton}
              >
                ← Previous
              </button>
              <div style={styles.weekRangeDisplay}>
                <span style={styles.weekRangeText}>{formatWeekRange()}</span>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    style={styles.todayButton}
                  >
                    Today
                  </button>
                )}
              </div>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                style={styles.weekNavButton}
              >
                Next →
              </button>
            </div>

            {/* Week Summary */}
            {weekSchedule && (
              <div style={styles.weekSummary}>
                <span>{weekSchedule.totalSessions} sessions</span>
                <span style={styles.weekSummaryDivider}>•</span>
                <span>{Math.floor(weekSchedule.totalMinutes / 60)}h {weekSchedule.totalMinutes % 60}m total</span>
              </div>
            )}

            {loadingWeek ? (
              <LoadingState message="Loading week schedule..." />
            ) : weekSchedule ? (
              <div style={styles.weekGrid}>
                {weekSchedule.days.map((day) => (
                  <div 
                    key={day.date} 
                    style={{
                      ...styles.dayColumn,
                      ...(isToday(day.date) ? styles.dayColumnToday : {}),
                    }}
                  >
                    <div style={styles.dayHeader}>
                      <div style={styles.dayName}>{day.dayName}</div>
                      <div style={styles.dayDate}>
                        {new Date(day.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                      </div>
                      {isToday(day.date) && <span style={styles.todayIndicator}>Today</span>}
                    </div>
                    
                    <div style={styles.daySessionsList}>
                      {day.sessions.length === 0 ? (
                        <div style={styles.noSessions}>No sessions</div>
                      ) : (
                        day.sessions.map((session) => (
                          <div 
                            key={session.id} 
                            style={{
                              ...styles.weekSessionCard,
                              ...(session.status === 'completed' ? styles.weekSessionCompleted : {}),
                              ...(session.status === 'cancelled' ? styles.weekSessionCancelled : {}),
                            }}
                          >
                            <div style={styles.weekSessionTime}>
                              {session.time} - {session.endTime}
                            </div>
                            <div style={styles.weekSessionClient}>
                              <span style={styles.weekClientInitials}>{session.clientInitials}</span>
                              {session.clientName}
                            </div>
                            <div style={styles.weekSessionType}>{session.sessionType}</div>
                            <div style={styles.weekSessionMeta}>
                              <span style={{
                                ...styles.weekLocationBadge,
                                ...(session.locationType === 'telehealth' ? styles.weekTelehealthBadge : {}),
                              }}>
                                {session.locationType === 'telehealth' ? '📹' : '🏢'}
                              </span>
                              <span style={{
                                ...styles.weekStatusBadge,
                                ...getStatusStyle(session.status),
                              }}>
                                {session.status}
                              </span>
                            </div>
                            {session.locationType === 'telehealth' && 
                             isToday(day.date) && 
                             !['completed', 'cancelled', 'no-show'].includes(session.status) && (
                              <button
                                onClick={() => handleStartSession(session.id)}
                                style={styles.weekStartButton}
                              >
                                Start
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {day.sessions.length > 0 && (
                      <div style={styles.dayFooter}>
                        {day.sessions.filter(s => !['cancelled', 'no-show'].includes(s.status)).length} sessions
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Last updated: {new Date(dashboard.fetchedAt).toLocaleTimeString()}</p>
        <button onClick={loadDashboard} style={styles.refreshButton}>
          Refresh
        </button>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FAF7F2 0%, #F0EBE3 100%)',
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #E2E8F0',
    padding: '16px 24px',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  practitionerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
  },
  practitionerName: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#2D3748',
    margin: 0,
  },
  headerSubtext: {
    fontSize: '14px',
    color: '#718096',
    margin: 0,
  },
  logoutButton: {
    padding: '8px 16px',
    background: 'transparent',
    color: '#718096',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  summaryCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  summaryCardHighlight: {
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
  },
  summaryNumber: {
    fontSize: '32px',
    fontWeight: 600,
    lineHeight: 1,
    marginBottom: '8px',
  },
  summaryLabel: {
    fontSize: '14px',
    opacity: 0.8,
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: '16px',
  },
  emptyState: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    color: '#718096',
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sessionCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.2s',
  },
  sessionCardUpNext: {
    border: '2px solid #6B8E7F',
    boxShadow: '0 4px 12px rgba(107, 142, 127, 0.15)',
  },
  sessionCardCompleted: {
    opacity: 0.7,
  },
  sessionLeft: {
    minWidth: '100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sessionTime: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2D3748',
  },
  upNextBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#276749',
    background: '#C6F6D5',
    padding: '2px 8px',
    borderRadius: '12px',
    display: 'inline-block',
  },
  completedBadge: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#718096',
    background: '#EDF2F7',
    padding: '2px 8px',
    borderRadius: '12px',
    display: 'inline-block',
  },
  sessionCenter: {
    flex: 1,
  },
  clientInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  clientAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#EDF2F7',
    color: '#4A5568',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },
  clientName: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#2D3748',
  },
  sessionMeta: {
    fontSize: '13px',
    color: '#718096',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  locationBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500,
  },
  telehealthBadge: {
    background: '#E9D8FD',
    color: '#553C9A',
  },
  inPersonBadge: {
    background: '#FED7AA',
    color: '#9C4221',
  },
  sessionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  startButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  statusText: {
    fontSize: '13px',
    color: '#718096',
    padding: '10px 16px',
    background: '#F7FAFC',
    borderRadius: '8px',
  },
  quickLinks: {
    display: 'flex',
    gap: '12px',
  },
  quickLinkButton: {
    padding: '12px 20px',
    background: 'white',
    color: '#4A5568',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  footer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#A0AEC0',
  },
  refreshButton: {
    padding: '6px 12px',
    background: 'transparent',
    color: '#718096',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  errorCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '400px',
    margin: '100px auto',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
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
  retryButton: {
    padding: '12px 24px',
    background: '#6B8E7F',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  // View Toggle styles
  viewToggle: {
    display: 'flex',
    background: 'white',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '24px',
    width: 'fit-content',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  viewToggleButton: {
    padding: '10px 24px',
    background: 'transparent',
    color: '#718096',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  viewToggleButtonActive: {
    background: '#6B8E7F',
    color: 'white',
  },
  // Week view styles
  weekViewContainer: {
    marginBottom: '32px',
  },
  weekNavigation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    background: 'white',
    borderRadius: '12px',
    padding: '12px 20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  weekNavButton: {
    padding: '8px 16px',
    background: 'transparent',
    color: '#4A5568',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  weekRangeDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  weekRangeText: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2D3748',
  },
  todayButton: {
    padding: '6px 12px',
    background: '#6B8E7F',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  weekSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#718096',
  },
  weekSummaryDivider: {
    color: '#CBD5E0',
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '12px',
    overflowX: 'auto',
  },
  dayColumn: {
    background: 'white',
    borderRadius: '12px',
    minWidth: '150px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  dayColumnToday: {
    border: '2px solid #6B8E7F',
    boxShadow: '0 4px 12px rgba(107, 142, 127, 0.15)',
  },
  dayHeader: {
    padding: '12px',
    background: '#F7FAFC',
    borderBottom: '1px solid #EDF2F7',
    textAlign: 'center',
  },
  dayName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2D3748',
  },
  dayDate: {
    fontSize: '12px',
    color: '#718096',
    marginTop: '2px',
  },
  todayIndicator: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 600,
    color: '#276749',
    background: '#C6F6D5',
    padding: '2px 8px',
    borderRadius: '10px',
    marginTop: '4px',
  },
  daySessionsList: {
    padding: '8px',
    minHeight: '100px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  noSessions: {
    fontSize: '12px',
    color: '#A0AEC0',
    textAlign: 'center',
    padding: '20px 8px',
  },
  weekSessionCard: {
    background: '#F7FAFC',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '8px',
    fontSize: '12px',
    borderLeft: '3px solid #6B8E7F',
  },
  weekSessionCompleted: {
    opacity: 0.6,
    borderLeftColor: '#A0AEC0',
  },
  weekSessionCancelled: {
    opacity: 0.5,
    borderLeftColor: '#FC8181',
    textDecoration: 'line-through',
  },
  weekSessionTime: {
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: '4px',
  },
  weekSessionClient: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#4A5568',
    marginBottom: '4px',
  },
  weekClientInitials: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#E2E8F0',
    color: '#4A5568',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: 600,
  },
  weekSessionType: {
    color: '#718096',
    marginBottom: '6px',
  },
  weekSessionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  weekLocationBadge: {
    fontSize: '10px',
  },
  weekTelehealthBadge: {
    // Already has emoji
  },
  weekStatusBadge: {
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  weekStartButton: {
    width: '100%',
    marginTop: '8px',
    padding: '6px 10px',
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  dayFooter: {
    padding: '8px 12px',
    borderTop: '1px solid #EDF2F7',
    fontSize: '11px',
    color: '#718096',
    textAlign: 'center',
  },
};

export default ClinicianDashboard;
