import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDashboard } from '@/hooks/useDashboard';

// ============================================================================
// DESIGN TOKENS - Consistent with Bloom design system
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
  blue: '#5B9BD5',
  blueLight: '#E8F1F9',
  amber: '#E8B77D',
  amberLight: '#FEF7ED',
  green: '#7B9B7B',
  greenLight: '#E8F0E8',
};

const shadows = {
  subtle: '0 1px 3px rgba(122, 141, 122, 0.08)',
  lifted: '0 4px 12px rgba(122, 141, 122, 0.12)',
  card: '0 2px 8px rgba(122, 141, 122, 0.06)',
};

// ============================================================================
// ICONS
// ============================================================================
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
    <path d="M19 13l1 2 1-2 2-1-2-1-1-2-1 2-2 1 2 1z" />
  </svg>
);

const MegaphoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l18-5v12L3 13v-2z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

const PieChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const LeafIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const BotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);



// ============================================================================
// TYPES
// ============================================================================
interface ClientSource {
  source: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface SocialPlatform {
  name: string;
  connected: boolean;
  followers?: number;
  engagement?: number;
  lastPost?: string;
  recommended: boolean;
  icon: string;
}

interface ContentIdea {
  type: string;
  title: string;
  description: string;
  performanceScore: number;
  bestDay: string;
  bestTime: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ============================================================================
// SAMPLE DATA - Will be replaced with real API data
// ============================================================================
const sampleClientSources: ClientSource[] = [
  { source: 'Google Search', count: 45, percentage: 38, trend: 'up', color: colors.blue },
  { source: 'Referral (GP)', count: 32, percentage: 27, trend: 'stable', color: colors.sage },
  { source: 'Referral (Colleague)', count: 18, percentage: 15, trend: 'up', color: colors.green },
  { source: 'Psychology Today', count: 12, percentage: 10, trend: 'down', color: colors.terracotta },
  { source: 'Instagram', count: 8, percentage: 7, trend: 'up', color: colors.lavender },
  { source: 'Direct/Other', count: 4, percentage: 3, trend: 'stable', color: colors.charcoalLight },
];

const sampleSocialPlatforms: SocialPlatform[] = [
  { name: 'Instagram', connected: true, followers: 1240, engagement: 4.2, lastPost: '3 days ago', recommended: true, icon: '≡ƒô╕' },
  { name: 'LinkedIn', connected: true, followers: 890, engagement: 2.8, lastPost: '1 week ago', recommended: true, icon: '≡ƒÆ╝' },
  { name: 'Facebook Page', connected: false, recommended: true, icon: '≡ƒôÿ' },
  { name: 'TikTok', connected: false, recommended: false, icon: '≡ƒÄ╡' },
  { name: 'YouTube', connected: false, recommended: false, icon: 'Γû╢∩╕Å' },
];

const sampleContentIdeas: ContentIdea[] = [
  { type: 'Educational', title: 'Understanding Anxiety Triggers', description: 'Short-form content about recognizing anxiety patterns', performanceScore: 92, bestDay: 'Tuesday', bestTime: '7:00 PM' },
  { type: 'Behind the Scenes', title: 'A Day in Private Practice', description: 'Authentic content showing your workspace/routine', performanceScore: 87, bestDay: 'Wednesday', bestTime: '12:00 PM' },
  { type: 'Tips', title: '3 Grounding Techniques', description: 'Quick actionable tips for managing stress', performanceScore: 85, bestDay: 'Monday', bestTime: '8:00 AM' },
  { type: 'Personal', title: 'Why I Became a Psychologist', description: 'Story-driven content building connection', performanceScore: 78, bestDay: 'Sunday', bestTime: '10:00 AM' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

// Header component for Business Coach
const BusinessCoachHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'clamp(8px, 2vw, 12px) clamp(12px, 4vw, 24px)',
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lavender}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        paddingTop: 'max(env(safe-area-inset-top, 0px), clamp(8px, 2vw, 12px))',
        minHeight: '48px',
      }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/bloom-home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          color: colors.charcoal,
          fontSize: '14px',
          minHeight: '44px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.lavenderLight}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <BackIcon />
        <span className="back-text">Back to Dashboard</span>
      </button>

      {/* Center: Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: colors.sage,
        }}
      >
        <LeafIcon />
        <span
          style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: 600,
          }}
        >
          Business Coach
        </span>
      </div>

      {/* Right: AI Assistant button */}
      <button
        onClick={() => document.getElementById('ai-assistant')?.scrollIntoView({ behavior: 'smooth' })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          backgroundColor: colors.sage,
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          color: colors.white,
          fontSize: '13px',
          fontWeight: 500,
          minHeight: '44px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.sageDark}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.sage}
      >
        <SparklesIcon />
        <span className="assistant-text">Ask Coach</span>
      </button>

      <style>{`
        @media (max-width: 480px) {
          .back-text, .assistant-text { display: none; }
        }
      `}</style>
    </header>
  );
};

// Revenue Overview Card
const RevenueOverviewCard: React.FC<{
  currentRevenue: number;
  projectedRevenue: number;
  yearlyProjection: number;
  sessionsCompleted: number;
  averageSessionValue: number;
}> = ({ currentRevenue, projectedRevenue, yearlyProjection, sessionsCompleted, averageSessionValue }) => {
  const suggestedNextYearGoal = Math.round(yearlyProjection * 1.1 / 1000) * 1000; // Round to nearest $1000, 10% growth

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: colors.white,
        borderRadius: '16px',
        padding: 'clamp(16px, 4vw, 24px)',
        boxShadow: shadows.card,
        gridColumn: 'span 2',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <TrendUpIcon />
        <h2 style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', fontWeight: 600, color: colors.charcoal, margin: 0 }}>
          Your Financial Journey
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: colors.greenLight, borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: colors.charcoalLight, marginBottom: '4px' }}>This Month</div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, color: colors.sageDark }}>
            ${currentRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: colors.sage }}>{sessionsCompleted} sessions</div>
        </div>

        <div style={{ padding: '16px', backgroundColor: colors.blueLight, borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: colors.charcoalLight, marginBottom: '4px' }}>Projected This Month</div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, color: colors.blue }}>
            ${projectedRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: colors.charcoalLight }}>Based on bookings</div>
        </div>

        <div style={{ padding: '16px', backgroundColor: colors.amberLight, borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: colors.charcoalLight, marginBottom: '4px' }}>Yearly Pace</div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, color: colors.amber }}>
            ${yearlyProjection.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: colors.charcoalLight }}>Annualized</div>
        </div>

        <div style={{ padding: '16px', backgroundColor: colors.lavenderLight, borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: colors.charcoalLight, marginBottom: '4px' }}>Avg Session Value</div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, color: colors.charcoal }}>
            ${Math.round(averageSessionValue)}
          </div>
          <div style={{ fontSize: '11px', color: colors.charcoalLight }}>Per appointment</div>
        </div>
      </div>

      {/* Personal Goal Suggestion */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: colors.cream,
        borderRadius: '12px',
        border: `1px dashed ${colors.sage}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <SparklesIcon />
          <span style={{ fontSize: '14px', fontWeight: 600, color: colors.sageDark }}>
            Suggested Personal Goal for Next Year
          </span>
        </div>
        <p style={{ fontSize: '14px', color: colors.charcoalLight, margin: 0, lineHeight: 1.6 }}>
          Based on your current pace, a comfortable stretch goal would be{' '}
          <strong style={{ color: colors.sageDark }}>${suggestedNextYearGoal.toLocaleString()}</strong> annually.
          This represents ~10% growth and could be achieved by adding{' '}
          <strong>{Math.ceil((suggestedNextYearGoal - yearlyProjection) / (averageSessionValue * 12))}</strong>{' '}
          additional sessions per month.
        </p>
      </div>
    </motion.div>
  );
};

// Client Attribution Card
const ClientAttributionCard: React.FC<{ sources: ClientSource[] }> = ({ sources }) => {
  const totalClients = sources.reduce((sum, s) => sum + s.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        backgroundColor: colors.white,
        borderRadius: '16px',
        padding: 'clamp(16px, 4vw, 24px)',
        boxShadow: shadows.card,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <PieChartIcon />
        <h2 style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', fontWeight: 600, color: colors.charcoal, margin: 0 }}>
          How Clients Find You
        </h2>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: colors.charcoalLight, marginBottom: '8px' }}>
          Total new clients this year: <strong>{totalClients}</strong>
        </div>

        {/* Visual bar chart */}
        <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
          {sources.map((source) => (
            <div
              key={source.source}
              style={{
                width: `${source.percentage}%`,
                backgroundColor: source.color,
                transition: 'width 0.5s ease',
              }}
              title={`${source.source}: ${source.percentage}%`}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {sources.map((source) => (
            <div
              key={source.source}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                backgroundColor: colors.cream,
                borderRadius: '8px',
                fontSize: '12px',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: source.color }} />
              <span style={{ color: colors.charcoal }}>{source.source}</span>
              <span style={{ color: colors.charcoalLight }}>({source.count})</span>
              {source.trend === 'up' && <span style={{ color: colors.green }}>Γåæ</span>}
              {source.trend === 'down' && <span style={{ color: colors.terracotta }}>Γåô</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div style={{
        padding: '12px',
        backgroundColor: colors.greenLight,
        borderRadius: '8px',
        fontSize: '13px',
        color: colors.sageDark,
      }}>
        ≡ƒÆí <strong>Insight:</strong> Google Search and GP referrals drive 65% of your new clients. 
        Consider strengthening these channels.
      </div>
    </motion.div>
  );
};

// Schedule Optimization Card
const ScheduleOptimizationCard: React.FC = () => {
  const suggestions = [
    { action: 'Add Thursday evening slots', impact: '+$1,200/month', reason: 'High demand, 8 waitlist requests' },
    { action: 'Open Saturday mornings', impact: '+$800/month', reason: 'Working professionals prefer weekends' },
    { action: 'Offer telehealth Fridays', impact: '+$600/month', reason: 'Lower no-show rate, travel convenience' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        backgroundColor: colors.white,
        borderRadius: '16px',
        padding: 'clamp(16px, 4vw, 24px)',
        boxShadow: shadows.card,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <CalendarIcon />
        <h2 style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', fontWeight: 600, color: colors.charcoal, margin: 0 }}>
          Schedule Opportunities
        </h2>
      </div>

      <p style={{ fontSize: '13px', color: colors.charcoalLight, marginBottom: '16px' }}>
        Based on your current schedule and client demand patterns:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {suggestions.map((suggestion, i) => (
          <div
            key={i}
            style={{
              padding: '12px 16px',
              backgroundColor: colors.cream,
              borderRadius: '12px',
              borderLeft: `3px solid ${colors.sage}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: colors.charcoal, fontSize: '14px' }}>{suggestion.action}</span>
              <span style={{ color: colors.green, fontWeight: 600, fontSize: '13px' }}>{suggestion.impact}</span>
            </div>
            <div style={{ fontSize: '12px', color: colors.charcoalLight }}>{suggestion.reason}</div>
          </div>
        ))}
      </div>

      <button
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '12px',
          backgroundColor: colors.sage,
          color: colors.white,
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: '44px',
        }}
      >
        <CalendarIcon />
        Review Schedule Settings
      </button>
    </motion.div>
  );
};

// Social Media Card
const SocialMediaCard: React.FC<{ platforms: SocialPlatform[] }> = ({ platforms }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        backgroundColor: colors.white,
        borderRadius: '16px',
        padding: 'clamp(16px, 4vw, 24px)',
        boxShadow: shadows.card,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <ShareIcon />
        <h2 style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', fontWeight: 600, color: colors.charcoal, margin: 0 }}>
          Social Media Presence
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {platforms.map((platform) => (
          <div
            key={platform.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: platform.connected ? colors.greenLight : colors.cream,
              borderRadius: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{platform.icon}</span>
              <div>
                <div style={{ fontWeight: 500, color: colors.charcoal, fontSize: '14px' }}>{platform.name}</div>
                {platform.connected ? (
                  <div style={{ fontSize: '12px', color: colors.charcoalLight }}>
                    {platform.followers?.toLocaleString()} followers ΓÇó {platform.engagement}% engagement
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: platform.recommended ? colors.sage : colors.charcoalLight }}>
                    {platform.recommended ? 'Γ£¿ Recommended for you' : 'Optional'}
                  </div>
                )}
              </div>
            </div>
            <button
              style={{
                padding: '6px 12px',
                backgroundColor: platform.connected ? 'transparent' : colors.sage,
                color: platform.connected ? colors.sage : colors.white,
                border: platform.connected ? `1px solid ${colors.sage}` : 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {platform.connected ? 'View' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      <div style={{
        padding: '12px',
        backgroundColor: colors.blueLight,
        borderRadius: '8px',
        fontSize: '13px',
        color: colors.charcoal,
      }}>
        ≡ƒôà <strong>Posting Schedule:</strong> For best engagement, aim for 2-3 posts per week. 
        Your audience is most active Tuesday-Thursday, 7-9 PM.
      </div>
    </motion.div>
  );
};

// Content Ideas Card
const ContentIdeasCard: React.FC<{ ideas: ContentIdea[] }> = ({ ideas }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        backgroundColor: colors.white,
        borderRadius: '16px',
        padding: 'clamp(16px, 4vw, 24px)',
        boxShadow: shadows.card,
        gridColumn: 'span 2',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <MegaphoneIcon />
        <h2 style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', fontWeight: 600, color: colors.charcoal, margin: 0 }}>
          Content Ideas That Work
        </h2>
      </div>

      <p style={{ fontSize: '13px', color: colors.charcoalLight, marginBottom: '16px' }}>
        Based on what performs well for psychology practices in your area:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
        {ideas.map((idea, i) => (
          <div
            key={i}
            style={{
              padding: '16px',
              backgroundColor: colors.cream,
              borderRadius: '12px',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: idea.performanceScore >= 85 ? colors.green : colors.amber,
              color: colors.white,
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 600,
            }}>
              {idea.performanceScore}% likely to perform
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: colors.sage, 
              fontWeight: 600, 
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>
              {idea.type}
            </div>
            <div style={{ fontWeight: 600, color: colors.charcoal, fontSize: '14px', marginBottom: '4px' }}>
              {idea.title}
            </div>
            <div style={{ fontSize: '12px', color: colors.charcoalLight, marginBottom: '8px' }}>
              {idea.description}
            </div>
            <div style={{ fontSize: '11px', color: colors.sage }}>
              Best: {idea.bestDay} at {idea.bestTime}
            </div>
          </div>
        ))}
      </div>

      <button
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '12px',
          backgroundColor: 'transparent',
          color: colors.sage,
          border: `1px solid ${colors.sage}`,
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: '44px',
        }}
      >
        <SparklesIcon />
        Generate More Ideas
      </button>
    </motion.div>
  );
};

// Referral Network Card
const ReferralNetworkCard: React.FC = () => {
  const specializations = [
    'Anxiety & Depression',
    'PTSD & Trauma',
    'Child & Adolescent',
    'Couples Therapy',
    'ADHD Assessment',
  ];
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(['Anxiety & Depression', 'PTSD & Trauma']);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      style={{
        backgroundColor: colors.white,
        borderRadius: '16px',
        padding: 'clamp(16px, 4vw, 24px)',
        boxShadow: shadows.card,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <UsersIcon />
        <h2 style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', fontWeight: 600, color: colors.charcoal, margin: 0 }}>
          Bloom Referral Network
        </h2>
      </div>

      <p style={{ fontSize: '13px', color: colors.charcoalLight, marginBottom: '16px' }}>
        Let other Bloom practitioners know you're accepting referrals in specific areas:
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {specializations.map((spec) => {
          const isSelected = selectedSpecs.includes(spec);
          return (
            <button
              key={spec}
              onClick={() => {
                if (isSelected) {
                  setSelectedSpecs(selectedSpecs.filter(s => s !== spec));
                } else {
                  setSelectedSpecs([...selectedSpecs, spec]);
                }
              }}
              style={{
                padding: '8px 14px',
                backgroundColor: isSelected ? colors.sage : 'transparent',
                color: isSelected ? colors.white : colors.charcoal,
                border: `1px solid ${isSelected ? colors.sage : colors.lavender}`,
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {spec}
            </button>
          );
        })}
      </div>

      <div style={{
        padding: '12px',
        backgroundColor: colors.lavenderLight,
        borderRadius: '8px',
        fontSize: '13px',
        color: colors.charcoal,
      }}>
        <HeartIcon /> <strong>Network Status:</strong> 12 practitioners in your area have you saved for referrals.
        3 potential referrals pending review.
      </div>

      <button
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '12px',
          backgroundColor: 'transparent',
          color: colors.sage,
          border: `1px solid ${colors.sage}`,
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          minHeight: '44px',
        }}
      >
        Update Bloom Profile
      </button>
    </motion.div>
  );
};

// AI Coach Chat Component
const AICoachChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Bloom Business Coach. I can help you understand your practice data, suggest growth strategies, and answer questions about marketing, scheduling, and revenue. I have read-only access to your data - I'll never make changes without your approval. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = [
    "How can I increase my revenue by 15%?",
    "What's my best client acquisition channel?",
    "When should I post on social media?",
    "Should I raise my session rates?",
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    // Generate IDs outside of state updates to avoid impure function warnings
    const messageId = crypto.randomUUID();
    const responseId = crypto.randomUUID();
    const now = new Date();

    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: input,
      timestamp: now,
    };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: responseId,
        role: 'assistant',
        content: getAIResponse(input),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes('revenue') || q.includes('income') || q.includes('money')) {
      return "Based on your current data, here are 3 ways to increase revenue:\n\n1. **Add evening slots** - You have 8 people on your waitlist requesting after-5pm appointments. This could add ~$1,200/month.\n\n2. **Reduce no-shows** - Your current no-show rate is 8%. Implementing SMS reminders could reduce this to 3-4%, recovering ~$400/month.\n\n3. **Review session pricing** - Your average session value ($225) is slightly below the area average ($245). A modest increase could add ~$600/month.\n\nWould you like me to elaborate on any of these?";
    }
    if (q.includes('client') || q.includes('acquisition') || q.includes('find')) {
      return "Looking at your client attribution data:\n\n≡ƒôè **Top channels:**\n- Google Search (38%) - Your SEO is working well\n- GP Referrals (27%) - Strong medical network\n- Colleague Referrals (15%) - Growing reputation\n\n≡ƒÆí **Recommendation:** Your Google presence drives the most clients. Consider investing in:\n1. Google Business Profile optimization\n2. Patient reviews (you have 12, aim for 25+)\n3. Local SEO content about anxiety treatment in your suburb";
    }
    if (q.includes('social') || q.includes('post') || q.includes('instagram')) {
      return "Based on engagement patterns for psychology practices:\n\n≡ƒôà **Best posting times:**\n- Tuesday-Thursday: 7-9 PM\n- Sunday: 10 AM-12 PM\n\n≡ƒô¥ **Content mix that works:**\n- 40% Educational (tips, myth-busting)\n- 30% Behind-the-scenes (humanizing)\n- 20% Client wins (with permission/anonymized)\n- 10% Personal/relatable\n\n≡ƒÄ» **Frequency:** 2-3 posts/week on Instagram, 1-2 on LinkedIn\n\nYour last post 3 days ago got 4.2% engagement - that's above average! Keep that content style.";
    }
    if (q.includes('rate') || q.includes('price') || q.includes('fee')) {
      return "Let me analyze your pricing:\n\n≡ƒôè **Your current rates:**\n- Standard session: $225\n- Extended session: $295\n\n≡ƒôì **Area comparison:**\n- Average in your suburb: $245 (standard)\n- Your experience level typically commands: $235-260\n\n≡ƒÆí **My suggestion:**\nA $20 increase to $245 would:\n- Still be competitive\n- Add ~$2,400/year (at 10 sessions/month)\n- Better reflect your 8+ years experience\n\nMost practices increase rates annually in January. Should I help you draft a rate change notice for clients?";
    }
    return "That's a great question! Based on your practice data, I can see several relevant insights. Could you tell me a bit more about what specific aspect you'd like to explore? I can help with:\n\nΓÇó Revenue and pricing strategies\nΓÇó Client acquisition channels\nΓÇó Social media planning\nΓÇó Schedule optimization\nΓÇó Referral network growth";
  };

  return (
    <motion.div
      id="ai-assistant"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      style={{
        backgroundColor: colors.white,
        borderRadius: '16px',
        padding: 'clamp(16px, 4vw, 24px)',
        boxShadow: shadows.lifted,
        gridColumn: 'span 2',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <BotIcon />
        <h2 style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', fontWeight: 600, color: colors.charcoal, margin: 0 }}>
          AI Business Coach
        </h2>
        <span style={{
          marginLeft: 'auto',
          fontSize: '11px',
          color: colors.charcoalLight,
          backgroundColor: colors.lavenderLight,
          padding: '4px 8px',
          borderRadius: '10px',
        }}>
          Read-only access
        </span>
      </div>

      {/* Chat messages */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        marginBottom: '16px',
        padding: '8px',
        backgroundColor: colors.cream,
        borderRadius: '12px',
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              backgroundColor: message.role === 'user' ? colors.sage : colors.white,
              color: message.role === 'user' ? colors.white : colors.charcoal,
              borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              fontSize: '14px',
              lineHeight: 1.5,
              whiteSpace: 'pre-line',
              boxShadow: shadows.subtle,
            }}>
              {message.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', gap: '4px', padding: '12px' }}>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1 }}
              style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.sage }}
            />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
              style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.sage }}
            />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
              style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.sage }}
            />
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length < 3 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              style={{
                padding: '8px 12px',
                backgroundColor: colors.lavenderLight,
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '12px',
                color: colors.charcoal,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.lavender}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.lavenderLight}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your practice..."
          style={{
            flex: 1,
            padding: '12px 16px',
            border: `1px solid ${colors.lavender}`,
            borderRadius: '12px',
            fontSize: '14px',
            outline: 'none',
            minHeight: '44px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            padding: '12px 20px',
            backgroundColor: input.trim() ? colors.sage : colors.lavender,
            color: colors.white,
            border: 'none',
            borderRadius: '12px',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 500,
            minHeight: '44px',
            minWidth: '44px',
          }}
        >
          <MessageIcon />
        </button>
      </div>
    </motion.div>
  );
};

// Quick Action Buttons
const QuickActions: React.FC = () => {
  const actions = [
    { label: 'Marketing Hub', icon: <MegaphoneIcon />, href: '/marketing', color: colors.blue },
    { label: 'Analytics', icon: <PieChartIcon />, href: '/analytics', color: colors.sage },
    { label: 'Edit Profile', icon: <UsersIcon />, href: '/profile', color: colors.terracotta },
    { label: 'Schedule', icon: <CalendarIcon />, href: '/schedule', color: colors.amber },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}
    >
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '16px',
            backgroundColor: colors.white,
            borderRadius: '12px',
            textDecoration: 'none',
            boxShadow: shadows.card,
            transition: 'all 0.2s',
            minHeight: '80px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = shadows.lifted;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = shadows.card;
          }}
        >
          <div style={{ color: action.color }}>{action.icon}</div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: colors.charcoal, textAlign: 'center' }}>
            {action.label}
          </span>
        </Link>
      ))}
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const BusinessCoach: React.FC = () => {
  const { dashboard } = useDashboard(
    import.meta.env.VITE_DEV_PRACTITIONER_ID
  );

  // Use real data or fallback to sample
  const monthlyStats = dashboard?.monthlyStats || {
    currentRevenue: 5180,
    projectedRevenue: 7940,
    yearlyProjection: 69067,
    sessionsCompleted: 23,
    averageSessionValue: 225,
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.cream,
    }}>
      <BusinessCoachHeader />

      <main style={{
        padding: 'clamp(16px, 4vw, 32px)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Quick Actions */}
        <QuickActions />

        {/* Dashboard Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(16px, 3vw, 24px)',
        }}>
          {/* Revenue Overview - Full Width */}
          <RevenueOverviewCard
            currentRevenue={monthlyStats.currentRevenue}
            projectedRevenue={monthlyStats.projectedRevenue || monthlyStats.currentRevenue * 1.5}
            yearlyProjection={monthlyStats.yearlyProjection || monthlyStats.currentRevenue * 12}
            sessionsCompleted={monthlyStats.sessionsCompleted || 23}
            averageSessionValue={monthlyStats.averageSessionValue || 225}
          />

          {/* Client Attribution */}
          <ClientAttributionCard sources={sampleClientSources} />

          {/* Schedule Optimization */}
          <ScheduleOptimizationCard />

          {/* Social Media */}
          <SocialMediaCard platforms={sampleSocialPlatforms} />

          {/* Referral Network */}
          <ReferralNetworkCard />

          {/* Content Ideas - Full Width */}
          <ContentIdeasCard ideas={sampleContentIdeas} />

          {/* AI Coach - Full Width */}
          <AICoachChat />
        </div>
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          [style*="grid-column: span 2"] {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BusinessCoach;
