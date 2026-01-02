import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroSection } from '@/components/HeroSection';

export const metadata: Metadata = {
  title: 'Counselling Newcastle | Professional Therapy Services | Life Psychology Australia',
  description: 'Professional counselling Newcastle for anxiety, depression, relationships. $250/session. Medicare rebates. Telehealth available. Registered psychologist Zoe Semmler.',
  alternates: {
    canonical: '/counselling-newcastle',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Counselling Newcastle",
  "description": "Professional counselling services in Newcastle NSW for anxiety, depression, and relationships",
  "provider": {
    "@type": "LocalBusiness",
    "name": "Life Psychology Australia",
    "address": { "@type": "PostalAddress", "addressLocality": "Newcastle", "addressRegion": "NSW", "addressCountry": "AU" }
  },
  "areaServed": { "@type": "City", "name": "Newcastle", "addressRegion": "NSW" },
  "serviceType": "Counselling",
  "offers": { "@type": "Offer", "price": "250", "priceCurrency": "AUD" }
};

export default function CounsellingNewcastlePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div className="min-h-screen">
        <HeroSection />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Counselling Newcastle - Professional Therapy Services
            </h1>

            <p className="text-xl text-gray-700 mb-6">
              Professional counselling services in Newcastle NSW. Specializing in anxiety, depression, relationships, and personal growth. Medicare rebates available.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Services Offered</h2>
                <ul className="space-y-2">
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Anxiety counselling Newcastle</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Depression therapy Newcastle</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Couples counselling Newcastle</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Personal development coaching</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>NDIS psychology services</li>
                </ul>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose Us</h2>
                <ul className="space-y-2">
                  <li className="flex items-center"><span className="text-blue-500 mr-2">💼</span>AHPRA registered psychologist</li>
                  <li className="flex items-center"><span className="text-blue-500 mr-2">💰</span>Medicare rebates available</li>
                  <li className="flex items-center"><span className="text-blue-500 mr-2">📅</span>Flexible telehealth appointments</li>
                  <li className="flex items-center"><span className="text-blue-500 mr-2">🏠</span>Sessions from your home</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/services"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                View All Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
