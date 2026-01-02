import type { Metadata } from 'next';
import Image from 'next/image';
import { GreaterHunterCTA } from './GreaterHunterCTA';

export const metadata: Metadata = {
  title: 'Greater Hunter Psychology Services | Telehealth Therapy Across Newcastle Region',
  description: 'Psychology services across the Greater Hunter region NSW. Telehealth therapy available for residents of Newcastle, Lake Macquarie, Maitland, Cessnock, and surrounding areas.',
  alternates: {
    canonical: '/greater-hunter',
  },
};

export default function GreaterHunterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-lg shadow-lg max-w-4xl mx-auto h-64 md:h-80">
              <Image
                src="https://images.pexels.com/photos/5934491/pexels-photo-5934491.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Scenic Hunter Valley landscape"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Zoe Semmler, Registered Psychologist
          </h1>
          <p className="text-xl text-blue-600 font-medium mb-4">
            Online Psychologist in Newcastle and the Greater Hunter
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Telehealth psychology for Newcastle & the Hunter. Get confidential, convenient psychology care across the Greater Hunter region.
          </p>
        </div>

        {/* Credentials */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">✓ Registered Psychologist (AHPRA)</span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">✓ APS Full Member</span>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">✓ Evidence-based care</span>
          <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">✓ Secure telehealth</span>
        </div>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 lg:p-12 text-center border border-blue-100 mb-12">
          <GreaterHunterCTA />
          <p className="text-sm text-gray-500 mt-4">New clients welcome — no referral needed.</p>
        </section>

        {/* Areas Served */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Areas We Serve</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Newcastle', 'Lake Macquarie', 'Maitland', 'Cessnock', 'Port Stephens', 'Singleton', 'Muswellbrook', 'Upper Hunter'].map((area) => (
              <div key={area} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
                <span className="font-medium text-gray-800">{area}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Services Available</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Individual Therapy</h3>
              <p className="text-gray-600 text-sm">CBT and ACT for anxiety, depression, and life challenges.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Couples Counselling</h3>
              <p className="text-gray-600 text-sm">Gottman Method and EFT for relationship challenges.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">NDIS Psychology</h3>
              <p className="text-gray-600 text-sm">Registered provider for NDIS participants.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
