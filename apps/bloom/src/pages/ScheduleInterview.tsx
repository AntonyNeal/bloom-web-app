/**
 * Interview Scheduling Page
 * 
 * A Miyazaki-inspired scheduling experience with efficient space usage.
 * Uses the Bloom design system's natural, warm aesthetic.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../config/api';

// ============================================================================
// DESIGN TOKENS - The palette of a welcoming garden
// ============================================================================
const colors = {
  cream: '#FAF8F3',
  creamDark: '#F5F0E8',
  sage: '#7B8D7B',
  sageLight: '#9BAA9B',
  sageLighter: '#C8D4C8',
  sagePale: '#E8EDE8',
  sageDark: '#5A6B5A',
  sageDeep: '#4A5D4C',
  lavender: '#E8E2F0',
  lavenderLight: '#F3F0F7',
  lavenderMid: '#D4C8E3',
  terracotta: '#D4A59A',
  terracottaLight: '#E8C4BB',
  charcoal: '#3A3A3A',
  charcoalLight: '#5A5A5A',
  white: '#FFFFFF',
  warmWhite: '#FFFEF9',
  error: '#E88B7D',
  errorLight: '#FFF5F4',
};

// ============================================================================
// TYPES
// ============================================================================
interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface ApplicantInfo {
  firstName: string;
  lastName: string;
}

interface ScheduleResponse {
  success: boolean;
  applicant?: ApplicantInfo;
  slots?: TimeSlot[];
  durationMinutes?: number;
  alreadyScheduled?: boolean;
  scheduledAt?: string;
  error?: string;
}

// ============================================================================
// DECORATIVE COMPONENTS
// ============================================================================
const PETALS = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  left: `${10 + (((i * 17 + 3) % 80))}%`,
  delay: (i * 1.5) % 8,
  duration: 15 + (i % 4) * 3,
  size: 6 + (i % 3) * 3,
  rotation: (i * 60) % 360,
}));

const FloatingPetals = () => (
  <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
    {PETALS.map(petal => (
      <motion.div
        key={petal.id}
        initial={{ y: -20, x: 0, rotate: petal.rotation, opacity: 0 }}
        animate={{ 
          y: '100vh',
          x: [0, 20, -15, 25, 0],
          rotate: petal.rotation + 360,
          opacity: [0, 0.4, 0.4, 0.4, 0],
        }}
        transition={{ duration: petal.duration, delay: petal.delay, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          left: petal.left,
          top: 0,
          width: petal.size,
          height: petal.size,
          borderRadius: '50% 0 50% 50%',
          background: `linear-gradient(135deg, ${colors.lavenderMid} 0%, ${colors.terracottaLight} 100%)`,
        }}
      />
    ))}
  </div>
);

const BloomLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" fill={colors.sagePale} />
      <path d="M24 14C24 14 20 18 20 24C20 30 24 34 24 34C24 34 28 30 28 24C28 18 24 14 24 14Z" fill={colors.sage} opacity="0.8" />
      <path d="M14 24C14 24 18 20 24 20C30 20 34 24 34 24C34 24 30 28 24 28C18 28 14 24 14 24Z" fill={colors.sage} opacity="0.6" />
      <circle cx="24" cy="24" r="4" fill={colors.terracotta} />
    </svg>
    <span style={{ 
      fontFamily: "'Crimson Text', Georgia, serif",
      fontSize: '20px',
      fontWeight: 600,
      color: colors.sageDeep,
      letterSpacing: '-0.3px',
    }}>
      Bloom
    </span>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ScheduleInterview() {
  const { token } = useParams<{ token: string }>();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<ApplicantInfo | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [alreadyScheduled, setAlreadyScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [interviewLink, setInterviewLink] = useState<string | null>(null);
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid scheduling link');
      setLoading(false);
      return;
    }
    fetchSlots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchSlots = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.scheduleInterview}/${token}`);
      const data: ScheduleResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load available times');
        return;
      }

      if (data.alreadyScheduled) {
        setAlreadyScheduled(true);
        setScheduledAt(data.scheduledAt || null);
        setApplicant(data.applicant || null);
        return;
      }

      setApplicant(data.applicant || null);
      setSlots(data.slots || []);
    } catch {
      setError('Unable to load scheduling options. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const bookSlot = async () => {
    if (!selectedSlot || !token) return;

    setBooking(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.scheduleInterview}/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to book interview');
        return;
      }

      setSuccess(true);
      setScheduledAt(data.scheduledAt);
      setInterviewLink(data.interviewLink);
    } catch {
      setError('Failed to book interview. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const grouped = slots.reduce((acc, slot) => {
      const dateKey = new Date(slot.start).toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    }, {} as Record<string, TimeSlot[]>);
    
    // Sort slots within each date by time
    Object.values(grouped).forEach(dateSlots => {
      dateSlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    });
    
    return grouped;
  }, [slots]);

  const dateKeys = Object.keys(slotsByDate).sort();

  // Set initial active date
  useEffect(() => {
    if (dateKeys.length > 0 && !activeDateKey) {
      setActiveDateKey(dateKeys[0]);
    }
  }, [dateKeys, activeDateKey]);

  const formatDate = (dateKey: string) => {
    const date = new Date(dateKey + 'T12:00:00');
    return {
      weekday: date.toLocaleDateString('en-AU', { weekday: 'short' }),
      day: date.getDate(),
      month: date.toLocaleDateString('en-AU', { month: 'short' }),
    };
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatShortDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  const containerStyle = {
    minHeight: '100vh',
    background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.lavenderLight} 100%)`,
  };

  // Loading
  if (loading) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FloatingPetals />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', zIndex: 1 }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 64, height: 64, margin: '0 auto 20px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '28px' }}>🌸</span>
          </motion.div>
          <p style={{ color: colors.charcoalLight, fontSize: '15px' }}>Finding available times...</p>
        </motion.div>
      </div>
    );
  }

  // Error
  if (error && !slots.length && !alreadyScheduled) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <FloatingPetals />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: 380, width: '100%', background: colors.white, borderRadius: 20,
            padding: '40px 28px', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(122, 141, 122, 0.12)', zIndex: 1,
          }}
        >
          <div style={{
            width: 60, height: 60, margin: '0 auto 20px', borderRadius: '50%',
            background: colors.errorLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '28px' }}>🍂</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: colors.charcoal, marginBottom: 10, fontFamily: "'Crimson Text', Georgia, serif" }}>
            Unable to Load
          </h1>
          <p style={{ color: colors.charcoalLight, marginBottom: 20, lineHeight: 1.5 }}>{error}</p>
          <p style={{ fontSize: '13px', color: colors.charcoalLight }}>
            Need help? <a href="mailto:support@life-psychology.com.au" style={{ color: colors.sage, textDecoration: 'underline' }}>Contact support</a>
          </p>
        </motion.div>
      </div>
    );
  }

  // Already scheduled
  if (alreadyScheduled && !success) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <FloatingPetals />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: 380, width: '100%', background: colors.white, borderRadius: 20,
            padding: '40px 28px', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(122, 141, 122, 0.12)', zIndex: 1,
          }}
        >
          <BloomLogo />
          <div style={{
            width: 64, height: 64, margin: '20px auto', borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.sagePale} 0%, ${colors.lavenderLight} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '32px' }}>✨</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: colors.charcoal, marginBottom: 10, fontFamily: "'Crimson Text', Georgia, serif" }}>
            Already Scheduled
          </h1>
          {applicant && <p style={{ color: colors.charcoalLight, marginBottom: 16 }}>Hi {applicant.firstName}! Your interview is on the calendar.</p>}
          {scheduledAt && (
            <div style={{ background: colors.sagePale, borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <p style={{ color: colors.sageDeep, fontWeight: 600, fontSize: '15px' }}>{formatDateTime(scheduledAt)}</p>
            </div>
          )}
          <p style={{ fontSize: '13px', color: colors.charcoalLight, lineHeight: 1.5 }}>
            Check your email for the interview link. Need to reschedule? <a href="mailto:support@life-psychology.com.au" style={{ color: colors.sage, textDecoration: 'underline' }}>Contact us</a>
          </p>
        </motion.div>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <FloatingPetals />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            maxWidth: 400, width: '100%', background: colors.white, borderRadius: 20,
            padding: '40px 28px', textAlign: 'center',
            boxShadow: '0 12px 48px rgba(122, 141, 122, 0.15)', zIndex: 1,
          }}
        >
          <BloomLogo />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: 80, height: 80, margin: '20px auto', borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 24px ${colors.sage}40`,
            }}
          >
            <span style={{ fontSize: '40px' }}>🌸</span>
          </motion.div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: colors.charcoal, marginBottom: 8, fontFamily: "'Crimson Text', Georgia, serif" }}>
            You're All Set!
          </h1>
          <p style={{ color: colors.charcoalLight, marginBottom: 20, fontSize: '15px' }}>We're looking forward to meeting you.</p>
          {scheduledAt && (
            <div style={{
              background: `linear-gradient(135deg, ${colors.sagePale} 0%, ${colors.lavenderLight} 100%)`,
              borderRadius: 12, padding: '20px', marginBottom: 24,
            }}>
              <p style={{ fontSize: '12px', color: colors.charcoalLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Interview</p>
              <p style={{ color: colors.sageDeep, fontWeight: 600, fontSize: '16px', lineHeight: 1.4 }}>{formatDateTime(scheduledAt)}</p>
            </div>
          )}
          {interviewLink && (
            <a
              href={interviewLink}
              style={{
                display: 'block', padding: '14px 20px', background: colors.sage, color: colors.white,
                borderRadius: 10, fontWeight: 600, fontSize: '14px', textDecoration: 'none', marginBottom: 12,
              }}
            >
              📹 Save Interview Link
            </a>
          )}
          <p style={{ fontSize: '13px', color: colors.charcoalLight }}>A confirmation email is on its way.</p>
        </motion.div>
      </div>
    );
  }

  // ============================================================================
  // MAIN SCHEDULING UI - Compact Grid Layout
  // ============================================================================
  const activeSlots = activeDateKey ? slotsByDate[activeDateKey] || [] : [];

  return (
    <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', paddingBottom: selectedSlot ? 100 : 20 }}>
      <FloatingPetals />
      
      {/* Compact Header */}
      <header style={{ padding: '20px 16px 12px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <BloomLogo />
          <h1 style={{ 
            fontSize: '24px', fontWeight: 600, color: colors.charcoal, marginTop: 12, marginBottom: 4,
            fontFamily: "'Crimson Text', Georgia, serif",
          }}>
            Schedule Your Interview
          </h1>
          {applicant && (
            <p style={{ color: colors.charcoalLight, fontSize: '14px', marginBottom: 4 }}>
              Hi {applicant.firstName}! Choose a time that works for you.
            </p>
          )}
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', background: `${colors.white}90`, borderRadius: 16,
            fontSize: '13px', color: colors.charcoalLight,
          }}>
            <span>🎥</span>
            <span>30-minute video call</span>
          </div>
        </motion.div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              maxWidth: 500, margin: '0 auto 12px', padding: '10px 16px',
              background: colors.errorLight, borderRadius: 10, color: colors.error,
              fontSize: '13px', marginLeft: 16, marginRight: 16,
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: 500, margin: '0 auto', padding: '0 16px', width: '100%', position: 'relative', zIndex: 1 }}>
        {dateKeys.length === 0 ? (
          // No slots
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: colors.white, borderRadius: 16, padding: '40px 24px', textAlign: 'center',
              boxShadow: '0 4px 20px rgba(122, 141, 122, 0.08)',
            }}
          >
            <div style={{
              width: 56, height: 56, margin: '0 auto 20px', borderRadius: '50%',
              background: colors.creamDark, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '28px' }}>🍃</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.charcoal, marginBottom: 10, fontFamily: "'Crimson Text', Georgia, serif" }}>
              No Times Available
            </h2>
            <p style={{ color: colors.charcoalLight, marginBottom: 16, lineHeight: 1.5, fontSize: '14px' }}>
              Please check back soon or reach out to us.
            </p>
            <a href="mailto:support@life-psychology.com.au" style={{ color: colors.sage, textDecoration: 'underline', fontSize: '13px' }}>
              Contact Support
            </a>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: colors.white, borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(122, 141, 122, 0.1)',
            }}
          >
            {/* Date Tabs - Horizontal scrollable day picker */}
            <div style={{
              display: 'flex', gap: 6, padding: '12px', overflowX: 'auto',
              background: `linear-gradient(180deg, ${colors.warmWhite} 0%, ${colors.cream} 100%)`,
              borderBottom: `1px solid ${colors.sagePale}`,
            }}>
              {dateKeys.map((dateKey) => {
                const { weekday, day, month } = formatDate(dateKey);
                const isActive = dateKey === activeDateKey;
                const slotCount = slotsByDate[dateKey].length;
                
                return (
                  <button
                    key={dateKey}
                    onClick={() => setActiveDateKey(dateKey)}
                    style={{
                      flex: '0 0 auto',
                      minWidth: 60,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: isActive ? `2px solid ${colors.sage}` : `1px solid ${colors.sagePale}`,
                      background: isActive 
                        ? `linear-gradient(135deg, ${colors.sagePale} 0%, ${colors.lavenderLight} 100%)`
                        : colors.white,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 600, color: colors.charcoalLight, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      {weekday}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: isActive ? colors.sageDeep : colors.charcoal, lineHeight: 1.2 }}>
                      {day}
                    </div>
                    <div style={{ fontSize: '10px', color: colors.charcoalLight }}>
                      {month}
                    </div>
                    <div style={{ 
                      fontSize: '9px', 
                      color: colors.sage, 
                      marginTop: 2,
                      fontWeight: 500,
                    }}>
                      {slotCount} slot{slotCount !== 1 ? 's' : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time Slots Grid */}
            <div style={{ padding: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                gap: 8,
              }}>
                {activeSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  
                  return (
                    <motion.button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 8,
                        border: `2px solid ${isSelected ? colors.sage : colors.sagePale}`,
                        background: isSelected 
                          ? `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`
                          : colors.white,
                        color: isSelected ? colors.white : colors.charcoal,
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? `0 4px 12px ${colors.sage}40` : 'none',
                      }}
                    >
                      {formatTime(slot.start)}
                    </motion.button>
                  );
                })}
              </div>

              {activeSlots.length === 0 && (
                <p style={{ textAlign: 'center', color: colors.charcoalLight, fontSize: '14px', padding: '20px 0' }}>
                  No times available for this day
                </p>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Fixed Bottom Bar */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: colors.white, borderTop: `1px solid ${colors.sagePale}`,
              padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 100,
            }}
          >
            <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: '11px', color: colors.charcoalLight, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Selected
                </p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: colors.charcoal, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {formatShortDateTime(selectedSlot.start)}
                </p>
              </div>
              
              <motion.button
                onClick={bookSlot}
                disabled={booking}
                whileHover={{ scale: booking ? 1 : 1.02 }}
                whileTap={{ scale: booking ? 1 : 0.98 }}
                style={{
                  padding: '12px 24px',
                  background: booking ? colors.sageLighter : `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageDark} 100%)`,
                  color: colors.white, borderRadius: 10, fontWeight: 600, fontSize: '14px',
                  border: 'none', cursor: booking ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: booking ? 'none' : `0 4px 12px ${colors.sage}40`,
                  transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                {booking ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                    Booking...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Confirm
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
