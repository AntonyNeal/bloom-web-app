'use client';

export function FooterBookingButton() {
  const handleBookingClick = () => {
    // Track the click event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'booking_cta_click', {
        event_category: 'Booking',
        event_label: 'footer_booking_button',
      });
    }
    
    // Open Halaxy booking
    window.open('https://life-psychology.au2.halaxy.com/book', '_blank');
  };

  return (
    <button
      onClick={handleBookingClick}
      className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-full sm:w-auto justify-center gap-2"
      type="button"
    >
      <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100/70 rounded-md border border-blue-200/60 shadow-sm text-sm sm:text-lg">
        📅
      </span>
      <span className="sm:text-sm">Book Appointment</span>
    </button>
  );
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
