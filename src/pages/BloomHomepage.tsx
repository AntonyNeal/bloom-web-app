import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BlossomTreeSophisticated } from '@/components/bloom-tree/BlossomTreeSophisticated';
import { motion, useReducedMotion } from 'framer-motion';
import { useDashboard } from '@/hooks/useDashboard';
import { BloomHeader } from '@/components/layout/BloomHeader';
import type { WeeklyStats, UpcomingStats, MonthlyStats } from '@/types/bloom';

// ============================================================================
// DESIGN TOKENS - The palette of a cottage garden
// ============================================================================
const colors = {
  cream: '#FAF8F3',
  sage: '#7B8D7B',
  sageLight: '#9BAA9B',
  sageDark: '#5A6B5A',
  terracotta: '#D4A59A',
  terracottaLight: '#E8C4BB',
  charcoal: '#3A3A3A',
  charcoalLight: '#5A5A5A',
  lavender: '#E8E2F0',
  lavenderLight: '#F3F0F7',
  white: '#FFFFFF',
  warmWhite: '#FFFEF9',
  // Social feed additions
  blue: '#5B9BD5',
  blueLight: '#E8F1F9',
  amber: '#E8B77D',
  amberLight: '#FEF7ED',
};

const shadows = {
  subtle: '0 1px 3px rgba(122, 141, 122, 0.08)',
  lifted: '0 4px 12px rgba(122, 141, 122, 0.12)',
  card: '0 2px 8px rgba(122, 141, 122, 0.06)',
  feed: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
  feedHover: '0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)',
};

// ============================================================================
// TYPES - The taxonomy of our garden
// ============================================================================
// Using types from @/types/bloom.ts for data schema
// Local Session type for backward compatibility with existing components
interface Session {
  id: string;
  time: string;
  sessionNumber: number;
  clientInitials: string;
  presentingIssues: string[];
  mhcpRemaining: number;
  mhcpTotal: number;
  relationshipMonths: number;
  isUpNext?: boolean;
  status?: string;
  locationType?: string;
}

// WeeklyStats, UpcomingStats, MonthlyStats imported from @/types/bloom

interface User {
  name: string;
  id: string;
}

interface BloomHomepageProps {
  /** Practitioner ID for fetching data (optional - uses sample data if not provided) */
  practitionerId?: string;
  /** Override user data */
  user?: User;
  /** Override sessions (bypasses API) */
  todaysSessions?: Session[];
  /** Override weekly stats */
  weeklyStats?: WeeklyStats;
  /** Override upcoming stats */
  upcomingStats?: UpcomingStats;
  /** Override monthly stats */
  monthlyStats?: MonthlyStats;
}

// ============================================================================
// SAMPLE DATA - Seeds for demonstration
// ============================================================================
const sampleSessions: Session[] = [
  {
    id: '1',
    time: '9:00 AM',
    sessionNumber: 8,
    clientInitials: 'JM',
    presentingIssues: ['Anxiety', 'Depression'],
    mhcpRemaining: 2,
    mhcpTotal: 10,
    relationshipMonths: 14,
  },
  {
    id: '2',
    time: '10:30 AM',
    sessionNumber: 3,
    clientInitials: 'AK',
    presentingIssues: ['Work Stress', 'Relationship Issues'],
    mhcpRemaining: 7,
    mhcpTotal: 10,
    relationshipMonths: 2,
  },
  {
    id: '3',
    time: '1:00 PM',
    sessionNumber: 12,
    clientInitials: 'RL',
    presentingIssues: ['PTSD'],
    mhcpRemaining: 4,
    mhcpTotal: 10,
    relationshipMonths: 18,
  },
  {
    id: '4',
    time: '2:30 PM',
    sessionNumber: 1,
    clientInitials: 'BT',
    presentingIssues: ['Grief', 'Adjustment'],
    mhcpRemaining: 10,
    mhcpTotal: 10,
    relationshipMonths: 0,
  },
  {
    id: '5',
    time: '4:00 PM',
    sessionNumber: 6,
    clientInitials: 'MW',
    presentingIssues: ['Social Anxiety', 'Self-esteem'],
    mhcpRemaining: 1,
    mhcpTotal: 10,
    relationshipMonths: 8,
  },
];

const sampleWeeklyStats: WeeklyStats = {
  weekStartDate: new Date(Date.now() - new Date().getDay() * 86400000).toISOString(),
  weekEndDate: new Date(Date.now() + (6 - new Date().getDay()) * 86400000).toISOString(),
  currentSessions: 18,
  scheduledSessions: 22,
  maxSessions: 25,
  currentRevenue: 3960,
  completionRate: 0.82,
  noShowCount: 1,
  cancellationCount: 2,
};

const sampleUpcomingStats: UpcomingStats = {
  tomorrowSessions: 4,
  remainingThisWeek: 7,
  nextWeekSessions: 20,
  mhcpEndingSoon: 3,
  clientsNeedingFollowUp: 2,
  unbookedRegulars: 1,
};

const sampleMonthlyStats: MonthlyStats = {
  currentRevenue: 12450,
  monthName: new Date().toLocaleDateString('en-AU', { month: 'long' }),
};

// ============================================================================
// ICONS - Small botanical touches
// ============================================================================
const LeafIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ============================================================================
// ICONS - Feed-style icons
// ============================================================================
const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? colors.terracotta : 'none'} stroke={filled ? colors.terracotta : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const NoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0l2.5 7.5L22 10l-7.5 2.5L12 20l-2.5-7.5L2 10l7.5-2.5L12 0z" />
  </svg>
);

// ============================================================================
// CLIENT STORY BUBBLE - Like Instagram stories
// ============================================================================
const ClientStoryBubble: React.FC<{ session: Session; isNext?: boolean }> = ({ session, isNext }) => {
  const isNewClient = session.relationshipMonths === 0;
  const isMhcpLow = session.mhcpRemaining <= 2;
  
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        minWidth: '72px',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          padding: '3px',
          background: isNext 
            ? `linear-gradient(135deg, ${colors.sage}, ${colors.terracotta})` 
            : isMhcpLow 
              ? `linear-gradient(135deg, ${colors.terracotta}, ${colors.amber})`
              : colors.lavender,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: isNewClient ? colors.terracottaLight : colors.lavenderLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '18px',
            fontWeight: 600,
            color: colors.charcoal,
            border: `2px solid ${colors.white}`,
          }}
        >
          {session.clientInitials}
        </div>
      </div>
      <span style={{
        fontSize: '11px',
        fontWeight: isNext ? 600 : 400,
        color: isNext ? colors.charcoal : colors.charcoalLight,
        maxWidth: '64px',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {session.time}
      </span>
    </motion.div>
  );
};

// ============================================================================
// SESSION FEED CARD - Social media post style
// ============================================================================
const SessionFeedCard: React.FC<{ session: Session; isUpNext?: boolean; index: number }> = ({ session, isUpNext, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const mhcpPercentage = (session.mhcpRemaining / session.mhcpTotal) * 100;
  const isNewClient = session.relationshipMonths === 0;
  const isMhcpLow = session.mhcpRemaining <= 2;

  const formatRelationship = (months: number) => {
    if (months === 0) return 'New client';
    if (months === 1) return '1 month';
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
    return `${years}y ${remainingMonths}m`;
  };

  // Calculate time until session
  const getTimeUntil = () => {
    const now = new Date();
    const [time, period] = session.time.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let sessionHour = hours;
    if (period === 'PM' && hours !== 12) sessionHour += 12;
    if (period === 'AM' && hours === 12) sessionHour = 0;
    
    const sessionTime = new Date(now);
    sessionTime.setHours(sessionHour, minutes || 0, 0, 0);
    
    const diff = sessionTime.getTime() - now.getTime();
    if (diff < 0) return 'In session';
    const diffMins = Math.floor(diff / 60000);
    if (diffMins < 60) return `in ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `in ${diffHours}h ${diffMins % 60}m`;
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: colors.white,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: isHovered ? shadows.feedHover : shadows.feed,
        transform: isHovered && !prefersReducedMotion ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        cursor: 'pointer',
        border: isUpNext ? `2px solid ${colors.sage}` : `1px solid transparent`,
      }}
    >
      {/* Up Next Banner */}
      {isUpNext && (
        <div style={{
          background: `linear-gradient(90deg, ${colors.sage}, ${colors.sageLight})`,
          color: colors.white,
          padding: '8px 20px',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          <SparkleIcon />
          Up Next · {getTimeUntil()}
        </div>
      )}

      <div style={{ padding: '20px 24px' }}>
        {/* Header: Avatar + Client Info + Time */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          marginBottom: '16px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: isNewClient 
              ? `linear-gradient(135deg, ${colors.terracotta}, ${colors.amber})`
              : `linear-gradient(135deg, ${colors.sage}, ${colors.sageLight})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '20px',
            fontWeight: 600,
            color: colors.white,
            flexShrink: 0,
            boxShadow: `0 2px 8px ${isNewClient ? colors.terracotta : colors.sage}30`,
          }}>
            {session.clientInitials}
          </div>

          {/* Client Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}>
              <span style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '18px',
                fontWeight: 600,
                color: colors.charcoal,
              }}>
                Session {session.sessionNumber}
              </span>
              <span style={{
                fontSize: '12px',
                color: colors.charcoalLight,
              }}>
                · {formatRelationship(session.relationshipMonths)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: colors.charcoalLight,
              fontSize: '14px',
            }}>
              <ClockIcon />
              <span style={{ fontWeight: 500, color: colors.charcoal }}>{session.time}</span>
              {!isUpNext && <span style={{ fontSize: '13px' }}>· {getTimeUntil()}</span>}
            </div>
          </div>

          {/* New Client Badge */}
          {isNewClient && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: colors.terracotta,
                backgroundColor: colors.amberLight,
                padding: '4px 10px',
                borderRadius: '20px',
                letterSpacing: '0.3px',
              }}
            >
              ✨ New
            </motion.span>
          )}
        </div>

        {/* Presenting Issues - Like tweet content */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px',
          paddingLeft: '66px',
        }}>
          {session.presentingIssues.map((issue, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '14px',
                color: colors.sage,
                backgroundColor: `${colors.sage}12`,
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: 500,
              }}
            >
              {issue}
            </span>
          ))}
        </div>

        {/* MHCP Progress - Like engagement metrics */}
        <div style={{
          paddingLeft: '66px',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '13px', color: colors.charcoalLight }}>
              Medicare Mental Health Plan
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: isMhcpLow ? colors.terracotta : colors.sage,
            }}>
              {session.mhcpRemaining}/{session.mhcpTotal} sessions left
            </span>
          </div>
          <div style={{
            height: '6px',
            backgroundColor: colors.lavenderLight,
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mhcpPercentage}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                height: '100%',
                background: isMhcpLow
                  ? `linear-gradient(90deg, ${colors.terracotta}, ${colors.amber})`
                  : `linear-gradient(90deg, ${colors.sage}, ${colors.sageLight})`,
                borderRadius: '3px',
              }}
            />
          </div>
          {isMhcpLow && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontSize: '12px',
                color: colors.terracotta,
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <BellIcon />
              Consider discussing GP referral
            </motion.p>
          )}
        </div>

        {/* Action Bar - Like social media engagement */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          paddingTop: '12px',
          borderTop: `1px solid ${colors.lavenderLight}`,
          paddingLeft: '66px',
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: isLiked ? `${colors.terracotta}15` : 'transparent',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              color: isLiked ? colors.terracotta : colors.charcoalLight,
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <HeartIcon filled={isLiked} />
            <span>Prep done</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: colors.blueLight }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              color: colors.charcoalLight,
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <NoteIcon />
            <span>Notes</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: colors.lavenderLight }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              color: colors.charcoalLight,
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircleIcon />
            <span>Complete</span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};

// ============================================================================
// EMPTY STATE - A peaceful garden at rest
// ============================================================================
const EmptyState: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
    }}
  >
    {/* Simple garden illustration */}
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      style={{ marginBottom: '24px', opacity: 0.7 }}
    >
      {/* Ground */}
      <ellipse cx="60" cy="90" rx="50" ry="8" fill={colors.lavenderLight} />
      {/* Pot */}
      <path
        d="M45 70 L50 90 L70 90 L75 70 Z"
        fill={colors.terracottaLight}
        stroke={colors.terracotta}
        strokeWidth="1"
      />
      {/* Plant stem */}
      <path
        d="M60 70 Q58 55 60 45"
        stroke={colors.sage}
        strokeWidth="2"
        fill="none"
      />
      {/* Leaves */}
      <ellipse cx="52" cy="52" rx="8" ry="4" fill={colors.sageLight} transform="rotate(-30 52 52)" />
      <ellipse cx="68" cy="55" rx="8" ry="4" fill={colors.sage} transform="rotate(25 68 55)" />
      <ellipse cx="55" cy="42" rx="6" ry="3" fill={colors.sage} transform="rotate(-15 55 42)" />
      {/* Sun rays */}
      <circle cx="95" cy="20" r="12" fill={colors.terracottaLight} opacity="0.5" />
      <circle cx="95" cy="20" r="8" fill={colors.terracotta} opacity="0.3" />
    </svg>
    <h3
      style={{
        fontFamily: "'Crimson Text', Georgia, serif",
        fontSize: '20px',
        color: colors.charcoal,
        marginBottom: '8px',
        fontWeight: 500,
      }}
    >
      No sessions scheduled today
    </h3>
    <p
      style={{
        fontSize: '14px',
        color: colors.charcoalLight,
        maxWidth: '280px',
        lineHeight: 1.5,
      }}
    >
      A quiet day in the garden. Time to catch up on notes or enjoy a cup of tea.
    </p>
  </div>
);

// ============================================================================
// TODAY'S SESSIONS - Social Feed Style
// ============================================================================
const SessionFeed: React.FC<{ sessions: Session[] }> = ({ sessions }) => {
  // Sort sessions by time and identify the next one
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour = hours;
        if (period === 'PM' && hours !== 12) hour += 12;
        if (period === 'AM' && hours === 12) hour = 0;
        return hour * 60 + (minutes || 0);
      };
      return parseTime(a.time) - parseTime(b.time);
    });
  }, [sessions]);

  // Find the next upcoming session
  const nextSessionId = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const session of sortedSessions) {
      const [time, period] = session.time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour = hours;
      if (period === 'PM' && hours !== 12) hour += 12;
      if (period === 'AM' && hours === 12) hour = 0;
      const sessionMinutes = hour * 60 + (minutes || 0);
      
      if (sessionMinutes > currentMinutes) {
        return session.id;
      }
    }
    return sortedSessions[0]?.id;
  }, [sortedSessions]);

  if (sessions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {sortedSessions.map((session, index) => (
        <SessionFeedCard 
          key={session.id} 
          session={session} 
          isUpNext={session.id === nextSessionId}
          index={index}
        />
      ))}
    </div>
  );
};

// ============================================================================
// CLIENT STORIES BAR - Like Instagram Stories
// ============================================================================
const ClientStoriesBar: React.FC<{ sessions: Session[] }> = ({ sessions }) => {
  if (sessions.length === 0) return null;

  // Find next session for highlighting
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const sortedSessions = [...sessions].sort((a, b) => {
    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour = hours;
      if (period === 'PM' && hours !== 12) hour += 12;
      if (period === 'AM' && hours === 12) hour = 0;
      return hour * 60 + (minutes || 0);
    };
    return parseTime(a.time) - parseTime(b.time);
  });

  let nextIndex = 0;
  for (let i = 0; i < sortedSessions.length; i++) {
    const [time, period] = sortedSessions[i].time.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour = hours;
    if (period === 'PM' && hours !== 12) hour += 12;
    if (period === 'AM' && hours === 12) hour = 0;
    const sessionMinutes = hour * 60 + (minutes || 0);
    
    if (sessionMinutes > currentMinutes) {
      nextIndex = i;
      break;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: colors.white,
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: shadows.feed,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '14px',
      }}>
        <CalendarIcon />
        <span style={{
          fontFamily: "'Crimson Text', Georgia, serif",
          fontSize: '16px',
          fontWeight: 500,
          color: colors.charcoal,
        }}>
          Today's Schedule
        </span>
        <span style={{
          fontSize: '13px',
          color: colors.charcoalLight,
          marginLeft: 'auto',
        }}>
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {sortedSessions.map((session, index) => (
          <ClientStoryBubble 
            key={session.id} 
            session={session}
            isNext={index === nextIndex}
          />
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================================
// COMPACT STAT CARD - For the sidebar/inline stats
// ============================================================================
const CompactStatPill: React.FC<{ label: string; value: string; subtext?: string; highlight?: boolean; large?: boolean }> = ({ label, value, subtext, highlight, large }) => (
  <div style={{
    display: 'flex',
    flexDirection: large ? 'column' : 'row',
    alignItems: large ? 'flex-start' : 'center',
    justifyContent: large ? 'flex-start' : 'space-between',
    padding: large ? '14px 18px' : '10px 14px',
    backgroundColor: highlight ? `${colors.terracotta}10` : large ? colors.white : colors.lavenderLight,
    borderRadius: large ? '14px' : '10px',
    flex: large ? '1 1 100%' : 1,
    minWidth: large ? '100%' : '140px',
    border: large ? `1px solid ${colors.lavender}` : 'none',
    gap: large ? '4px' : 0,
  }}>
    <span style={{ fontSize: '13px', color: colors.charcoalLight }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
      <span style={{
        fontSize: large ? '28px' : '14px',
        fontWeight: 600,
        fontFamily: large ? "'Crimson Text', Georgia, serif" : 'inherit',
        color: highlight ? colors.terracotta : colors.charcoal,
        letterSpacing: large ? '-0.5px' : 'normal',
      }}>
        {value}
      </span>
      {subtext && (
        <span style={{
          fontSize: '13px',
          color: colors.sageLight,
          fontWeight: 500,
        }}>
          {subtext}
        </span>
      )}
    </div>
  </div>
);

// ============================================================================
// QUICK STATS INLINE - Yearly projection card
// ============================================================================
const QuickStatsInline: React.FC<{ weeklyStats: WeeklyStats; upcomingStats: UpcomingStats; monthlyStats: MonthlyStats }> = ({ weeklyStats, upcomingStats, monthlyStats }) => {
  // Calculate yearly projection based on current monthly pace
  const currentMonth = new Date().getMonth(); // 0-11
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate();
  
  // Ensure we have valid numbers
  const currentRevenue = Number(monthlyStats.currentRevenue) || 0;
  
  // Projected monthly revenue (extrapolate current month based on days elapsed)
  const projectedMonthlyRevenue = dayOfMonth > 0 ? (currentRevenue / dayOfMonth) * daysInMonth : currentRevenue;
  
  // Yearly projection: assume this monthly rate for the full year
  const yearlyProjection = Math.round(projectedMonthlyRevenue * 12);
  
  // Calculate monthly average for context
  const monthlyAverage = Math.round(yearlyProjection / 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        backgroundColor: colors.white,
        borderRadius: '16px',
        padding: '20px',
        marginTop: '20px',
        boxShadow: shadows.feed,
      }}
    >
      {/* Yearly Projection Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
      }}>
        <span style={{
          fontFamily: "'Crimson Text', Georgia, serif",
          fontSize: '16px',
          fontWeight: 500,
          color: colors.charcoal,
        }}>
          Your projected earnings
        </span>
        <span style={{
          fontSize: '12px',
          color: colors.sage,
          backgroundColor: `${colors.sage}15`,
          padding: '3px 10px',
          borderRadius: '12px',
          fontWeight: 600,
        }}>
          Based on current pace
        </span>
      </div>

      {/* Big yearly number */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px',
        marginBottom: '16px',
      }}>
        <span style={{
          fontFamily: "'Crimson Text', Georgia, serif",
          fontSize: '36px',
          fontWeight: 600,
          color: colors.charcoal,
          letterSpacing: '-1px',
        }}>
          ${yearlyProjection.toLocaleString()}
        </span>
        <span style={{
          fontSize: '14px',
          color: colors.charcoalLight,
        }}>
          this year
        </span>
      </div>

      {/* Monthly average insight */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: colors.lavenderLight,
        borderRadius: '10px',
      }}>
        <span style={{
          fontSize: '14px',
          color: colors.charcoalLight,
        }}>
          That's around <span style={{ fontWeight: 600, color: colors.charcoal }}>${monthlyAverage.toLocaleString()}</span> per month
        </span>
      </div>

      {/* Quick stats row */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        paddingTop: '12px',
        borderTop: `1px solid ${colors.lavenderLight}`,
      }}>
        <CompactStatPill 
          label="This week" 
          value={`${weeklyStats.currentSessions}/${weeklyStats.maxSessions}`} 
        />
        <CompactStatPill 
          label="Tomorrow" 
          value={`${upcomingStats.tomorrowSessions} sessions`} 
        />
        <CompactStatPill 
          label="MHCP Alert" 
          value={`${upcomingStats.mhcpEndingSoon} clients`}
          highlight={upcomingStats.mhcpEndingSoon > 0}
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// BLOOM HOMEPAGE - Social Feed Layout
// ============================================================================
const BloomHomepage: React.FC<BloomHomepageProps> = ({
  practitionerId,
  todaysSessions: sessionsOverride,
  weeklyStats: weeklyOverride,
  upcomingStats: upcomingOverride,
  monthlyStats: monthlyOverride,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [showDebug, setShowDebug] = useState(false);
  const [azureUserId, setAzureUserId] = useState<string | null>(null);
  
  // Get Azure User ID for debugging
  React.useEffect(() => {
    const getAzureId = async () => {
      try {
        const msalInstance = (window as { msalInstance?: { getAllAccounts: () => { homeAccountId?: string; localAccountId?: string }[] } }).msalInstance;
        if (msalInstance) {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            const account = accounts[0];
            const userId = account.homeAccountId?.split('.')[0] || account.localAccountId || null;
            setAzureUserId(userId);
          }
        }
      } catch (e) {
        console.error('Error getting Azure ID:', e);
      }
    };
    getAzureId();
  }, []);
  
  // Fetch dashboard data from API (or use sample data as fallback)
  const { dashboard, loading } = useDashboard(practitionerId);

  // Transform dashboard data to local types, or use overrides/samples
  const todaysSessions: Session[] = sessionsOverride || (dashboard ? 
    dashboard.todaysSessions.map(s => ({
      id: s.id,
      time: s.time,
      sessionNumber: s.sessionNumber,
      clientInitials: s.clientInitials,
      presentingIssues: s.presentingIssues,
      mhcpRemaining: s.mhcpRemaining,
      mhcpTotal: s.mhcpTotal,
      relationshipMonths: s.relationshipMonths,
      isUpNext: s.isUpNext,
      status: s.status,
      locationType: s.locationType,
    })) : sampleSessions);

  const weeklyStats: WeeklyStats = weeklyOverride || (dashboard 
    ? dashboard.weeklyStats 
    : sampleWeeklyStats);

  const upcomingStats: UpcomingStats = upcomingOverride || (dashboard 
    ? dashboard.upcomingStats 
    : sampleUpcomingStats);

  const monthlyStats: MonthlyStats = monthlyOverride || (dashboard 
    ? dashboard.monthlyStats 
    : sampleMonthlyStats);

  // Show loading state
  if (loading && !dashboard) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.cream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ color: colors.sage }}
        >
          <LeafIcon />
        </motion.div>
        <p style={{ color: colors.charcoalLight, fontSize: '14px' }}>
          Growing your garden...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.cream,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Developer Debug Banner - shows Azure ID for account setup */}
      {azureUserId && (
        <div
          onClick={() => setShowDebug(!showDebug)}
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            background: showDebug ? colors.sage : 'rgba(122, 141, 122, 0.8)',
            color: 'white',
            padding: showDebug ? '12px 16px' : '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: shadows.lifted,
            maxWidth: showDebug ? '400px' : 'auto',
          }}
        >
          {showDebug ? (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🔧 Developer Info</div>
              <div style={{ marginBottom: '4px' }}>Azure ID:</div>
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: '4px 8px', 
                borderRadius: '4px',
                wordBreak: 'break-all'
              }}>
                {azureUserId}
              </div>
              <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.8 }}>
                {dashboard?.syncStatus?.isConnected ? '✅ Live data' : '📊 Sample data'}
              </div>
            </div>
          ) : (
            <span>🔧 Dev</span>
          )}
        </div>
      )}
      {/* Global styles for animations */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600&family=Inter:wght@400;500;600&display=swap');
          
          @keyframes dropdownFade {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes blossomFloat {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }
            25% {
              transform: translate(1px, -2px) scale(1.02);
            }
            50% {
              transform: translate(-1px, 1px) scale(0.98);
            }
            75% {
              transform: translate(2px, -1px) scale(1.01);
            }
          }

          @keyframes petalFall {
            0% {
              transform: translate(0, 0) rotate(0deg);
              opacity: 0.8;
            }
            25% {
              transform: translate(-10px, 30px) rotate(90deg);
              opacity: 0.6;
            }
            50% {
              transform: translate(5px, 60px) rotate(180deg);
              opacity: 0.4;
            }
            75% {
              transform: translate(-5px, 90px) rotate(270deg);
              opacity: 0.2;
            }
            100% {
              transform: translate(0, 120px) rotate(360deg);
              opacity: 0;
            }
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          /* Hide scrollbar for stories */
          .stories-scroll::-webkit-scrollbar {
            display: none;
          }

          /* Feed column max-width for readability */
          @media (min-width: 768px) {
            .feed-column {
              max-width: 600px;
              margin: 0 auto;
            }
          }
        `}
      </style>

      <BloomHeader />

      {/* Main Feed Layout - Single column like social media */}
      <main style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px 16px',
      }}>
        {/* Hero: Tree + Revenue - Clickable to Business Coach */}
        <Link 
          to="/business-coach"
          style={{ textDecoration: 'none', display: 'block' }}
          aria-label="View Business Coach dashboard"
        >
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ 
              marginBottom: '24px',
              cursor: 'pointer',
              borderRadius: '20px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            whileHover={{ 
              scale: 1.01,
              boxShadow: '0 8px 24px rgba(122, 141, 122, 0.15)',
            }}
            whileTap={{ scale: 0.99 }}
          >
            <BlossomTreeSophisticated monthlyStats={monthlyStats} />
            {/* Subtle hint to click */}
            <div style={{
              textAlign: 'center',
              marginTop: '-8px',
              paddingBottom: '8px',
              fontSize: '12px',
              color: colors.sageLight,
              opacity: 0.8,
            }}>
              Tap to explore your Business Coach →
            </div>
          </motion.div>
        </Link>

        {/* Stories Bar - Quick glance at today's clients */}
        <ClientStoriesBar sessions={todaysSessions} />

        {/* Feed Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          paddingLeft: '4px',
        }}>
          <h2 style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '24px',
            fontWeight: 500,
            color: colors.charcoal,
            margin: 0,
          }}>
            Your Day
          </h2>
          <div style={{
            flex: 1,
            height: '1px',
            background: `linear-gradient(90deg, ${colors.lavender}, transparent)`,
          }} />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: colors.white,
              border: `1px solid ${colors.lavender}`,
              borderRadius: '20px',
              cursor: 'pointer',
              color: colors.charcoalLight,
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <span>View week</span>
            <ArrowRightIcon />
          </motion.button>
        </div>

        {/* Session Feed - The main content */}
        <div className="feed-column">
          <SessionFeed sessions={todaysSessions} />
        </div>

        {/* Quick Stats - At bottom like engagement summary */}
        <QuickStatsInline weeklyStats={weeklyStats} upcomingStats={upcomingStats} monthlyStats={monthlyStats} />
      </main>
    </div>
  );
};

export default BloomHomepage;
