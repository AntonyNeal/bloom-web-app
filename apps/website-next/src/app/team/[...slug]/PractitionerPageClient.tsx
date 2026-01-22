'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PublicPractitioner } from '@/types/practitioner';

// API base URL - empty string for same-origin requests in browser
const API_BASE_URL = process.env.NEXT_PUBLIC_AZURE_FUNCTION_URL || '';

interface PractitionerPageClientProps {
  slug: string;
}

export function PractitionerPageClient({ slug }: PractitionerPageClientProps) {
  const [practitioner, setPractitioner] = useState<PublicPractitioner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPractitioner() {
      if (!slug) {
        setError('No practitioner specified');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/public/practitioners/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Practitioner not found');
          } else {
            setError('Failed to load practitioner profile');
          }
          return;
        }
        const data = await response.json();
        setPractitioner(data);
      } catch (err) {
        console.error('Error fetching practitioner:', err);
        setError('Unable to load practitioner profile');
      } finally {
        setLoading(false);
      }
    }

    fetchPractitioner();
  }, [slug]);

  // Loading skeleton
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
        </div>
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <div className="aspect-[3/4] rounded-2xl bg-gray-200 animate-pulse mb-6" />
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-12 bg-gray-200 rounded w-3/4 animate-pulse mb-4" />
                <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse mb-8" />
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Error state
  if (error || !practitioner) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {error === 'Practitioner not found' ? 'Practitioner Not Found' : 'Something went wrong'}
          </h1>
          <p className="text-gray-600 mb-8">
            {error === 'Practitioner not found'
              ? "We couldn't find the practitioner you're looking for."
              : 'Unable to load the practitioner profile. Please try again later.'}
          </p>
          <Link
            href="/team"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Our Team
          </Link>
        </div>
      </main>
    );
  }

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: practitioner.displayName,
    jobTitle: 'Registered Psychologist',
    description: practitioner.headline || practitioner.bio,
    image: practitioner.profilePhotoUrl,
    worksFor: {
      '@type': 'MedicalBusiness',
      name: 'Life Psychology Australia',
      url: 'https://www.life-psychology.com.au',
    },
    knowsAbout: practitioner.specializations,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-orange-600">Home</Link>
              <span>/</span>
              <Link href="/team" className="hover:text-orange-600">Our Team</Link>
              <span>/</span>
              <span className="text-gray-900">{practitioner.displayName}</span>
            </nav>
          </div>
        </div>

        {/* Profile Header */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Photo & Quick Info */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  {/* Photo */}
                  <div className="aspect-[3/4] relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg mb-6">
                    {practitioner.profilePhotoUrl ? (
                      <Image
                        src={practitioner.profilePhotoUrl}
                        alt={`${practitioner.displayName} - Psychologist`}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                          <span className="text-6xl text-orange-300">
                            {practitioner.firstName.charAt(0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Info Card */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    {/* Availability */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-3 h-3 rounded-full ${practitioner.acceptingNewClients ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-700">
                        {practitioner.acceptingNewClients ? 'Accepting new clients' : 'Waitlist available'}
                      </span>
                    </div>

                    {/* Services */}
                    <div className="space-y-2 mb-6">
                      {practitioner.medicareProvider && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Medicare Rebates Available
                        </div>
                      )}
                      {practitioner.ndisRegistered && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          NDIS Registered Provider
                        </div>
                      )}
                      {practitioner.sessionTypes.map((type) => (
                        <div key={type} className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {type} Sessions
                        </div>
                      ))}
                    </div>

                    {/* Languages */}
                    {practitioner.languages.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Languages
                        </h4>
                        <p className="text-sm text-gray-700">
                          {practitioner.languages.join(', ')}
                        </p>
                      </div>
                    )}

                    {/* Book Button */}
                    <Link
                      href={`/appointments?practitioner=${practitioner.slug}`}
                      className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
                    >
                      Book with {practitioner.firstName}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Name & Title */}
                <div className="mb-8">
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                    {practitioner.displayName}
                  </h1>
                  {practitioner.qualifications && (
                    <p className="text-lg text-gray-500">
                      {practitioner.qualifications}
                    </p>
                  )}
                  {practitioner.headline && (
                    <p className="text-xl text-gray-700 mt-4 leading-relaxed">
                      {practitioner.headline}
                    </p>
                  )}
                </div>

                {/* Bio */}
                {practitioner.bio && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">About</h2>
                    <div className="prose prose-lg prose-gray max-w-none">
                      {practitioner.bio.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="text-gray-600 leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Areas of Focus */}
                {practitioner.areasOfFocus.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Areas of Focus</h2>
                    <div className="flex flex-wrap gap-3">
                      {practitioner.areasOfFocus.map((area) => (
                        <span 
                          key={area}
                          className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specializations */}
                {practitioner.specializations.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Specializations</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {practitioner.specializations.map((spec) => (
                        <div 
                          key={spec}
                          className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-100"
                        >
                          <div className="w-2 h-2 rounded-full bg-orange-400" />
                          <span className="text-gray-700">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Therapy Approaches */}
                {practitioner.therapyApproaches.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Therapeutic Approaches</h2>
                    <div className="flex flex-wrap gap-3">
                      {practitioner.therapyApproaches.map((approach) => (
                        <span 
                          key={approach}
                          className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                        >
                          {approach}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {practitioner.experienceYears && (
                  <div className="mb-10 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <span className="text-2xl font-bold text-orange-600">
                          {practitioner.experienceYears}+
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Years of Experience</h3>
                        <p className="text-gray-600">
                          Helping clients achieve their mental health goals
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    Ready to Start Your Journey?
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                    Book your first session with {practitioner.firstName} and take the first step 
                    towards positive change.
                  </p>
                  <Link
                    href={`/appointments?practitioner=${practitioner.slug}`}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-full transition-colors shadow-lg hover:shadow-xl"
                  >
                    Book an Appointment
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Team */}
        <section className="py-8 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link 
              href="/team"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Our Team
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
