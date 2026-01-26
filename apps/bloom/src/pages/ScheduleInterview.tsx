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

  // Group slots by date (using local date, not UTC)
  const slotsByDate = useMemo(() => {
    const grouped = slots.reduce((acc, slot) => {
      // Use local date for grouping (not UTC)
      const date = new Date(slot.start);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

  // Week navigation state
  const [weekOffset, setWeekOffset] = useState(0);

  // Standard business hours for display (7am to 8pm)
  const timeRows = useMemo(() => {
    // Show business hours range, but only include hours that have slots somewhere
    const hoursWithSlots = new Set<number>();
    slots.forEach(slot => {
      const hour = new Date(slot.start).getHours();
      hoursWithSlots.add(hour);
    });
    
    if (hoursWithSlots.size === 0) return [];
    
    // Get min and max hours from actual slots
    const minHour = Math.min(...hoursWithSlots);
    const maxHour = Math.max(...hoursWithSlots);
    
    // Create array of all hours in range
    const hours: number[] = [];
    for (let h = minHour; h <= maxHour; h++) {
      hours.push(h);
    }
    return hours;
  }, [slots]);

  // Helper to format date as local YYYY-MM-DD
  const toLocalDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Get the week's dates based on offset
  const weekDates = useMemo(() => {
    if (dateKeys.length === 0) return [];
    
    // Parse the first date key
    const [year, month, day] = dateKeys[0].split('-').map(Number);
    const firstDate = new Date(year, month - 1, day);
    const startOfWeek = new Date(firstDate);
    startOfWeek.setDate(startOfWeek.getDate() + (weekOffset * 7));
    
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(toLocalDateKey(date));
    }
    return dates;
  }, [dateKeys, weekOffset]);

  // Check if we can navigate to next/prev week
  const canGoPrev = weekOffset > 0;
  const canGoNext = useMemo(() => {
    if (dateKeys.length === 0) return false;
    const lastDateInData = dateKeys[dateKeys.length - 1];
    const lastDateInWeek = weekDates[weekDates.length - 1];
    return lastDateInWeek < lastDateInData;
  }, [dateKeys, weekDates]);

  // Format week range for header
  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) return '';
    const start = new Date(weekDates[0] + 'T12:00:00');
    const end = new Date(weekDates[6] + 'T12:00:00');
    const startStr = start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    return `${startStr} - ${endStr}`;
  }, [weekDates]);

  const formatDate = (dateKey: string) => {
    // Parse YYYY-MM-DD as local date
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      weekday: date.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase(),
      day: date.getDate(),
      month: date.toLocaleDateString('en-AU', { month: 'short' }),
    };
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
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
  // MAIN SCHEDULING UI - Week Grid Layout (Halaxy-inspired, Bloom aesthetic)
  // ============================================================================

  // Helper to get slot for a specific date and hour
  const getSlotsForDateHour = (dateKey: string, hour: number): TimeSlot[] => {
    const dateSlots = slotsByDate[dateKey] || [];
    return dateSlots.filter(slot => new Date(slot.start).getHours() === hour);
  };

  // Check if date is today
  const isToday = (dateKey: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateKey === today;
  };

  return (
    <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <FloatingPetals />
      
      {/* Header */}
      <header style={{ padding: '24px 16px 16px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <BloomLogo />
          <h1 style={{ 
            fontSize: '26px', fontWeight: 600, color: colors.charcoal, marginTop: 14, marginBottom: 6,
            fontFamily: "'Crimson Text', Georgia, serif",
          }}>
            Schedule Your Interview
          </h1>
          {applicant && (
            <p style={{ color: colors.charcoalLight, fontSize: '15px', marginBottom: 6 }}>
              Hi {applicant.firstName}! Choose a time that works for you.
            </p>
          )}
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', background: `${colors.white}90`, borderRadius: 20,
            fontSize: '13px', color: colors.charcoalLight,
          }}>
            <span>🎥</span>
            <span>1-hour video call</span>
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
              maxWidth: 700, margin: '0 auto 12px', padding: '10px 16px',
              background: colors.errorLight, borderRadius: 10, color: colors.error,
              fontSize: '13px', marginLeft: 16, marginRight: 16,
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: 800, margin: '0 auto', padding: '0 16px', width: '100%', position: 'relative', zIndex: 1 }}>
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
            {/* Week Navigation Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              background: `linear-gradient(180deg, ${colors.warmWhite} 0%, ${colors.cream} 100%)`,
              borderBottom: `1px solid ${colors.sagePale}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setWeekOffset(w => w - 1)}
                  disabled={!canGoPrev}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: `1px solid ${colors.sagePale}`,
                    background: canGoPrev ? colors.white : colors.creamDark,
                    color: canGoPrev ? colors.charcoal : colors.charcoalLight,
                    cursor: canGoPrev ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', opacity: canGoPrev ? 1 : 0.5,
                    transition: 'all 0.2s',
                  }}
                >
                  ‹
                </button>
                <span style={{ 
                  fontWeight: 600, color: colors.charcoal, fontSize: '15px',
                  minWidth: 130, textAlign: 'center',
                }}>
                  {weekRangeLabel}
                </span>
                <button
                  onClick={() => setWeekOffset(w => w + 1)}
                  disabled={!canGoNext}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: `1px solid ${colors.sagePale}`,
                    background: canGoNext ? colors.white : colors.creamDark,
                    color: canGoNext ? colors.charcoal : colors.charcoalLight,
                    cursor: canGoNext ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', opacity: canGoNext ? 1 : 0.5,
                    transition: 'all 0.2s',
                  }}
                >
                  ›
                </button>
              </div>
            </div>

            {/* Week Grid */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 600 }}>
                {/* Day Headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '60px repeat(7, 1fr)',
                  borderBottom: `1px solid ${colors.sagePale}`,
                }}>
                  <div style={{ padding: '12px 8px' }} /> {/* Empty corner cell */}
                  {weekDates.map((dateKey) => {
                    const { weekday, day } = formatDate(dateKey);
                    const hasSlots = slotsByDate[dateKey]?.length > 0;
                    const today = isToday(dateKey);
                    
                    return (
                      <div
                        key={dateKey}
                        style={{
                          padding: '12px 4px',
                          textAlign: 'center',
                          background: today ? colors.sagePale : 'transparent',
                          borderRadius: today ? '0' : '0',
                        }}
                      >
                        <div style={{ 
                          fontSize: '11px', 
                          fontWeight: 600, 
                          color: hasSlots ? colors.charcoal : colors.charcoalLight,
                          letterSpacing: '0.5px',
                          opacity: hasSlots ? 1 : 0.5,
                        }}>
                          {weekday}
                        </div>
                        <div style={{ 
                          fontSize: '22px', 
                          fontWeight: 700, 
                          color: today ? colors.sage : (hasSlots ? colors.charcoal : colors.charcoalLight),
                          lineHeight: 1.3,
                          opacity: hasSlots ? 1 : 0.5,
                        }}>
                          {day}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Time Rows */}
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {timeRows.map((hour) => (
                    <div
                      key={hour}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '60px repeat(7, 1fr)',
                        borderBottom: `1px solid ${colors.creamDark}`,
                        minHeight: 48,
                      }}
                    >
                      {/* Hour label */}
                      <div style={{
                        padding: '8px',
                        fontSize: '12px',
                        color: colors.charcoalLight,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-end',
                        paddingRight: 12,
                      }}>
                        {formatHour(hour)}
                      </div>
                      
                      {/* Slots for each day */}
                      {weekDates.map((dateKey) => {
                        const slotsInCell = getSlotsForDateHour(dateKey, hour);
                        const hasAnySlots = slotsByDate[dateKey]?.length > 0;
                        
                        return (
                          <div
                            key={`${dateKey}-${hour}`}
                            style={{
                              padding: '4px 2px',
                              borderLeft: `1px solid ${colors.creamDark}`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2,
                              alignItems: 'center',
                              background: !hasAnySlots ? colors.creamDark + '40' : 'transparent',
                            }}
                          >
                            {slotsInCell.length > 0 ? (
                              slotsInCell.map((slot) => {
                                const isSelected = selectedSlot?.id === slot.id;
                                return (
                                  <motion.button
                                    key={slot.id}
                                    onClick={() => setSelectedSlot(slot)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                      width: '90%',
                                      padding: '6px 4px',
                                      borderRadius: 6,
                                      border: 'none',
                                      background: isSelected 
                                        ? `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`
                                        : colors.sagePale,
                                      color: isSelected ? colors.white : colors.sageDeep,
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s',
                                      boxShadow: isSelected ? `0 2px 8px ${colors.sage}50` : 'none',
                                    }}
                                  >
                                    {formatTime(slot.start)}
                                  </motion.button>
                                );
                              })
                            ) : (
                              hasAnySlots && (
                                <span style={{ color: colors.sageLighter, fontSize: '12px' }}>—</span>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Fixed Bottom Bar */}
      <div style={{ 
        padding: selectedSlot ? '16px' : '24px 16px',
        background: selectedSlot ? colors.white : 'transparent',
        borderTop: selectedSlot ? `1px solid ${colors.sagePale}` : 'none',
        position: selectedSlot ? 'sticky' : 'static',
        bottom: 0,
        marginTop: 'auto',
        zIndex: 10,
      }}>
        <AnimatePresence mode="wait">
          {selectedSlot ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{ 
                maxWidth: 800, 
                margin: '0 auto', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: 16,
              }}
            >
              <button
                onClick={() => setSelectedSlot(null)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: `1px solid ${colors.sagePale}`,
                  borderRadius: 8,
                  color: colors.charcoal,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                ← Back
              </button>
              
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: colors.charcoalLight, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Selected Time
                </p>
                <p style={{ fontSize: '15px', fontWeight: 600, color: colors.charcoal }}>
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
                  transition: 'all 0.2s',
                }}
              >
                {booking ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                    Booking...
                  </>
                ) : (
                  'Confirm →'
                )}
              </motion.button>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                textAlign: 'center', 
                color: colors.charcoalLight, 
                fontSize: '13px',
                maxWidth: 800,
                margin: '0 auto',
              }}
            >
              Select an available time slot to continue
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
