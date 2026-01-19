/**
 * BloomHeader - Shared header component for authenticated pages
 * 
 * Mobile-first responsive header designed for iOS/Android compatibility
 * Used across BloomHomepage, AdminDashboard, and all authenticated pages
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// ============================================================================
// DESIGN TOKENS
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
  lifted: '0 4px 12px rgba(122, 141, 122, 0.12)',
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

const HomeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

interface BloomHeaderProps {
  /** Show admin tools link (default: true) */
  showAdminTools?: boolean;
  /** Show home link (for pages not on bloom-home) */
  showHomeLink?: boolean;
}

export function BloomHeader({ showAdminTools = true, showHomeLink = false }: BloomHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
  const shortName = displayName.replace('Dr. ', '').split(' ')[0];

  const handleSignOut = async () => {
    setDropdownOpen(false);
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

      {/* Right: Actions */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'clamp(8px, 2vw, 16px)',
        flexShrink: 0,
      }}>
        {/* Home link - shown when not on bloom-home */}
        {showHomeLink && (
          <Link
            to="/bloom-home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: colors.charcoalLight,
              textDecoration: 'none',
              fontSize: 'clamp(11px, 2.5vw, 13px)',
              padding: 'clamp(6px, 1.5vw, 8px) clamp(6px, 1.5vw, 10px)',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              minWidth: '44px',
              minHeight: '44px',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.lavenderLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Home"
          >
            <HomeIcon />
            <span className="bloom-home-text" style={{ display: 'none' }}>Home</span>
          </Link>
        )}

        {/* Admin Tools link */}
        {showAdminTools && (
          <Link
            to="/admin/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: colors.charcoalLight,
              textDecoration: 'none',
              fontSize: 'clamp(11px, 2.5vw, 13px)',
              padding: 'clamp(6px, 1.5vw, 8px) clamp(6px, 1.5vw, 10px)',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              minWidth: '44px',
              minHeight: '44px',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.lavenderLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Admin Tools"
          >
            <WrenchIcon />
            <span className="bloom-admin-text" style={{ display: 'none' }}>Admin Tools</span>
          </Link>
        )}

        {/* User Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(4px, 1vw, 6px)',
              padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.lavender}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2.8vw, 14px)',
              color: colors.charcoal,
              transition: 'all 0.2s ease',
              minHeight: '44px',
              minWidth: '44px',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className="bloom-user-name-mobile" style={{ display: 'none' }}>{shortName}</span>
            <span className="bloom-user-name-desktop">{displayName}</span>
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
                maxWidth: 'calc(100vw - 24px)',
              }}
              role="menu"
            >
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  padding: '12px 16px',
                  color: colors.charcoal,
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'background-color 0.15s ease',
                  minHeight: '44px',
                  alignItems: 'center',
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
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex',
                  width: '100%',
                  padding: '12px 16px',
                  color: colors.charcoal,
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  borderTop: `1px solid ${colors.lavender}`,
                  transition: 'background-color 0.15s ease',
                  minHeight: '44px',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
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
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
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

        /* Extra small screens (< 360px) - hide date entirely */
        @media (max-width: 359px) {
          .bloom-header-date {
            display: none !important;
          }
        }
        
        /* Small screens (360px - 480px) - abbreviated content */
        @media (min-width: 360px) and (max-width: 480px) {
          .bloom-date-desktop { display: none !important; }
          .bloom-date-mobile { display: inline !important; }
          .bloom-admin-text { display: none !important; }
          .bloom-home-text { display: none !important; }
          .bloom-user-name-desktop { display: none !important; }
          .bloom-user-name-mobile { display: inline !important; }
        }
        
        /* Medium screens (481px - 768px) - show more content */
        @media (min-width: 481px) and (max-width: 768px) {
          .bloom-date-desktop { display: inline !important; }
          .bloom-date-mobile { display: none !important; }
          .bloom-admin-text { display: none !important; }
          .bloom-home-text { display: none !important; }
          .bloom-user-name-desktop { display: inline !important; }
          .bloom-user-name-mobile { display: none !important; }
        }
        
        /* Large screens (769px+) - full content */
        @media (min-width: 769px) {
          .bloom-date-desktop { display: inline !important; }
          .bloom-date-mobile { display: none !important; }
          .bloom-admin-text { display: inline !important; }
          .bloom-home-text { display: inline !important; }
          .bloom-user-name-desktop { display: inline !important; }
          .bloom-user-name-mobile { display: none !important; }
        }
        
        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
          .bloom-header-date {
            padding: 8px;
          }
        }
        
        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
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
