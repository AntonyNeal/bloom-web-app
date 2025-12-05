import React from 'react';
import { conversionManager } from '../tracking';
import { useBooking } from '../hooks/useBooking';

interface BookingButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  customUrl?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Reusable BookingButton component that automatically handles Google Ads conversion tracking
 * for all Halaxy booking links across the site
 */
export const BookingButton: React.FC<BookingButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  customUrl: _customUrl,
  onClick,
}) => {
  const { openBookingModal } = useBooking('booking_button');
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary:
      'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
    outline:
      'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-3 text-base gap-3',
    lg: 'px-6 py-4 text-lg gap-4',
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Track booking intent in unified tracking system
    conversionManager.trackBookingIntent('booking_button');

    // Call custom onClick if provided
    if (onClick) {
      onClick(event);
    }

    openBookingModal(event);
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * Reusable BookingLink component for anchor-style booking links
 */
interface BookingLinkProps {
  children: React.ReactNode;
  className?: string;
  customUrl?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const BookingLink: React.FC<BookingLinkProps> = ({
  children,
  className = '',
  customUrl: _customUrl,
  onClick,
}) => {
  const { openBookingModal } = useBooking('booking_link');
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Track booking intent in unified tracking system
    conversionManager.trackBookingIntent('booking_link');

    // Call custom onClick if provided
    if (onClick) {
      onClick(event);
    }

    openBookingModal(event);
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 hover:text-blue-700 transition-colors ${className}`}
    >
      {children}
    </a>
  );
};
