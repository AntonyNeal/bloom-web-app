/**
 * Bloom Button - Triggers Azure AD login
 * Used on the landing page to access the practitioner portal
 */

import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tier2Flower } from '@/components/flowers/Tier2Flower';

interface BloomButtonProps {
  isMobile: boolean;
}

export const BloomButton = ({ isMobile }: BloomButtonProps) => {
  const { login, isLoading } = useAuth();

  const handleClick = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-label="Sign in to practitioner portal"
      className="secondary-button"
      style={{
        minWidth: isMobile ? '100%' : '220px',
        height: '64px',
        background: 'transparent',
        color: '#9B72AA',
        fontSize: '17px',
        fontWeight: 600,
        borderRadius: '12px',
        border: '2px solid rgba(155, 114, 170, 0.3)',
        cursor: isLoading ? 'wait' : 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '16px',
        paddingRight: '16px',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 12px rgba(155, 114, 170, 0.12)',
        opacity: isLoading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.borderColor = 'rgba(155, 114, 170, 0.5)';
          e.currentTarget.style.background = 'rgba(155, 114, 170, 0.05)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(155, 114, 170, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          e.currentTarget.style.borderColor = 'rgba(155, 114, 170, 0.3)';
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(155, 114, 170, 0.12)';
        }
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '3px solid #9B72AA';
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      {/* Purple Rose Flower - Positioned at left edge */}
      <div
        style={{
          position: 'absolute',
          left: '4px',
          top: '50%',
          transform: 'translateY(-50%) scale(0.585)',
          width: '48px',
          height: '48px',
          pointerEvents: 'none',
        }}
      >
        <Suspense fallback={<div style={{ width: '48px', height: '48px' }} />}>
          <Tier2Flower isChecked={true} isMobile={false} shouldReduceMotion={true} />
        </Suspense>
      </div>
      <span style={{ position: 'relative', letterSpacing: '0.02em', marginLeft: '48px' }}>
        {isLoading ? 'Signing in...' : 'Bloom'}
      </span>
    </button>
  );
};
