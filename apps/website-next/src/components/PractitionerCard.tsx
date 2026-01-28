/**
 * PractitionerCard Component
 * 
 * Displays a practitioner profile in the directory listing.
 * Designed for conversion optimization based on research findings.
 * 
 * @see docs/epics/DESIGN_SYSTEM_RESEARCH_FINDINGS.md
 * 
 * Information Hierarchy (research-validated order):
 * 1. Photo + Name + Credentials — Immediate recognition and credibility
 * 2. Key Specialty (1-2 max) — Plain language, not clinical jargon
 * 3. Rating + Review Count — Social proof
 * 4. Next Available — Drives action ("Available Tomorrow" outperforms calendars)
 * 5. Price/Gap — Transparent; shows total, rebate, and out-of-pocket
 * 6. CTAs — "Book Consultation" primary, "View Profile" secondary
 */

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface PractitionerCardProps {
  id: string;
  firstName: string;
  lastName: string;
  credentials: string; // e.g., "Clinical Psychologist"
  photoUrl?: string;
  specialties: string[]; // Max 2 displayed
  yearsExperience: number;
  rating?: number; // 1-5
  reviewCount?: number;
  nextAvailable?: string; // e.g., "Tomorrow", "Monday", "This Week"
  sessionPrice: number; // Total fee
  medicareRebate?: number; // Medicare rebate amount
  isAvailableToday?: boolean;
  slug: string;
}

export function PractitionerCard({
  id,
  firstName,
  lastName,
  credentials,
  photoUrl,
  specialties,
  yearsExperience,
  rating,
  reviewCount,
  nextAvailable,
  sessionPrice,
  medicareRebate,
  isAvailableToday,
  slug,
}: PractitionerCardProps) {
  const fullName = `${firstName} ${lastName}`;
  const gap = medicareRebate ? sessionPrice - medicareRebate : sessionPrice;
  const displaySpecialties = specialties.slice(0, 2);
  
  // Format availability for urgency
  const availabilityDisplay = isAvailableToday 
    ? 'Available Today' 
    : nextAvailable 
      ? `Available ${nextAvailable}` 
      : 'Check Availability';
  
  const availabilityUrgent = isAvailableToday || nextAvailable === 'Tomorrow';

  return (
    <article 
      className="group relative bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden border border-slate-200/60"
      aria-labelledby={`practitioner-${id}-name`}
    >
      <div className="p-5 sm:p-6">
        {/* Header: Photo + Name + Credentials */}
        <div className="flex gap-4">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-100">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={`${fullName} profile photo`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 80px, 96px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-trust-100 text-trust-600">
                  <span className="text-2xl font-semibold">
                    {firstName[0]}{lastName[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Name, Credentials, Rating */}
          <div className="flex-1 min-w-0">
            <h3 
              id={`practitioner-${id}-name`}
              className="text-lg sm:text-xl font-semibold text-slate-900 truncate"
            >
              {fullName}
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">{credentials}</p>
            
            {/* Rating */}
            {rating && reviewCount && reviewCount > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex items-center" aria-label={`${rating} out of 5 stars`}>
                  <StarIcon className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="ml-1 text-sm font-medium text-slate-900">{rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-slate-500">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Specialties */}
        <div className="mt-4">
          <p className="text-sm font-medium text-trust-700">
            {displaySpecialties.join(' & ')} Specialist
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            {yearsExperience} years experience
          </p>
        </div>
        
        {/* Availability Badge */}
        <div className="mt-4">
          <div 
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              ${availabilityUrgent 
                ? 'bg-healing-50 text-healing-700 border border-healing-200' 
                : 'bg-slate-50 text-slate-600 border border-slate-200'
              }
            `}
          >
            <CalendarIcon className="w-4 h-4" />
            {availabilityDisplay}
          </div>
        </div>
        
        {/* Pricing */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-slate-900">
              ${sessionPrice}
            </span>
            <span className="text-sm text-slate-500">/session</span>
          </div>
          {medicareRebate && (
            <p className="text-sm text-healing-600 mt-1">
              ${gap.toFixed(2)} gap after ${medicareRebate.toFixed(2)} Medicare rebate
            </p>
          )}
        </div>
        
        {/* CTAs */}
        <div className="mt-5 flex gap-3">
          <Link
            href={`/book/${slug}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-trust-700 hover:bg-trust-800 text-white font-medium rounded-lg transition-colors duration-150 text-sm sm:text-base"
          >
            Book Consultation
          </Link>
          <Link
            href={`/team/${slug}`}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 hover:border-slate-400 text-slate-700 font-medium rounded-lg transition-colors duration-150 text-sm sm:text-base"
          >
            View Profile
          </Link>
        </div>
      </div>
    </article>
  );
}

// Simple icon components (inline to avoid dependencies)
function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  );
}

export default PractitionerCard;
