/**
 * Growth - Professional Development
 * 
 * Nurture your professional growth. Track supervision, plan CPD,
 * and cultivate your practice over time.
 * 
 * Features (planned):
 * - Supervision tracking and scheduling
 * - CPD hours and requirements
 * - Professional development resources
 * - Goal setting and reflection
 */

import { BloomHeader } from '../../components/layout/BloomHeader';

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const colors = {
  // Growth greens
  sproutGreen: '#4A7C59',
  leafGreen: '#6B9B7A',
  newGrowth: '#A8D5BA',
  soilBrown: '#8B7355',
  
  // Base (from Bloom)
  cream: '#FAF8F3',
  sage: '#7B8D7B',
  charcoal: '#3A3A3A',
  charcoalLight: '#5A5A5A',
  lavender: '#E8E2F0',
};

// ============================================================================
// ICONS
// ============================================================================
const SproutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20h10" />
    <path d="M12 20v-8" />
    <path d="M12 12c-3 0-6-3-6-6 3 0 6 3 6 6z" />
    <path d="M12 12c3 0 6-3 6-6-3 0-6 3-6 6z" />
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const AwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

// ============================================================================
// PROGRESS CARD COMPONENT
// ============================================================================
interface ProgressCardProps {
  icon: React.ReactNode;
  title: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

const ProgressCard = ({ icon, title, current, target, unit, color }: ProgressCardProps) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.lavender}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: colors.charcoal,
            margin: 0,
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: '12px',
            color: colors.charcoalLight,
            margin: 0,
          }}>
            {current} / {target} {unit}
          </p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div style={{
        height: '8px',
        backgroundColor: `${color}15`,
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: color,
          borderRadius: '4px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
};

// ============================================================================
// ACTIVITY CARD
// ============================================================================
interface ActivityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  date: string;
  comingSoon?: boolean;
}

const ActivityCard = ({ icon, title, description, date, comingSoon }: ActivityCardProps) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px 20px',
    border: `1px solid ${colors.lavender}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      backgroundColor: `${colors.sage}10`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.sage,
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '2px',
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: colors.charcoal,
        }}>
          {title}
        </span>
        {comingSoon && (
          <span style={{
            fontSize: '10px',
            fontWeight: 500,
            color: colors.sage,
            backgroundColor: `${colors.sage}15`,
            padding: '2px 6px',
            borderRadius: '8px',
          }}>
            Coming Soon
          </span>
        )}
      </div>
      <p style={{
        fontSize: '13px',
        color: colors.charcoalLight,
        margin: 0,
      }}>
        {description}
      </p>
    </div>
    <div style={{
      fontSize: '12px',
      color: colors.charcoalLight,
    }}>
      {date}
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function Growth() {
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
          gap: '16px',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: `${colors.sproutGreen}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.sproutGreen,
          }}>
            <SproutIcon />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Crimson Text', Georgia, serif",
              fontSize: '24px',
              fontWeight: 600,
              color: colors.charcoal,
              margin: 0,
            }}>
              Growth
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.charcoalLight,
              margin: 0,
            }}>
              Professional development & supervision
            </p>
          </div>
        </div>

        {/* Progress Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <ProgressCard
            icon={<BookIcon />}
            title="CPD Hours"
            current={18}
            target={30}
            unit="hours this year"
            color={colors.sproutGreen}
          />
          <ProgressCard
            icon={<UsersIcon />}
            title="Supervision"
            current={6}
            target={12}
            unit="sessions this year"
            color={colors.soilBrown}
          />
        </div>

        {/* Section: Upcoming */}
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: colors.charcoalLight,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '16px',
        }}>
          Upcoming
        </h2>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '32px',
        }}>
          <ActivityCard
            icon={<UsersIcon />}
            title="Peer Supervision Group"
            description="Monthly case discussion with Bloom practitioners"
            date="Feb 5"
            comingSoon
          />
          <ActivityCard
            icon={<AwardIcon />}
            title="Trauma-Informed Care Workshop"
            description="Online CPD workshop - 6 hours"
            date="Feb 12"
            comingSoon
          />
        </div>

        {/* Section: Goals */}
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: colors.charcoalLight,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '16px',
        }}>
          Professional Goals
        </h2>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: `1px solid ${colors.lavender}`,
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: `${colors.sage}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.sage,
            margin: '0 auto 16px',
          }}>
            <TargetIcon />
          </div>
          <p style={{
            fontSize: '14px',
            color: colors.charcoalLight,
            margin: 0,
            lineHeight: 1.6,
          }}>
            Goal setting and reflection tools coming soon.<br />
            Track your professional journey and celebrate growth.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Growth;
