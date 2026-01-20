/**
 * Miyazaki-Inspired Floating Calendar
 * 
 * A dreamy, organic date picker that floats like petals drifting
 * on a gentle breeze. Inspired by Studio Ghibli's soft, nature-filled worlds.
 * 
 * Features:
 * - Soft floating animation on open/close
 * - Gentle petal decorations
 * - Warm, hand-crafted feel
 * - Week view for quick navigation
 */

import { useState, useRef, useEffect } from 'react';

interface FloatingCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function FloatingCalendar({ selectedDate, onDateSelect }: FloatingCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const openCalendar = () => {
    setIsAnimating(true);
    setIsOpen(true);
  };

  const closeCalendar = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 300);
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    closeCalendar();
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeCalendar();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Get days of current week
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Get mini month calendar
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() + 6) % 7; // Monday start
    
    const days: (Date | null)[] = [];
    
    // Padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatDay = (date: Date) => {
    return date.toLocaleDateString('en-AU', { weekday: 'short' }).slice(0, 2);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  };

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return date.toLocaleDateString('en-AU', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'short' 
    });
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isSelected = (date: Date) => date.toDateString() === selectedDate.toDateString();

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    onDateSelect(newDate);
  };

  const goToToday = () => {
    onDateSelect(new Date());
  };

  const weekDays = getWeekDays(selectedDate);
  const monthDays = getMonthDays(selectedDate);

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Trigger Button - The Date Display */}
      <button onClick={openCalendar} style={styles.trigger}>
        <span style={styles.triggerIcon}>🌸</span>
        <span style={styles.triggerText}>{formatDisplayDate(selectedDate)}</span>
        <span style={styles.triggerChevron}>{isOpen ? '▴' : '▾'}</span>
      </button>

      {/* Floating Calendar Panel */}
      {isOpen && (
        <div style={{
          ...styles.floatingPanel,
          animation: isAnimating 
            ? (isOpen ? 'floatIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'floatOut 0.3s ease-in forwards')
            : undefined,
        }}>
          {/* Decorative Petals */}
          <div style={styles.petalTopLeft}>🌸</div>
          <div style={styles.petalTopRight}>✿</div>
          <div style={styles.petalBottomRight}>❀</div>

          {/* Month Header */}
          <div style={styles.monthHeader}>
            <button onClick={() => navigateMonth(-1)} style={styles.navButton}>←</button>
            <span style={styles.monthTitle}>{formatMonth(selectedDate)}</span>
            <button onClick={() => navigateMonth(1)} style={styles.navButton}>→</button>
          </div>

          {/* Quick Week View */}
          <div style={styles.weekStrip}>
            {weekDays.map((day, i) => (
              <button
                key={i}
                onClick={() => handleDateSelect(day)}
                style={{
                  ...styles.weekDay,
                  ...(isToday(day) ? styles.weekDayToday : {}),
                  ...(isSelected(day) ? styles.weekDaySelected : {}),
                }}
              >
                <span style={styles.weekDayName}>{formatDay(day)}</span>
                <span style={styles.weekDayNum}>{day.getDate()}</span>
              </button>
            ))}
          </div>

          {/* Mini Month Grid */}
          <div style={styles.monthGrid}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <div key={d} style={styles.monthGridHeader}>{d}</div>
            ))}
            {monthDays.map((day, i) => (
              <button
                key={i}
                onClick={() => day && handleDateSelect(day)}
                disabled={!day}
                style={{
                  ...styles.monthDay,
                  ...(day && isToday(day) ? styles.monthDayToday : {}),
                  ...(day && isSelected(day) ? styles.monthDaySelected : {}),
                  ...(!day ? styles.monthDayEmpty : {}),
                }}
              >
                {day?.getDate()}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={styles.quickActions}>
            <button onClick={goToToday} style={styles.todayButton}>
              ↻ Go to Today
            </button>
          </div>

          {/* Decorative vine */}
          <div style={styles.vineDecoration}>
            <svg width="100%" height="20" viewBox="0 0 200 20" style={{ opacity: 0.15 }}>
              <path 
                d="M0,10 Q25,0 50,10 T100,10 T150,10 T200,10" 
                fill="none" 
                stroke="#6B8E7F" 
                strokeWidth="2"
              />
              <circle cx="30" cy="8" r="3" fill="#6B8E7F" />
              <circle cx="80" cy="12" r="2" fill="#6B8E7F" />
              <circle cx="130" cy="8" r="3" fill="#6B8E7F" />
              <circle cx="170" cy="11" r="2" fill="#6B8E7F" />
            </svg>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes floatIn {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95) rotate(-2deg);
          }
          60% {
            transform: translateY(5px) scale(1.02) rotate(0.5deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }
        
        @keyframes floatOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-15px) scale(0.95);
          }
        }
        
        @keyframes gentleSway {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50% { transform: rotate(2deg) translateY(-3px); }
        }
        
        @keyframes petalFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(10deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,250,245,0.95) 100%)',
    border: '1px solid rgba(107, 142, 127, 0.2)',
    borderRadius: '24px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
    color: '#4A5568',
    boxShadow: '0 2px 12px rgba(107, 142, 127, 0.1)',
    transition: 'all 0.3s ease',
  },
  triggerIcon: {
    fontSize: '16px',
  },
  triggerText: {
    color: '#2D3748',
    fontWeight: 600,
  },
  triggerChevron: {
    fontSize: '10px',
    color: '#A0AEC0',
    marginLeft: '4px',
  },
  floatingPanel: {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '320px',
    background: 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(255,252,248,0.98) 50%, rgba(255,250,245,0.98) 100%)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '20px',
    boxShadow: `
      0 4px 6px rgba(107, 142, 127, 0.07),
      0 10px 20px rgba(107, 142, 127, 0.1),
      0 20px 40px rgba(107, 142, 127, 0.08),
      inset 0 1px 0 rgba(255,255,255,0.9)
    `,
    border: '1px solid rgba(107, 142, 127, 0.15)',
    overflow: 'hidden',
  },
  petalTopLeft: {
    position: 'absolute',
    top: '8px',
    left: '12px',
    fontSize: '14px',
    opacity: 0.4,
    animation: 'petalFloat 4s ease-in-out infinite',
  },
  petalTopRight: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    fontSize: '12px',
    opacity: 0.3,
    animation: 'petalFloat 5s ease-in-out infinite 0.5s',
  },
  petalBottomRight: {
    position: 'absolute',
    bottom: '40px',
    right: '20px',
    fontSize: '10px',
    opacity: 0.25,
    animation: 'petalFloat 6s ease-in-out infinite 1s',
  },
  monthHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingTop: '4px',
  },
  monthTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2D3748',
    letterSpacing: '0.01em',
  },
  navButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(107, 142, 127, 0.08)',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6B8E7F',
    transition: 'all 0.2s ease',
  },
  weekStrip: {
    display: 'flex',
    gap: '4px',
    marginBottom: '16px',
    padding: '8px',
    background: 'rgba(107, 142, 127, 0.05)',
    borderRadius: '16px',
  },
  weekDay: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 4px',
    background: 'transparent',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  weekDayToday: {
    background: 'rgba(107, 142, 127, 0.15)',
  },
  weekDaySelected: {
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    boxShadow: '0 4px 12px rgba(107, 142, 127, 0.3)',
  },
  weekDayName: {
    fontSize: '10px',
    fontWeight: 500,
    color: '#A0AEC0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  weekDayNum: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2D3748',
  },
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
    marginBottom: '12px',
  },
  monthGridHeader: {
    textAlign: 'center',
    fontSize: '10px',
    fontWeight: 600,
    color: '#A0AEC0',
    padding: '4px',
    textTransform: 'uppercase',
  },
  monthDay: {
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 500,
    color: '#4A5568',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  monthDayToday: {
    background: 'rgba(107, 142, 127, 0.15)',
    fontWeight: 700,
    color: '#6B8E7F',
  },
  monthDaySelected: {
    background: 'linear-gradient(135deg, #6B8E7F 0%, #8FA892 100%)',
    color: 'white',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(107, 142, 127, 0.3)',
  },
  monthDayEmpty: {
    visibility: 'hidden',
  },
  quickActions: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '8px',
    borderTop: '1px solid rgba(107, 142, 127, 0.1)',
    marginTop: '4px',
  },
  todayButton: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(107, 142, 127, 0.2)',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B8E7F',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  vineDecoration: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    height: '20px',
    overflow: 'hidden',
  },
};

export default FloatingCalendar;
