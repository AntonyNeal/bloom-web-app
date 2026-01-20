/**
 * Clinician Feed (Home Page)
 * 
 * Social media-style feed for practitioners showing:
 * - Today's appointments as feed cards
 * - Announcements and updates
 * - Quick actions and reminders
 * 
 * Calendar view is on a separate page (/calendar)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingState from '../../components/common/LoadingState';
import { API_BASE_URL } from '../../config/api';
import { BloomHeader } from '../../components/layout/BloomHeader';

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

// Feed item types
type FeedItemType = 'appointment' | 'announcement' | 'reminder' | 'insight';

interface FeedItem {
  id: string;
  type: FeedItemType;
  timestamp: Date;
  data: Session | AnnouncementData | ReminderData | InsightData;
}

interface AnnouncementData {
  title: string;
  message: string;
  icon: string;
}

interface ReminderData {
  title: string;
  message: string;
  action?: string;
  actionPath?: string;
}

interface InsightData {
  title: string;
  stat: string;
  trend?: 'up' | 'down' | 'neutral';
  message: string;
}

export function ClinicianDashboard() {
  const navigate = useNavigate();
  const { logout, getAccessToken, user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      
      // Build headers with auth info
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Send Azure User ID for practitioner lookup
      if (user?.localAccountId) {
        headers['X-Azure-User-Id'] = user.localAccountId;
      } else if (user?.homeAccountId) {
        // Fallback to homeAccountId if localAccountId not available
        headers['X-Azure-User-Id'] = user.homeAccountId.split('.')[0];
      }
      
      const res = await fetch(`${API_BASE_URL}/clinician/dashboard`, { headers });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load dashboard');
      }

      const data = await res.json();
      setDashboard(data.data);
      
      // Build feed from sessions and other data
      buildFeed(data.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const buildFeed = (data: DashboardData) => {
    const items: FeedItem[] = [];
    const now = new Date();

    // Add today's sessions as feed items
    data.today.sessions
      .filter(s => !['cancelled', 'no-show'].includes(s.status))
      .forEach((session, index) => {
        items.push({
          id: `session-${session.id}`,
          type: 'appointment',
          timestamp: parseSessionTime(session.time, index),
          data: session,
        });
      });

    // Add a morning greeting/summary if it's before noon
    if (now.getHours() < 12) {
      items.push({
        id: 'greeting',
        type: 'announcement',
        timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0),
        data: {
          title: 'Good morning! ☀️',
          message: data.today.summary.upcomingSessions > 0 
            ? `You have ${data.today.summary.upcomingSessions} session${data.today.summary.upcomingSessions !== 1 ? 's' : ''} scheduled for today.`
            : 'No sessions scheduled today. Enjoy your day!',
          icon: '🌸',
        },
      });
    }

    // Add insight about completed sessions
    if (data.today.summary.completedSessions > 0) {
      items.push({
        id: 'insight-completed',
        type: 'insight',
        timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 min ago
        data: {
          title: 'Sessions completed',
          stat: `${data.today.summary.completedSessions}`,
          trend: 'up',
          message: `Great work! You've completed ${data.today.summary.completedSessions} session${data.today.summary.completedSessions !== 1 ? 's' : ''} today.`,
        },
      });
    }

    // Add reminder to review notes if sessions completed but potentially unreviewed
    if (data.today.summary.completedSessions > 0) {
      items.push({
        id: 'reminder-notes',
        type: 'reminder',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
        data: {
          title: 'Review session notes',
          message: 'Don\'t forget to review and finalize your clinical notes.',
          action: 'View Calendar',
          actionPath: '/calendar',
        },
      });
    }

    // Sort by timestamp, most recent first (but keep appointments in order)
    items.sort((a, b) => {
      // Appointments should appear in time order at the top
      if (a.type === 'appointment' && b.type === 'appointment') {
        return a.timestamp.getTime() - b.timestamp.getTime();
      }
      // Appointments before other items
      if (a.type === 'appointment') return -1;
      if (b.type === 'appointment') return 1;
      // Other items by recency
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setFeedItems(items);
  };

  const parseSessionTime = (timeStr: string, index: number): Date => {
    const now = new Date();
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, minutes, index);
  };

  const handleStartSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  };

  const getSessionTimeStatus = (session: Session): { label: string; style: React.CSSProperties } => {
    if (session.isUpNext) {
      return { label: 'Up next', style: { background: '#C6F6D5', color: '#276749' } };
    }
    if (session.status === 'in-progress') {
      return { label: 'In progress', style: { background: '#EDEBFE', color: '#5521B5' } };
    }
    if (session.status === 'completed') {
      return { label: 'Completed', style: { background: '#E2E8F0', color: '#4A5568' } };
    }
    return { label: session.time, style: { background: '#F7FAFC', color: '#4A5568' } };
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <LoadingState message="Loading your feed..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Unable to Load Feed</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button onClick={loadDashboard} style={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div style={styles.container}>
      {/* Shared header with FloatingLeavesNav */}
      <BloomHeader showHomeLink={true} />

      <div style={styles.layout}>
        {/* Left sidebar - Profile & Stats */}
        <aside style={styles.sidebar}>
          <div style={styles.profileCard}>
            <div style={styles.profileAvatar}>
              {dashboard.practitioner.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <h2 style={styles.profileName}>{dashboard.practitioner.displayName}</h2>
            <p style={styles.profileRole}>Psychologist</p>
          </div>

          <div style={styles.statsCard}>
            <h3 style={styles.statsTitle}>Today's Overview</h3>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Total Sessions</span>
              <span style={styles.statValue}>{dashboard.today.summary.totalSessions}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Upcoming</span>
              <span style={{ ...styles.statValue, color: '#6B8E7F' }}>{dashboard.today.summary.upcomingSessions}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Completed</span>
              <span style={styles.statValue}>{dashboard.today.summary.completedSessions}</span>
            </div>
          </div>

          <div style={styles.quickLinks}>
            <button onClick={() => navigate('/calendar')} style={styles.quickLinkBtn}>
              📅 View Calendar
            </button>
            <button onClick={() => navigate('/admin/applications')} style={styles.quickLinkBtn}>
              📋 Applications
            </button>
            <button onClick={logout} style={{ ...styles.quickLinkBtn, color: '#A0AEC0' }}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main feed */}
        <main style={styles.feed}>
          <div style={styles.feedHeader}>
            <h1 style={styles.feedTitle}>Your Feed</h1>
            <p style={styles.feedDate}>{dashboard.today.date}</p>
          </div>

          {feedItems.length === 0 ? (
            <div style={styles.emptyFeed}>
              <div style={styles.emptyIcon}>🌿</div>
              <p>Nothing on your feed today</p>
              <p style={styles.emptySubtext}>Enjoy the peace and quiet!</p>
            </div>
          ) : (
            <div style={styles.feedList}>
              {feedItems.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  onStartSession={handleStartSession}
                  onNavigate={navigate}
                  getTimeAgo={getTimeAgo}
                  getSessionTimeStatus={getSessionTimeStatus}
                />
              ))}
            </div>
          )}
        </main>

        {/* Right sidebar - Actions */}
        <aside style={styles.rightSidebar}>
          <div style={styles.actionsCard}>
            <h3 style={styles.actionsTitle}>Quick Actions</h3>
            <button onClick={() => navigate('/calendar')} style={styles.actionButton}>
              <span style={styles.actionIcon}>📅</span>
              <span>View Full Calendar</span>
            </button>
            <button style={styles.actionButton}>
              <span style={styles.actionIcon}>📝</span>
              <span>Add Note</span>
            </button>
            <button onClick={loadDashboard} style={styles.actionButton}>
              <span style={styles.actionIcon}>🔄</span>
              <span>Refresh Feed</span>
            </button>
          </div>

          <div style={styles.tipsCard}>
            <h3 style={styles.tipsTitle}>💡 Tip of the Day</h3>
            <p style={styles.tipText}>
              Click "Start Session" on any telehealth appointment to join the video call and auto-generate AI notes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Feed Card Component
interface FeedCardProps {
  item: FeedItem;
  onStartSession: (id: string) => void;
  onNavigate: (path: string) => void;
  getTimeAgo: (date: Date) => string;
  getSessionTimeStatus: (session: Session) => { label: string; style: React.CSSProperties };
}

function FeedCard({ item, onStartSession, onNavigate, getTimeAgo, getSessionTimeStatus }: FeedCardProps) {
  if (item.type === 'appointment') {
    const session = item.data as Session;
    const timeStatus = getSessionTimeStatus(session);
    
    return (
      <div style={{
        ...styles.feedCard,
        ...(session.isUpNext ? styles.feedCardHighlight : {}),
      }}>
        <div style={styles.cardHeader}>
          <div style={styles.cardType}>
            <span style={styles.cardTypeIcon}>{session.locationType === 'telehealth' ? '📹' : '🏢'}</span>
            <span>{session.locationType === 'telehealth' ? 'Telehealth Session' : 'In-Person Session'}</span>
          </div>
          <span style={{ ...styles.timeBadge, ...timeStatus.style }}>{timeStatus.label}</span>
        </div>
        
        <div style={styles.appointmentContent}>
          <div style={styles.clientRow}>
            <div style={styles.clientAvatar}>{session.clientInitials}</div>
            <div>
              <div style={styles.clientName}>{session.clientName}</div>
              <div style={styles.sessionDetails}>
                {session.sessionType} • {session.duration} min
              </div>
            </div>
          </div>
        </div>

        {session.locationType === 'telehealth' && !['completed', 'cancelled', 'no-show'].includes(session.status) && (
          <div style={styles.cardActions}>
            <button 
              onClick={() => onStartSession(session.id)} 
              style={styles.startSessionBtn}
            >
              Start Session →
            </button>
          </div>
        )}
        
        {session.status === 'completed' && (
          <div style={styles.cardActions}>
            <span style={styles.completedText}>✓ Session completed</span>
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'announcement') {
    const announcement = item.data as AnnouncementData;
    return (
      <div style={{ ...styles.feedCard, ...styles.announcementCard }}>
        <div style={styles.cardHeader}>
          <div style={styles.cardType}>
            <span style={styles.cardTypeIcon}>{announcement.icon}</span>
            <span>Announcement</span>
          </div>
          <span style={styles.timeAgo}>{getTimeAgo(item.timestamp)}</span>
        </div>
        <h3 style={styles.announcementTitle}>{announcement.title}</h3>
        <p style={styles.announcementMessage}>{announcement.message}</p>
      </div>
    );
  }

  if (item.type === 'reminder') {
    const reminder = item.data as ReminderData;
    return (
      <div style={{ ...styles.feedCard, ...styles.reminderCard }}>
        <div style={styles.cardHeader}>
          <div style={styles.cardType}>
            <span style={styles.cardTypeIcon}>⏰</span>
            <span>Reminder</span>
          </div>
          <span style={styles.timeAgo}>{getTimeAgo(item.timestamp)}</span>
        </div>
        <h3 style={styles.reminderTitle}>{reminder.title}</h3>
        <p style={styles.reminderMessage}>{reminder.message}</p>
        {reminder.action && reminder.actionPath && (
          <button 
            onClick={() => onNavigate(reminder.actionPath!)} 
            style={styles.reminderAction}
          >
            {reminder.action}
          </button>
        )}
      </div>
    );
  }

  if (item.type === 'insight') {
    const insight = item.data as InsightData;
    return (
      <div style={{ ...styles.feedCard, ...styles.insightCard }}>
        <div style={styles.cardHeader}>
          <div style={styles.cardType}>
            <span style={styles.cardTypeIcon}>📊</span>
            <span>Insight</span>
          </div>
          <span style={styles.timeAgo}>{getTimeAgo(item.timestamp)}</span>
        </div>
        <div style={styles.insightContent}>
          <div style={styles.insightStat}>
            {insight.trend === 'up' && <span style={styles.trendUp}>↑</span>}
            {insight.trend === 'down' && <span style={styles.trendDown}>↓</span>}
            <span style={styles.insightNumber}>{insight.stat}</span>
          </div>
          <div>
            <h3 style={styles.insightTitle}>{insight.title}</h3>
            <p style={styles.insightMessage}>{insight.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#F0EBE3',
  },
  layout: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '280px 1fr 280px',
    gap: '24px',
    padding: '24px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  profileCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  profileAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 600,
    margin: '0 auto 12px',
  },
  profileName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2D3748',
    margin: '0 0 4px 0',
  },
  profileRole: {
    fontSize: '13px',
    color: '#718096',
    margin: 0,
  },
  statsCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  statsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2D3748',
    margin: '0 0 16px 0',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #F7FAFC',
  },
  statLabel: {
    fontSize: '13px',
    color: '#718096',
  },
  statValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#2D3748',
  },
  quickLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  quickLinkBtn: {
    padding: '12px 16px',
    background: 'white',
    color: '#4A5568',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  feed: {
    minHeight: '100vh',
  },
  feedHeader: {
    marginBottom: '20px',
  },
  feedTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#2D3748',
    margin: '0 0 4px 0',
  },
  feedDate: {
    fontSize: '14px',
    color: '#718096',
    margin: 0,
  },
  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  emptyFeed: {
    background: 'white',
    borderRadius: '16px',
    padding: '60px 24px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptySubtext: {
    fontSize: '13px',
    color: '#A0AEC0',
  },
  feedCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  feedCardHighlight: {
    border: '2px solid #6B8E7F',
    boxShadow: '0 4px 12px rgba(107, 142, 127, 0.15)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardType: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#718096',
    fontWeight: 500,
  },
  cardTypeIcon: {
    fontSize: '14px',
  },
  timeBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
  },
  timeAgo: {
    fontSize: '12px',
    color: '#A0AEC0',
  },
  appointmentContent: {
    marginBottom: '12px',
  },
  clientRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  clientAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#EDF2F7',
    color: '#4A5568',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
  },
  clientName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: '2px',
  },
  sessionDetails: {
    fontSize: '13px',
    color: '#718096',
  },
  cardActions: {
    paddingTop: '12px',
    borderTop: '1px solid #F7FAFC',
  },
  startSessionBtn: {
    width: '100%',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  completedText: {
    fontSize: '13px',
    color: '#718096',
  },
  announcementCard: {
    borderLeft: '4px solid #6B8E7F',
  },
  announcementTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2D3748',
    margin: '0 0 8px 0',
  },
  announcementMessage: {
    fontSize: '14px',
    color: '#4A5568',
    margin: 0,
    lineHeight: 1.5,
  },
  reminderCard: {
    borderLeft: '4px solid #F6AD55',
  },
  reminderTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#2D3748',
    margin: '0 0 6px 0',
  },
  reminderMessage: {
    fontSize: '13px',
    color: '#718096',
    margin: '0 0 12px 0',
  },
  reminderAction: {
    padding: '8px 16px',
    background: '#FFFAF0',
    color: '#C05621',
    border: '1px solid #FEEBC8',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  insightCard: {
    borderLeft: '4px solid #667EEA',
  },
  insightContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  insightStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  insightNumber: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#2D3748',
  },
  trendUp: {
    fontSize: '20px',
    color: '#38A169',
  },
  trendDown: {
    fontSize: '20px',
    color: '#E53E3E',
  },
  insightTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2D3748',
    margin: '0 0 4px 0',
  },
  insightMessage: {
    fontSize: '13px',
    color: '#718096',
    margin: 0,
  },
  rightSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  actionsCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  actionsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2D3748',
    margin: '0 0 16px 0',
  },
  actionButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    background: '#F7FAFC',
    color: '#4A5568',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '8px',
  },
  actionIcon: {
    fontSize: '16px',
  },
  tipsCard: {
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    borderRadius: '16px',
    padding: '20px',
    color: 'white',
  },
  tipsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    margin: '0 0 12px 0',
  },
  tipText: {
    fontSize: '13px',
    lineHeight: 1.5,
    margin: 0,
    opacity: 0.95,
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
