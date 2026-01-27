/**
 * Notes History Page
 * 
 * View all past clinical notes with filtering and search.
 * Allows clinicians to review session history without opening Halaxy.
 * 
 * Features:
 * - List all notes with date/client filters
 * - Click to view full note detail
 * - Search by client name
 * - Filter by note type and date range
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { BloomHeader } from '../../components/layout/BloomHeader';
import { API_BASE_URL } from '../../config/api';

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

interface NotesResponse {
  success: boolean;
  data?: {
    notes: NoteMetadata[];
    total: number;
    limit: number;
    offset: number;
  };
  error?: string;
}

// ============================================================================
// Mock Data for Local Development
// ============================================================================

const MOCK_NOTES: NoteMetadata[] = [
  {
    id: '1',
    patientHalaxyId: '12345',
    patientInitials: 'JD',
    patientName: 'John Doe',
    sessionDate: '2026-01-27',
    noteType: 'progress',
    wordCount: 450,
    isLocked: false,
    createdAt: '2026-01-27T10:30:00Z',
    updatedAt: '2026-01-27T10:30:00Z',
  },
  {
    id: '2',
    patientHalaxyId: '12346',
    patientInitials: 'SM',
    patientName: 'Sarah Mitchell',
    sessionDate: '2026-01-26',
    noteType: 'progress',
    wordCount: 380,
    isLocked: true,
    createdAt: '2026-01-26T14:00:00Z',
    updatedAt: '2026-01-26T14:15:00Z',
  },
  {
    id: '3',
    patientHalaxyId: '12347',
    patientInitials: 'RK',
    patientName: 'Robert Kim',
    sessionDate: '2026-01-25',
    noteType: 'intake',
    wordCount: 820,
    isLocked: true,
    createdAt: '2026-01-25T09:00:00Z',
    updatedAt: '2026-01-25T09:45:00Z',
  },
  {
    id: '4',
    patientHalaxyId: '12345',
    patientInitials: 'JD',
    patientName: 'John Doe',
    sessionDate: '2026-01-20',
    noteType: 'progress',
    wordCount: 520,
    isLocked: true,
    createdAt: '2026-01-20T10:30:00Z',
    updatedAt: '2026-01-20T10:45:00Z',
  },
  {
    id: '5',
    patientHalaxyId: '12348',
    patientInitials: 'EW',
    patientName: 'Emma Wilson',
    sessionDate: '2026-01-19',
    noteType: 'progress',
    wordCount: 290,
    isLocked: true,
    createdAt: '2026-01-19T11:00:00Z',
    updatedAt: '2026-01-19T11:20:00Z',
  },
  {
    id: '6',
    patientHalaxyId: '12346',
    patientInitials: 'SM',
    patientName: 'Sarah Mitchell',
    sessionDate: '2026-01-18',
    noteType: 'progress',
    wordCount: 410,
    isLocked: true,
    createdAt: '2026-01-18T14:00:00Z',
    updatedAt: '2026-01-18T14:30:00Z',
  },
];

// ============================================================================
// Styles (Bloom Design System)
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 600,
    color: colors.charcoal,
    margin: 0,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: colors.charcoalLight,
    marginTop: '0.25rem',
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  filterLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: colors.charcoalLight,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  input: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: `1px solid ${colors.sageLight}`,
    fontSize: '0.9rem',
    minWidth: '150px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: `1px solid ${colors.sageLight}`,
    fontSize: '0.9rem',
    minWidth: '150px',
    background: colors.white,
    cursor: 'pointer',
  },
  notesGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  noteCard: {
    background: colors.white,
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.cream}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  noteCardHover: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    borderColor: colors.sageLight,
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.white,
    fontWeight: 600,
    fontSize: '1rem',
    flexShrink: 0,
  },
  noteInfo: {
    flex: 1,
    minWidth: 0,
  },
  noteName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.charcoal,
    margin: 0,
    marginBottom: '0.25rem',
  },
  noteMeta: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  metaItem: {
    fontSize: '0.85rem',
    color: colors.charcoalLight,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  noteTypeBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'capitalize' as const,
  },
  lockedBadge: {
    background: colors.lavenderLight,
    color: colors.lavender,
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  draftBadge: {
    background: '#FEF3C7',
    color: '#92400E',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  wordCount: {
    fontSize: '0.8rem',
    color: colors.charcoalLight,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    color: colors.charcoalLight,
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  loading: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    color: colors.charcoalLight,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2rem',
  },
  pageButton: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${colors.sageLight}`,
    background: colors.white,
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
  pageInfo: {
    fontSize: '0.9rem',
    color: colors.charcoalLight,
  },
  backButton: {
    display: 'flex',
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
    transition: 'all 0.2s',
  },
  devBanner: {
    background: '#FEF3C7',
    border: '1px solid #F59E0B',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: '#92400E',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getNoteTypeColor = (type: string): React.CSSProperties => {
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

export function NotesHistory() {
  const navigate = useNavigate();
  const { getAccessToken, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [notes, setNotes] = useState<NoteMetadata[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  
  // Filters from URL params
  const searchQuery = searchParams.get('search') || '';
  const noteTypeFilter = searchParams.get('type') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Load notes - using ref to avoid dependency loops
  const loadNotesRef = React.useRef<() => Promise<void>>();
  
  loadNotesRef.current = async () => {
    setLoading(true);
    setError(null);
    
    // Check if we should use mock data (local dev without DB)
    const isLocalDev = window.location.hostname === 'localhost';
    
    try {
      const token = await getAccessToken();
      
      const params = new URLSearchParams();
      if (noteTypeFilter) params.append('type', noteTypeFilter);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const response = await fetch(`${API_BASE_URL}/clinical-notes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: NotesResponse = await response.json();
      
      if (data.success && data.data) {
        setNotes(data.data.notes);
        setTotal(data.data.total);
        setUseMockData(false);
      } else {
        throw new Error(data.error || 'Failed to load notes');
      }
    } catch (err) {
      console.warn('Failed to load notes from API, using mock data:', err);
      
      // Fall back to mock data for local development
      if (isLocalDev) {
        let filteredNotes = [...MOCK_NOTES];
        
        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredNotes = filteredNotes.filter(n => 
            n.patientName?.toLowerCase().includes(query) ||
            n.patientInitials.toLowerCase().includes(query)
          );
        }
        
        // Apply type filter
        if (noteTypeFilter) {
          filteredNotes = filteredNotes.filter(n => n.noteType === noteTypeFilter);
        }
        
        setNotes(filteredNotes.slice(offset, offset + limit));
        setTotal(filteredNotes.length);
        setUseMockData(true);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load notes');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when filters change
  useEffect(() => {
    if (isAuthenticated) {
      loadNotesRef.current?.();
    }
  }, [isAuthenticated, noteTypeFilter, offset, searchQuery]);

  // Update URL params
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to first page on filter change
    setSearchParams(newParams);
  };

  const goToPage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const totalPages = Math.ceil(total / limit);

  // Handle note click
  const handleNoteClick = (note: NoteMetadata) => {
    navigate(`/notes/${note.id}`, { state: { note } });
  };

  return (
    <div style={styles.container}>
      <BloomHeader />
      
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <button 
              style={styles.backButton}
              onClick={() => navigate('/bloom-home')}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.cream}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              ← Back to Dashboard
            </button>
            <h1 style={styles.title}>📝 Session Notes</h1>
            <p style={styles.subtitle}>
              {total} note{total !== 1 ? 's' : ''} • View and manage your clinical documentation
            </p>
          </div>
        </div>

        {/* Dev Mode Banner */}
        {useMockData && (
          <div style={styles.devBanner}>
            ⚠️ <strong>Development Mode:</strong> Showing mock data. Connect to Azure SQL for real notes.
          </div>
        )}

        {/* Filters */}
        <div style={styles.filters}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search Client</label>
            <input
              type="text"
              placeholder="Name or initials..."
              value={searchQuery}
              onChange={(e) => updateFilter('search', e.target.value)}
              style={styles.input}
            />
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Note Type</label>
            <select
              value={noteTypeFilter}
              onChange={(e) => updateFilter('type', e.target.value)}
              style={styles.select}
            >
              <option value="">All Types</option>
              <option value="intake">Intake</option>
              <option value="progress">Progress</option>
              <option value="discharge">Discharge</option>
              <option value="correspondence">Correspondence</option>
              <option value="supervision">Supervision</option>
            </select>
          </div>
        </div>

        {/* Notes List */}
        {loading ? (
          <div style={styles.loading}>
            <p>Loading notes...</p>
          </div>
        ) : error ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⚠️</div>
            <p>{error}</p>
            <button onClick={() => loadNotesRef.current?.()} style={{ ...styles.pageButton, marginTop: '1rem' }}>
              Try Again
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <p>No notes found</p>
            {(searchQuery || noteTypeFilter) && (
              <button 
                onClick={() => setSearchParams(new URLSearchParams())}
                style={{ ...styles.pageButton, marginTop: '1rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={styles.notesGrid}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    ...styles.noteCard,
                    ...(hoveredId === note.id ? styles.noteCardHover : {}),
                  }}
                  onClick={() => handleNoteClick(note)}
                  onMouseEnter={() => setHoveredId(note.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Avatar */}
                  <div style={styles.avatar}>
                    {note.patientInitials}
                  </div>
                  
                  {/* Note Info */}
                  <div style={styles.noteInfo}>
                    <h3 style={styles.noteName}>
                      {note.patientName || note.patientInitials}
                    </h3>
                    <div style={styles.noteMeta}>
                      <span style={styles.metaItem}>
                        📅 {formatDate(note.sessionDate)}
                      </span>
                      <span 
                        style={{
                          ...styles.noteTypeBadge,
                          ...getNoteTypeColor(note.noteType),
                        }}
                      >
                        {note.noteType}
                      </span>
                      {note.isLocked ? (
                        <span style={styles.lockedBadge}>
                          🔒 Locked
                        </span>
                      ) : (
                        <span style={styles.draftBadge}>
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Word Count */}
                  <div style={styles.wordCount}>
                    {note.wordCount} words
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={{
                    ...styles.pageButton,
                    opacity: page === 1 ? 0.5 : 1,
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => page > 1 && goToPage(page - 1)}
                  disabled={page === 1}
                >
                  ← Previous
                </button>
                <span style={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <button
                  style={{
                    ...styles.pageButton,
                    opacity: page === totalPages ? 0.5 : 1,
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => page < totalPages && goToPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NotesHistory;
