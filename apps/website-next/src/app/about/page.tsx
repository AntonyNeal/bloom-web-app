import Image from 'next/image';
import type { Metadata } from 'next';
import { AboutBookingCTA } from '@/components/AboutBookingCTA';

export const metadata: Metadata = {
  title: 'About Zoe Semmler | Registered Psychologist Newcastle',
  description: 'Meet Zoe Semmler, registered psychologist in Newcastle NSW. Professional support for anxiety, depression, couples therapy, neurodiversity, and NDIS services. Telehealth psychology across Greater Hunter region.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Zoe Semmler | Registered Psychologist Newcastle',
    description: 'Meet Zoe Semmler, registered psychologist in Newcastle NSW. Professional support for anxiety, depression, couples therapy, neurodiversity, and NDIS services.',
    url: '/about',
    type: 'website',
  },
};

// JSON-LD structured data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'Life Psychology Australia',
  description: 'Professional psychology services in Newcastle and Greater Hunter region',
  url: 'https://www.life-psychology.com.au',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Newcastle',
    addressRegion: 'NSW',
    addressCountry: 'AU',
  },
  medicalSpecialty: 'Psychology',
  founder: {
    '@type': 'Person',
    name: 'Zoe Semmler',
    jobTitle: 'Registered Psychologist',
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section - Personal Introduction */}
          <div className="text-center mb-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Meet Zoe Semmler, Your Registered Psychologist
              </h1>

              {/* Professional Photo */}
              <div className="mb-8 max-w-2xl mx-auto">
                <Image
                  src="/assets/therapy-session-2-1200w.webp"
                  alt="Zoe Semmler in a therapy session - demonstrating warm, empathetic, and professional approach to psychology practice"
                  width={1200}
                  height={800}
                  className="w-full h-auto rounded-2xl shadow-xl"
                  priority
                />
              </div>

              {/* Introduction */}
              <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-3xl mx-auto">
                I&apos;m passionate about helping people navigate life&apos;s challenges
                and discover their inner strength. As a registered psychologist,
                I&apos;m committed to supporting individuals and couples through
                anxiety, depression, relationship difficulties, and major life
                transitions. My approach combines evidence-based methods with
                genuine care, guiding you towards wellbeing.
              </p>

              {/* Key Credentials */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  AHPRA Registered Psychologist (PsyBA)
                </span>
                <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  APS Full Member (MAPS)
                </span>
                <span className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  NDIS Provider
                </span>
              </div>
            </div>
          </div>

          {/* Professional Journey Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                My Professional Journey
              </h2>

              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p>
                  My journey into psychology began with a deep desire to help
                  people find their way through life&apos;s most challenging moments.
                  After completing my Master of Clinical Psychology and working in
                  various settings, I established Life Psychology Australia to
                  make quality mental health care more accessible to everyone.
                </p>

                <p>
                  I specialise in working with adults experiencing anxiety,
                  depression, and relationship difficulties, while also
                  providing neurodiversity-affirming care. My approach is rooted
                  in evidence-based practices combined with genuine compassion
                  and understanding.
                </p>

                <p>
                  The transition to telehealth has been a natural evolution of
                  my practice, allowing me to serve clients across the Greater
                  Hunter region and beyond. I believe that quality mental health
                  support should be accessible from the comfort of your own
                  home, without compromising on the therapeutic relationship or
                  treatment effectiveness.
                </p>
              </div>
            </div>
          </div>

          {/* Treatment Approach Section */}
          <section className="bg-blue-50 rounded-lg p-8 lg:p-12 mb-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                My Approach to Therapy
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Evidence-Based Practice</h3>
                  <p className="text-gray-600">
                    I use proven therapeutic approaches including CBT, ACT, and Schema Therapy 
                    to ensure you receive effective, research-backed treatment.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Client-Centred Care</h3>
                  <p className="text-gray-600">
                    Your unique experiences and goals guide our work together. 
                    I tailor my approach to what works best for you.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Safe & Supportive Space</h3>
                  <p className="text-gray-600">
                    Creating a non-judgmental environment where you can explore 
                    your thoughts and feelings openly is my priority.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Neurodiversity-Affirming</h3>
                  <p className="text-gray-600">
                    I celebrate neurodiversity and provide affirming support for 
                    autistic and neurodivergent individuals.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Take the first step towards positive change. Book a session and let&apos;s 
              work together on your path to wellbeing.
            </p>
            <AboutBookingCTA />
          </div>
        </div>
      </main>
    </>
  );
}
