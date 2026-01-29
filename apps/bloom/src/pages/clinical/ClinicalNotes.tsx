/**
 * Clinical Notes - Deep Work Space
 * 
 * A focused space for clinical documentation. Away from the bustle
 * of the feed, where practitioners can concentrate on their notes.
 * 
 * Features (planned):
 * - Recent session notes requiring completion
 * - AI-assisted note suggestions
 * - Templates and quick entries
 * - Search across all notes
 */

import { BloomHeader } from '../../components/layout/BloomHeader';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const colors = {
  // Clinical purple-grey tones
  inkDark: '#4A4A6A',
  inkLight: '#7A7A9A',
  parchment: '#FAFAF8',
  paperWhite: '#FFFFFF',
  
  // Base (from Bloom)
  cream: '#FAF8F3',
  sage: '#7B8D7B',
  charcoal: '#3A3A3A',
  charcoalLight: '#5A5A5A',
  lavender: '#E8E2F0',
};

// ============================================================================
// ICONS
// ============================================================================
const FileTextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ============================================================================
// PLACEHOLDER NOTE CARD
// ============================================================================
interface NoteCardProps {
  clientInitials: string;
  sessionDate: string;
  status: 'draft' | 'pending' | 'complete';
  preview: string;
}

const NoteCard = ({ clientInitials, sessionDate, status, preview }: NoteCardProps) => {
  const statusColors = {
    draft: { bg: '#FEF3C7', text: '#D97706' },
    pending: { bg: '#DBEAFE', text: '#2563EB' },
    complete: { bg: '#D1FAE5', text: '#059669' },
  };
  
  const statusLabels = {
    draft: 'Draft',
    pending: 'Awaiting Review',
    complete: 'Complete',
  };

  return (
    <div style={{
      backgroundColor: colors.paperWhite,
      borderRadius: '12px',
      padding: '16px 20px',
      border: `1px solid ${colors.lavender}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = `0 4px 12px ${colors.inkLight}15`;
      e.currentTarget.style.borderColor = colors.sage;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = colors.lavender;
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        {/* Client Avatar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: `${colors.sage}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.sage,
          fontSize: '14px',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {clientInitials}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: colors.charcoal,
            }}>
              Session Note
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: statusColors[status].text,
              backgroundColor: statusColors[status].bg,
              padding: '2px 8px',
              borderRadius: '10px',
            }}>
              {statusLabels[status]}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px',
            color: colors.charcoalLight,
            fontSize: '12px',
          }}>
            <ClockIcon />
            {sessionDate}
          </div>
          
          <p style={{
            fontSize: '13px',
            color: colors.charcoalLight,
            margin: 0,
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {preview}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function ClinicalNotes() {
  const navigate = useNavigate();

  // Placeholder data
  const pendingNotes = [
    { clientInitials: 'MK', sessionDate: 'Today, 2:30 PM', status: 'draft' as const, preview: 'AI transcription ready for review. Key themes: anxiety management, workplace stress...' },
    { clientInitials: 'JL', sessionDate: 'Today, 11:00 AM', status: 'pending' as const, preview: 'Progress review session. Discussed coping strategies and homework completion...' },
    { clientInitials: 'AP', sessionDate: 'Yesterday, 4:00 PM', status: 'draft' as const, preview: 'Initial assessment. Presenting concerns include depression symptoms...' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.cream,
    }}>
      <BloomHeader />
      
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '32px 24px 64px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: `${colors.inkDark}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.inkDark,
            }}>
              <FileTextIcon />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '24px',
                fontWeight: 600,
                color: colors.charcoal,
                margin: 0,
              }}>
                Clinical Notes
              </h1>
              <p style={{
                fontSize: '14px',
                color: colors.charcoalLight,
                margin: 0,
              }}>
                Your documentation workspace
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/notes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: colors.sage,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6B7D6B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.sage;
            }}
          >
            <PlusIcon />
            New Note
          </button>
        </div>

        {/* Search Bar */}
        <div style={{
          position: 'relative',
          marginBottom: '24px',
        }}>
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.charcoalLight,
          }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search notes by client, date, or content..."
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              backgroundColor: colors.paperWhite,
              border: `1px solid ${colors.lavender}`,
              borderRadius: '12px',
              fontSize: '14px',
              color: colors.charcoal,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.sage;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.lavender;
            }}
          />
        </div>

        {/* Pending Notes Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: colors.charcoalLight,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px',
          }}>
            Needs Attention ({pendingNotes.filter(n => n.status !== 'complete').length})
          </h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {pendingNotes.map((note, i) => (
              <NoteCard key={i} {...note} />
            ))}
          </div>
        </div>

        {/* View All Link */}
        <button
          onClick={() => navigate('/notes')}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: 'transparent',
            border: `2px dashed ${colors.lavender}`,
            borderRadius: '12px',
            color: colors.charcoalLight,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colors.sage;
            e.currentTarget.style.color = colors.sage;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = colors.lavender;
            e.currentTarget.style.color = colors.charcoalLight;
          }}
        >
          View All Notes →
        </button>
      </main>
    </div>
  );
}

export default ClinicalNotes;
