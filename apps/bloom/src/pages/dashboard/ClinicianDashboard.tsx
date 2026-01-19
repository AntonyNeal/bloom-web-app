/**
 * Clinician Dashboard
 * 
 * Shows today's sessions with ability to start telehealth calls.
 * Replaces the basic AdminDashboard for practitioners.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingState } from '../../components/common/LoadingState';
import { API_BASE_URL } from '../../config/api';

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

export function ClinicianDashboard() {
  const navigate = useNavigate();
  const { user, logout, getAccessToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

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

  const handleStartSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
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
};

export default ClinicianDashboard;
