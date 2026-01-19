/**
 * Notes Review Component
 * 
 * After a session ends, displays the AI-generated clinical notes draft
 * for the clinician to review, edit, and finalize.
 * 
 * Features:
 * - Auto-loads draft notes from API
 * - Editable text area
 * - Save as final or discard
 * - Session summary header
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config/api';

interface NotesReviewProps {
  appointmentId: string;
  patientName: string;
  sessionDate: string;
  onComplete: () => void;
}

interface DraftNote {
  id: string;
  content: string;
  generatedAt: string;
  sessionDurationMinutes?: number;
}

type ReviewPhase = 'loading' | 'reviewing' | 'saving' | 'error' | 'no-notes';

export function NotesReview({
  appointmentId,
  patientName,
  sessionDate,
  onComplete,
}: NotesReviewProps) {
  const { getAccessToken } = useAuth();
  
  const [phase, setPhase] = useState<ReviewPhase>('loading');
  const [draft, setDraft] = useState<DraftNote | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Load draft notes from API
   */
  useEffect(() => {
    loadDraftNotes();
  }, [appointmentId]);

  const loadDraftNotes = async () => {
    try {
      const token = await getAccessToken();
      
      // First trigger note generation if not already done
      const generateRes = await fetch(`${API_BASE_URL}/session/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId }),
      });

      if (!generateRes.ok) {
        console.warn('Note generation may have already been triggered');
      }

      // Wait a moment for processing, then fetch the draft
      await new Promise(resolve => setTimeout(resolve, 2000));

      const draftRes = await fetch(`${API_BASE_URL}/clinical-notes/drafts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!draftRes.ok) {
        throw new Error('Failed to load draft notes');
      }

      const draftData = await draftRes.json();
      
      // Find the draft for this appointment
      const appointmentDraft = draftData.data?.drafts?.find(
        (d: { appointmentId: string }) => d.appointmentId === appointmentId
      );

      if (appointmentDraft) {
        setDraft({
          id: appointmentDraft.id,
          content: appointmentDraft.content,
          generatedAt: appointmentDraft.createdAt,
          sessionDurationMinutes: appointmentDraft.sessionDurationMinutes,
        });
        setEditedContent(appointmentDraft.content);
        setPhase('reviewing');
      } else {
        // No draft yet - might still be generating
        // Try again after a delay
        setTimeout(loadDraftNotes, 5000);
      }
    } catch (err) {
      console.error('Error loading draft notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notes');
      setPhase('error');
    }
  };

  /**
   * Save notes as final
   */
  const handleSave = async () => {
    if (!draft) return;
    
    setPhase('saving');
    try {
      const token = await getAccessToken();
      
      const res = await fetch(`${API_BASE_URL}/clinical-notes/${draft.id}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save notes');
      }

      onComplete();
    } catch (err) {
      console.error('Error saving notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save notes');
      setPhase('reviewing');
    }
  };

  /**
   * Discard draft and complete without saving
   */
  const handleDiscard = async () => {
    if (!draft) {
      onComplete();
      return;
    }

    try {
      const token = await getAccessToken();
      
      await fetch(`${API_BASE_URL}/clinical-notes/${draft.id}/draft`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      onComplete();
    } catch (err) {
      console.error('Error discarding draft:', err);
      // Still complete even if discard fails
      onComplete();
    }
  };

  /**
   * Skip notes for now (save as draft for later)
   */
  const handleSkip = () => {
    onComplete();
  };

  if (phase === 'loading') {
    return (
      <div style={styles.container}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <h2 style={styles.loadingTitle}>Generating Session Notes</h2>
          <p style={styles.loadingText}>
            Our AI is reviewing the session transcription and creating a draft...
          </p>
          <p style={styles.loadingSubtext}>This usually takes 30-60 seconds</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Unable to Load Notes</h2>
          <p style={styles.errorText}>{error}</p>
          <div style={styles.errorActions}>
            <button onClick={loadDraftNotes} style={styles.retryButton}>
              Try Again
            </button>
            <button onClick={onComplete} style={styles.skipButton}>
              Continue Without Notes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'no-notes') {
    return (
      <div style={styles.container}>
        <div style={styles.noNotesCard}>
          <h2 style={styles.noNotesTitle}>No Session Recording</h2>
          <p style={styles.noNotesText}>
            No recording consent was given for this session, so automatic notes were not generated.
          </p>
          <button onClick={onComplete} style={styles.continueButton}>
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.reviewCard}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Review Session Notes</h1>
          <div style={styles.sessionInfo}>
            <span style={styles.patientName}>{patientName}</span>
            <span style={styles.separator}>•</span>
            <span style={styles.sessionDate}>{sessionDate}</span>
            {draft?.sessionDurationMinutes && (
              <>
                <span style={styles.separator}>•</span>
                <span style={styles.duration}>{draft.sessionDurationMinutes} min</span>
              </>
            )}
          </div>
        </div>

        {/* Notes editor */}
        <div style={styles.editorContainer}>
          <div style={styles.editorHeader}>
            <span style={styles.editorLabel}>AI-Generated Draft</span>
            <span style={styles.editorHint}>Review and edit as needed</span>
          </div>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            style={styles.editor}
            placeholder="Clinical notes will appear here..."
          />
        </div>

        {/* Disclaimer */}
        <div style={styles.disclaimer}>
          <strong>Important:</strong> These notes were generated by AI from the session transcription. 
          Please review for accuracy and completeness before finalizing.
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={handleDiscard} style={styles.discardButton}>
            Discard
          </button>
          <button onClick={handleSkip} style={styles.skipButton}>
            Save Draft for Later
          </button>
          <button 
            onClick={handleSave} 
            style={styles.saveButton}
            disabled={phase === 'saving'}
          >
            {phase === 'saving' ? 'Saving...' : 'Finalize Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #FAF7F2 0%, #F0EBE3 100%)',
  },
  loadingCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '3px solid #E2E8F0',
    borderTopColor: '#6B8E7F',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 24px',
  },
  loadingTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: '12px',
  },
  loadingText: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '8px',
  },
  loadingSubtext: {
    fontSize: '12px',
    color: '#A0AEC0',
  },
  errorCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#C53030',
    marginBottom: '12px',
  },
  errorText: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '24px',
  },
  errorActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  retryButton: {
    padding: '12px 24px',
    background: '#6B8E7F',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  noNotesCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
  },
  noNotesTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: '12px',
  },
  noNotesText: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '24px',
  },
  continueButton: {
    padding: '12px 24px',
    background: '#6B8E7F',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  reviewCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '800px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
  },
  header: {
    marginBottom: '24px',
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: '8px',
  },
  sessionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#718096',
  },
  patientName: {
    fontWeight: 500,
    color: '#4A5568',
  },
  separator: {
    opacity: 0.5,
  },
  sessionDate: {},
  duration: {},
  editorContainer: {
    marginBottom: '20px',
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  editorLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#4A5568',
  },
  editorHint: {
    fontSize: '12px',
    color: '#A0AEC0',
  },
  editor: {
    width: '100%',
    minHeight: '400px',
    padding: '16px',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: 1.6,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  disclaimer: {
    background: '#FFFAF0',
    border: '1px solid #F6E05E',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#744210',
    marginBottom: '24px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  discardButton: {
    padding: '12px 20px',
    background: 'transparent',
    color: '#C53030',
    border: '1px solid #FED7D7',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  skipButton: {
    padding: '12px 20px',
    background: 'transparent',
    color: '#718096',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  saveButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default NotesReview;
