/**
 * Miyazaki-Inspired Floating Navigation
 * 
 * A dreamy, organic navigation dropdown that floats like petals drifting.
 * Matches the aesthetic of the FloatingCalendar component.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  description: string;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Your Feed',
    path: '/admin/dashboard',
    icon: '🏡',
    description: 'Today\'s sessions & updates',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/calendar',
    icon: '📅',
    description: 'Week view & scheduling',
  },
  {
    id: 'business-coach',
    label: 'Business Coach',
    path: '/business-coach',
    icon: '🌳',
    description: 'Revenue & practice growth',
    comingSoon: true,
  },
  {
    id: 'therapy-room',
    label: 'Therapy Room',
    path: '/session/next',
    icon: '🪴',
    description: 'Your next session awaits',
    comingSoon: true,
  },
  {
    id: 'pd-market',
    label: 'PD Market',
    path: '/pd-market',
    icon: '📚',
    description: 'Professional development',
    comingSoon: true,
  },
  {
    id: 'resources',
    label: 'Resources',
    path: '/resources',
    icon: '🧰',
    description: 'Templates & tools',
    comingSoon: true,
  },
  {
    id: 'community',
    label: 'Community',
    path: '/community',
    icon: '🌻',
    description: 'Connect with colleagues',
    comingSoon: true,
  },
];

export function FloatingNav() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current page label
  const currentPage = navItems.find(item => 
    location.pathname === item.path || 
    (item.path !== '/' && location.pathname.startsWith(item.path))
  ) || navItems[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNavigation = (item: NavItem) => {
    if (item.comingSoon) {
      // Show a gentle message for coming soon items
      return;
    }
    navigate(item.path);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Trigger Button */}
      <button onClick={() => setIsOpen(!isOpen)} style={styles.trigger}>
        <span style={styles.triggerIcon}>{currentPage.icon}</span>
        <span style={styles.triggerText}>{currentPage.label}</span>
        <span style={styles.triggerChevron}>{isOpen ? '▴' : '▾'}</span>
      </button>

      {/* Floating Navigation Panel */}
      {isOpen && (
        <div style={styles.floatingPanel}>
          {/* Decorative Elements */}
          <div style={styles.petalTopLeft}>🌸</div>
          <div style={styles.petalTopRight}>✿</div>

          {/* Navigation Items */}
          <div style={styles.navList}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                style={{
                  ...styles.navItem,
                  ...(currentPage.id === item.id ? styles.navItemActive : {}),
                  ...(item.comingSoon ? styles.navItemDisabled : {}),
                }}
                disabled={item.comingSoon}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <div style={styles.navContent}>
                  <span style={styles.navLabel}>
                    {item.label}
                    {item.comingSoon && (
                      <span style={styles.comingSoonBadge}>Soon</span>
                    )}
                  </span>
                  <span style={styles.navDescription}>{item.description}</span>
                </div>
                {currentPage.id === item.id && (
                  <span style={styles.activeIndicator}>●</span>
                )}
              </button>
            ))}
          </div>

          {/* Decorative vine at bottom */}
          <div style={styles.vineDecoration}>
            <svg width="100%" height="16" viewBox="0 0 280 16" style={{ opacity: 0.12 }}>
              <path 
                d="M0,8 Q35,2 70,8 T140,8 T210,8 T280,8" 
                fill="none" 
                stroke="#6B8E7F" 
                strokeWidth="2"
              />
              <circle cx="40" cy="6" r="2.5" fill="#6B8E7F" />
              <circle cx="100" cy="10" r="2" fill="#6B8E7F" />
              <circle cx="160" cy="6" r="2.5" fill="#6B8E7F" />
              <circle cx="220" cy="9" r="2" fill="#6B8E7F" />
            </svg>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes floatNavIn {
          0% {
            opacity: 0;
            transform: translateY(-15px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,250,245,0.98) 100%)',
    border: '1px solid rgba(107, 142, 127, 0.15)',
    borderRadius: '24px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
    color: '#4A5568',
    boxShadow: '0 2px 12px rgba(107, 142, 127, 0.08)',
    transition: 'all 0.3s ease',
    minWidth: '140px',
  },
  triggerIcon: {
    fontSize: '16px',
  },
  triggerText: {
    color: '#2D3748',
    fontWeight: 600,
    flex: 1,
    textAlign: 'left',
  },
  triggerChevron: {
    fontSize: '10px',
    color: '#A0AEC0',
  },
  floatingPanel: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: '0',
    width: '280px',
    background: 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(255,252,248,0.98) 50%, rgba(255,250,245,0.98) 100%)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '12px',
    boxShadow: `
      0 4px 6px rgba(107, 142, 127, 0.07),
      0 10px 20px rgba(107, 142, 127, 0.1),
      0 20px 40px rgba(107, 142, 127, 0.08),
      inset 0 1px 0 rgba(255,255,255,0.9)
    `,
    border: '1px solid rgba(107, 142, 127, 0.12)',
    overflow: 'hidden',
    animation: 'floatNavIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
  },
  petalTopLeft: {
    position: 'absolute',
    top: '6px',
    left: '10px',
    fontSize: '12px',
    opacity: 0.35,
  },
  petalTopRight: {
    position: 'absolute',
    top: '8px',
    right: '12px',
    fontSize: '10px',
    opacity: 0.25,
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingTop: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    background: 'transparent',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  navItemActive: {
    background: 'rgba(107, 142, 127, 0.1)',
  },
  navItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  navIcon: {
    fontSize: '20px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2D3748',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navDescription: {
    fontSize: '11px',
    color: '#718096',
    fontWeight: 400,
  },
  comingSoonBadge: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#6B8E7F',
    background: 'rgba(107, 142, 127, 0.15)',
    padding: '2px 6px',
    borderRadius: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  activeIndicator: {
    fontSize: '8px',
    color: '#6B8E7F',
  },
  vineDecoration: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(107, 142, 127, 0.08)',
  },
};

export default FloatingNav;
