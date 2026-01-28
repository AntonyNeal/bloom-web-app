/**
 * TrustBar Component
 * 
 * Displays institutional credibility signals above the fold.
 * Research shows 75% of users judge credibility based on website design alone.
 * 
 * @see docs/epics/DESIGN_SYSTEM_RESEARCH_FINDINGS.md
 * 
 * Primary Trust Signals:
 * 1. AHPRA verification badge
 * 2. Social proof statistics
 * 3. Medicare availability
 */

import React from 'react';

export interface TrustBarProps {
  practitionerCount?: number;
  clientCount?: number;
  averageRating?: number;
  showMedicare?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export function TrustBar({
  practitionerCount = 50,
  clientCount = 10000,
  averageRating = 4.8,
  showMedicare = true,
  variant = 'light',
  className = '',
}: TrustBarProps) {
  const isDark = variant === 'dark';
  
  const bgClass = isDark 
    ? 'bg-trust-700/10 border-trust-600/20' 
    : 'bg-slate-50/80 border-slate-200/60';
  
  const textClass = isDark 
    ? 'text-slate-100' 
    : 'text-slate-700';
  
  const mutedClass = isDark 
    ? 'text-slate-300' 
    : 'text-slate-500';
  
  const accentClass = isDark 
    ? 'text-healing-400' 
    : 'text-healing-600';

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k+`;
    }
    return `${num}+`;
  };

  return (
    <div 
      className={`
        w-full py-3 px-4 sm:px-6 border-b backdrop-blur-sm
        ${bgClass}
        ${className}
      `}
      role="region"
      aria-label="Trust indicators"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {/* AHPRA Verified Badge */}
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className={`w-5 h-5 ${accentClass}`} />
            <span className={textClass}>
              <span className="font-medium">AHPRA Verified</span>
              <span className={mutedClass}> Practitioners</span>
            </span>
          </div>
          
          {/* Divider */}
          <span className={`hidden sm:block ${mutedClass}`} aria-hidden="true">•</span>
          
          {/* Practitioner Count */}
          <div className="flex items-center gap-2">
            <UsersIcon className={`w-5 h-5 ${accentClass}`} />
            <span className={textClass}>
              <span className="font-medium">{practitionerCount}+</span>
              <span className={mutedClass}> Practitioners</span>
            </span>
          </div>
          
          {/* Divider */}
          <span className={`hidden sm:block ${mutedClass}`} aria-hidden="true">•</span>
          
          {/* Clients Helped */}
          <div className="flex items-center gap-2">
            <HeartIcon className={`w-5 h-5 ${accentClass}`} />
            <span className={textClass}>
              <span className="font-medium">{formatNumber(clientCount)}</span>
              <span className={mutedClass}> Australians Helped</span>
            </span>
          </div>
          
          {/* Divider */}
          <span className={`hidden sm:block ${mutedClass}`} aria-hidden="true">•</span>
          
          {/* Rating */}
          <div className="flex items-center gap-2">
            <StarIcon className={`w-5 h-5 text-amber-400 fill-current`} />
            <span className={textClass}>
              <span className="font-medium">{averageRating}</span>
              <span className={mutedClass}> Average Rating</span>
            </span>
          </div>
          
          {/* Medicare Badge */}
          {showMedicare && (
            <>
              <span className={`hidden lg:block ${mutedClass}`} aria-hidden="true">•</span>
              <div className="flex items-center gap-2">
                <MedicareIcon className={`w-5 h-5 ${accentClass}`} />
                <span className={textClass}>
                  <span className="font-medium">Medicare</span>
                  <span className={mutedClass}> Rebates Available</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon components
function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function MedicareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  );
}

export default TrustBar;
