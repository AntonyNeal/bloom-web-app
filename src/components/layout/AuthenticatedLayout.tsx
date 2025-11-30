/**
 * AuthenticatedLayout
 * 
 * Consistent layout wrapper for all authenticated pages in Bloom.
 * Uses the shared BloomHeader for consistent navigation.
 * 
 * Features:
 * - Shared BloomHeader with navigation
 * - Consistent footer for visual grounding
 * - Flexible content container
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BloomHeader } from './BloomHeader';

// Bloom design system colors
const bloomColors = {
  eucalyptusSage: '#6B8E7F',
  warmCream: '#FAF7F2',
};

interface AuthenticatedLayoutProps {
  children: ReactNode;
  /** Page title (displayed in page content, not header) */
  title?: string;
  /** Custom back navigation path (unused - BloomHeader handles nav) */
  backTo?: string;
  /** Show full-width content (no max-width container) */
  fullWidth?: boolean;
  /** Hide back button - unused, kept for backwards compatibility */
  hideBack?: boolean;
}

export function AuthenticatedLayout({
  children,
  title,
  fullWidth = false,
}: AuthenticatedLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: bloomColors.warmCream,
      }}
    >
      {/* Shared Header */}
      <BloomHeader showHomeLink={true} />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: fullWidth ? '0' : '24px',
        }}
      >
        <div
          style={{
            maxWidth: fullWidth ? 'none' : '1400px',
            margin: '0 auto',
          }}
        >
          {/* Page title if provided */}
          {title && (
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#3A3A3A',
                marginBottom: '24px',
                fontFamily: "'Crimson Text', Georgia, serif",
              }}
            >
              {title}
            </h1>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{
          borderTop: '1px solid rgba(107, 142, 127, 0.1)',
          background: 'rgba(254, 253, 251, 0.8)',
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            maxWidth: fullWidth ? 'none' : '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Left - Bloom branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🌸</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: bloomColors.eucalyptusSage,
              }}
            >
              Bloom
            </span>
            <span
              style={{
                fontSize: '12px',
                color: '#888',
              }}
            >
              by Life Psychology Australia
            </span>
          </div>

          {/* Center - Quick links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a
              href="mailto:hello@life-psychology.com.au"
              style={{
                fontSize: '12px',
                color: '#666',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = bloomColors.eucalyptusSage;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#666';
              }}
            >
              Contact Support
            </a>
            <a
              href="https://www.life-psychology.com.au"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                color: '#666',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = bloomColors.eucalyptusSage;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#666';
              }}
            >
              Main Website
            </a>
          </div>

          {/* Right - Copyright */}
          <div
            style={{
              fontSize: '11px',
              color: '#999',
            }}
          >
            © {new Date().getFullYear()} Life Psychology Australia
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

export default AuthenticatedLayout;
