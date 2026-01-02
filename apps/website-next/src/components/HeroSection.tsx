import Link from 'next/link';
import { BookingButton } from './BookingButton';
import { AvailabilityIndicatorClient } from './AvailabilityIndicatorClient';

interface HeroSectionProps {
  heroPhoto?: string;
}

export function HeroSection({ heroPhoto = '/assets/hero-zoe-main.webp' }: HeroSectionProps) {
  const isPortraitVariant = heroPhoto.includes('zoe.jpg') || heroPhoto.includes('zoe.webp');
  
  // Image dimensions for CLS prevention - use mobile-first dimensions
  const mobileWidth = 380;
  const mobileHeight = 412;
  const desktopWidth = 500;
  const desktopHeight = isPortraitVariant ? 543 : 731;

  return (
    <main
      id="main-content"
      className="pt-6 pb-10 sm:pt-8 sm:pb-12 lg:pt-10 lg:pb-16 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden"
      aria-label="Life Psychology Australia header"
    >
      {/* Subtle background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-100/20 to-transparent rounded-full -z-10 translate-x-1/4 -translate-y-1/4" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Image - equal column on desktop */}
          <div className="order-1 lg:order-1">
            <div className={`mx-auto ${isPortraitVariant ? 'max-w-xl lg:max-w-none' : 'max-w-sm lg:max-w-md'}`}>
              {/* Aspect ratio container prevents CLS by reserving space before image loads */}
              <div className="relative aspect-[380/412] sm:aspect-[500/543]">
                {/* Mobile-first responsive image using picture element for optimal loading */}
                <picture>
                  {/* Mobile: smaller 380w image (16KB vs 70KB) */}
                  <source
                    media="(max-width: 639px)"
                    srcSet="/assets/hero-zoe-main-380w.webp"
                    type="image/webp"
                    width={mobileWidth}
                    height={mobileHeight}
                  />
                  {/* Desktop: full size image */}
                  <source
                    media="(min-width: 640px)"
                    srcSet="/assets/hero-zoe-main.webp"
                    type="image/webp"
                    width={desktopWidth}
                    height={desktopHeight}
                  />
                  {/* Fallback */}
                  <img
                    src="/assets/hero-zoe-main.webp"
                    alt="Zoe Semmler, Registered Psychologist - warm and approachable telehealth psychology in Newcastle"
                    width={mobileWidth}
                    height={mobileHeight}
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    className="absolute inset-0 w-full h-full rounded-2xl shadow-lg object-cover object-top"
                  />
                </picture>
                {/* Floating credential badge - positioned relative to aspect ratio container */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md min-w-[140px]">
                  <p className="text-xs font-semibold text-slate-700">Registered Psychologist</p>
                  <p className="text-[10px] text-slate-500">Newcastle, NSW</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content - equal column on desktop */}
          <div className="order-2 lg:order-2 text-center lg:text-left">
            {/* Name and Title */}
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Zoe Semmler
              </h1>
              <p className="text-blue-600 font-medium text-lg">
                Psychologist • Newcastle & Australia-wide
              </p>
            </div>

            {/* Value proposition */}
            <p className="text-slate-600 text-base sm:text-lg mb-6 max-w-xl lg:max-w-none">
              Supporting you through anxiety, depression, and life transitions with warm, evidence-based telehealth therapy.
            </p>

            {/* Trust badges - compact row */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Medicare rebates
              </span>
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                NDIS provider
              </span>
              <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                Secure telehealth
              </span>
            </div>

            {/* CTA Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <BookingButton className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base">
                  Book your first session
                </BookingButton>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-xl font-semibold transition-all duration-200 text-base"
                >
                  About our practice
                </Link>
              </div>

              {/* Availability indicator */}
              <AvailabilityIndicatorClient />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
