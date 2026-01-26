/**
 * Recording Consent Dialog
 * 
 * Displays consent prompt before session recording.
 * Required by Australian privacy law for recording telehealth sessions.
 * 
 * Features:
 * - Clear explanation of what's being recorded
 * - Options for verbal or written consent
 * - Recording indicator when active
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Bloom color palette
const colors = {
  sage: '#6B8E7F',
  sageLight: '#a8c5bb',
  lavender: '#9B8BC4',
  warmWhite: '#FAF7F2',
  charcoal: '#3A3A3A',
  charcoalLight: '#636e72',
  white: '#ffffff',
  errorRed: '#c0392b',
};

interface RecordingConsentDialogProps {
  isOpen: boolean;
  patientName: string;
  onConsent: (type: 'verbal' | 'written') => void;
  onDecline: () => void;
}

export function RecordingConsentDialog({
  isOpen,
  patientName,
  onConsent,
  onDecline,
}: RecordingConsentDialogProps) {
  const [selectedType, setSelectedType] = useState<'verbal' | 'written'>('verbal');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={styles.dialog}
        >
          {/* Icon */}
          <div style={styles.iconContainer}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.lavender} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>

          {/* Title */}
          <h2 style={styles.title}>Recording Consent</h2>

          {/* Description */}
          <p style={styles.description}>
            This session can be recorded for clinical documentation and quality assurance purposes.
          </p>

          {/* What's recorded */}
          <div style={styles.infoBox}>
            <h4 style={styles.infoTitle}>What will be recorded:</h4>
            <ul style={styles.infoList}>
              <li>Video and audio of the session</li>
              <li>Shared screen content (if applicable)</li>
            </ul>
            <h4 style={{ ...styles.infoTitle, marginTop: '12px' }}>How it's used:</h4>
            <ul style={styles.infoList}>
              <li>Clinical notes and treatment planning</li>
              <li>Supervision and professional development</li>
              <li>Stored securely with encrypted access</li>
            </ul>
          </div>

          {/* Consent type selection */}
          <div style={styles.consentTypes}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="consentType"
                value="verbal"
                checked={selectedType === 'verbal'}
                onChange={() => setSelectedType('verbal')}
                style={styles.radio}
              />
              <span style={styles.radioText}>
                <strong>Verbal consent</strong>
                <br />
                <span style={styles.radioSubtext}>
                  I verbally confirm {patientName}'s consent
                </span>
              </span>
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="consentType"
                value="written"
                checked={selectedType === 'written'}
                onChange={() => setSelectedType('written')}
                style={styles.radio}
              />
              <span style={styles.radioText}>
                <strong>Written consent on file</strong>
                <br />
                <span style={styles.radioSubtext}>
                  Consent form already signed
                </span>
              </span>
            </label>
          </div>

          {/* Privacy note */}
          <p style={styles.privacyNote}>
            Recordings are stored in compliance with Australian Privacy Principles and 
            health records legislation. They can be deleted upon request.
          </p>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              onClick={onDecline}
              style={styles.declineButton}
            >
              Don't Record
            </button>
            <button
              onClick={() => onConsent(selectedType)}
              style={styles.consentButton}
            >
              Confirm & Start Recording
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Recording indicator badge
 */
interface RecordingIndicatorProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: string;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

export function RecordingIndicator({
  isRecording,
  isPaused,
  duration,
  onPause,
  onResume,
  onStop,
}: RecordingIndicatorProps) {
  if (!isRecording) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={styles.indicator}
    >
      {/* Recording dot */}
      <div style={{
        ...styles.recordingDot,
        animation: isPaused ? 'none' : 'pulse 1.5s ease-in-out infinite',
        backgroundColor: isPaused ? colors.charcoalLight : colors.errorRed,
      }} />
      
      {/* Status */}
      <span style={styles.indicatorText}>
        {isPaused ? 'Paused' : 'REC'} {duration}
      </span>

      {/* Controls */}
      <div style={styles.indicatorControls}>
        {isPaused ? (
          <button onClick={onResume} style={styles.indicatorButton} title="Resume">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        ) : (
          <button onClick={onPause} style={styles.indicatorButton} title="Pause">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        )}
        <button onClick={onStop} style={{ ...styles.indicatorButton, color: colors.errorRed }} title="Stop">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  dialog: {
    background: colors.white,
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.warmWhite} 0%, #f0ebf5 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: colors.charcoal,
    textAlign: 'center',
    margin: '0 0 12px',
  },
  description: {
    fontSize: '15px',
    color: colors.charcoalLight,
    textAlign: 'center',
    margin: '0 0 20px',
    lineHeight: 1.5,
  },
  infoBox: {
    background: colors.warmWhite,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  infoTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: colors.charcoal,
    margin: '0 0 8px',
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: colors.charcoalLight,
    lineHeight: 1.6,
  },
  consentTypes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    border: `1px solid ${colors.sageLight}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  radio: {
    marginTop: '4px',
    accentColor: colors.sage,
  },
  radioText: {
    fontSize: '14px',
    color: colors.charcoal,
    lineHeight: 1.4,
  },
  radioSubtext: {
    fontSize: '13px',
    color: colors.charcoalLight,
  },
  privacyNote: {
    fontSize: '12px',
    color: colors.charcoalLight,
    textAlign: 'center',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  declineButton: {
    flex: 1,
    padding: '14px 20px',
    background: 'transparent',
    border: `1px solid ${colors.sageLight}`,
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 500,
    color: colors.charcoalLight,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  consentButton: {
    flex: 2,
    padding: '14px 20px',
    background: `linear-gradient(135deg, ${colors.sage} 0%, #8fa892 100%)`,
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    color: colors.white,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '20px',
    color: colors.white,
  },
  recordingDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: colors.errorRed,
  },
  indicatorText: {
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  indicatorControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '8px',
    paddingLeft: '12px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
  },
  indicatorButton: {
    background: 'transparent',
    border: 'none',
    color: colors.white,
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    transition: 'opacity 0.2s',
  },
};

// Add keyframe animation
if (typeof document !== 'undefined') {
  const existing = document.getElementById('recording-animations');
  if (!existing) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'recording-animations';
    styleSheet.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default RecordingConsentDialog;
