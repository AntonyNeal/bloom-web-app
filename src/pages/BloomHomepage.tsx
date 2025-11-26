import React, { useState } from 'react';
import { BlossomTreeSophisticated } from '@/components/bloom-tree/BlossomTreeSophisticated';

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
};

const shadows = {
  subtle: '0 1px 3px rgba(122, 141, 122, 0.08)',
  lifted: '0 4px 12px rgba(122, 141, 122, 0.12)',
  card: '0 2px 8px rgba(122, 141, 122, 0.06)',
};

// ============================================================================
// TYPES - The taxonomy of our garden
// ============================================================================
interface Session {
  id: string;
  time: string;
  sessionNumber: number;
  clientInitials: string;
  presentingIssues: string[];
  mhcpRemaining: number;
  mhcpTotal: number;
  relationshipMonths: number;
}

interface WeeklyStats {
  currentSessions: number;
  maxSessions: number;
  currentRevenue: number;
  targetRevenue: number;
}

interface UpcomingStats {
  tomorrowSessions: number;
  remainingThisWeek: number;
  mhcpEndingSoon: number;
}

interface MonthlyStats {
  currentRevenue: number;
  targetRevenue: number;
  monthName: string;
}

interface User {
  name: string;
  id: string;
}

interface BloomHomepageProps {
  user?: User;
  todaysSessions?: Session[];
  weeklyStats?: WeeklyStats;
  upcomingStats?: UpcomingStats;
  monthlyStats?: MonthlyStats;
}

// ============================================================================
// SAMPLE DATA - Seeds for demonstration
// ============================================================================
const sampleUser: User = {
  name: 'Dr. Sarah Chen',
  id: 'user-1',
};

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
  currentSessions: 18,
  maxSessions: 25,
  currentRevenue: 3960,
  targetRevenue: 5500,
};

const sampleUpcomingStats: UpcomingStats = {
  tomorrowSessions: 4,
  remainingThisWeek: 7,
  mhcpEndingSoon: 3,
};

const sampleMonthlyStats: MonthlyStats = {
  currentRevenue: 12450,
  targetRevenue: 22000,
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

const WrenchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
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
// BLOSSOM TREE - The heart of the garden, grows with monthly revenue
// ============================================================================
interface BlossomTreeProps {
  monthlyStats: MonthlyStats;
}

const BlossomTree: React.FC<BlossomTreeProps> = ({ monthlyStats }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const growthPercentage = Math.min((monthlyStats.currentRevenue / monthlyStats.targetRevenue) * 100, 100);
  
  // Tree growth stages based on percentage
  // 0-20%: bare branches, 20-40%: buds, 40-60%: small blossoms, 60-80%: blooming, 80-100%: full bloom
  const getGrowthStage = (pct: number) => {
    if (pct < 20) return 'dormant';
    if (pct < 40) return 'budding';
    if (pct < 60) return 'blooming';
    if (pct < 80) return 'flourishing';
    return 'fullBloom';
  };
  
  const stage = getGrowthStage(growthPercentage);
  
  // Number of blossoms based on growth
  const blossomCount = Math.floor(growthPercentage / 5); // 0-20 blossoms
  
  // Generate blossom positions - spreading from center outward as tree grows
  const generateBlossoms = (count: number) => {
    const blossoms = [];
    const random = (seed: number) => {
      const x = Math.sin(seed * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    
    for (let i = 0; i < count; i++) {
      // Spread blossoms in the canopy area
      const angle = random(i * 7) * Math.PI * 2;
      const distance = 20 + random(i * 13) * 55 * (growthPercentage / 100);
      const x = 100 + Math.cos(angle) * distance;
      const y = 55 + Math.sin(angle) * distance * 0.6; // Flatten vertically for canopy shape
      
      // Size varies - some buds, some full blossoms
      const size = 4 + random(i * 17) * 8 * (growthPercentage / 100);
      const opacity = 0.6 + random(i * 23) * 0.4;
      const delay = random(i * 31) * 2;
      
      blossoms.push({ x, y, size, opacity, delay, id: i });
    }
    return blossoms;
  };
  
  const blossoms = generateBlossoms(blossomCount);
  
  // Petal colors at different stages
  const petalColors = {
    dormant: colors.lavenderLight,
    budding: '#F5E6E0',
    blooming: '#FADADD',
    flourishing: '#FFB7C5',
    fullBloom: '#FF9EAF',
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${colors.lavender}`,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: isHovered ? shadows.lifted : shadows.card,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        marginBottom: '24px',
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3
          style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '18px',
            fontWeight: 500,
            color: colors.charcoal,
            margin: 0,
          }}
        >
          {monthlyStats.monthName}'s Garden
        </h3>
        <span
          style={{
            fontSize: '12px',
            color: colors.charcoalLight,
            backgroundColor: colors.lavenderLight,
            padding: '4px 10px',
            borderRadius: '12px',
          }}
        >
          {stage === 'dormant' && '🌱 Dormant'}
          {stage === 'budding' && '🌿 Budding'}
          {stage === 'blooming' && '🌸 Blooming'}
          {stage === 'flourishing' && '🌺 Flourishing'}
          {stage === 'fullBloom' && '🌳 Full Bloom'}
        </span>
      </div>

      {/* Tree Visualization */}
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '180px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        overflow: 'hidden',
      }}>
        <svg
          width="200"
          height="170"
          viewBox="0 0 200 170"
          style={{
            overflow: 'visible',
          }}
        >
          {/* Ground */}
          <ellipse
            cx="100"
            cy="165"
            rx="70"
            ry="8"
            fill={colors.lavenderLight}
          />
          
          {/* Tree trunk - grows taller with revenue */}
          <path
            d={`
              M95 165
              Q92 ${145 - growthPercentage * 0.3} 90 ${120 - growthPercentage * 0.4}
              Q88 ${100 - growthPercentage * 0.3} 100 ${85 - growthPercentage * 0.2}
              Q112 ${100 - growthPercentage * 0.3} 110 ${120 - growthPercentage * 0.4}
              Q108 ${145 - growthPercentage * 0.3} 105 165
              Z
            `}
            fill={colors.sageDark}
            style={{
              transition: 'all 0.5s ease',
            }}
          />
          
          {/* Branches - appear as tree grows */}
          {growthPercentage > 20 && (
            <>
              {/* Left branch */}
              <path
                d={`M92 ${105 - growthPercentage * 0.2} Q70 ${90 - growthPercentage * 0.15} ${55 - growthPercentage * 0.1} ${75 - growthPercentage * 0.2}`}
                stroke={colors.sageDark}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                style={{
                  opacity: Math.min((growthPercentage - 20) / 20, 1),
                  transition: 'all 0.5s ease',
                }}
              />
              {/* Right branch */}
              <path
                d={`M108 ${105 - growthPercentage * 0.2} Q130 ${90 - growthPercentage * 0.15} ${145 + growthPercentage * 0.1} ${75 - growthPercentage * 0.2}`}
                stroke={colors.sageDark}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                style={{
                  opacity: Math.min((growthPercentage - 20) / 20, 1),
                  transition: 'all 0.5s ease',
                }}
              />
            </>
          )}
          
          {/* Canopy shadow/depth */}
          {growthPercentage > 30 && (
            <ellipse
              cx="100"
              cy={70 - growthPercentage * 0.15}
              rx={40 + growthPercentage * 0.4}
              ry={25 + growthPercentage * 0.2}
              fill={colors.sageLight}
              opacity={0.3}
              style={{
                transition: 'all 0.5s ease',
              }}
            />
          )}
          
          {/* Blossoms */}
          {blossoms.map((blossom) => (
            <g key={blossom.id}>
              {/* Blossom petals */}
              <circle
                cx={blossom.x}
                cy={blossom.y}
                r={blossom.size}
                fill={petalColors[stage]}
                opacity={blossom.opacity}
                style={{
                  animation: `blossomFloat ${3 + blossom.delay}s ease-in-out infinite`,
                  animationDelay: `${blossom.delay}s`,
                  transition: 'all 0.5s ease',
                }}
              />
              {/* Center of blossom */}
              {blossom.size > 6 && (
                <circle
                  cx={blossom.x}
                  cy={blossom.y}
                  r={blossom.size * 0.3}
                  fill={colors.terracotta}
                  opacity={blossom.opacity * 0.8}
                />
              )}
            </g>
          ))}
          
          {/* Falling petals animation for full bloom */}
          {stage === 'fullBloom' && (
            <>
              {[0, 1, 2].map((i) => (
                <circle
                  key={`falling-${i}`}
                  cx={80 + i * 20}
                  cy="140"
                  r="3"
                  fill={petalColors.fullBloom}
                  opacity={0.6}
                  style={{
                    animation: `petalFall ${4 + i}s ease-in-out infinite`,
                    animationDelay: `${i * 1.5}s`,
                  }}
                />
              ))}
            </>
          )}
        </svg>
      </div>

      {/* Revenue counter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: `1px solid ${colors.lavenderLight}`,
      }}>
        <div>
          <div style={{ 
            fontSize: '12px', 
            color: colors.charcoalLight,
            marginBottom: '4px',
          }}>
            Monthly Take Home
          </div>
          <div style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '28px',
            fontWeight: 600,
            color: colors.charcoal,
            letterSpacing: '-1px',
          }}>
            ${monthlyStats.currentRevenue.toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            fontSize: '12px', 
            color: colors.charcoalLight,
            marginBottom: '4px',
          }}>
            Target
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 500,
            color: colors.sage,
          }}>
            ${monthlyStats.targetRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: '12px' }}>
        <div
          style={{
            height: '8px',
            backgroundColor: colors.lavenderLight,
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${growthPercentage}%`,
              background: `linear-gradient(90deg, ${colors.sage}, ${petalColors[stage]})`,
              borderRadius: '4px',
              transition: 'width 0.8s ease, background 0.5s ease',
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          fontSize: '11px',
          color: colors.charcoalLight,
        }}>
          <span>{Math.round(growthPercentage)}% of target</span>
          <span>${(monthlyStats.targetRevenue - monthlyStats.currentRevenue).toLocaleString()} to go</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COTTAGE HEADER - A brass nameplate, not a billboard
// ============================================================================
const CottageHeader: React.FC<{ user: User }> = ({ user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lavender}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: Branding */}
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
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '-0.5px',
          }}
        >
          Bloom
        </span>
      </div>

      {/* Center: Date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: colors.charcoalLight,
          fontSize: '14px',
        }}
      >
        <CalendarIcon />
        <span>Today: {formattedDate}</span>
      </div>

      {/* Right: Admin & User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a
          href="/admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: colors.charcoalLight,
            textDecoration: 'none',
            fontSize: '13px',
            padding: '6px 10px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.lavenderLight;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <WrenchIcon />
          <span>Admin Tools</span>
        </a>

        {/* User Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.lavender}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: colors.charcoal,
              transition: 'all 0.2s ease',
            }}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span>{user.name}</span>
            <ChevronDownIcon />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.lavender}`,
                borderRadius: '8px',
                boxShadow: shadows.lifted,
                minWidth: '160px',
                overflow: 'hidden',
                animation: 'dropdownFade 0.15s ease-out',
              }}
              role="menu"
            >
              <a
                href="/profile"
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  color: colors.charcoal,
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lavenderLight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                role="menuitem"
              >
                My Profile
              </a>
              <a
                href="/signout"
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  color: colors.charcoal,
                  textDecoration: 'none',
                  fontSize: '14px',
                  borderTop: `1px solid ${colors.lavender}`,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lavenderLight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                role="menuitem"
              >
                Sign Out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// SESSION CARD - Like a botanical specimen label
// ============================================================================
const SessionCard: React.FC<{ session: Session }> = ({ session }) => {
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${colors.lavender}`,
        borderRadius: '8px',
        padding: '16px 20px',
        boxShadow: isHovered ? shadows.lifted : shadows.card,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      {/* Top row: Time and session number */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ClockIcon />
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: colors.charcoal,
            }}
          >
            {session.time}
          </span>
        </div>
        <span
          style={{
            fontSize: '12px',
            color: colors.charcoalLight,
            backgroundColor: colors.lavenderLight,
            padding: '3px 8px',
            borderRadius: '4px',
          }}
        >
          Session {session.sessionNumber}
        </span>
      </div>

      {/* Client initials - the focal point */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: isNewClient ? colors.terracottaLight : colors.lavenderLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '18px',
            fontWeight: 600,
            color: isNewClient ? colors.sageDark : colors.sage,
          }}
        >
          {session.clientInitials}
        </div>
        <div>
          <div
            style={{
              fontSize: '13px',
              color: colors.charcoalLight,
              marginBottom: '2px',
            }}
          >
            {formatRelationship(session.relationshipMonths)}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {session.presentingIssues.map((issue, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  color: colors.sage,
                  backgroundColor: `${colors.sage}15`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {issue}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* MHCP Progress */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <span style={{ fontSize: '12px', color: colors.charcoalLight }}>
            MHCP Sessions
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: isMhcpLow ? colors.terracotta : colors.sage,
            }}
          >
            {session.mhcpRemaining} of {session.mhcpTotal} remaining
          </span>
        </div>
        <div
          style={{
            height: '4px',
            backgroundColor: colors.lavenderLight,
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${mhcpPercentage}%`,
              background: isMhcpLow
                ? `linear-gradient(90deg, ${colors.terracotta}, ${colors.terracottaLight})`
                : `linear-gradient(90deg, ${colors.sage}, ${colors.sageLight})`,
              borderRadius: '2px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
    </article>
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
// TODAY'S SESSIONS - The main garden bed
// ============================================================================
const TodaysSessions: React.FC<{ sessions: Session[] }> = ({ sessions }) => (
  <section style={{ flex: 1 }}>
    <h2
      style={{
        fontFamily: "'Crimson Text', Georgia, serif",
        fontSize: '22px',
        fontWeight: 500,
        color: colors.charcoal,
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      Today's Sessions
      {sessions.length > 0 && (
        <span
          style={{
            fontSize: '14px',
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontWeight: 400,
            color: colors.charcoalLight,
            backgroundColor: colors.lavenderLight,
            padding: '2px 10px',
            borderRadius: '12px',
          }}
        >
          {sessions.length}
        </span>
      )}
    </h2>

    {sessions.length === 0 ? (
      <EmptyState />
    ) : (
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        }}
      >
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    )}
  </section>
);

// ============================================================================
// STAT CARD - Individual metric widgets
// ============================================================================
interface StatCardProps {
  title: string;
  children: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${colors.lavender}`,
        borderRadius: '8px',
        padding: '16px 20px',
        boxShadow: isHovered ? shadows.lifted : shadows.card,
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
      }}
    >
      <h3
        style={{
          fontFamily: "'Crimson Text', Georgia, serif",
          fontSize: '16px',
          fontWeight: 500,
          color: colors.charcoal,
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: `1px solid ${colors.lavenderLight}`,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
};

// ============================================================================
// QUICK STATS - The sidebar metrics
// ============================================================================
interface QuickStatsProps {
  weeklyStats: WeeklyStats;
  upcomingStats: UpcomingStats;
}

const QuickStats: React.FC<QuickStatsProps> = ({ weeklyStats, upcomingStats }) => {
  const sessionPercentage = (weeklyStats.currentSessions / weeklyStats.maxSessions) * 100;
  const revenuePercentage = (weeklyStats.currentRevenue / weeklyStats.targetRevenue) * 100;

  return (
    <aside
      style={{
        width: '280px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* This Week Card */}
      <StatCard title="This Week">
        {/* Sessions Progress */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '13px', color: colors.charcoalLight }}>
              Sessions
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: colors.charcoal }}>
              {weeklyStats.currentSessions} / {weeklyStats.maxSessions}
            </span>
          </div>
          <div
            style={{
              height: '6px',
              backgroundColor: colors.lavenderLight,
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${sessionPercentage}%`,
                background: `linear-gradient(90deg, ${colors.sage}, ${colors.sageLight})`,
                borderRadius: '3px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Revenue Progress */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '13px', color: colors.charcoalLight }}>
              Revenue
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: colors.charcoal }}>
              ${weeklyStats.currentRevenue.toLocaleString()} / ${weeklyStats.targetRevenue.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              height: '6px',
              backgroundColor: colors.lavenderLight,
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(revenuePercentage, 100)}%`,
                background: `linear-gradient(90deg, ${colors.terracotta}, ${colors.terracottaLight})`,
                borderRadius: '3px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </StatCard>

      {/* Upcoming Card */}
      <StatCard title="Upcoming">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px', color: colors.charcoalLight }}>
              Tomorrow
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: colors.charcoal,
              }}
            >
              {upcomingStats.tomorrowSessions} sessions
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px', color: colors.charcoalLight }}>
              Rest of week
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: colors.charcoal,
              }}
            >
              {upcomingStats.remainingThisWeek} sessions
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '8px',
              borderTop: `1px solid ${colors.lavenderLight}`,
            }}
          >
            <span style={{ fontSize: '13px', color: colors.charcoalLight }}>
              MHCP ending soon
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: upcomingStats.mhcpEndingSoon > 0 ? colors.terracotta : colors.charcoal,
                backgroundColor: upcomingStats.mhcpEndingSoon > 0 ? `${colors.terracotta}15` : 'transparent',
                padding: upcomingStats.mhcpEndingSoon > 0 ? '2px 8px' : '0',
                borderRadius: '4px',
              }}
            >
              {upcomingStats.mhcpEndingSoon} clients
            </span>
          </div>
        </div>
      </StatCard>
    </aside>
  );
};

// ============================================================================
// BLOOM HOMEPAGE - The complete garden view
// ============================================================================
const BloomHomepage: React.FC<BloomHomepageProps> = ({
  user = sampleUser,
  todaysSessions = sampleSessions,
  weeklyStats = sampleWeeklyStats,
  upcomingStats = sampleUpcomingStats,
  monthlyStats = sampleMonthlyStats,
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.cream,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
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

          /* Responsive adjustments */
          @media (max-width: 900px) {
            .bloom-main-layout {
              flex-direction: column !important;
            }
            .bloom-sidebar {
              width: 100% !important;
              flex-direction: row !important;
              flex-wrap: wrap !important;
            }
            .bloom-sidebar > div {
              flex: 1 1 280px !important;
            }
          }

          @media (max-width: 600px) {
            .bloom-header-center {
              display: none !important;
            }
          }
        `}
      </style>

      <CottageHeader user={user} />

      <main
        className="bloom-main-layout"
        style={{
          display: 'flex',
          gap: '24px',
          padding: '24px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Left column: Tree + Sessions */}
        <div style={{ flex: 1 }}>
          <BlossomTreeSophisticated monthlyStats={monthlyStats} />
          <TodaysSessions sessions={todaysSessions} />
        </div>
        
        {/* Right sidebar */}
        <QuickStats
          weeklyStats={weeklyStats}
          upcomingStats={upcomingStats}
        />
      </main>
    </div>
  );
};

export default BloomHomepage;
