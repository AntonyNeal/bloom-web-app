'use client';

interface BookingButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function BookingButton({ children, className = '' }: BookingButtonProps) {
  const handleClick = () => {
    // Track the click event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'booking_cta_click', {
        event_category: 'Booking',
        event_label: 'hero_booking_button',
      });
    }
    
    // Open booking modal or redirect to booking page
    window.open('https://life-psychology.au2.halaxy.com/book', '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
