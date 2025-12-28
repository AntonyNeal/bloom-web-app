import type { Metadata } from 'next';
import { ServiceBookingCTA } from '@/components/ServiceBookingCTA';

export const metadata: Metadata = {
  title: 'Couples Therapy Newcastle | Relationship Counselling',
  description: 'Professional couples therapy and relationship counselling in Newcastle NSW. Strengthen communication, rebuild trust, and deepen your connection through secure telehealth sessions.',
  alternates: {
    canonical: '/couples-therapy',
  },
  openGraph: {
    title: 'Couples Therapy Newcastle | Relationship Counselling',
    description: 'Professional couples therapy and relationship counselling in Newcastle NSW. Strengthen communication and deepen your connection.',
    url: '/couples-therapy',
  },
};

const relationshipChallenges = [
  {
    title: 'Communication Breakdown',
    description: 'Feeling unheard or misunderstood, struggling to express needs, or arguments that go in circles.',
    icon: '💬',
  },
  {
    title: 'Trust Issues',
    description: 'Rebuilding after betrayal, managing jealousy, or working through past hurts that affect the present.',
    icon: '🔒',
  },
  {
    title: 'Growing Apart',
    description: 'Feeling disconnected, leading parallel lives, or losing the spark that brought you together.',
    icon: '🌱',
  },
  {
    title: 'Major Life Transitions',
    description: 'Navigating parenthood, career changes, relocation, or other significant life changes together.',
    icon: '🔄',
  },
];

const whatToExpect = [
  'A safe, non-judgmental space for both partners',
  'Evidence-based approaches like Emotionally Focused Therapy (EFT)',
  'Practical communication tools you can use immediately',
  'Support in understanding each other\'s perspectives',
  'Guidance in rebuilding trust and connection',
  'Flexible telehealth sessions that fit your schedule',
];

export default function CouplesTherapyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-purple-50/10">
      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Couples Therapy & Relationship Counselling
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Strengthen your relationship with professional support. Whether you&apos;re 
            working through challenges or wanting to deepen your connection, couples 
            therapy can help you build a stronger partnership.
          </p>
          <ServiceBookingCTA label="Book a Couples Session" />
        </div>
      </section>

      {/* Relationship Challenges */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Common Relationship Challenges
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {relationshipChallenges.map((challenge, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl mb-4">{challenge.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{challenge.title}</h3>
                <p className="text-gray-600">{challenge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-16 bg-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            What to Expect
          </h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <ul className="space-y-4">
              {whatToExpect.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-purple-600 mr-3 text-xl">✓</span>
                  <span className="text-gray-700 text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Strengthen Your Relationship?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Taking the step to seek help is a sign of commitment to your relationship. 
            Let&apos;s work together to build the connection you both deserve.
          </p>
          <ServiceBookingCTA label="Book Your First Session" />
        </div>
      </section>
    </main>
  );
}
