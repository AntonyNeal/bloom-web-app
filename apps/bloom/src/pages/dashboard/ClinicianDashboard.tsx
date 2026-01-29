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
  // Practitioner dashboard (when user has Halaxy credentials)
  practitioner?: {
    displayName: string;
    email: string;
    halaxyId: string;
  };
  // Admin dashboard (when user is admin/staff without practitioner record)
  user?: {
    displayName: string;
    email: string;
    role: string;
    permissions: string[];
  };
  dashboardType?: 'admin' | 'practitioner';
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
type FeedItemType = 'appointment' | 'announcement' | 'reminder' | 'insight' | 'tip';

interface FeedItem {
  id: string;
  type: FeedItemType;
  timestamp: Date;
  data: Session | AnnouncementData | ReminderData | InsightData | TipData;
}

interface TipData {
  title: string;
  message: string;
  icon: string;
  category: 'telehealth' | 'wellbeing' | 'business' | 'clinical' | 'productivity';
  action?: string;
  actionPath?: string;
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

// ============================================================================
// CONTEXTUAL TIP GENERATOR
// Generates personalized tips based on practitioner's current situation
// ============================================================================

interface TipContext {
  hour: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isFriday: boolean;
  isMonday: boolean;
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  hasTelehealthToday: boolean;
  hasInPersonToday: boolean;
  sessionsRemaining: number;
  displayName: string;
}

function generateContextualTip(ctx: TipContext): TipData | null {
  const tips: TipData[] = [];

  // ─────────────────────────────────────────────────────────────────────────
  // TIME-OF-DAY TIPS
  // ─────────────────────────────────────────────────────────────────────────
  
  // Early morning (before 8am)
  if (ctx.hour < 8) {
    tips.push({
      title: 'Early Start',
      message: 'Starting early? Remember to take a moment for yourself before your first session. A 5-minute mindfulness practice can help you be more present with clients.',
      icon: '🌅',
      category: 'wellbeing',
    });
  }

  // Late afternoon energy dip (3-5pm)
  if (ctx.hour >= 15 && ctx.hour < 17 && ctx.sessionsRemaining > 0) {
    tips.push({
      title: 'Afternoon Reset',
      message: `You have ${ctx.sessionsRemaining} session${ctx.sessionsRemaining !== 1 ? 's' : ''} remaining. Consider a short walk or stretch between sessions to maintain your therapeutic presence.`,
      icon: '🚶',
      category: 'wellbeing',
    });
  }

  // End of day (after 5pm)
  if (ctx.hour >= 17 && ctx.completedSessions > 0) {
    tips.push({
      title: 'Day\'s End',
      message: 'As you wrap up, take a moment to note any patterns or themes from today\'s sessions. This reflection can inform your clinical approach tomorrow.',
      icon: '📝',
      category: 'clinical',
      action: 'Review Notes',
      actionPath: '/notes',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DAY-OF-WEEK TIPS
  // ─────────────────────────────────────────────────────────────────────────

  if (ctx.isMonday && ctx.hour < 12) {
    tips.push({
      title: 'Monday Planning',
      message: 'Start of the week! Review your calendar for any client prep needed. Clients often bring weekend events to Monday sessions.',
      icon: '📅',
      category: 'productivity',
      action: 'View Calendar',
      actionPath: '/calendar',
    });
  }

  if (ctx.isFriday && ctx.hour >= 14) {
    tips.push({
      title: 'Weekend Prep',
      message: 'Before the weekend, consider scheduling any follow-up calls or check-ins for clients who may need additional support.',
      icon: '🗓️',
      category: 'clinical',
    });
  }

  if (ctx.isWeekend) {
    tips.push({
      title: 'Weekend Practice',
      message: 'Working weekends requires extra self-care. Ensure you\'re scheduling adequate rest and maintaining boundaries.',
      icon: '🌿',
      category: 'wellbeing',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WORKLOAD TIPS
  // ─────────────────────────────────────────────────────────────────────────

  // Light day
  if (ctx.totalSessions === 0) {
    tips.push({
      title: 'Admin Day',
      message: 'No sessions today? This is a great time to catch up on clinical notes, professional development, or business planning.',
      icon: '💼',
      category: 'productivity',
      action: 'Business Coach',
      actionPath: '/business-coach',
    });
  }

  // Heavy day (6+ sessions)
  if (ctx.totalSessions >= 6) {
    tips.push({
      title: 'Busy Day Ahead',
      message: `With ${ctx.totalSessions} sessions today, pace yourself. Consider scheduling brief breaks and having water and snacks ready.`,
      icon: '⚡',
      category: 'wellbeing',
    });
  }

  // Back-to-back sessions
  if (ctx.totalSessions >= 4 && ctx.upcomingSessions >= 3) {
    tips.push({
      title: 'Session Spacing',
      message: 'Multiple sessions ahead. Even 5-minute breaks between clients can help you reset and maintain therapeutic presence.',
      icon: '⏱️',
      category: 'wellbeing',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TELEHEALTH-SPECIFIC TIPS
  // ─────────────────────────────────────────────────────────────────────────

  if (ctx.hasTelehealthToday) {
    const telehealthTips: TipData[] = [
      {
        title: 'Telehealth Tip',
        message: 'Click "Start Session" on any telehealth appointment to join the video call. AI-powered note-taking captures key themes automatically.',
        icon: '📹',
        category: 'telehealth',
      },
      {
        title: 'Video Presence',
        message: 'For telehealth: position your camera at eye level, ensure good lighting on your face, and minimize background distractions.',
        icon: '💡',
        category: 'telehealth',
      },
      {
        title: 'Connection Check',
        message: 'Before your first telehealth session, test your internet connection and audio. Have a phone number ready as backup.',
        icon: '📶',
        category: 'telehealth',
      },
    ];
    // Add one random telehealth tip
    tips.push(telehealthTips[Math.floor(Math.random() * telehealthTips.length)]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CLINICAL TIPS (general, always available)
  // ─────────────────────────────────────────────────────────────────────────

  const clinicalTips: TipData[] = [
    {
      title: 'Therapeutic Alliance',
      message: 'Research shows the therapeutic relationship accounts for 30% of therapy outcomes. Check in on the alliance with at least one client today.',
      icon: '🤝',
      category: 'clinical',
    },
    {
      title: 'Client Progress',
      message: 'Consider reviewing treatment goals with long-term clients. Celebrating progress, however small, reinforces therapeutic gains.',
      icon: '📈',
      category: 'clinical',
    },
    {
      title: 'Supervision Reflection',
      message: 'What case would you bring to supervision this week? Noting challenging moments helps maximize peer consultation.',
      icon: '🔍',
      category: 'clinical',
    },
  ];

  // Add a clinical tip on some occasions
  if (tips.length < 2 && Math.random() > 0.5) {
    tips.push(clinicalTips[Math.floor(Math.random() * clinicalTips.length)]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SELECT THE MOST RELEVANT TIP
  // ─────────────────────────────────────────────────────────────────────────

  if (tips.length === 0) {
    // Fallback tip
    return {
      title: 'Daily Reflection',
      message: 'Taking brief notes after each session helps consolidate your clinical thinking and improves continuity of care.',
      icon: '💭',
      category: 'clinical',
    };
  }

  // Return the first (most contextually relevant) tip
  return tips[0];
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
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;
    const isMonday = dayOfWeek === 1;

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
    if (hour < 12) {
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

    // ========================================================================
    // CONTEXTUAL TIP - Smart tip based on practitioner's situation
    // ========================================================================
    const tip = generateContextualTip({
      hour,
      dayOfWeek,
      isWeekend,
      isFriday,
      isMonday,
      totalSessions: data.today.summary.totalSessions,
      upcomingSessions: data.today.summary.upcomingSessions,
      completedSessions: data.today.summary.completedSessions,
      hasTelehealthToday: data.today.sessions.some(s => s.locationType === 'telehealth'),
      hasInPersonToday: data.today.sessions.some(s => s.locationType === 'in-person'),
      sessionsRemaining: data.today.summary.upcomingSessions,
      displayName: data.practitioner?.displayName || data.user?.displayName || 'there',
    });

    if (tip) {
      items.push({
        id: 'contextual-tip',
        type: 'tip',
        timestamp: new Date(now.getTime() - 1000 * 60 * 45), // Show after insights
        data: tip,
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
    // Determine if this is a configuration issue vs a temporary error
    const isConfigError = error.includes('not configured') || error.includes('not registered') || error.includes('Access denied');
    
    return (
      <div style={styles.container}>
        <BloomHeader showHomeLink={true} />
        <div style={styles.errorContainer}>
          <div style={styles.errorCard}>
            {/* Miyazaki-inspired illustration - a garden needs tending */}
            <svg
              width="160"
              height="140"
              viewBox="0 0 160 140"
              fill="none"
              style={{ marginBottom: '32px' }}
            >
              {/* Soft background glow */}
              <ellipse cx="80" cy="120" rx="70" ry="15" fill="#F3F0F7" opacity="0.6" />
              
              {/* Watering can - the garden needs care */}
              <path
                d="M55 65 L55 95 Q55 105 65 105 L95 105 Q105 105 105 95 L105 65 Z"
                fill="#E8C4BB"
                stroke="#D4A59A"
                strokeWidth="1.5"
              />
              <path
                d="M55 65 Q55 55 70 55 L90 55 Q105 55 105 65"
                fill="#E8C4BB"
                stroke="#D4A59A"
                strokeWidth="1.5"
              />
              {/* Spout */}
              <path
                d="M105 75 Q120 70 130 55"
                stroke="#D4A59A"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              {/* Handle */}
              <path
                d="M65 55 Q65 35 80 35 Q95 35 95 55"
                stroke="#D4A59A"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              
              {/* Small plant waiting to be watered */}
              <ellipse cx="80" cy="120" rx="15" ry="4" fill="#9BAA9B" opacity="0.4" />
              <path
                d="M80 120 Q78 110 80 100"
                stroke="#7B8D7B"
                strokeWidth="2"
                fill="none"
              />
              <ellipse cx="74" cy="105" rx="6" ry="3" fill="#9BAA9B" transform="rotate(-35 74 105)" />
              <ellipse cx="86" cy="102" rx="5" ry="2.5" fill="#7B8D7B" transform="rotate(30 86 102)" />
              
              {/* Droplets - connection being made */}
              <circle cx="125" cy="60" r="3" fill="#9BB0A8" opacity="0.7" />
              <circle cx="122" cy="70" r="2" fill="#9BB0A8" opacity="0.5" />
              <circle cx="128" cy="75" r="2.5" fill="#9BB0A8" opacity="0.6" />
            </svg>
            
            <h2 style={styles.errorTitle}>
              {isConfigError ? 'Almost there...' : 'Taking a moment...'}
            </h2>
            
            <p style={styles.errorMessage}>
              {isConfigError 
                ? 'Your Bloom account needs a little more setup to connect with your appointments.'
                : 'We couldn\'t reach your appointments right now. Like a garden after rain, things will clear up soon.'}
            </p>
            
            <p style={styles.errorDetail}>
              {error}
            </p>
            
            {!isConfigError && (
              <button onClick={loadDashboard} style={styles.retryButton}>
                <span style={{ marginRight: '8px' }}>🌱</span>
                Try again
              </button>
            )}
            
            {isConfigError && (
              <div style={styles.configHint}>
                <p style={styles.hintText}>
                  In the meantime, you can manage your practice directly:
                </p>
                <button onClick={() => navigate('/practice')} style={styles.retryButton}>
                  <span style={{ marginRight: '8px' }}>📋</span>
                  Go to Practice Management
                </button>
              </div>
            )}
          </div>
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
              {(dashboard.practitioner?.displayName || dashboard.user?.displayName || 'User').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <h2 style={styles.profileName}>{dashboard.practitioner?.displayName || dashboard.user?.displayName || 'User'}</h2>
            <p style={styles.profileRole}>{dashboard.dashboardType === 'admin' ? (dashboard.user?.role || 'Admin') : 'Psychologist'}</p>
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
              {/* Peaceful garden illustration */}
              <svg
                width="120"
                height="100"
                viewBox="0 0 120 100"
                fill="none"
                style={{ marginBottom: '24px', opacity: 0.8 }}
              >
                {/* Ground */}
                <ellipse cx="60" cy="90" rx="50" ry="8" fill="#E8E0F0" />
                {/* Pot */}
                <path
                  d="M45 70 L50 90 L70 90 L75 70 Z"
                  fill="#E8D5C4"
                  stroke="#C9A88C"
                  strokeWidth="1"
                />
                {/* Plant stem */}
                <path
                  d="M60 70 Q58 55 60 45"
                  stroke="#6B8E7F"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Leaves */}
                <ellipse cx="52" cy="52" rx="8" ry="4" fill="#A8C5B8" transform="rotate(-30 52 52)" />
                <ellipse cx="68" cy="55" rx="8" ry="4" fill="#6B8E7F" transform="rotate(25 68 55)" />
                <ellipse cx="55" cy="42" rx="6" ry="3" fill="#6B8E7F" transform="rotate(-15 55 42)" />
                {/* Sun rays */}
                <circle cx="95" cy="20" r="12" fill="#E8D5C4" opacity="0.5" />
                <circle cx="95" cy="20" r="8" fill="#C9A88C" opacity="0.3" />
              </svg>
              <h3 style={styles.emptyTitle}>A clear day ahead</h3>
              <p style={styles.emptySubtext}>
                Time to catch up on notes, or simply enjoy a cup of tea. ☕
              </p>
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
            <button onClick={() => navigate('/practice')} style={styles.actionButton}>
              <span style={styles.actionIcon}>🏥</span>
              <span>Practice Management</span>
            </button>
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

  // Tip card - contextual tips based on practitioner situation
  if (item.type === 'tip') {
    const tip = item.data as TipData;
    const categoryColors: Record<string, { bg: string; border: string; icon: string }> = {
      telehealth: { bg: '#E8F4F8', border: '#5B9BD5', icon: '📹' },
      wellbeing: { bg: '#F0F7F4', border: '#6B8E7F', icon: '🌿' },
      business: { bg: '#FEF7ED', border: '#E8B77D', icon: '💼' },
      clinical: { bg: '#F3F0F7', border: '#9B8DC4', icon: '🧠' },
      productivity: { bg: '#FFF9E6', border: '#D4A574', icon: '⚡' },
    };
    const colors = categoryColors[tip.category] || categoryColors.clinical;

    return (
      <div style={{ 
        ...styles.feedCard, 
        background: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
      }}>
        <div style={styles.cardHeader}>
          <div style={styles.cardType}>
            <span style={styles.cardTypeIcon}>{tip.icon}</span>
            <span style={{ fontWeight: 600, color: colors.border }}>{tip.title}</span>
          </div>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '12px',
            background: `${colors.border}20`,
            color: colors.border,
            fontWeight: 500,
            textTransform: 'capitalize',
          }}>
            {tip.category}
          </span>
        </div>
        <p style={{
          ...styles.reminderMessage,
          marginTop: '8px',
          lineHeight: 1.6,
        }}>
          {tip.message}
        </p>
        {tip.action && tip.actionPath && (
          <button
            onClick={() => onNavigate(tip.actionPath!)}
            style={{
              ...styles.reminderAction,
              background: colors.border,
            }}
          >
            {tip.action}
          </button>
        )}
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
    background: 'linear-gradient(180deg, #FAFBF9 0%, #F5F7F4 100%)',
    borderRadius: '16px',
    padding: '60px 24px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: "'Crimson Text', Georgia, serif",
    fontSize: '20px',
    color: '#2D3748',
    marginBottom: '8px',
    fontWeight: 500,
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#718096',
    maxWidth: '280px',
    lineHeight: 1.5,
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
  // Miyazaki-inspired error states - gentle and warm
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 80px)',
    padding: '40px 24px',
    background: 'linear-gradient(180deg, #FAF8F3 0%, #F3F0F7 50%, #E8F4F0 100%)',
  },
  errorCard: {
    background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F3 100%)',
    borderRadius: '24px',
    padding: '48px 56px',
    maxWidth: '480px',
    textAlign: 'center' as const,
    boxShadow: '0 8px 40px rgba(123, 141, 123, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(155, 170, 155, 0.15)',
  },
  errorTitle: {
    fontFamily: '"Crimson Text", Georgia, serif',
    fontSize: '28px',
    fontWeight: 600,
    color: '#5A6B5A',
    marginBottom: '16px',
    letterSpacing: '-0.01em',
  },
  errorMessage: {
    fontFamily: '"Source Sans Pro", -apple-system, sans-serif',
    fontSize: '16px',
    color: '#6B7B6B',
    marginBottom: '12px',
    lineHeight: 1.7,
  },
  errorDetail: {
    fontFamily: '"Source Sans Pro", -apple-system, sans-serif',
    fontSize: '13px',
    color: '#9BAA9B',
    marginBottom: '28px',
    padding: '12px 16px',
    background: 'rgba(155, 170, 155, 0.08)',
    borderRadius: '8px',
    fontStyle: 'italic',
  },
  retryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #7B8D7B 0%, #6B8E7F 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(107, 142, 127, 0.25)',
    transition: 'all 0.2s ease',
  },
  configHint: {
    marginTop: '20px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #F3F0F7 0%, #E8E2F0 100%)',
    borderRadius: '12px',
    border: '1px solid rgba(180, 160, 200, 0.2)',
  },
  hintText: {
    fontFamily: '"Source Sans Pro", -apple-system, sans-serif',
    fontSize: '14px',
    color: '#6B5B7B',
    margin: 0,
    lineHeight: 1.6,
  },
};

export default ClinicianDashboard;
