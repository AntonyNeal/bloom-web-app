'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PublicPractitioner } from '@/types/practitioner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function TeamSection() {
  const [practitioners, setPractitioners] = useState<PublicPractitioner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPractitioners() {
      try {
        const response = await fetch(`${API_BASE_URL}/public/practitioners`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.practitioners) {
            setPractitioners(data.practitioners);
          }
        }
      } catch (error) {
        console.error('Error fetching practitioners:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPractitioners();
  }, []);

  // Don't render anything while loading or if no practitioners
  if (loading) {
    return (
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded w-64 mx-auto animate-pulse mb-4" />
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (practitioners.length === 0) {
    return null;
  }

  // Show up to 3 practitioners on homepage
  const displayedPractitioners = practitioners.slice(0, 3);

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Meet Our Psychologists
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our team of registered psychologists are here to support you 
            with compassion, expertise, and evidence-based care.
          </p>
        </div>

        {/* Practitioners Grid */}
        <div className={`grid gap-8 ${
          displayedPractitioners.length === 1 
            ? 'max-w-md mx-auto' 
            : displayedPractitioners.length === 2 
              ? 'md:grid-cols-2 max-w-3xl mx-auto' 
              : 'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {displayedPractitioners.map((practitioner) => (
            <Link
              key={practitioner.id}
              href={`/team/${practitioner.slug}`}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
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
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                      <span className="text-3xl text-orange-300">
                        {practitioner.firstName.charAt(0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Accepting clients badge */}
                {practitioner.acceptingNewClients && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Accepting Clients
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {practitioner.displayName}
                </h3>
                
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
                  </div>
                )}

                {/* View profile */}
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
          ))}
        </div>

        {/* See all team link */}
        {practitioners.length > 3 && (
          <div className="text-center mt-10">
            <Link
              href="/team"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              View All {practitioners.length} Team Members
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
