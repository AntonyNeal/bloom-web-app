/**
 * Pre-Session Brief Panel
 * 
 * AI-generated summary of client context to help clinicians
 * prepare before starting a session. Uses Azure OpenAI to
 * synthesize previous notes into actionable insights.
 * 
 * Follows Bloom/Miyazaki design principles:
 * - Calm, focused UI
 * - Information hierarchy that guides attention
 * - Gentle animations that don't distract
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';

// Bloom color palette
const colors = {
  sage: '#6B8E7F',
  sageLight: '#a8c5bb',
  sageDark: '#5d7a72',
  lavender: '#9B8BC4',
  lavenderLight: '#b8aad4',
  warmWhite: '#FAF7F2',
  cream: '#F5F3EF',
  charcoal: '#3A3A3A',
  charcoalLight: '#636e72',
  white: '#ffffff',
  blush: '#E8C5B5',
  errorRed: '#c0392b',
  warningOrange: '#e67e22',
};

interface PreSessionBriefProps {
  patientInitials: string;
  patientName: string;
  appointmentId: string;
  sessionType?: string;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

interface PrepSummaryData {
  prepSummary: string;
  generatedAt: string;
  sessionsAnalyzed: number;
}

// Icons
const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const ChevronIcon = ({ direction }: { direction: 'up' | 'down' }) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transform: direction === 'up' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
  </svg>
);

export function PreSessionBrief({
  patientInitials,
  patientName: _patientName,
  appointmentId: _appointmentId,
  sessionType,
  onClose: _onClose,
  isExpanded = false,
  onToggleExpand,
}: PreSessionBriefProps) {
  const { getAccessToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prepData, setPrepData] = useState<PrepSummaryData | null>(null);
  const [expanded, setExpanded] = useState(isExpanded);

  const fetchPrepSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      
      // Get Azure user ID for auth header
      const azureUserId = user?.localAccountId || 
        (user?.homeAccountId?.split('.')[0]) || 
        '';

      const response = await fetch(`${API_BASE_URL}/clinical-notes/generate-prep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Azure-User-Id': azureUserId,
        },
        body: JSON.stringify({
          patientInitials,
          upcomingSessionType: sessionType || 'therapy',
          // In production, these would come from database
          // For now, we'll handle gracefully if no previous notes
          previousNotes: [],
          bookingNotes: '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prep summary');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setPrepData(data.data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching prep summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prep summary');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, user, patientInitials, sessionType]);

  // Fetch prep summary on mount
  useEffect(() => {
    fetchPrepSummary();
  }, [fetchPrepSummary]);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggleExpand?.();
  };

  // Parse markdown-like content into sections
  const parseSections = (content: string) => {
    const sections: { title: string; content: string; priority: 'high' | 'normal' }[] = [];
    const lines = content.split('\n');
    let currentSection: { title: string; content: string; priority: 'high' | 'normal' } = { title: '', content: '', priority: 'normal' };

    // Emoji pattern for section icons
    const emojiPattern = /[\u{1F534}\u{1F4CB}\u{1F4C8}\u{1F4DD}\u{1F4CA}\u{1F4AC}\u{1F3AF}\u{1F4CC}]/gu;

    for (const line of lines) {
      // Check for section headers (## or ###)
      const headerMatch = line.match(/^#{2,3}\s+(.+)/);
      if (headerMatch) {
        // Save previous section if it has content
        if (currentSection.title || currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        const isPriority = line.includes('\u{1F534}') || line.toLowerCase().includes('priority');
        currentSection = { 
          title: headerMatch[1].replace(emojiPattern, '').trim(),
          content: '',
          priority: isPriority ? 'high' : 'normal',
        };
      } else {
        currentSection.content += line + '\n';
      }
    }
    
    // Don't forget the last section
    if (currentSection.title || currentSection.content.trim()) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = prepData?.prepSummary ? parseSections(prepData.prepSummary) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={styles.container}
    >
      {/* Header */}
      <div style={styles.header} onClick={handleToggle}>
        <div style={styles.headerLeft}>
          <div style={styles.aiIcon}>
            <SparkleIcon />
          </div>
          <div>
            <h3 style={styles.title}>Pre-Session Brief</h3>
            <p style={styles.subtitle}>AI-generated context for {patientInitials}</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          {loading && <div style={styles.loadingDot} />}
          <ChevronIcon direction={expanded ? 'up' : 'down'} />
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={styles.content}>
              {loading && (
                <div style={styles.loadingState}>
                  <div style={styles.loadingSpinner} />
                  <p style={styles.loadingText}>Preparing your brief...</p>
                  <p style={styles.loadingSubtext}>Analyzing previous sessions</p>
                </div>
              )}

              {error && (
                <div style={styles.errorState}>
                  <AlertIcon />
                  <p style={styles.errorText}>{error}</p>
                  <button onClick={fetchPrepSummary} style={styles.retryButton}>
                    <RefreshIcon />
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && prepData && sections.length > 0 && (
                <div style={styles.sections}>
                  {sections.map((section, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        ...styles.section,
                        ...(section.priority === 'high' ? styles.prioritySection : {}),
                      }}
                    >
                      {section.title && (
                        <h4 style={{
                          ...styles.sectionTitle,
                          ...(section.priority === 'high' ? styles.priorityTitle : {}),
                        }}>
                          {section.priority === 'high' && <AlertIcon />}
                          {section.title}
                        </h4>
                      )}
                      <div 
                        style={styles.sectionContent}
                        dangerouslySetInnerHTML={{ 
                          __html: formatContent(section.content) 
                        }}
                      />
                    </div>
                  ))}
                  
                  <div style={styles.meta}>
                    <span>Generated {formatTimestamp(prepData.generatedAt)}</span>
                    <span>•</span>
                    <span>{prepData.sessionsAnalyzed} sessions analyzed</span>
                  </div>
                </div>
              )}

              {!loading && !error && (!prepData || sections.length === 0) && (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>
                    No previous session data available for this client.
                  </p>
                  <p style={styles.emptySubtext}>
                    Session notes will be used to generate future briefs.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper to format content with basic markdown
function formatContent(content: string): string {
  return content
    // Bold text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive list items
    .replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    // Clean up
    .replace(/<p><\/p>/g, '')
    .trim();
}

// Format timestamp relative to now
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    background: colors.white,
    borderRadius: '12px',
    border: `1px solid ${colors.sageLight}`,
    overflow: 'hidden',
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    cursor: 'pointer',
    background: `linear-gradient(135deg, ${colors.warmWhite} 0%, ${colors.cream} 100%)`,
    borderBottom: `1px solid ${colors.sageLight}`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: colors.charcoalLight,
  },
  aiIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: `linear-gradient(135deg, ${colors.lavender} 0%, ${colors.lavenderLight} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.white,
  },
  title: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: colors.charcoal,
  },
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: colors.charcoalLight,
  },
  loadingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: colors.lavender,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  content: {
    padding: '20px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  loadingState: {
    textAlign: 'center',
    padding: '32px 16px',
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: `3px solid ${colors.sageLight}`,
    borderTopColor: colors.sage,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 500,
    color: colors.charcoal,
  },
  loadingSubtext: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: colors.charcoalLight,
  },
  errorState: {
    textAlign: 'center',
    padding: '24px 16px',
    color: colors.errorRed,
  },
  errorText: {
    margin: '8px 0 16px',
    fontSize: '14px',
  },
  retryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: colors.warmWhite,
    border: `1px solid ${colors.sageLight}`,
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    color: colors.charcoal,
    cursor: 'pointer',
  },
  sections: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  section: {
    padding: '12px 16px',
    background: colors.warmWhite,
    borderRadius: '8px',
    borderLeft: `3px solid ${colors.sage}`,
  },
  prioritySection: {
    background: '#FEF3E7',
    borderLeftColor: colors.warningOrange,
  },
  sectionTitle: {
    margin: '0 0 8px',
    fontSize: '13px',
    fontWeight: 600,
    color: colors.charcoal,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  priorityTitle: {
    color: colors.warningOrange,
  },
  sectionContent: {
    fontSize: '13px',
    lineHeight: 1.6,
    color: colors.charcoal,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: `1px solid ${colors.sageLight}`,
    fontSize: '12px',
    color: colors.charcoalLight,
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 16px',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: colors.charcoal,
  },
  emptySubtext: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: colors.charcoalLight,
  },
};

// Add keyframe animations via style tag
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default PreSessionBrief;
