'use client';

interface BookNowButtonProps {
  variant: 'desktop' | 'mobile';
}

export function BookNowButton({ variant }: BookNowButtonProps) {
  const handleClick = () => {
    // Track booking click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'booking_cta_click', {
        event_category: 'Booking',
        event_label: `${variant}_navigation`,
      });
    }
    window.open('https://life-psychology.au2.halaxy.com/book', '_blank');
  };

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-blue-500/20"
      >
        <span className="flex items-center gap-1">
          <span className="text-sm">📅</span>
          <span>Book</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="ml-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-blue-500/20"
    >
      <span className="flex items-center gap-1">
        <span className="text-sm">📅</span>
        <span>Book Now</span>
      </span>
    </button>
  );
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
