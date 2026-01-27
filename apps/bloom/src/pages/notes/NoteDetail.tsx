/**
 * Note Detail Page
 * 
 * View a single clinical note with full content.
 * In production, the encrypted content would be decrypted client-side.
 */

import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { BloomHeader } from '../../components/layout/BloomHeader';

// ============================================================================
// Types
// ============================================================================

interface NoteMetadata {
  id: string;
  patientHalaxyId: string;
  patientInitials: string;
  patientName?: string;
  sessionDate: string;
  noteType: string;
  wordCount: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Styles (Bloom Design System)
// ============================================================================

const colors = {
  sage: '#6B8E7F',
  sageLight: '#a8c5bb',
  lavender: '#9B8BC4',
  lavenderLight: '#E8E4F0',
  warmWhite: '#FAF7F2',
  cream: '#F5F3EF',
  charcoal: '#3A3A3A',
  charcoalLight: '#636e72',
  white: '#ffffff',
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.warmWhite} 0%, ${colors.cream} 100%)`,
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: colors.sage,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    marginBottom: '1.5rem',
  },
  card: {
    background: colors.white,
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.5rem',
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: `1px solid ${colors.cream}`,
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.white,
    fontWeight: 600,
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: colors.charcoal,
    margin: 0,
    marginBottom: '0.5rem',
  },
  meta: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  metaItem: {
    fontSize: '0.9rem',
    color: colors.charcoalLight,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  noteContent: {
    marginTop: '1.5rem',
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: colors.charcoalLight,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
  placeholder: {
    background: colors.cream,
    borderRadius: '12px',
    padding: '2rem',
    textAlign: 'center' as const,
    color: colors.charcoalLight,
  },
  placeholderIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem',
    opacity: 0.6,
  },
  placeholderText: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: `1px solid ${colors.cream}`,
  },
  button: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryButton: {
    background: colors.sage,
    color: colors.white,
    border: 'none',
  },
  secondaryButton: {
    background: 'transparent',
    color: colors.sage,
    border: `1px solid ${colors.sageLight}`,
  },
  lockedBanner: {
    background: colors.lavenderLight,
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    color: colors.lavender,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getNoteTypeStyle = (type: string): React.CSSProperties => {
  const typeColors: Record<string, { bg: string; color: string }> = {
    intake: { bg: '#DBEAFE', color: '#1E40AF' },
    progress: { bg: '#D1FAE5', color: '#065F46' },
    discharge: { bg: '#FEE2E2', color: '#991B1B' },
    correspondence: { bg: '#E0E7FF', color: '#3730A3' },
    supervision: { bg: '#FCE7F3', color: '#9D174D' },
    other: { bg: '#F3F4F6', color: '#374151' },
  };
  const colors = typeColors[type] || typeColors.other;
  return { background: colors.bg, color: colors.color };
};

// ============================================================================
// Component
// ============================================================================

export function NoteDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  
  // Get note from navigation state (passed from list page)
  // Or create mock note for direct URL access
  const noteFromState = location.state?.note as NoteMetadata | undefined;
  const [note] = useState<NoteMetadata | null>(() => {
    if (noteFromState) return noteFromState;
    // Mock note for development when accessing directly via URL
    if (id) {
      return {
        id: id,
        patientHalaxyId: '12345',
        patientInitials: 'XX',
        patientName: 'Unknown Client',
        sessionDate: new Date().toISOString().split('T')[0],
        noteType: 'progress',
        wordCount: 0,
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  });

  if (!note) {
    return (
      <div style={styles.container}>
        <BloomHeader />
        <div style={styles.content}>
          <div style={styles.placeholder}>
            <div style={styles.placeholderIcon}>📋</div>
            <p style={styles.placeholderText}>Loading note...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <BloomHeader />
      
      <div style={styles.content}>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/notes')}
          onMouseEnter={(e) => e.currentTarget.style.background = colors.cream}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          ← Back to Notes
        </button>

        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.avatar}>
              {note.patientInitials}
            </div>
            <div style={styles.headerInfo}>
              <h1 style={styles.patientName}>
                {note.patientName || note.patientInitials}
              </h1>
              <div style={styles.meta}>
                <span style={styles.metaItem}>
                  📅 {formatDate(note.sessionDate)}
                </span>
                <span 
                  style={{
                    ...styles.badge,
                    ...getNoteTypeStyle(note.noteType),
                  }}
                >
                  {note.noteType}
                </span>
                <span style={styles.metaItem}>
                  {note.wordCount} words
                </span>
              </div>
            </div>
          </div>

          {/* Locked Banner */}
          {note.isLocked && (
            <div style={styles.lockedBanner}>
              🔒 This note is locked and cannot be edited
            </div>
          )}

          {/* Note Content */}
          <div style={styles.noteContent}>
            <div style={styles.sectionTitle}>Session Notes</div>
            
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>🔐</div>
              <p style={styles.placeholderText}>
                <strong>Encrypted Content</strong>
                <br /><br />
                In production, this note would be decrypted client-side using your encryption key.
                <br /><br />
                <em style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  Development mode: Azure SQL is currently unavailable.
                  <br />
                  Connect to the database to view real note content.
                </em>
              </p>
            </div>
          </div>

          {/* Timestamps */}
          <div style={{ ...styles.meta, marginTop: '1.5rem', fontSize: '0.8rem' }}>
            <span style={styles.metaItem}>
              Created: {formatTime(note.createdAt)}
            </span>
            <span style={styles.metaItem}>
              Updated: {formatTime(note.updatedAt)}
            </span>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            {!note.isLocked && (
              <button 
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={() => alert('Edit functionality coming soon')}
              >
                ✏️ Edit Note
              </button>
            )}
            <button 
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => navigate(`/session?patientId=${note.patientHalaxyId}`)}
            >
              📹 New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteDetail;
