/**
 * My Clients - Caseload Overview
 * 
 * A clear view of your active caseload. Track treatment progress,
 * see who's due for review, manage your therapeutic relationships.
 * 
 * Features (planned):
 * - Active caseload overview
 * - Treatment progress tracking
 * - Session frequency insights
 * - Review reminders
 */

import { BloomHeader } from '../../components/layout/BloomHeader';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const colors = {
  // Warm earthy tones for client relationships
  warmBrown: '#8B7355',
  earthTone: '#A68B5B',
  sandLight: '#F5F0E8',
  
  // Base (from Bloom)
  cream: '#FAF8F3',
  sage: '#7B8D7B',
  charcoal: '#3A3A3A',
  charcoalLight: '#5A5A5A',
  lavender: '#E8E2F0',
  terracotta: '#D4A59A',
};

// ============================================================================
// ICONS
// ============================================================================
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

// ============================================================================
// CLIENT CARD COMPONENT
// ============================================================================
interface ClientCardProps {
  initials: string;
  status: 'active' | 'review-due' | 'new';
  totalSessions: number;
  lastSession: string;
  nextSession?: string;
}

const ClientCard = ({ initials, status, totalSessions, lastSession, nextSession }: ClientCardProps) => {
  const navigate = useNavigate();
  
  const statusConfig = {
    'active': { label: 'Active', color: '#059669', bg: '#D1FAE5' },
    'review-due': { label: 'Review Due', color: '#D97706', bg: '#FEF3C7' },
    'new': { label: 'New Client', color: '#2563EB', bg: '#DBEAFE' },
  };

  return (
    <div
      onClick={() => navigate('/client/demo')}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px 20px',
        border: `1px solid ${colors.lavender}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 12px ${colors.warmBrown}15`;
        e.currentTarget.style.borderColor = colors.sage;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = colors.lavender;
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* Avatar */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: `${colors.terracotta}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.terracotta,
          fontSize: '16px',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {initials}
        </div>
        
        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
          }}>
            <span style={{
              fontFamily: "'Crimson Text', Georgia, serif",
              fontSize: '16px',
              fontWeight: 600,
              color: colors.charcoal,
            }}>
              Client {initials}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: statusConfig[status].color,
              backgroundColor: statusConfig[status].bg,
              padding: '2px 8px',
              borderRadius: '10px',
            }}>
              {statusConfig[status].label}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '12px',
            color: colors.charcoalLight,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUpIcon />
              {totalSessions} sessions
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CalendarIcon />
              Last: {lastSession}
            </span>
          </div>
        </div>
        
        {/* Next session */}
        {nextSession && (
          <div style={{
            textAlign: 'right',
            padding: '8px 12px',
            backgroundColor: `${colors.sage}10`,
            borderRadius: '8px',
          }}>
            <div style={{
              fontSize: '11px',
              color: colors.charcoalLight,
              marginBottom: '2px',
            }}>
              Next
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: 500,
              color: colors.sage,
            }}>
              {nextSession}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// STATS CARD
// ============================================================================
interface StatCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
}

const StatCard = ({ label, value, sublabel }: StatCardProps) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px 20px',
    border: `1px solid ${colors.lavender}`,
    textAlign: 'center',
  }}>
    <div style={{
      fontSize: '28px',
      fontWeight: 600,
      color: colors.charcoal,
      marginBottom: '4px',
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '13px',
      color: colors.charcoalLight,
    }}>
      {label}
    </div>
    {sublabel && (
      <div style={{
        fontSize: '11px',
        color: colors.sage,
        marginTop: '4px',
      }}>
        {sublabel}
      </div>
    )}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function MyClients() {
  // Placeholder data
  const clients = [
    { initials: 'MK', status: 'active' as const, totalSessions: 12, lastSession: '2 days ago', nextSession: 'Tomorrow' },
    { initials: 'JL', status: 'review-due' as const, totalSessions: 8, lastSession: 'Today', nextSession: 'Next week' },
    { initials: 'AP', status: 'new' as const, totalSessions: 2, lastSession: 'Yesterday' },
    { initials: 'SR', status: 'active' as const, totalSessions: 24, lastSession: '1 week ago', nextSession: 'Friday' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.cream,
    }}>
      <BloomHeader />
      
      <main style={{
        maxWidth: '900px',
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
            backgroundColor: `${colors.terracotta}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.terracotta,
          }}>
            <UsersIcon />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Crimson Text', Georgia, serif",
              fontSize: '24px',
              fontWeight: 600,
              color: colors.charcoal,
              margin: 0,
            }}>
              My Clients
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.charcoalLight,
              margin: 0,
            }}>
              Your active caseload
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <StatCard label="Active Clients" value={clients.length} />
          <StatCard label="Sessions This Week" value={8} sublabel="+2 from last week" />
          <StatCard label="Reviews Due" value={1} />
        </div>

        {/* Search Bar */}
        <div style={{
          position: 'relative',
          marginBottom: '24px',
        }}>
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.charcoalLight,
          }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search clients..."
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              backgroundColor: 'white',
              border: `1px solid ${colors.lavender}`,
              borderRadius: '12px',
              fontSize: '14px',
              color: colors.charcoal,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.sage;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.lavender;
            }}
          />
        </div>

        {/* Client List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {clients.map((client, i) => (
            <ClientCard key={i} {...client} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default MyClients;
