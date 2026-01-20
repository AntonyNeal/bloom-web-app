/**
 * BloomHeader - Shared header component for authenticated pages
 * 
 * Mobile-first responsive header designed for iOS/Android compatibility
 * Used across BloomHomepage, AdminDashboard, and all authenticated pages
 * 
 * Features Ghibli-inspired FloatingLeavesNav for page navigation
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FloatingLeavesNav } from '@/components/navigation/FloatingLeavesNav';

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const colors = {
  sage: '#7B8D7B',
  charcoalLight: '#5A5A5A',
  lavender: '#E8E2F0',
  white: '#FFFFFF',
};

// ============================================================================
// ICONS
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

interface BloomHeaderProps {
  /** Show admin tools link (default: true) */
  showAdminTools?: boolean;
  /** Show home link (for pages not on bloom-home) */
  showHomeLink?: boolean;
}

export function BloomHeader({ showAdminTools = true, showHomeLink = false }: BloomHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  
  // Short format for mobile, full format for desktop
  const mobileDate = today.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });
  
  const desktopDate = today.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  // Get display name - handle different user object shapes
  const displayName = user?.name || user?.username || 'User';

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

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
        paddingLeft: 'max(env(safe-area-inset-left, 0px), clamp(12px, 4vw, 24px))',
        paddingRight: 'max(env(safe-area-inset-right, 0px), clamp(12px, 4vw, 24px))',
        minHeight: '48px',
      }}
    >
      {/* Left: Branding - links to home */}
      <Link
        to="/bloom-home"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1.5vw, 8px)',
          color: colors.sage,
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{ 
          width: 'clamp(20px, 5vw, 24px)', 
          height: 'clamp(20px, 5vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <LeafIcon />
        </div>
        <span
          style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: 600,
            letterSpacing: '-0.5px',
          }}
        >
          Bloom
        </span>
      </Link>

      {/* Center: Date */}
      <div
        className="bloom-header-date"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 8px)',
          color: colors.charcoalLight,
          fontSize: 'clamp(11px, 2.5vw, 14px)',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <div style={{ 
          width: 'clamp(12px, 3vw, 16px)', 
          height: 'clamp(12px, 3vw, 16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <CalendarIcon />
        </div>
        <span className="bloom-date-mobile" style={{ display: 'none' }}>{mobileDate}</span>
        <span className="bloom-date-desktop">Today: {desktopDate}</span>
      </div>

      {/* Right: FloatingLeavesNav - Ghibli-inspired dropdown */}
      <FloatingLeavesNav
        showAdmin={showAdminTools}
        onSignOut={handleSignOut}
        userName={displayName}
      />

      {/* Responsive CSS */}
      <style>{`
        /* Extra small screens (< 360px) - hide date entirely */
        @media (max-width: 359px) {
          .bloom-header-date {
            display: none !important;
          }
        }
        
        /* Small screens (360px - 480px) - abbreviated date */
        @media (min-width: 360px) and (max-width: 480px) {
          .bloom-date-desktop { display: none !important; }
          .bloom-date-mobile { display: inline !important; }
        }
        
        /* Medium+ screens - full date */
        @media (min-width: 481px) {
          .bloom-date-desktop { display: inline !important; }
          .bloom-date-mobile { display: none !important; }
        }
        
        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
          .bloom-header-date {
            padding: 8px;
          }
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
          header {
            border-bottom-width: 2px;
          }
        }
        
        /* Landscape orientation on mobile */
        @media (max-height: 500px) and (orientation: landscape) {
          header {
            padding-top: 6px !important;
            padding-bottom: 6px !important;
            min-height: 40px !important;
          }
        }
      `}</style>
    </header>
  );
}

export default BloomHeader;