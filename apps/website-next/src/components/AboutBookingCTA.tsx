'use client';

export function AboutBookingCTA() {
  const handleBookingClick = () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'booking_cta_click', {
        event_category: 'Booking',
        event_label: 'about_page_cta',
      });
    }
    window.open('https://life-psychology.au2.halaxy.com/book', '_blank');
  };

  return (
    <button
      onClick={handleBookingClick}
      className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      type="button"
    >
      Book an Appointment
    </button>
  );
}
