import { useState } from 'react';
import { FileText, ArrowLeft, LogOut, BarChart3, FlaskConical, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

// ============================================================================
// DESIGN TOKENS - Matching the cottage garden aesthetic
// ============================================================================
const colors = {
  cream: '#FAF8F3',
  warmCream: '#FAF7F2',
  sage: '#7B8D7B',
  sageLight: '#9BAA9B',
  sageDark: '#5A6B5A',
  terracotta: '#D4A59A',
  terracottaLight: '#E8C4BB',
  charcoal: '#3A3A3A',
  charcoalLight: '#5A5A5A',
  lavender: '#E8E2F0',
  lavenderLight: '#F3F0F7',
  lavenderDark: '#B8A9D1',
  blush: '#F5E6E0',
  blushDark: '#D4A28F',
  white: '#FFFFFF',
};

const shadows = {
  subtle: '0 1px 3px rgba(122, 141, 122, 0.08)',
  lifted: '0 4px 12px rgba(122, 141, 122, 0.12)',
  card: '0 2px 8px rgba(122, 141, 122, 0.06)',
  glow: '0 8px 24px rgba(122, 141, 122, 0.15)',
};

// ============================================================================
// DECORATIVE ICONS - Botanical touches
// ============================================================================
const LeafIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const FlowerIcon = ({ color = colors.terracotta }: { color?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    {/* Petals */}
    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
      <ellipse
        key={i}
        cx="16"
        cy="8"
        rx="4"
        ry="7"
        fill={color}
        opacity={0.7 + (i % 2) * 0.2}
        transform={`rotate(${angle} 16 16)`}
      />
    ))}
    {/* Center */}
    <circle cx="16" cy="16" r="5" fill={colors.sage} />
    <circle cx="16" cy="16" r="3" fill={colors.sageLight} />
  </svg>
);

const SparkleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0l1.5 4.5L14 6l-4.5 1.5L8 12l-1.5-4.5L2 6l4.5-1.5L8 0z" />
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function AdminDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Quick action cards configuration
  const quickActions = [
    {
      id: 'applications',
      title: 'Application Management',
      description: 'Review and process practitioner applications with care',
      icon: FileText,
      href: '/admin/applications',
      gradient: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageDark} 100%)`,
      accentColor: colors.sage,
      lightColor: colors.sageLight,
    },
    {
      id: 'ab-tests',
      title: 'A/B Testing Dashboard',
      description: 'Monitor and analyze active experiments',
      icon: BarChart3,
      href: '/admin/ab-tests',
      gradient: `linear-gradient(135deg, ${colors.lavenderDark} 0%, #9B8BC7 100%)`,
      accentColor: colors.lavenderDark,
      lightColor: colors.lavender,
    },
    {
      id: 'smoke-tests',
      title: 'Smoke Tests',
      description: 'Test APIs, databases, and system integrity',
      icon: FlaskConical,
      href: '/admin/smoke-tests',
      gradient: `linear-gradient(135deg, ${colors.blushDark} 0%, ${colors.terracotta} 100%)`,
      accentColor: colors.terracotta,
      lightColor: colors.blush,
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30, scale: prefersReducedMotion ? 1 : 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden admin-dashboard"
      style={{ backgroundColor: colors.cream }}
    >
      {/* ============================================================
          AMBIENT BACKGROUND - Soft botanical atmosphere
          ============================================================ */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {/* Large gradient orbs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1.5 }}
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '800px',
            height: '800px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.sageLight}40 0%, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-15%',
            width: '900px',
            height: '900px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.lavender}50 0%, transparent 70%)`,
            filter: 'blur(80px)',
          }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1.5, delay: 0.6 }}
          style={{
            position: 'absolute',
            top: '40%',
            left: '60%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.blush}40 0%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />

        {/* Decorative botanical elements */}
        <motion.div
          initial={{ opacity: 0, rotate: -15 }}
          animate={{ opacity: 0.15, rotate: 0 }}
          transition={{ duration: 2, delay: 0.5 }}
          style={{ position: 'absolute', top: '10%', right: '5%' }}
        >
          <LeafIcon style={{ width: 120, height: 120, color: colors.sage }} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.12 }}
          transition={{ duration: 2, delay: 0.8 }}
          style={{ position: 'absolute', bottom: '15%', left: '3%', transform: 'rotate(45deg)' }}
        >
          <FlowerIcon color={colors.terracottaLight} />
        </motion.div>
      </div>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <motion.div
        className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        style={{ zIndex: 1 }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Back Navigation */}
        <motion.button
          variants={itemVariants}
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-2 mb-8 px-0 py-2 text-base font-medium transition-all duration-200"
          style={{
            color: colors.sage,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </motion.button>

        {/* ============================================================
            HEADER CARD - Welcoming the admin
            ============================================================ */}
        <motion.div
          variants={itemVariants}
          style={{
            backgroundColor: colors.white,
            borderRadius: '20px',
            padding: '32px 36px',
            marginBottom: '32px',
            boxShadow: shadows.card,
            border: `1px solid ${colors.lavenderLight}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative corner accent */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: `linear-gradient(135deg, ${colors.lavenderLight}30 0%, transparent 60%)`,
              borderRadius: '0 20px 0 100%',
            }}
          />

          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-5">
              {/* Avatar/Icon with botanical flair */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageDark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 16px ${colors.sage}40`,
                  position: 'relative',
                }}
              >
                <LeafIcon style={{ width: 32, height: 32, color: colors.white }} />
                {/* Sparkle accent */}
                <motion.div
                  animate={
                    prefersReducedMotion
                      ? {}
                      : {
                          scale: [1, 1.2, 1],
                          opacity: [0.8, 1, 0.8],
                        }
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    color: colors.terracotta,
                  }}
                >
                  <SparkleIcon />
                </motion.div>
              </div>

              <div>
                <h1
                  style={{
                    fontFamily: "'Crimson Text', Georgia, serif",
                    fontSize: '32px',
                    fontWeight: 600,
                    color: colors.charcoal,
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Admin Dashboard
                </h1>
                <p
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: '15px',
                    color: colors.charcoalLight,
                    margin: '4px 0 0 0',
                  }}
                >
                  Welcome back, {user?.name || user?.username || 'Administrator'}
                </p>
              </div>
            </div>

            {/* Sign Out Button */}
            <motion.button
              onClick={logout}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
              style={{
                color: colors.charcoalLight,
                backgroundColor: colors.lavenderLight,
                border: `1px solid ${colors.lavender}`,
                cursor: 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
              whileHover={{
                backgroundColor: colors.lavender,
                scale: 1.02,
              }}
              whileTap={{ scale: 0.98 }}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ============================================================
            QUICK ACTIONS SECTION
            ============================================================ */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-6">
            <h2
              style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '22px',
                fontWeight: 500,
                color: colors.charcoal,
                margin: 0,
              }}
            >
              Quick Actions
            </h2>
            <div
              style={{
                flex: 1,
                height: '1px',
                background: `linear-gradient(90deg, ${colors.lavender} 0%, transparent 100%)`,
                marginLeft: '8px',
              }}
            />
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const isHovered = hoveredCard === action.id;

              return (
                <motion.div
                  key={action.id}
                  variants={cardVariants}
                  custom={index}
                  onClick={() => navigate(action.href)}
                  onMouseEnter={() => setHoveredCard(action.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: '16px',
                    padding: '28px',
                    cursor: 'pointer',
                    boxShadow: isHovered ? shadows.glow : shadows.card,
                    border: `1px solid ${isHovered ? action.lightColor : colors.lavenderLight}`,
                    transform: isHovered && !prefersReducedMotion ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Hover gradient overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(135deg, ${action.lightColor}20 0%, transparent 50%)`,
                      opacity: isHovered ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                      borderRadius: '16px',
                    }}
                  />

                  {/* Content */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Icon */}
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: action.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        boxShadow: `0 4px 12px ${action.accentColor}30`,
                        transform: isHovered && !prefersReducedMotion ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      <Icon style={{ width: 28, height: 28, color: colors.white }} />
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontFamily: "'Crimson Text', Georgia, serif",
                        fontSize: '20px',
                        fontWeight: 600,
                        color: colors.charcoal,
                        margin: '0 0 8px 0',
                      }}
                    >
                      {action.title}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: '14px',
                        lineHeight: 1.6,
                        color: colors.charcoalLight,
                        margin: '0 0 16px 0',
                      }}
                    >
                      {action.description}
                    </p>

                    {/* Action link */}
                    <div
                      className="flex items-center gap-1"
                      style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: '14px',
                        fontWeight: 500,
                        color: action.accentColor,
                        transition: 'gap 0.2s ease',
                        gap: isHovered ? '8px' : '4px',
                      }}
                    >
                      <span>Open</span>
                      <ChevronRight
                        style={{
                          width: 16,
                          height: 16,
                          transform: isHovered && !prefersReducedMotion ? 'translateX(2px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ============================================================
            FOOTER ACCENT
            ============================================================ */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mt-12"
          style={{ opacity: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '40px',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${colors.lavender})`,
              }}
            />
            <FlowerIcon color={colors.lavenderDark} />
            <div
              style={{
                width: '40px',
                height: '1px',
                background: `linear-gradient(90deg, ${colors.lavender}, transparent)`,
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
