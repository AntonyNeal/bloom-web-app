'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PublicPractitioner } from '@/types/practitioner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Practitioner card component
function PractitionerCard({ practitioner }: { practitioner: PublicPractitioner }) {
  return (
    <Link 
      href={`/team/${practitioner.slug}`}
      className="group block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {/* Photo */}
      <div className="aspect-[4/3] relative bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
        {practitioner.profilePhotoUrl ? (
          <Image
            src={practitioner.profilePhotoUrl}
            alt={`${practitioner.displayName} - Psychologist`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
              <span className="text-4xl text-orange-300">
                {practitioner.firstName.charAt(0)}
              </span>
            </div>
          </div>
        )}
        
        {/* Accepting new clients badge */}
        {practitioner.acceptingNewClients && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            Accepting Clients
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
          {practitioner.displayName}
        </h2>
        
        {practitioner.qualifications && (
          <p className="text-sm text-gray-500 mt-1">
            {practitioner.qualifications}
          </p>
        )}
        
        {practitioner.headline && (
          <p className="text-gray-600 mt-3 line-clamp-2">
            {practitioner.headline}
          </p>
        )}

        {/* Specializations */}
        {practitioner.specializations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {practitioner.specializations.slice(0, 3).map((spec) => (
              <span 
                key={spec}
                className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full"
              >
                {spec}
              </span>
            ))}
            {practitioner.specializations.length > 3 && (
              <span className="text-xs text-gray-400">
                +{practitioner.specializations.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Services badges */}
        <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
          {practitioner.medicareProvider && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Medicare
            </span>
          )}
          {practitioner.ndisRegistered && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              NDIS
            </span>
          )}
          {practitioner.sessionTypes.includes('Telehealth') && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              Telehealth
            </span>
          )}
        </div>

        {/* View profile link */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-orange-600 font-medium text-sm group-hover:text-orange-700 inline-flex items-center gap-1">
            View Profile
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-full mb-2" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="flex gap-2 mt-4">
              <div className="h-6 bg-gray-100 rounded-full w-16" />
              <div className="h-6 bg-gray-100 rounded-full w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TeamPageClient() {
  const [practitioners, setPractitioners] = useState<PublicPractitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPractitioners() {
      try {
        const response = await fetch(`${API_BASE_URL}/public/practitioners`);
        if (!response.ok) {
          throw new Error('Failed to fetch practitioners');
        }
        const data = await response.json();
        if (data.success && data.practitioners) {
          setPractitioners(data.practitioners);
        }
      } catch (err) {
        console.error('Error fetching practitioners:', err);
        setError('Unable to load team members');
      } finally {
        setLoading(false);
      }
    }

    fetchPractitioners();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10">
      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Meet Our Psychologists
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Our team of registered psychologists are here to support you on your journey 
              to better mental health. Each brings unique expertise and a genuine passion 
              for helping people thrive.
            </p>
          </div>

          {/* Practitioners Grid */}
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-gray-600">{error}</p>
            </div>
          ) : practitioners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {practitioners.map((practitioner) => (
                <PractitionerCard key={practitioner.id} practitioner={practitioner} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Our Team is Growing
              </h2>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                We&apos;re currently updating our team profiles. Please check back soon 
                or contact us directly to learn more about our practitioners.
              </p>
              <Link 
                href="/contact"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-full transition-colors"
              >
                Contact Us
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Book your first session with one of our experienced psychologists. 
            We offer flexible telehealth appointments to fit your schedule.
          </p>
          <Link 
            href="/appointments"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-full transition-colors shadow-lg hover:shadow-xl"
          >
            Book an Appointment
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
