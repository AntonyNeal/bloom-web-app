/**
 * FloatingLeavesNav - Ghibli-inspired navigation dropdown
 * 
 * Leaves drift down gently like in a Totoro forest scene.
 * Each menu item is a leaf that floats into place with organic motion.
 * Hover causes leaves to lift slightly, as if caught by a breeze.
 * 
 * Design Philosophy:
 * - "Ma" (間) breathing space - unhurried, calming animations
 * - Nature metaphors - wind, leaves, organic growth
 * - Warm cottage garden palette - sage, cream, terracotta
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// ============================================================================
// DESIGN TOKENS - Cottage Garden Palette
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
  // Leaf greens - subtle variations
  leafLight: '#A8B9A8',
  leafMid: '#8FA08F',
  leafDark: '#6B7C6B',
};

// ============================================================================
// LEAF SVG - Organic shape with vein detail
// ============================================================================
const LeafShape = ({ color = colors.sage, size = 20 }: { color?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    style={{ flexShrink: 0 }}
  >
    {/* Leaf body */}
    <path 
      d="M12 2C8 6 4 10 4 14c0 5.5 3.5 8 8 8s8-2.5 8-8c0-4-4-8-8-12z" 
      fill={color}
      opacity={0.15}
    />
    {/* Leaf outline */}
    <path 
      d="M12 2C8 6 4 10 4 14c0 5.5 3.5 8 8 8s8-2.5 8-8c0-4-4-8-8-12z" 
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Central vein */}
    <path 
      d="M12 6v14" 
      stroke={color}
      strokeWidth="1"
      opacity={0.5}
      strokeLinecap="round"
    />
    {/* Side veins */}
    <path 
      d="M12 10l-3 2M12 14l-2.5 1.5M12 10l3 2M12 14l2.5 1.5" 
      stroke={color}
      strokeWidth="0.75"
      opacity={0.3}
      strokeLinecap="round"
    />
  </svg>
);

// ============================================================================
// FLOATING LEAF ITEM - Individual menu item with drift animation
// ============================================================================
interface LeafItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  index: number;
  isActive?: boolean;
  onClick?: () => void;
  accentColor?: string;
}

const LeafItem: React.FC<LeafItemProps> = ({ 
  to, 
  icon, 
  label, 
  description,
  index, 
  isActive,
  onClick,
  accentColor = colors.sage,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Gentle drift animation - like a leaf floating down
  const driftVariants = {
    hidden: { 
      opacity: 0, 
      y: -20, 
      x: (index % 2 === 0 ? -10 : 10), // Alternate left/right drift
      rotate: (index % 2 === 0 ? -5 : 5),
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0,
      rotate: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 15,
        delay: index * 0.08, // Staggered drift
      }
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.95,
      transition: { duration: 0.15 }
    }
  };

  // Hover lift - like a breeze catching the leaf
  const hoverStyle = isHovered && !prefersReducedMotion ? {
    y: -3,
    rotate: (index % 2 === 0 ? 2 : -2),
    boxShadow: `0 8px 24px ${colors.sage}25`,
  } : {};

  return (
    <motion.div
      variants={driftVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={!prefersReducedMotion ? hoverStyle : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative' }}
    >
      <Link
        to={to}
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 18px',
          textDecoration: 'none',
          backgroundColor: isActive ? `${accentColor}12` : isHovered ? `${colors.sage}08` : 'transparent',
          borderRadius: '12px',
          transition: 'background-color 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle leaf watermark in background */}
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: isHovered ? 0.08 : 0.03,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}>
          <LeafShape color={accentColor} size={40} />
        </div>

        {/* Icon */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: isActive ? `${accentColor}20` : `${colors.sage}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive ? accentColor : colors.sage,
          transition: 'all 0.3s ease',
          flexShrink: 0,
        }}>
          {icon}
        </div>

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '15px',
            fontWeight: 600,
            color: isActive ? accentColor : colors.charcoal,
            marginBottom: description ? '2px' : 0,
            transition: 'color 0.3s ease',
          }}>
            {label}
          </div>
          {description && (
            <div style={{
              fontSize: '12px',
              color: colors.charcoalLight,
              opacity: 0.8,
            }}>
              {description}
            </div>
          )}
        </div>

        {/* Active indicator - small leaf */}
        {isActive && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            style={{ color: accentColor }}
          >
            <LeafShape color={accentColor} size={16} />
          </motion.div>
        )}
      </Link>
    </motion.div>
  );
};

// ============================================================================
// SECTION DIVIDER - Vine-like separator
// ============================================================================
const VineDivider = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 18px',
    opacity: 0.4,
  }}>
    <div style={{
      flex: 1,
      height: '1px',
      background: `linear-gradient(90deg, transparent, ${colors.sage}, transparent)`,
    }} />
    <LeafShape color={colors.sage} size={12} />
    <div style={{
      flex: 1,
      height: '1px',
      background: `linear-gradient(90deg, transparent, ${colors.sage}, transparent)`,
    }} />
  </div>
);

// ============================================================================
// ICONS - Navigation icons
// ============================================================================
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const WrenchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const WaterDropIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const SproutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20h10" />
    <path d="M12 20v-8" />
    <path d="M12 12c-3 0-6-3-6-6 3 0 6 3 6 6z" />
    <path d="M12 12c3 0 6-3 6-6-3 0-6 3-6 6z" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ============================================================================
// MENU ICON - Hamburger with leaf aesthetic
// ============================================================================
const MenuIcon = ({ isOpen }: { isOpen: boolean }) => (
  <motion.svg 
    width="22" 
    height="22" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round"
  >
    <motion.line 
      x1="4" y1="6" x2="20" y2="6"
      animate={{ 
        rotate: isOpen ? 45 : 0,
        y: isOpen ? 6 : 0,
        x: isOpen ? 0 : 0,
      }}
      style={{ originX: '12px', originY: '6px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    />
    <motion.line 
      x1="4" y1="12" x2="20" y2="12"
      animate={{ 
        opacity: isOpen ? 0 : 1,
        scaleX: isOpen ? 0 : 1,
      }}
      transition={{ duration: 0.2 }}
    />
    <motion.line 
      x1="4" y1="18" x2="20" y2="18"
      animate={{ 
        rotate: isOpen ? -45 : 0,
        y: isOpen ? -6 : 0,
      }}
      style={{ originX: '12px', originY: '18px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    />
  </motion.svg>
);

// ============================================================================
// FLOATING BACKGROUND LEAVES - Ambient decoration
// ============================================================================
const FloatingBackgroundLeaves = () => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) return null;
  
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: `${20 + i * 30}%`, 
            y: '-10%',
            rotate: 0,
            opacity: 0,
          }}
          animate={{ 
            y: '110%',
            rotate: [0, 15, -10, 20, 0],
            x: [`${20 + i * 30}%`, `${25 + i * 30}%`, `${18 + i * 30}%`, `${22 + i * 30}%`],
            opacity: [0, 0.1, 0.1, 0.1, 0],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 3,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
          }}
        >
          <LeafShape color={colors.sage} size={16 + i * 4} />
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT - FloatingLeavesNav
// ============================================================================
export interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  accentColor?: string;
  section?: 'main' | 'admin' | 'account';
}

interface FloatingLeavesNavProps {
  /** Custom navigation items (optional - uses defaults if not provided) */
  items?: NavItem[];
  /** Callback when menu closes */
  onClose?: () => void;
  /** Whether to show admin section */
  showAdmin?: boolean;
  /** Sign out handler */
  onSignOut?: () => void;
  /** User display name */
  userName?: string;
}

export const FloatingLeavesNav: React.FC<FloatingLeavesNavProps> = ({
  items,
  onClose,
  showAdmin = true,
  onSignOut,
  userName = 'User',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Default navigation items - organized by practitioner workflows
  const defaultItems: NavItem[] = [
    // ─────────────────────────────────────────────────────────────────────────
    // DAILY WORK
    // ─────────────────────────────────────────────────────────────────────────
    { 
      to: '/', 
      icon: <HomeIcon />, 
      label: 'Home', 
      description: 'Your garden feed',
      section: 'main',
    },
    { 
      to: '/session', 
      icon: <VideoIcon />, 
      label: 'Therapy Room', 
      description: 'Start a session',
      accentColor: colors.sage,
      section: 'main',
    },
    { 
      to: '/calendar', 
      icon: <CalendarIcon />, 
      label: 'Calendar', 
      description: 'Full schedule view',
      section: 'main',
    },
  ];

  // Clinical work items
  const clinicalItems: NavItem[] = [
    { 
      to: '/clinical-notes', 
      icon: <FileTextIcon />, 
      label: 'Clinical Notes', 
      description: 'Documentation workspace',
      section: 'main',
    },
    { 
      to: '/my-clients', 
      icon: <UsersIcon />, 
      label: 'My Clients', 
      description: 'Caseload overview',
      section: 'main',
    },
  ];

  // Community & Growth items
  const communityItems: NavItem[] = [
    { 
      to: '/billabong', 
      icon: <WaterDropIcon />, 
      label: 'The Billabong', 
      description: 'Community & peer support',
      accentColor: '#4A8FA8', // Water blue
      section: 'main',
    },
    { 
      to: '/growth', 
      icon: <SproutIcon />, 
      label: 'Growth', 
      description: 'Supervision & CPD',
      accentColor: '#4A7C59', // Sprout green
      section: 'main',
    },
  ];

  // Business items
  const businessItems: NavItem[] = [
    { 
      to: '/business', 
      icon: <BriefcaseIcon />, 
      label: 'Business', 
      description: 'Finances & admin',
      accentColor: colors.terracotta,
      section: 'main',
    },
  ];

  const adminItems: NavItem[] = [
    { 
      to: '/admin/dashboard', 
      icon: <WrenchIcon />, 
      label: 'Admin Tools', 
      description: 'Practice & team management',
      section: 'admin',
    },
  ];

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleItemClick = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleSignOut = () => {
    setIsOpen(false);
    onSignOut?.();
  };

  // Panel animation - gentle unfurl like a fern
  const panelVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: -10,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 25,
        staggerChildren: 0.05,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Menu Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={!prefersReducedMotion ? { scale: 1.05 } : undefined}
        whileTap={!prefersReducedMotion ? { scale: 0.95 } : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          backgroundColor: isOpen ? `${colors.sage}15` : 'transparent',
          border: `1px solid ${isOpen ? colors.sage : colors.lavender}`,
          borderRadius: '12px',
          cursor: 'pointer',
          color: isOpen ? colors.sage : colors.charcoal,
          transition: 'all 0.3s ease',
        }}
        aria-label="Navigation menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MenuIcon isOpen={isOpen} />
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 'min(320px, calc(100vw - 32px))',
              backgroundColor: colors.white,
              borderRadius: '16px',
              boxShadow: `0 10px 40px ${colors.sage}20, 0 2px 10px ${colors.sage}10`,
              border: `1px solid ${colors.lavender}`,
              overflow: 'hidden',
              zIndex: 1000,
            }}
            role="menu"
          >
            {/* Background floating leaves */}
            <FloatingBackgroundLeaves />

            {/* Header with greeting */}
            <div style={{
              padding: '20px 18px 12px',
              borderBottom: `1px solid ${colors.lavenderLight}`,
              position: 'relative',
              zIndex: 1,
            }}>
              <div style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '18px',
                fontWeight: 600,
                color: colors.charcoal,
                marginBottom: '4px',
              }}>
                Welcome back
              </div>
              <div style={{
                fontSize: '13px',
                color: colors.charcoalLight,
              }}>
                {userName}
              </div>
            </div>

            {/* Navigation Items */}
            <div style={{ 
              padding: '8px 8px',
              position: 'relative',
              zIndex: 1,
              maxHeight: '60vh',
              overflowY: 'auto',
            }}>
              {/* Daily Work section */}
              {defaultItems.map((item, index) => (
                <LeafItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  index={index}
                  isActive={location.pathname === item.to}
                  onClick={handleItemClick}
                  accentColor={item.accentColor}
                />
              ))}

              {/* Clinical Work section */}
              <VineDivider />
              {clinicalItems.map((item, index) => (
                <LeafItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  index={defaultItems.length + index}
                  isActive={location.pathname === item.to}
                  onClick={handleItemClick}
                  accentColor={item.accentColor}
                />
              ))}

              {/* Community & Growth section */}
              <VineDivider />
              {communityItems.map((item, index) => (
                <LeafItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  index={defaultItems.length + clinicalItems.length + index}
                  isActive={location.pathname === item.to}
                  onClick={handleItemClick}
                  accentColor={item.accentColor}
                />
              ))}

              {/* Business section */}
              <VineDivider />
              {businessItems.map((item, index) => (
                <LeafItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  index={defaultItems.length + clinicalItems.length + communityItems.length + index}
                  isActive={location.pathname === item.to}
                  onClick={handleItemClick}
                  accentColor={item.accentColor}
                />
              ))}

              {/* Admin section */}
              {showAdmin && (
                <>
                  <VineDivider />
                  {adminItems.map((item, index) => (
                    <LeafItem
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      description={item.description}
                      index={defaultItems.length + clinicalItems.length + communityItems.length + businessItems.length + index}
                      isActive={location.pathname.startsWith(item.to)}
                      onClick={handleItemClick}
                      accentColor={item.accentColor}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Sign out */}
            {onSignOut && (
              <div style={{
                padding: '8px 8px 12px',
                borderTop: `1px solid ${colors.lavenderLight}`,
                position: 'relative',
                zIndex: 1,
              }}>
                <motion.button
                  onClick={handleSignOut}
                  whileHover={!prefersReducedMotion ? { x: 3 } : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 18px',
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${colors.terracotta}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: `${colors.terracotta}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.terracotta,
                  }}>
                    <LogOutIcon />
                  </div>
                  <span style={{
                    fontFamily: "'Crimson Text', Georgia, serif",
                    fontSize: '15px',
                    fontWeight: 500,
                    color: colors.terracotta,
                  }}>
                    Sign out
                  </span>
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingLeavesNav;
