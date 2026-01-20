/**
 * Clinician Calendar Page
 * 
 * Week calendar view for practitioners to see their full schedule.
 * Separated from the feed-style home page.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingState from '../../components/common/LoadingState';
import { API_BASE_URL } from '../../config/api';
import { BloomHeader } from '../../components/layout/BloomHeader';

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

export function ClinicianCalendar() {
  const navigate = useNavigate();
  const { getAccessToken, user } = useAuth();
  
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const fetchingRef = useRef(false);

  const loadWeekSchedule = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchingRef.current) return;
    
    // Don't fetch until user is available
    const azureUserId = user?.localAccountId || user?.homeAccountId?.split('.')[0];
    if (!azureUserId) return;
    
    fetchingRef.current = true;
    
    try {
      // Only show loading spinner on initial load, not on week changes
      if (!initialLoadComplete) {
        setLoading(true);
      }
      
      const token = await getAccessToken();
      
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
      
      // Build headers with auth info
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Send Azure User ID for practitioner lookup
      headers['X-Azure-User-Id'] = azureUserId;
      
      const res = await fetch(`${API_BASE_URL}/clinician/schedule?${params}`, { headers });

      if (!res.ok) throw new Error('Failed to load schedule');

      const data = await res.json();
      setWeekSchedule(data.data);
      setInitialLoadComplete(true);
    } catch (err) {
      console.error('Error loading week schedule:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [getAccessToken, weekOffset, user?.localAccountId, user?.homeAccountId, initialLoadComplete]);

  useEffect(() => {
    loadWeekSchedule();
  }, [loadWeekSchedule]);

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
      case 'completed': return { background: '#DEF7EC', color: '#03543F' };
      case 'confirmed': return { background: '#E1EFFE', color: '#1E429F' };
      case 'arrived': return { background: '#FDF6B2', color: '#723B13' };
      case 'in-progress': return { background: '#EDEBFE', color: '#5521B5' };
      case 'cancelled':
      case 'no-show': return { background: '#FDE8E8', color: '#9B1C1C' };
      default: return { background: '#F3F4F6', color: '#374151' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Shared header with FloatingLeavesNav */}
      <BloomHeader showHomeLink={true} />

      <main style={styles.main}>
        {/* Week Navigation */}
        <div style={styles.weekNavigation}>
          <button onClick={() => setWeekOffset(weekOffset - 1)} style={styles.navButton}>
            ← Previous
          </button>
          <div style={styles.weekRangeDisplay}>
            <span style={styles.weekRangeText}>{formatWeekRange()}</span>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} style={styles.todayButton}>
                Today
              </button>
            )}
          </div>
          <button onClick={() => setWeekOffset(weekOffset + 1)} style={styles.navButton}>
            Next →
          </button>
        </div>

        {/* Week Summary */}
        {weekSchedule && (
          <div style={styles.weekSummary}>
            <span>{weekSchedule.totalSessions} sessions</span>
            <span style={styles.divider}>•</span>
            <span>{Math.floor(weekSchedule.totalMinutes / 60)}h {weekSchedule.totalMinutes % 60}m total</span>
          </div>
        )}

        {loading ? (
          <LoadingState message="Loading schedule..." />
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
                          ...styles.sessionCard,
                          ...(session.status === 'completed' ? styles.sessionCompleted : {}),
                          ...(session.status === 'cancelled' ? styles.sessionCancelled : {}),
                        }}
                      >
                        <div style={styles.sessionTime}>
                          {session.time} - {session.endTime}
                        </div>
                        <div style={styles.sessionClient}>
                          <span style={styles.clientInitials}>{session.clientInitials}</span>
                          {session.clientName}
                        </div>
                        <div style={styles.sessionType}>{session.sessionType}</div>
                        <div style={styles.sessionMeta}>
                          <span>{session.locationType === 'telehealth' ? '📹' : '🏢'}</span>
                          <span style={{ ...styles.statusBadge, ...getStatusStyle(session.status) }}>
                            {session.status}
                          </span>
                        </div>
                        {session.locationType === 'telehealth' && 
                         isToday(day.date) && 
                         !['completed', 'cancelled', 'no-show'].includes(session.status) && (
                          <button
                            onClick={() => handleStartSession(session.id)}
                            style={styles.startButton}
                          >
                            Start Session
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
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FAF7F2 0%, #F0EBE3 100%)',
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
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
  navButton: {
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
  divider: {
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
    minWidth: '160px',
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
    minHeight: '120px',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  noSessions: {
    fontSize: '12px',
    color: '#A0AEC0',
    textAlign: 'center',
    padding: '30px 8px',
  },
  sessionCard: {
    background: '#F7FAFC',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    fontSize: '12px',
    borderLeft: '3px solid #6B8E7F',
  },
  sessionCompleted: {
    opacity: 0.6,
    borderLeftColor: '#A0AEC0',
  },
  sessionCancelled: {
    opacity: 0.5,
    borderLeftColor: '#FC8181',
    textDecoration: 'line-through',
  },
  sessionTime: {
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: '4px',
  },
  sessionClient: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#4A5568',
    marginBottom: '4px',
  },
  clientInitials: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: '#E2E8F0',
    color: '#4A5568',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: 600,
  },
  sessionType: {
    color: '#718096',
    marginBottom: '6px',
  },
  sessionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  statusBadge: {
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  startButton: {
    width: '100%',
    marginTop: '8px',
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
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

export default ClinicianCalendar;
