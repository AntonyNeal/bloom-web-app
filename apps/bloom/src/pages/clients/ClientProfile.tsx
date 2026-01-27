/**
 * Client Profile Page
 * 
 * Comprehensive view of a client including:
 * - Personal information and contact details
 * - Session history timeline
 * - Clinical notes
 * - Treatment goals and progress
 * - Medicare/MHCP information
 * 
 * This replaces the need to look up clients in Halaxy.
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BloomHeader } from '../../components/layout/BloomHeader';

// ============================================================================
// Types
// ============================================================================

interface ClientData {
  id: string;
  halaxyId: string;
  firstName: string;
  lastName: string;
  initials: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  gp?: {
    name: string;
    clinic: string;
    phone?: string;
  };
  medicare?: {
    number: string;
    irn: string;
    expiryDate: string;
  };
  mhcp?: {
    referralDate: string;
    sessionsTotal: number;
    sessionsUsed: number;
    expiryDate: string;
    referringGP: string;
  };
  treatmentGoals: TreatmentGoal[];
  presentingIssues: string[];
  diagnoses: string[];
  relationshipStartDate: string;
  totalSessions: number;
  lastSessionDate?: string;
  nextSessionDate?: string;
}

interface TreatmentGoal {
  id: string;
  goal: string;
  progress: 'not-started' | 'in-progress' | 'achieved';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionRecord {
  id: string;
  date: string;
  time: string;
  type: string;
  status: 'completed' | 'cancelled' | 'no-show' | 'scheduled';
  duration: number;
  hasNotes: boolean;
  notePreview?: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_CLIENTS: Record<string, ClientData> = {
  '12345': {
    id: '12345',
    halaxyId: '12345',
    firstName: 'John',
    lastName: 'Doe',
    initials: 'JD',
    email: 'john.doe@email.com',
    phone: '+61 412 345 678',
    dateOfBirth: '1985-03-15',
    address: '42 Smith Street, Newcastle NSW 2300',
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+61 412 987 654',
      relationship: 'Spouse',
    },
    gp: {
      name: 'Dr. Sarah Thompson',
      clinic: 'Newcastle Family Medical',
      phone: '+61 2 4929 1234',
    },
    medicare: {
      number: '2345 67890 1',
      irn: '1',
      expiryDate: '2027-03',
    },
    mhcp: {
      referralDate: '2025-09-15',
      sessionsTotal: 10,
      sessionsUsed: 8,
      expiryDate: '2026-09-15',
      referringGP: 'Dr. Sarah Thompson',
    },
    treatmentGoals: [
      {
        id: '1',
        goal: 'Reduce anxiety symptoms (PHQ-9 < 10)',
        progress: 'in-progress',
        notes: 'PHQ-9 decreased from 14 to 11',
        createdAt: '2025-09-20',
        updatedAt: '2026-01-27',
      },
      {
        id: '2',
        goal: 'Improve sleep quality (6+ hours consistently)',
        progress: 'in-progress',
        notes: 'Sleep hygiene plan established, averaging 5.5 hours',
        createdAt: '2025-09-20',
        updatedAt: '2026-01-20',
      },
      {
        id: '3',
        goal: 'Develop assertive communication skills',
        progress: 'achieved',
        notes: 'Successfully using "I" statements, set boundaries with manager',
        createdAt: '2025-10-01',
        updatedAt: '2026-01-15',
      },
    ],
    presentingIssues: ['Generalised Anxiety', 'Work Stress', 'Relationship Difficulties'],
    diagnoses: ['F41.1 - Generalised Anxiety Disorder'],
    relationshipStartDate: '2025-09-20',
    totalSessions: 8,
    lastSessionDate: '2026-01-27',
    nextSessionDate: undefined,
  },
  '12346': {
    id: '12346',
    halaxyId: '12346',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    initials: 'SM',
    email: 'sarah.m@email.com',
    phone: '+61 423 456 789',
    dateOfBirth: '1992-07-22',
    address: '15 Beach Road, Merewether NSW 2291',
    emergencyContact: {
      name: 'Michael Mitchell',
      phone: '+61 423 111 222',
      relationship: 'Brother',
    },
    gp: {
      name: 'Dr. James Lee',
      clinic: 'Merewether Medical Centre',
    },
    medicare: {
      number: '3456 78901 2',
      irn: '1',
      expiryDate: '2028-06',
    },
    mhcp: {
      referralDate: '2025-11-01',
      sessionsTotal: 10,
      sessionsUsed: 4,
      expiryDate: '2026-11-01',
      referringGP: 'Dr. James Lee',
    },
    treatmentGoals: [
      {
        id: '1',
        goal: 'Process grief related to loss of parent',
        progress: 'in-progress',
        notes: 'Working through stages, currently in acceptance phase',
        createdAt: '2025-11-10',
        updatedAt: '2026-01-26',
      },
      {
        id: '2',
        goal: 'Return to previous level of social functioning',
        progress: 'in-progress',
        notes: 'Attending one social event per week now',
        createdAt: '2025-11-10',
        updatedAt: '2026-01-20',
      },
    ],
    presentingIssues: ['Grief', 'Depression', 'Social Withdrawal'],
    diagnoses: ['F32.1 - Moderate Depressive Episode'],
    relationshipStartDate: '2025-11-10',
    totalSessions: 4,
    lastSessionDate: '2026-01-26',
    nextSessionDate: '2026-01-28',
  },
};

const MOCK_SESSIONS: Record<string, SessionRecord[]> = {
  '12345': [
    { id: 's1', date: '2026-01-27', time: '09:00', type: 'Individual Therapy', status: 'completed', duration: 50, hasNotes: true, notePreview: 'Worked on cognitive restructuring...' },
    { id: 's2', date: '2026-01-20', time: '09:00', type: 'Individual Therapy', status: 'completed', duration: 50, hasNotes: true, notePreview: 'Introduced sleep hygiene protocol...' },
    { id: 's3', date: '2026-01-13', time: '09:00', type: 'Individual Therapy', status: 'completed', duration: 50, hasNotes: true },
    { id: 's4', date: '2026-01-06', time: '09:00', type: 'Individual Therapy', status: 'completed', duration: 50, hasNotes: true },
    { id: 's5', date: '2025-12-16', time: '09:00', type: 'Individual Therapy', status: 'completed', duration: 50, hasNotes: true },
    { id: 's6', date: '2025-12-09', time: '09:00', type: 'Individual Therapy', status: 'cancelled', duration: 50, hasNotes: false },
    { id: 's7', date: '2025-11-25', time: '09:00', type: 'Individual Therapy', status: 'completed', duration: 50, hasNotes: true },
    { id: 's8', date: '2025-11-11', time: '09:00', type: 'Individual Therapy', status: 'completed', duration: 50, hasNotes: true },
    { id: 's9', date: '2025-09-20', time: '10:00', type: 'Initial Assessment', status: 'completed', duration: 90, hasNotes: true, notePreview: 'Initial assessment completed...' },
  ],
  '12346': [
    { id: 's1', date: '2026-01-28', time: '14:00', type: 'Individual Therapy', status: 'scheduled', duration: 50, hasNotes: false },
    { id: 's2', date: '2026-01-26', time: '14:00', type: 'Individual Therapy', status: 'completed', duration: 50, hasNotes: true },
    { id: 's3', date: '2026-01-12', time: '14:00', type: 'Individual Therapy', status: 'completed', duration: 50, hasNotes: true },
    { id: 's4', date: '2025-12-15', time: '14:00', type: 'Individual Therapy', status: 'completed', duration: 50, hasNotes: true },
    { id: 's5', date: '2025-11-10', time: '10:00', type: 'Initial Assessment', status: 'completed', duration: 90, hasNotes: true },
  ],
};

// ============================================================================
// Styles
// ============================================================================

const colors = {
  sage: '#6B8E7F',
  sageLight: '#a8c5bb',
  sageDark: '#5d7a72',
  lavender: '#9B8BC4',
  lavenderLight: '#E8E4F0',
  warmWhite: '#FAF7F2',
  cream: '#F5F3EF',
  charcoal: '#3A3A3A',
  charcoalLight: '#636e72',
  white: '#ffffff',
  blush: '#E8C5B5',
  amber: '#D4A574',
  coral: '#E57373',
  green: '#4CAF50',
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.warmWhite} 0%, ${colors.cream} 100%)`,
  },
  content: {
    maxWidth: '1200px',
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
  header: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '2rem',
    flexWrap: 'wrap' as const,
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.white,
    fontWeight: 600,
    fontSize: '2.5rem',
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
    minWidth: '250px',
  },
  clientName: {
    fontSize: '2rem',
    fontWeight: 600,
    color: colors.charcoal,
    margin: 0,
    marginBottom: '0.5rem',
  },
  clientMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    marginBottom: '1rem',
  },
  metaItem: {
    fontSize: '0.9rem',
    color: colors.charcoalLight,
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  quickActions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryButton: {
    background: colors.sage,
    color: colors.white,
  },
  secondaryButton: {
    background: colors.white,
    color: colors.sage,
    border: `1px solid ${colors.sageLight}`,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: colors.white,
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.charcoal,
    margin: 0,
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: `1px solid ${colors.cream}`,
  },
  infoLabel: {
    fontSize: '0.85rem',
    color: colors.charcoalLight,
  },
  infoValue: {
    fontSize: '0.85rem',
    color: colors.charcoal,
    fontWeight: 500,
    textAlign: 'right' as const,
  },
  mhcpBar: {
    height: '8px',
    background: colors.cream,
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '0.5rem',
  },
  mhcpProgress: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  goalItem: {
    padding: '0.75rem',
    background: colors.cream,
    borderRadius: '8px',
    marginBottom: '0.75rem',
  },
  goalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
  },
  goalText: {
    fontSize: '0.9rem',
    color: colors.charcoal,
    fontWeight: 500,
    margin: 0,
    flex: 1,
  },
  goalStatus: {
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    marginLeft: '0.5rem',
    flexShrink: 0,
  },
  goalNotes: {
    fontSize: '0.8rem',
    color: colors.charcoalLight,
    margin: 0,
    fontStyle: 'italic',
  },
  sessionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '0.5rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  sessionDate: {
    minWidth: '80px',
  },
  sessionDateDay: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: colors.charcoal,
  },
  sessionDateTime: {
    fontSize: '0.75rem',
    color: colors.charcoalLight,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionType: {
    fontSize: '0.85rem',
    color: colors.charcoal,
  },
  sessionStatus: {
    fontSize: '0.75rem',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  tag: {
    padding: '0.35rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: colors.charcoalLight,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });
};

const calculateAge = (dob: string): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getGoalStatusStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'achieved':
      return { background: '#D1FAE5', color: '#065F46' };
    case 'in-progress':
      return { background: '#FEF3C7', color: '#92400E' };
    default:
      return { background: colors.cream, color: colors.charcoalLight };
  }
};

const getSessionStatusStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'completed':
      return { background: '#D1FAE5', color: '#065F46' };
    case 'scheduled':
      return { background: '#DBEAFE', color: '#1E40AF' };
    case 'cancelled':
      return { background: '#FEE2E2', color: '#991B1B' };
    case 'no-show':
      return { background: '#FEF3C7', color: '#92400E' };
    default:
      return { background: colors.cream, color: colors.charcoalLight };
  }
};

// ============================================================================
// Component
// ============================================================================

export function ClientProfile() {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'notes'>('overview');
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  // Get client data (mock)
  const client = clientId ? MOCK_CLIENTS[clientId] : null;
  const sessions = clientId ? MOCK_SESSIONS[clientId] || [] : [];

  if (!client) {
    return (
      <div style={styles.container}>
        <BloomHeader />
        <div style={styles.content}>
          <div style={styles.emptyState}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
            <h2>Client Not Found</h2>
            <p>This client doesn't exist or you don't have access.</p>
            <button
              onClick={() => navigate('/bloom-home')}
              style={{ ...styles.actionButton, ...styles.primaryButton, marginTop: '1rem' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mhcpRemaining = client.mhcp ? client.mhcp.sessionsTotal - client.mhcp.sessionsUsed : 0;
  const mhcpPercentUsed = client.mhcp ? (client.mhcp.sessionsUsed / client.mhcp.sessionsTotal) * 100 : 0;
  const isMhcpLow = mhcpRemaining <= 2;

  return (
    <div style={styles.container}>
      <BloomHeader />

      <div style={styles.content}>
        {/* Back Button */}
        <button
          style={styles.backButton}
          onClick={() => navigate(-1)}
          onMouseEnter={(e) => (e.currentTarget.style.background = colors.cream)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          ← Back
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.avatar}>{client.initials}</div>
          <div style={styles.headerInfo}>
            <h1 style={styles.clientName}>
              {client.firstName} {client.lastName}
            </h1>
            <div style={styles.clientMeta}>
              {client.dateOfBirth && (
                <span style={styles.metaItem}>
                  🎂 {calculateAge(client.dateOfBirth)} years old
                </span>
              )}
              <span style={styles.metaItem}>📅 Client since {formatDate(client.relationshipStartDate)}</span>
              <span style={styles.metaItem}>📊 {client.totalSessions} sessions</span>
            </div>
            <div style={styles.quickActions}>
              <button
                style={{ ...styles.actionButton, ...styles.primaryButton }}
                onClick={() => navigate(`/session?patientId=${client.id}`)}
              >
                📹 Start Session
              </button>
              <button
                style={{ ...styles.actionButton, ...styles.secondaryButton }}
                onClick={() => navigate(`/notes?search=${client.initials}`)}
              >
                📝 View Notes
              </button>
              {client.phone && (
                <button
                  style={{ ...styles.actionButton, ...styles.secondaryButton }}
                  onClick={() => window.open(`tel:${client.phone}`)}
                >
                  📞 Call
                </button>
              )}
              {client.email && (
                <button
                  style={{ ...styles.actionButton, ...styles.secondaryButton }}
                  onClick={() => window.open(`mailto:${client.email}`)}
                >
                  ✉️ Email
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['overview', 'sessions', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab ? colors.sage : 'transparent',
                color: activeTab === tab ? colors.white : colors.charcoalLight,
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div style={styles.grid}>
            {/* Contact Info */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📇 Contact Information</h3>
              {client.phone && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Phone</span>
                  <span style={styles.infoValue}>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Email</span>
                  <span style={styles.infoValue}>{client.email}</span>
                </div>
              )}
              {client.address && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Address</span>
                  <span style={styles.infoValue}>{client.address}</span>
                </div>
              )}
              {client.dateOfBirth && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Date of Birth</span>
                  <span style={styles.infoValue}>{formatDate(client.dateOfBirth)}</span>
                </div>
              )}
              {client.emergencyContact && (
                <>
                  <div style={{ ...styles.infoRow, borderBottom: 'none', paddingTop: '1rem' }}>
                    <span style={{ ...styles.infoLabel, fontWeight: 600 }}>Emergency Contact</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>{client.emergencyContact.relationship}</span>
                    <span style={styles.infoValue}>
                      {client.emergencyContact.name}
                      <br />
                      <span style={{ fontWeight: 400 }}>{client.emergencyContact.phone}</span>
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* MHCP / Medicare */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🏥 Medicare & MHCP</h3>
              {client.medicare && (
                <>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Medicare Number</span>
                    <span style={styles.infoValue}>{client.medicare.number}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>IRN</span>
                    <span style={styles.infoValue}>{client.medicare.irn}</span>
                  </div>
                </>
              )}
              {client.mhcp && (
                <>
                  <div style={{ ...styles.infoRow, paddingTop: '1rem' }}>
                    <span style={{ ...styles.infoLabel, fontWeight: 600 }}>Mental Health Care Plan</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Sessions Remaining</span>
                    <span
                      style={{
                        ...styles.infoValue,
                        color: isMhcpLow ? colors.coral : colors.green,
                        fontWeight: 600,
                      }}
                    >
                      {mhcpRemaining} of {client.mhcp.sessionsTotal}
                    </span>
                  </div>
                  <div style={styles.mhcpBar}>
                    <div
                      style={{
                        ...styles.mhcpProgress,
                        width: `${mhcpPercentUsed}%`,
                        background: isMhcpLow
                          ? `linear-gradient(90deg, ${colors.amber} 0%, ${colors.coral} 100%)`
                          : `linear-gradient(90deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                      }}
                    />
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Referral Date</span>
                    <span style={styles.infoValue}>{formatDate(client.mhcp.referralDate)}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Expires</span>
                    <span style={styles.infoValue}>{formatDate(client.mhcp.expiryDate)}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Referring GP</span>
                    <span style={styles.infoValue}>{client.mhcp.referringGP}</span>
                  </div>
                </>
              )}
              {client.gp && (
                <>
                  <div style={{ ...styles.infoRow, paddingTop: '1rem' }}>
                    <span style={{ ...styles.infoLabel, fontWeight: 600 }}>GP Details</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Name</span>
                    <span style={styles.infoValue}>{client.gp.name}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Clinic</span>
                    <span style={styles.infoValue}>{client.gp.clinic}</span>
                  </div>
                </>
              )}
            </div>

            {/* Presenting Issues & Diagnoses */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📋 Clinical Information</h3>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ ...styles.infoLabel, display: 'block', marginBottom: '0.5rem' }}>
                  Presenting Issues
                </span>
                <div style={styles.tagContainer}>
                  {client.presentingIssues.map((issue, i) => (
                    <span
                      key={i}
                      style={{
                        ...styles.tag,
                        background: colors.lavenderLight,
                        color: colors.lavender,
                      }}
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ ...styles.infoLabel, display: 'block', marginBottom: '0.5rem' }}>
                  Diagnoses
                </span>
                <div style={styles.tagContainer}>
                  {client.diagnoses.map((dx, i) => (
                    <span
                      key={i}
                      style={{
                        ...styles.tag,
                        background: colors.cream,
                        color: colors.charcoal,
                      }}
                    >
                      {dx}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Treatment Goals */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🎯 Treatment Goals</h3>
              {client.treatmentGoals.map((goal) => (
                <div key={goal.id} style={styles.goalItem}>
                  <div style={styles.goalHeader}>
                    <p style={styles.goalText}>{goal.goal}</p>
                    <span style={{ ...styles.goalStatus, ...getGoalStatusStyle(goal.progress) }}>
                      {goal.progress.replace('-', ' ')}
                    </span>
                  </div>
                  {goal.notes && <p style={styles.goalNotes}>{goal.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📅 Session History</h3>
            {sessions.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No sessions recorded yet.</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    ...styles.sessionItem,
                    background: hoveredSession === session.id ? colors.cream : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredSession(session.id)}
                  onMouseLeave={() => setHoveredSession(null)}
                  onClick={() => session.hasNotes && navigate(`/notes/${session.id}`)}
                >
                  <div style={styles.sessionDate}>
                    <div style={styles.sessionDateDay}>{formatDateShort(session.date)}</div>
                    <div style={styles.sessionDateTime}>{session.time}</div>
                  </div>
                  <div style={styles.sessionInfo}>
                    <div style={styles.sessionType}>{session.type}</div>
                    {session.notePreview && (
                      <div style={{ fontSize: '0.8rem', color: colors.charcoalLight, marginTop: '0.25rem' }}>
                        {session.notePreview}
                      </div>
                    )}
                  </div>
                  <span style={{ ...styles.sessionStatus, ...getSessionStatusStyle(session.status) }}>
                    {session.status}
                  </span>
                  {session.hasNotes && (
                    <span style={{ fontSize: '0.8rem', color: colors.sage }}>📝</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📝 Clinical Notes</h3>
            <div style={styles.emptyState}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</p>
              <p>View all notes for this client</p>
              <button
                onClick={() => navigate(`/notes?search=${client.initials}`)}
                style={{ ...styles.actionButton, ...styles.primaryButton, marginTop: '1rem' }}
              >
                Open Notes History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientProfile;
