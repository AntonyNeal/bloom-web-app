/**
 * The Billabong - Community Space
 * 
 * A still pool where practitioners gather to share, reflect, and connect.
 * Named for the Australian billabong - where water gathers, where creatures
 * come to drink and rest, connected to the greater river.
 * 
 * Features (planned):
 * - Anonymized case consultation discussions
 * - Peer supervision coordination
 * - Shared professional wisdom
 * - Community announcements
 * - Practitioner connection
 */

import React from 'react';
import { BloomHeader } from '../../components/layout/BloomHeader';

// ============================================================================
// DESIGN TOKENS - Water-inspired palette
// ============================================================================
const colors = {
  // Water tones
  deepPool: '#2C5F6E',
  stillWater: '#4A8FA8',
  reflectionLight: '#8BC4D4',
  surfaceMist: '#D6EEF4',
  
  // Base (from Bloom)
  cream: '#FAF8F3',
  sage: '#7B8D7B',
  charcoal: '#3A3A3A',
  charcoalLight: '#5A5A5A',
};

// ============================================================================
// ICONS
// ============================================================================
const WaterDropIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
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

const MessageCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const BookOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
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
// PLACEHOLDER CARD COMPONENT
// ============================================================================
interface PlaceholderCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  comingSoon?: boolean;
}

const PlaceholderCard = ({ icon, title, description, comingSoon = true }: PlaceholderCardProps) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${colors.surfaceMist}`,
    boxShadow: `0 2px 8px ${colors.stillWater}10`,
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: `${colors.stillWater}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.stillWater,
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
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: colors.charcoal,
            margin: 0,
          }}>
            {title}
          </h3>
          {comingSoon && (
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: colors.stillWater,
              backgroundColor: `${colors.stillWater}15`,
              padding: '2px 8px',
              borderRadius: '10px',
            }}>
              Coming Soon
            </span>
          )}
        </div>
        <p style={{
          fontSize: '14px',
          color: colors.charcoalLight,
          margin: 0,
          lineHeight: 1.5,
        }}>
          {description}
        </p>
      </div>
    </div>
  </div>
);

// ============================================================================
// RIPPLE ANIMATION - Decorative water ripple
// ============================================================================
const WaterRipple = () => (
  <div style={{
    position: 'absolute',
    bottom: '10%',
    right: '10%',
    opacity: 0.1,
    pointerEvents: 'none',
  }}>
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="30" stroke={colors.stillWater} strokeWidth="1" />
      <circle cx="100" cy="100" r="50" stroke={colors.stillWater} strokeWidth="0.75" />
      <circle cx="100" cy="100" r="70" stroke={colors.stillWater} strokeWidth="0.5" />
      <circle cx="100" cy="100" r="90" stroke={colors.stillWater} strokeWidth="0.25" />
    </svg>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function Billabong() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.cream,
      position: 'relative',
    }}>
      <BloomHeader />
      
      {/* Decorative ripple */}
      <WaterRipple />
      
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '32px 24px 64px',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: `${colors.stillWater}15`,
            color: colors.deepPool,
            marginBottom: '16px',
          }}>
            <WaterDropIcon />
          </div>
          
          <h1 style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '32px',
            fontWeight: 600,
            color: colors.charcoal,
            marginBottom: '8px',
          }}>
            The Billabong
          </h1>
          
          <p style={{
            fontSize: '16px',
            color: colors.charcoalLight,
            maxWidth: '500px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            A gathering place for practitioners. Share wisdom, seek peer support, 
            and connect with your professional community.
          </p>
        </div>

        {/* Feature Cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <PlaceholderCard
            icon={<MessageCircleIcon />}
            title="Case Consultation"
            description="Share anonymized case dilemmas and receive thoughtful peer perspectives. A safe space for clinical reflection."
          />
          
          <PlaceholderCard
            icon={<UsersIcon />}
            title="Peer Supervision"
            description="Find supervision partners, coordinate group supervision, and build your professional support network."
          />
          
          <PlaceholderCard
            icon={<BookOpenIcon />}
            title="Shared Wisdom"
            description="Resources, templates, and clinical insights shared by the Bloom community. Learn from collective experience."
          />
          
          <PlaceholderCard
            icon={<CalendarIcon />}
            title="Community Events"
            description="Professional development workshops, peer meetups, and community gatherings. Grow together."
          />
        </div>

        {/* Quote */}
        <div style={{
          marginTop: '48px',
          padding: '24px 32px',
          backgroundColor: `${colors.stillWater}08`,
          borderRadius: '16px',
          borderLeft: `4px solid ${colors.stillWater}`,
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '18px',
            fontStyle: 'italic',
            color: colors.charcoal,
            margin: 0,
            lineHeight: 1.6,
          }}>
            "In the stillness of the billabong, the river's wisdom gathers."
          </p>
        </div>
      </main>
    </div>
  );
}

export default Billabong;
