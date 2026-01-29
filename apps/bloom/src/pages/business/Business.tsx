/**
 * Business - Practice Admin & Finances
 * 
 * The practical side of running a practice. Earnings, invoicing,
 * and business health metrics in one calm, organized space.
 * 
 * Features (planned):
 * - Earnings overview and trends
 * - Invoice management
 * - Medicare/private billing summary
 * - Practice health metrics
 */

import { BloomHeader } from '../../components/layout/BloomHeader';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const colors = {
  // Professional warm tones
  warmGold: '#B8860B',
  bronzeLight: '#CD9B4A',
  parchment: '#FBF8F0',
  
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
const BriefcaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const DollarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const PieChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

// ============================================================================
// STAT CARD
// ============================================================================
interface StatCardProps {
  label: string;
  value: string;
  change?: { value: string; positive: boolean };
  icon: React.ReactNode;
}

const StatCard = ({ label, value, change, icon }: StatCardProps) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${colors.lavender}`,
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '12px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: `${colors.warmGold}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.warmGold,
      }}>
        {icon}
      </div>
      {change && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          fontWeight: 500,
          color: change.positive ? '#059669' : '#DC2626',
        }}>
          <TrendingUpIcon />
          {change.value}
        </div>
      )}
    </div>
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
  </div>
);

// ============================================================================
// ACTION CARD
// ============================================================================
interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  comingSoon?: boolean;
}

const ActionCard = ({ icon, title, description, onClick, comingSoon }: ActionCardProps) => (
  <div
    onClick={comingSoon ? undefined : onClick}
    style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.lavender}`,
      cursor: comingSoon ? 'default' : 'pointer',
      transition: 'all 0.2s ease',
      opacity: comingSoon ? 0.7 : 1,
    }}
    onMouseEnter={(e) => {
      if (!comingSoon) {
        e.currentTarget.style.boxShadow = `0 4px 12px ${colors.warmGold}15`;
        e.currentTarget.style.borderColor = colors.sage;
      }
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
      <div style={{
        width: '44px',
        height: '44px',
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
          marginBottom: '4px',
        }}>
          <span style={{
            fontSize: '15px',
            fontWeight: 600,
            color: colors.charcoal,
          }}>
            {title}
          </span>
          {comingSoon && (
            <span style={{
              fontSize: '10px',
              fontWeight: 500,
              color: colors.warmGold,
              backgroundColor: `${colors.warmGold}15`,
              padding: '2px 8px',
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
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function Business() {
  const navigate = useNavigate();

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
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: `${colors.warmGold}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.warmGold,
            }}>
              <BriefcaseIcon />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '24px',
                fontWeight: 600,
                color: colors.charcoal,
                margin: 0,
              }}>
                Business
              </h1>
              <p style={{
                fontSize: '14px',
                color: colors.charcoalLight,
                margin: 0,
              }}>
                Practice finances & admin
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/business-coach')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: colors.sage,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6B7D6B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.sage;
            }}
          >
            Business Coach →
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <StatCard
            icon={<DollarIcon />}
            label="This Month"
            value="$4,840"
            change={{ value: '+12%', positive: true }}
          />
          <StatCard
            icon={<CalendarIcon />}
            label="Sessions"
            value="22"
            change={{ value: '+3', positive: true }}
          />
          <StatCard
            icon={<PieChartIcon />}
            label="Avg. per Session"
            value="$220"
          />
        </div>

        {/* Quick Actions */}
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: colors.charcoalLight,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '16px',
        }}>
          Quick Actions
        </h2>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '32px',
        }}>
          <ActionCard
            icon={<FileTextIcon />}
            title="Invoice History"
            description="View and download past invoices and statements"
            comingSoon
          />
          <ActionCard
            icon={<PieChartIcon />}
            title="Billing Breakdown"
            description="Medicare vs private, service types, and payment methods"
            comingSoon
          />
          <ActionCard
            icon={<DollarIcon />}
            title="Payout Settings"
            description="Bank details and payout schedule preferences"
            comingSoon
          />
        </div>

        {/* Info Box */}
        <div style={{
          backgroundColor: `${colors.warmGold}08`,
          borderRadius: '12px',
          padding: '20px 24px',
          border: `1px solid ${colors.warmGold}20`,
        }}>
          <p style={{
            fontSize: '14px',
            color: colors.charcoal,
            margin: 0,
            lineHeight: 1.6,
          }}>
            💡 <strong>Tip:</strong> Visit the Business Coach for personalized insights 
            about your practice growth and revenue optimization strategies.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Business;
