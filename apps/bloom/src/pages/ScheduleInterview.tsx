/**
 * Interview Scheduling Page
 * 
 * A Miyazaki-inspired scheduling experience that treats each moment as precious.
 * Uses the Bloom design system's natural, warm aesthetic.
 * 
 * "I want to spend as much time there as possible" - Miyazaki
 */

import { useState, useEffect, useMemo, useRef } from 'react';
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
// DECORATIVE COMPONENTS - Natural touches
// ============================================================================

// Floating petals in the background
const FloatingPetals = () => {
  // Generate random values once on mount using a ref to avoid impure render
  const petalsRef = useRef<Array<{
    id: number;
    left: string;
    delay: number;
    duration: number;
    size: number;
    rotation: number;
  }> | null>(null);
  
  if (petalsRef.current === null) {
    petalsRef.current = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${10 + (((i * 17 + 3) % 80))}%`, // Deterministic spread
      delay: (i * 1.2) % 8,
      duration: 12 + (i % 4) * 2,
      size: 8 + (i % 3) * 4,
      rotation: (i * 45) % 360,
    }));
  }
  
  const petals = petalsRef.current;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {petals.map(petal => (
        <motion.div
          key={petal.id}
          initial={{ y: -20, x: 0, rotate: petal.rotation, opacity: 0 }}
          animate={{ 
            y: '100vh',
            x: [0, 30, -20, 40, 0],
            rotate: petal.rotation + 360,
            opacity: [0, 0.6, 0.6, 0.6, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            left: petal.left,
            top: 0,
            width: petal.size,
            height: petal.size,
            borderRadius: '50% 0 50% 50%',
            background: `linear-gradient(135deg, ${colors.lavenderMid} 0%, ${colors.terracottaLight} 100%)`,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
};

// Bloom logo header
const BloomLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', justifyContent: 'center' }}>
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" fill={colors.sagePale} />
      <path
        d="M24 14C24 14 20 18 20 24C20 30 24 34 24 34C24 34 28 30 28 24C28 18 24 14 24 14Z"
        fill={colors.sage}
        opacity="0.8"
      />
      <path
        d="M14 24C14 24 18 20 24 20C30 20 34 24 34 24C34 24 30 28 24 28C18 28 14 24 14 24Z"
        fill={colors.sage}
        opacity="0.6"
      />
      <circle cx="24" cy="24" r="4" fill={colors.terracotta} />
    </svg>
    <span style={{ 
      fontFamily: "'Crimson Text', Georgia, serif",
      fontSize: '24px',
      fontWeight: 600,
      color: colors.sageDeep,
      letterSpacing: '-0.5px',
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
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

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
    return slots.reduce((acc, slot) => {
      const dateKey = new Date(slot.start).toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    }, {} as Record<string, TimeSlot[]>);
  }, [slots]);

  const formatDate = (dateKey: string) => {
    const date = new Date(dateKey + 'T12:00:00');
    return {
      weekday: date.toLocaleDateString('en-AU', { weekday: 'long' }),
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
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get time-of-day category for visual styling
  const getTimeCategory = (dateStr: string): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date(dateStr).getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const timeColors = {
    morning: { bg: colors.lavenderLight, border: colors.lavenderMid, text: colors.charcoal },
    afternoon: { bg: colors.sagePale, border: colors.sageLighter, text: colors.sageDeep },
    evening: { bg: colors.creamDark, border: colors.terracottaLight, text: colors.charcoal },
  };

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  // Loading state - gentle breathing animation
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lavenderLight} 50%, ${colors.sagePale} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <FloatingPetals />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', zIndex: 1 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 80,
              height: 80,
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '32px' }}>🌸</span>
          </motion.div>
          <p style={{ 
            color: colors.charcoalLight, 
            fontSize: '16px',
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}>
            Finding available times...
          </p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error && !slots.length && !alreadyScheduled) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lavenderLight} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <FloatingPetals />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: 420,
            width: '100%',
            background: colors.white,
            borderRadius: 24,
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(122, 141, 122, 0.12)',
            zIndex: 1,
          }}
        >
          <div style={{
            width: 72,
            height: 72,
            margin: '0 auto 24px',
            borderRadius: '50%',
            background: colors.errorLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '32px' }}>🍂</span>
          </div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 600, 
            color: colors.charcoal, 
            marginBottom: 12,
            fontFamily: "'Crimson Text', Georgia, serif",
          }}>
            Unable to Load
          </h1>
          <p style={{ color: colors.charcoalLight, marginBottom: 24, lineHeight: 1.6 }}>
            {error}
          </p>
          <p style={{ fontSize: '14px', color: colors.charcoalLight }}>
            Need help?{' '}
            <a 
              href="mailto:support@life-psychology.com.au" 
              style={{ color: colors.sage, textDecoration: 'underline' }}
            >
              Contact support
            </a>
          </p>
        </motion.div>
      </div>
    );
  }

  // Already scheduled state
  if (alreadyScheduled && !success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.sagePale} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <FloatingPetals />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: 420,
            width: '100%',
            background: colors.white,
            borderRadius: 24,
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(122, 141, 122, 0.12)',
            zIndex: 1,
          }}
        >
          <BloomLogo />
          <div style={{
            width: 80,
            height: 80,
            margin: '24px auto',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.sagePale} 0%, ${colors.lavenderLight} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '36px' }}>✨</span>
          </div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 600, 
            color: colors.charcoal, 
            marginBottom: 12,
            fontFamily: "'Crimson Text', Georgia, serif",
          }}>
            Already Scheduled
          </h1>
          {applicant && (
            <p style={{ color: colors.charcoalLight, marginBottom: 20 }}>
              Hi {applicant.firstName}! Your interview is already on the calendar.
            </p>
          )}
          {scheduledAt && (
            <div style={{
              background: colors.sagePale,
              borderRadius: 16,
              padding: '20px 24px',
              marginBottom: 24,
            }}>
              <p style={{ 
                color: colors.sageDeep, 
                fontWeight: 600,
                fontSize: '16px',
              }}>
                {formatDateTime(scheduledAt)}
              </p>
            </div>
          )}
          <p style={{ fontSize: '14px', color: colors.charcoalLight, lineHeight: 1.6 }}>
            Check your email for the interview link. Need to reschedule?{' '}
            <a 
              href="mailto:support@life-psychology.com.au" 
              style={{ color: colors.sage, textDecoration: 'underline' }}
            >
              Contact us
            </a>
          </p>
        </motion.div>
      </div>
    );
  }

  // Success state - celebrate the booking!
  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.sagePale} 0%, ${colors.lavenderLight} 50%, ${colors.cream} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <FloatingPetals />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            maxWidth: 480,
            width: '100%',
            background: colors.white,
            borderRadius: 24,
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 12px 48px rgba(122, 141, 122, 0.15)',
            zIndex: 1,
          }}
        >
          <BloomLogo />
          
          {/* Celebration animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: 100,
              height: 100,
              margin: '24px auto',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 24px ${colors.sage}40`,
            }}
          >
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              style={{ fontSize: '48px' }}
            >
              🌸
            </motion.span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ 
              fontSize: '28px', 
              fontWeight: 600, 
              color: colors.charcoal, 
              marginBottom: 8,
              fontFamily: "'Crimson Text', Georgia, serif",
            }}
          >
            You're All Set!
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ color: colors.charcoalLight, marginBottom: 24, fontSize: '16px' }}
          >
            We're looking forward to meeting you.
          </motion.p>
          
          {scheduledAt && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                background: `linear-gradient(135deg, ${colors.sagePale} 0%, ${colors.lavenderLight} 100%)`,
                borderRadius: 16,
                padding: '24px',
                marginBottom: 28,
              }}
            >
              <p style={{ 
                fontSize: '13px', 
                color: colors.charcoalLight, 
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Your Interview
              </p>
              <p style={{ 
                color: colors.sageDeep, 
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: 1.4,
              }}>
                {formatDateTime(scheduledAt)}
              </p>
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {interviewLink && (
              <a
                href={interviewLink}
                style={{
                  display: 'block',
                  padding: '16px 24px',
                  background: colors.sage,
                  color: colors.white,
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: '15px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.sageDark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.sage;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                📹 Save Interview Link
              </a>
            )}
            <p style={{ fontSize: '14px', color: colors.charcoalLight }}>
              A confirmation email is on its way to your inbox.
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ============================================================================
  // MAIN SCHEDULING UI
  // ============================================================================
  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.lavenderLight} 50%, ${colors.sagePale} 100%)`,
      paddingBottom: selectedSlot ? 140 : 48,
    }}>
      <FloatingPetals />
      
      {/* Header */}
      <header style={{
        padding: '32px 24px 24px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BloomLogo />
          
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 600, 
            color: colors.charcoal, 
            marginTop: 16,
            marginBottom: 8,
            fontFamily: "'Crimson Text', Georgia, serif",
          }}>
            Schedule Your Interview
          </h1>
          
          {applicant && (
            <p style={{ color: colors.charcoalLight, fontSize: '16px', marginBottom: 8 }}>
              Hi {applicant.firstName}! Choose a time that works for you.
            </p>
          )}
          
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '8px 16px',
            background: `${colors.white}90`,
            borderRadius: 20,
            fontSize: '14px',
            color: colors.charcoalLight,
          }}>
            <span>🎥</span>
            <span>30-minute video call</span>
          </div>
        </motion.div>
      </header>
      
      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              maxWidth: 600,
              margin: '0 auto 16px',
              padding: '12px 20px',
              background: colors.errorLight,
              borderRadius: 12,
              color: colors.error,
              fontSize: '14px',
              marginLeft: 24,
              marginRight: 24,
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main content */}
      <main style={{ 
        maxWidth: 640, 
        margin: '0 auto', 
        padding: '0 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        {Object.keys(slotsByDate).length === 0 ? (
          // No slots available
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: colors.white,
              borderRadius: 20,
              padding: '48px 32px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(122, 141, 122, 0.08)',
            }}
          >
            <div style={{
              width: 72,
              height: 72,
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: colors.creamDark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '32px' }}>🍃</span>
            </div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 600, 
              color: colors.charcoal, 
              marginBottom: 12,
              fontFamily: "'Crimson Text', Georgia, serif",
            }}>
              No Times Available
            </h2>
            <p style={{ color: colors.charcoalLight, marginBottom: 20, lineHeight: 1.6 }}>
              There are currently no available slots. Please check back soon or reach out to us.
            </p>
            <a
              href="mailto:support@life-psychology.com.au"
              style={{ color: colors.sage, textDecoration: 'underline', fontSize: '14px' }}
            >
              Contact Support
            </a>
          </motion.div>
        ) : (
          // Date cards with time slots
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(slotsByDate).map(([dateKey, dateSlots], index) => {
              const { weekday, day, month } = formatDate(dateKey);
              const isExpanded = hoveredDate === dateKey || !hoveredDate;
              
              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredDate(dateKey)}
                  onMouseLeave={() => setHoveredDate(null)}
                  style={{
                    background: colors.white,
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: isExpanded 
                      ? '0 8px 32px rgba(122, 141, 122, 0.12)'
                      : '0 2px 12px rgba(122, 141, 122, 0.06)',
                    transition: 'all 0.3s ease',
                    transform: isExpanded ? 'scale(1)' : 'scale(0.98)',
                  }}
                >
                  {/* Date header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '20px 24px',
                    borderBottom: `1px solid ${colors.sagePale}`,
                    background: `linear-gradient(90deg, ${colors.warmWhite} 0%, ${colors.cream} 100%)`,
                  }}>
                    {/* Calendar icon */}
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.white,
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>
                        {month}
                      </span>
                      <span style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>
                        {day}
                      </span>
                    </div>
                    
                    <div>
                      <p style={{ 
                        fontSize: '18px', 
                        fontWeight: 600, 
                        color: colors.charcoal,
                        fontFamily: "'Crimson Text', Georgia, serif",
                      }}>
                        {weekday}
                      </p>
                      <p style={{ fontSize: '13px', color: colors.charcoalLight }}>
                        {dateSlots.length} time{dateSlots.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>
                  
                  {/* Time slots */}
                  <div style={{ padding: '16px 20px 20px' }}>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 10,
                    }}>
                      {dateSlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        const timeCategory = getTimeCategory(slot.start);
                        const tColors = timeColors[timeCategory];
                        
                        return (
                          <motion.button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                              padding: '12px 18px',
                              borderRadius: 10,
                              border: `2px solid ${isSelected ? colors.sage : tColors.border}`,
                              background: isSelected 
                                ? `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`
                                : tColors.bg,
                              color: isSelected ? colors.white : tColors.text,
                              fontSize: '15px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: isSelected 
                                ? `0 4px 12px ${colors.sage}40`
                                : 'none',
                            }}
                          >
                            {formatTime(slot.start)}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Fixed bottom bar when slot is selected */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: colors.white,
              borderTop: `1px solid ${colors.sagePale}`,
              padding: '16px 24px',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
              zIndex: 100,
            }}
          >
            <div style={{ 
              maxWidth: 600, 
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ 
                  fontSize: '12px', 
                  color: colors.charcoalLight, 
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Selected
                </p>
                <p style={{ 
                  fontSize: '15px', 
                  fontWeight: 600, 
                  color: colors.charcoal,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {formatDateTime(selectedSlot.start)}
                </p>
              </div>
              
              <motion.button
                onClick={bookSlot}
                disabled={booking}
                whileHover={{ scale: booking ? 1 : 1.02 }}
                whileTap={{ scale: booking ? 1 : 0.98 }}
                style={{
                  padding: '14px 28px',
                  background: booking 
                    ? colors.sageLighter 
                    : `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageDark} 100%)`,
                  color: colors.white,
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: '15px',
                  border: 'none',
                  cursor: booking ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: booking ? 'none' : `0 4px 12px ${colors.sage}40`,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                {booking ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      ⏳
                    </motion.span>
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
