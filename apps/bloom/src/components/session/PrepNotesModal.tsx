/**
 * Prep Notes Modal
 * 
 * A modal for clinicians to view, edit, and enhance their prep notes
 * before a session. Includes Bloom assistant for generating insights
 * and answering questions about patient history.
 * 
 * Features:
 * - View/edit prep notes
 * - Ask Bloom questions about the patient
 * - Mark prep as complete
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';

// Bloom color palette
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
  terracotta: '#C4A484',
  terracottaLight: '#E8DDD3',
  amber: '#D4A574',
};

interface PrepNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    clientName?: string;
    clientInitials: string;
    sessionType?: string;
    time: string;
    status?: string;
  };
  onPrepComplete?: (sessionId: string, notes: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Icons
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const _EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const _RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
  </svg>
);

const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    style={{
      width: '20px',
      height: '20px',
      border: `2px solid ${colors.lavenderLight}`,
      borderTopColor: colors.sage,
      borderRadius: '50%',
    }}
  />
);

export function PrepNotesModal({ isOpen, onClose, session, onPrepComplete }: PrepNotesModalProps) {
  const { getAccessToken, user } = useAuth();
  const [prepNotes, setPrepNotes] = useState('');
  const [originalNotes, setOriginalNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'chat'>('notes');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock AI-generated notes for local development
  const getMockNotes = (clientName: string, clientInitials: string, status?: string) => {
    const isCompleted = status === 'completed';
    
    if (isCompleted) {
      // Session notes for completed sessions
      return `## Session Summary - ${clientName || clientInitials}

### Presenting Concerns
Client presented with ongoing anxiety related to work-life balance and relationship stress. Reports difficulty sleeping (4-5 hours/night) and increased irritability over the past two weeks.

### Session Content
- Explored cognitive patterns around perfectionism and fear of failure
- Introduced cognitive restructuring techniques for catastrophic thinking
- Practiced grounding exercise (5-4-3-2-1 sensory technique)
- Discussed boundaries with partner regarding household responsibilities

### Clinical Observations
Client demonstrated good insight into anxiety triggers. Affect was congruent with content discussed. Engaged actively in exercises and reported feeling "lighter" by session end.

### Treatment Progress
- Goal 1 (Reduce anxiety symptoms): Moderate progress - PHQ-9 decreased from 14 to 11
- Goal 2 (Improve sleep): Early stages - Sleep hygiene plan established
- Goal 3 (Communication skills): Good progress - Successfully used "I" statements in recent conversation

### Plan & Homework
1. Continue daily thought record (minimum 1 entry)
2. Practice grounding exercise when noticing anxiety rising
3. Implement 10pm "wind down" routine for sleep
4. Schedule one boundary-setting conversation before next session

### Risk Assessment
No current suicidal ideation or self-harm thoughts. Protective factors include supportive friend network and meaningful work.

**Next Session:** Continue cognitive restructuring work, review thought records, check-in on sleep improvements.`;
    } else {
      // Prep notes for upcoming sessions
      return `## Session Preparation - ${clientName || clientInitials}

### Quick Overview
**Sessions to date:** 8 sessions over 4 months
**Primary focus:** Anxiety management, work-life balance
**Last session:** Worked on cognitive restructuring for catastrophic thinking

### Key Points to Follow Up
- [ ] Check progress on thought record homework
- [ ] Review sleep diary entries from past week
- [ ] Ask about boundary conversation with partner

### Recent Themes
- Perfectionism patterns at work
- Difficulty delegating tasks
- Fear of disappointing others

### Treatment Goals Progress
| Goal | Status |
|------|--------|
| Reduce anxiety (PHQ-9) | 14 → 11 ✓ |
| Improve sleep quality | In progress |
| Assertive communication | Good progress |

### Session Approach
Consider starting with grounding exercise if client presents as activated. May be helpful to review cognitive model diagram to reinforce learning from last session.

### Notes from AI Analysis
*Based on session history, ${clientInitials} responds well to structured approaches and appreciates having tangible tools to practice. Consider introducing the "worry time" technique this session.*`;
    }
  };

  // Fetch existing prep notes when modal opens
  useEffect(() => {
    if (isOpen && session.id) {
      fetchPrepNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session.id]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchPrepNotes = async () => {
    setLoading(true);
    try {
      // Use mock data in local development
      const isLocalDev = window.location.hostname === 'localhost';
      if (isLocalDev) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockNotes = getMockNotes(session.clientName || '', session.clientInitials, session.status);
        setPrepNotes(mockNotes);
        setOriginalNotes(mockNotes);
        setLoading(false);
        return;
      }

      const token = await getAccessToken();
      const azureUserId = user?.localAccountId || (user?.homeAccountId?.split('.')[0]) || '';

      const response = await fetch(`${API_BASE_URL}/clinical-notes/prep/${session.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Azure-User-Id': azureUserId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.notes) {
          setPrepNotes(data.data.notes);
          setOriginalNotes(data.data.notes);
        }
      } else if (response.status === 404) {
        // No existing notes - that's fine, generate some
        await generatePrepNotes();
      }
    } catch (err) {
      console.error('Error fetching prep notes:', err);
      // Fall back to mock data on error
      const isLocalDev = window.location.hostname === 'localhost';
      if (isLocalDev) {
        const mockNotes = getMockNotes(session.clientName || '', session.clientInitials, session.status);
        setPrepNotes(mockNotes);
        setOriginalNotes(mockNotes);
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePrepNotes = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const azureUserId = user?.localAccountId || (user?.homeAccountId?.split('.')[0]) || '';

      const response = await fetch(`${API_BASE_URL}/clinical-notes/generate-prep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Azure-User-Id': azureUserId,
        },
        body: JSON.stringify({
          patientInitials: session.clientInitials,
          patientName: session.clientName,
          appointmentId: session.id,
          upcomingSessionType: session.sessionType || 'therapy',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.prepSummary) {
          setPrepNotes(data.data.prepSummary);
          setOriginalNotes(data.data.prepSummary);
        }
      }
    } catch (err) {
      console.error('Error generating prep notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePrepNotes = async () => {
    setSaving(true);
    try {
      const token = await getAccessToken();
      const azureUserId = user?.localAccountId || (user?.homeAccountId?.split('.')[0]) || '';

      await fetch(`${API_BASE_URL}/clinical-notes/prep/${session.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Azure-User-Id': azureUserId,
        },
        body: JSON.stringify({ notes: prepNotes }),
      });

      setOriginalNotes(prepNotes);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving prep notes:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAskAI = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setAiLoading(true);

    try {
      const token = await getAccessToken();
      const azureUserId = user?.localAccountId || (user?.homeAccountId?.split('.')[0]) || '';

      const response = await fetch(`${API_BASE_URL}/clinical-notes/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Azure-User-Id': azureUserId,
        },
        body: JSON.stringify({
          appointmentId: session.id,
          patientInitials: session.clientInitials,
          patientName: session.clientName,
          message: chatInput,
          context: prepNotes,
          conversationHistory: chatMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data?.response || 'I apologize, I was unable to process that request.',
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (err) {
      console.error('Error asking AI:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  const _handleAIEditNotes = async () => {
    setAiLoading(true);
    try {
      const token = await getAccessToken();
      const azureUserId = user?.localAccountId || (user?.homeAccountId?.split('.')[0]) || '';

      const response = await fetch(`${API_BASE_URL}/clinical-notes/enhance-prep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Azure-User-Id': azureUserId,
        },
        body: JSON.stringify({
          appointmentId: session.id,
          patientInitials: session.clientInitials,
          currentNotes: prepNotes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.enhancedNotes) {
          setPrepNotes(data.data.enhancedNotes);
          setIsEditing(true);
        }
      }
    } catch (err) {
      console.error('Error enhancing notes:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleMarkPrepComplete = () => {
    // Save notes if changed
    if (prepNotes !== originalNotes) {
      savePrepNotes();
    }
    onPrepComplete?.(session.id, prepNotes);
    onClose();
  };

  const hasChanges = prepNotes !== originalNotes;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.warmWhite,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.lavenderLight}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.white,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.sage}, ${colors.sageLight})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.white,
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '18px',
                fontWeight: 600,
              }}>
                {session.clientInitials}
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontFamily: "'Crimson Text', Georgia, serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  color: colors.charcoal,
                }}>
                  Prep Notes
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: colors.charcoalLight,
                }}>
                  {session.clientName || session.clientInitials} · {session.time}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.charcoalLight,
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.lavenderLight}`,
            backgroundColor: colors.white,
          }}>
            <button
              onClick={() => setActiveTab('notes')}
              style={{
                flex: 1,
                padding: '12px 20px',
                border: 'none',
                background: activeTab === 'notes' ? colors.warmWhite : 'transparent',
                color: activeTab === 'notes' ? colors.sage : colors.charcoalLight,
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                borderBottom: activeTab === 'notes' ? `2px solid ${colors.sage}` : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              📝 Notes
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '12px 20px',
                border: 'none',
                background: activeTab === 'chat' ? colors.warmWhite : 'transparent',
                color: activeTab === 'chat' ? colors.lavender : colors.charcoalLight,
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                borderBottom: activeTab === 'chat' ? `2px solid ${colors.lavender}` : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <SparkleIcon /> Ask Bloom
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
            {loading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                gap: '16px',
              }}>
                <LoadingSpinner />
                <p style={{ color: colors.charcoalLight, fontSize: '14px' }}>
                  Preparing session context...
                </p>
              </div>
            ) : activeTab === 'notes' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Notes Header with Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: colors.charcoalLight,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Session Preparation
                  </span>
                </div>

                {/* Notes Editor */}
                <div style={{
                  backgroundColor: colors.white,
                  borderRadius: '12px',
                  border: `1px solid ${isEditing ? colors.sage : colors.lavenderLight}`,
                  padding: '16px',
                  transition: 'border-color 0.2s',
                }}>
                  {isEditing ? (
                    <textarea
                      ref={textareaRef}
                      value={prepNotes}
                      onChange={(e) => setPrepNotes(e.target.value)}
                      placeholder="Add your prep notes here..."
                      style={{
                        width: '100%',
                        minHeight: '250px',
                        border: 'none',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        fontSize: '15px',
                        lineHeight: 1.6,
                        color: colors.charcoal,
                        backgroundColor: 'transparent',
                      }}
                    />
                  ) : (
                    <div
                      onClick={() => !session.status || session.status !== 'completed' ? setIsEditing(true) : null}
                      style={{
                        minHeight: '250px',
                        fontSize: '15px',
                        lineHeight: 1.7,
                        color: prepNotes ? colors.charcoal : colors.charcoalLight,
                        cursor: session.status === 'completed' ? 'default' : 'text',
                      }}
                    >
                      {prepNotes ? (
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: prepNotes
                              // Headers
                              .replace(/^### (.+)$/gm, '<h4 style="margin: 1rem 0 0.5rem; font-size: 14px; font-weight: 600; color: #6B8E7F;">$1</h4>')
                              .replace(/^## (.+)$/gm, '<h3 style="margin: 1.25rem 0 0.75rem; font-size: 16px; font-weight: 600; color: #3A3A3A;">$1</h3>')
                              // Bold
                              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              // Italic
                              .replace(/\*(.+?)\*/g, '<em style="color: #636e72;">$1</em>')
                              // Checkboxes
                              .replace(/- \[ \] (.+)/g, '<div style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;"><span style="color: #a8c5bb;">☐</span><span>$1</span></div>')
                              .replace(/- \[x\] (.+)/gi, '<div style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;"><span style="color: #6B8E7F;">☑</span><span style="text-decoration: line-through; color: #636e72;">$1</span></div>')
                              // Bullet lists
                              .replace(/^- (.+)$/gm, '<div style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;"><span style="color: #9B8BC4;">•</span><span>$1</span></div>')
                              // Numbered lists
                              .replace(/^(\d+)\. (.+)$/gm, '<div style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;"><span style="color: #6B8E7F; font-weight: 500;">$1.</span><span>$2</span></div>')
                              // Tables (simple)
                              .replace(/\|(.+)\|/g, (match) => {
                                const cells = match.split('|').filter(c => c.trim());
                                if (cells.every(c => c.trim().match(/^-+$/))) return ''; // Skip separator row
                                const cellStyle = 'padding: 6px 12px; border-bottom: 1px solid #E8E4F0;';
                                return '<div style="display: flex; margin: 2px 0;">' + 
                                  cells.map(c => `<span style="${cellStyle}">${c.trim()}</span>`).join('') + 
                                  '</div>';
                              })
                              // Horizontal rules
                              .replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #E8E4F0; margin: 1rem 0;" />')
                              // Line breaks
                              .replace(/\n\n/g, '<br/><br/>')
                              .replace(/\n/g, '<br/>')
                          }} 
                        />
                      ) : (
                        'Click to add prep notes...'
                      )}
                    </div>
                  )}
                </div>

                {/* Edit Actions */}
                {isEditing && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                  }}>
                    <button
                      onClick={() => {
                        setPrepNotes(originalNotes);
                        setIsEditing(false);
                      }}
                      style={{
                        padding: '8px 16px',
                        border: `1px solid ${colors.lavenderLight}`,
                        borderRadius: '8px',
                        background: colors.white,
                        color: colors.charcoalLight,
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={savePrepNotes}
                      disabled={saving}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        background: colors.sage,
                        color: colors.white,
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Chat Tab */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px' }}>
                {/* Chat Messages */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  {chatMessages.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: colors.charcoalLight,
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${colors.lavender}20, ${colors.sage}20)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}>
                        <SparkleIcon />
                      </div>
                      <p style={{ fontSize: '15px', marginBottom: '8px' }}>
                        Ask me anything about this patient
                      </p>
                      <p style={{ fontSize: '13px', opacity: 0.8 }}>
                        I can help with session history, patterns, and preparation suggestions.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{
                          maxWidth: '80%',
                          padding: '12px 16px',
                          borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          backgroundColor: msg.role === 'user' ? colors.sage : colors.white,
                          color: msg.role === 'user' ? colors.white : colors.charcoal,
                          fontSize: '14px',
                          lineHeight: 1.5,
                          boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {aiLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '16px 16px 16px 4px',
                        backgroundColor: colors.white,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}>
                        <LoadingSpinner />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: colors.white,
                  borderRadius: '12px',
                  border: `1px solid ${colors.lavenderLight}`,
                }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAskAI()}
                    placeholder="Ask about this patient..."
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      color: colors.charcoal,
                      backgroundColor: 'transparent',
                    }}
                  />
                  <button
                    onClick={handleAskAI}
                    disabled={!chatInput.trim() || aiLoading}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: chatInput.trim() ? colors.lavender : colors.lavenderLight,
                      color: colors.white,
                      cursor: chatInput.trim() ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SendIcon />
                  </button>
                </div>

                {/* Quick Actions */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: '12px',
                }}>
                  {[
                    'What patterns have we seen?',
                    'Key themes to explore',
                    'Risk considerations',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setChatInput(suggestion);
                      }}
                      style={{
                        padding: '6px 12px',
                        border: `1px solid ${colors.lavenderLight}`,
                        borderRadius: '20px',
                        background: colors.white,
                        color: colors.charcoalLight,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: `1px solid ${colors.lavenderLight}`,
            backgroundColor: colors.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ fontSize: '13px', color: colors.charcoalLight }}>
              {hasChanges && <span style={{ color: colors.amber }}>● Unsaved changes</span>}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 20px',
                  border: `1px solid ${colors.lavenderLight}`,
                  borderRadius: '10px',
                  background: colors.white,
                  color: colors.charcoalLight,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              {session.status === 'completed' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    background: `${colors.sage}15`,
                    color: colors.sage,
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  <CheckIcon />
                  Session Complete
                </div>
              ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMarkPrepComplete}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                  color: colors.white,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 2px 8px ${colors.sage}40`,
                }}
              >
                <CheckIcon />
                Prep Complete
              </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PrepNotesModal;
