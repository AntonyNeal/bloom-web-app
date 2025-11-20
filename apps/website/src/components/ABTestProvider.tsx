import * as React from 'react';
import { ABTestContext, TestConfig, useABTest } from '../hooks/useABTest';
import { tracker } from '../utils/UnifiedTracker';
import { apiService } from '../services/ApiService';
import { log } from '../utils/logger';
import { STORAGE_KEYS } from '../config/constants';

// Homepage A/B testing configuration
const HOMEPAGE_TEST_CONFIG: TestConfig = {
  name: 'Homepage Header Optimization',
  description: 'Healthcare-optimized vs Minimal header design',
  variants: ['healthcare-optimized', 'minimal'],
  weights: [50, 50], // 50/50 split for fair testing
  hypothesis:
    'Healthcare-optimized version will increase conversions by 15-25%',
};

interface ABTestProviderProps {
  children: React.ReactNode;
}

// Generate consistent user ID for A/B testing
function generateUserId(): string {
  // Check if user already has an ID
  let userId = localStorage.getItem(STORAGE_KEYS.AB_TEST_USER_ID);
  if (userId) {
    return userId;
  }

  // Generate new user ID based on browser fingerprint and timestamp
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const userAgent = navigator.userAgent;
  const screenRes = `${screen.width}x${screen.height}`;

  // Create a fingerprint (simplified)
  const fingerprint = btoa(
    `${userAgent}-${screenRes}-${timestamp}-${random}`
  ).substring(0, 16);

  userId = `user_${fingerprint}`;
  localStorage.setItem(STORAGE_KEYS.AB_TEST_USER_ID, userId);
  return userId;
}

// Allocate user to variant based on weighted distribution
function allocateUserToVariant(userId: string, testConfig: TestConfig): string {
  // Use user ID to create consistent allocation
  const hash = userId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const normalizedHash = Math.abs(hash) % 100;
  const weights = testConfig.weights;

  let cumulativeWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (normalizedHash < cumulativeWeight) {
      return testConfig.variants[i];
    }
  }

  // Fallback to first variant
  return testConfig.variants[0];
}

// Call Azure Function for variant allocation (production)
async function allocateVariantViaAzure(userId: string): Promise<string> {
  try {
    const functionUrl =
      import.meta.env.VITE_AZURE_FUNCTION_URL ||
      'https://lpa-functions.azurewebsites.net';

    const endpoint = `${functionUrl}/api/ab-test/allocate?test=homepage-header-test&userId=${userId}`;
    const result = await apiService.get<{ variant: string }>(endpoint);

    if (!result.success || !result.data) {
      log.error('Azure Function variant allocation failed', 'ABTest', {
        error: result.error,
      });
      throw new Error('Failed to allocate variant');
    }

    const allocatedVariant = result.data.variant;
    log.info('Azure Function allocated variant', 'ABTest', {
      variant: allocatedVariant,
      userId,
    });

    // Track allocation with unified tracker
    tracker.trackCustomEvent('ab_test_allocation', {
      test_name: 'homepage-header-test',
      variant: allocatedVariant,
      user_id: userId,
      allocation_method: 'azure_function',
    });

    return allocatedVariant;
  } catch (error) {
    log.error('Error calling Azure Function', 'ABTest', error);
    // Fallback to local allocation
    return allocateUserToVariant(userId, HOMEPAGE_TEST_CONFIG);
  }
}

export const ABTestProvider = ({ children }: ABTestProviderProps) => {
  const [variant, setVariantState] = React.useState<string | null>(
    'healthcare-optimized'
  ); // Start with fallback
  const isDevMode = import.meta.env.DEV;

  React.useEffect(() => {
    const initializeABTest = async () => {
      try {
        const userId = generateUserId();

        // Check for URL parameter override (works in both dev and staging)
        const urlParams = new URLSearchParams(window.location.search);
        const urlVariant = urlParams.get('variant');

        if (urlVariant && HOMEPAGE_TEST_CONFIG.variants.includes(urlVariant)) {
          setVariantState(urlVariant);
          if (isDevMode) {
            localStorage.setItem('dev-ab-variant', urlVariant);
            log.info('Variant set from URL (dev)', 'ABTest', {
              variant: urlVariant,
            });
          } else {
            log.info('Variant set from URL (staging)', 'ABTest', {
              variant: urlVariant,
            });
          }
          return;
        }

        if (isDevMode) {
          // Development mode: Check localStorage override
          const storedVariant = localStorage.getItem('dev-ab-variant');
          if (
            storedVariant &&
            HOMEPAGE_TEST_CONFIG.variants.includes(storedVariant)
          ) {
            setVariantState(storedVariant);
            log.info('Variant loaded from storage (dev)', 'ABTest', {
              variant: storedVariant,
            });
            return;
          }
        }

        // Check if variant is already stored (for consistency across page loads)
        const storedVariant = localStorage.getItem(STORAGE_KEYS.AB_TEST_VARIANT);
        const storedUserId = localStorage.getItem('ab-test-user-id');

        if (
          storedVariant &&
          storedUserId === userId &&
          HOMEPAGE_TEST_CONFIG.variants.includes(storedVariant)
        ) {
          setVariantState(storedVariant);
          log.info('Using stored variant', 'ABTest', {
            variant: storedVariant,
            userId,
          });
          return;
        }

        // Allocate new variant
        let allocatedVariant: string;

        if (isDevMode || !import.meta.env.VITE_AZURE_FUNCTION_URL) {
          // Local allocation for development or when Azure Function is not configured
          allocatedVariant = allocateUserToVariant(
            userId,
            HOMEPAGE_TEST_CONFIG
          );
          log.info('Allocated variant (local)', 'ABTest', {
            variant: allocatedVariant,
            userId,
          });
        } else {
          // Production: Use Azure Function
          allocatedVariant = await allocateVariantViaAzure(userId);
        }

        // Store the allocation
        localStorage.setItem(STORAGE_KEYS.AB_TEST_VARIANT, allocatedVariant);
        setVariantState(allocatedVariant);

        // Track allocation with unified tracker (with error handling)
        try {
          tracker.trackCustomEvent('ab_test_user_allocated', {
            test_name: 'homepage-header-test',
            variant: allocatedVariant,
            user_id: userId,
            is_dev_mode: isDevMode,
          });
        } catch (trackingError) {
          log.warn('Tracking error (non-critical)', 'ABTest', trackingError);
        }

        log.info('A/B test initialization complete', 'ABTest', {
          variant: allocatedVariant,
          userId,
        });
      } catch (error) {
        log.error('Initialization error, using fallback', 'ABTest', error);
        // Fallback to healthcare-optimized variant
        setVariantState('healthcare-optimized');
      }
    };

    initializeABTest();
  }, [isDevMode]);

  const setVariant = (newVariant: string) => {
    if (HOMEPAGE_TEST_CONFIG.variants.includes(newVariant)) {
      setVariantState(newVariant);
      if (isDevMode) {
        localStorage.setItem('dev-ab-variant', newVariant);
        log.info('Variant changed (dev mode)', 'ABTest', {
          variant: newVariant,
        });
      }
    }
  };

  return (
    <ABTestContext.Provider
      value={{
        variant,
        setVariant,
        testConfig: HOMEPAGE_TEST_CONFIG,
        isDevMode,
      }}
    >
      {children}
    </ABTestContext.Provider>
  );
};

// A/B Test Control Panel Component (visible in dev mode)
export const ABTestControlPanel = () => {
  const { variant, setVariant, testConfig, isDevMode } = useABTest();
  const [isOpen, setIsOpen] = React.useState(false);

  // Show in dev mode, or staging with debug parameter
  const showPanel =
    isDevMode ||
    (window.location.hostname.includes('staging') &&
      window.location.search.includes('debug=true'));

  if (!showPanel || !testConfig) {
    return null;
  }

  const userId = localStorage.getItem('ab-test-user-id');

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 9999,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = '#2563eb';
          (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = '#3b82f6';
          (e.target as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        🧪 A/B Test
      </button>

      {/* Panel (only visible when open) */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '70px',
            right: '20px',
            background: '#1f2937',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 9998,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            minWidth: '300px',
          }}
        >
          <div
            style={{
              marginBottom: '12px',
            }}
          >
            <div>
              <h3
                style={{
                  margin: '0 0 8px 0',
                  color: '#60a5fa',
                  fontSize: '16px',
                }}
              >
                🧪 A/B Test Panel {isDevMode ? '(Dev)' : '(Staging)'}
              </h3>
              <p style={{ margin: '0', color: '#9ca3af', fontSize: '12px' }}>
                {testConfig.description}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
              }}
            >
              Current Variant:
            </label>
            <select
              value={variant || ''}
              onChange={(e) => setVariant(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #374151',
                background: '#374151',
                color: 'white',
                fontSize: '14px',
              }}
            >
              {testConfig.variants.map((v: string) => (
                <option key={v} value={v}>
                  {v === 'healthcare-optimized'
                    ? '🏥 Healthcare-Optimized'
                    : '📱 Minimal'}{' '}
                  ({v})
                </option>
              ))}
            </select>
          </div>

          {userId && (
            <div
              style={{
                marginBottom: '12px',
                fontSize: '11px',
                color: '#6b7280',
              }}
            >
              <strong>User ID:</strong> {userId}
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            <p style={{ margin: '0 0 4px 0' }}>
              <strong>Hypothesis:</strong>
            </p>
            <p style={{ margin: '0', fontStyle: 'italic' }}>
              {testConfig.hypothesis}
            </p>
          </div>

          <div
            style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #374151',
            }}
          >
            <p style={{ margin: '0', fontSize: '11px', color: '#6b7280' }}>
              💡 Override: <code>?variant=minimal</code> or{' '}
              <code>?variant=healthcare-optimized</code>
            </p>
            {!isDevMode && (
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '11px',
                  color: '#ef4444',
                }}
              >
                ⚠️ Production A/B test active
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
