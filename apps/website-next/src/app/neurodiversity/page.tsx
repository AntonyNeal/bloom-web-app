import type { Metadata } from 'next';
import { ServiceBookingCTA } from '@/components/ServiceBookingCTA';

export const metadata: Metadata = {
  title: 'Neurodiversity Support | Autism & ADHD Affirming Psychology Newcastle',
  description: 'Neurodiversity-affirming psychology services in Newcastle. Supportive care for autistic adults and those with ADHD. Understanding your unique strengths through secure telehealth.',
  alternates: {
    canonical: '/neurodiversity',
  },
  openGraph: {
    title: 'Neurodiversity Support | Autism & ADHD Affirming Psychology',
    description: 'Neurodiversity-affirming psychology services in Newcastle. Supportive care for autistic adults and those with ADHD.',
    url: '/neurodiversity',
  },
};

const supportAreas = [
  {
    title: 'Understanding Your Identity',
    description: 'Exploring what neurodivergence means for you and how it shapes your unique perspective on the world.',
    icon: '🧠',
  },
  {
    title: 'Managing Overwhelm',
    description: 'Developing strategies for sensory sensitivities, executive function challenges, and preventing burnout.',
    icon: '🌊',
  },
  {
    title: 'Social Navigation',
    description: 'Understanding social dynamics, building meaningful connections, and advocating for your needs.',
    icon: '🤝',
  },
  {
    title: 'Life Transitions',
    description: 'Support through career changes, relationships, parenthood, and other major life transitions.',
    icon: '🌱',
  },
];

const affirmingApproach = [
  'Neurodiversity is viewed as natural human variation, not a deficit',
  'Your experiences and challenges are validated and understood',
  'Focus on your strengths while addressing genuine difficulties',
  'No pressure to mask or conform to neurotypical expectations',
  'Practical strategies tailored to how you actually think and process',
  'Recognition that late diagnosis brings unique challenges and strengths',
];

export default function NeurodiversityPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-teal-50/10">
      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Neurodiversity-Affirming Psychology
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Supportive, affirming care for autistic adults and those with ADHD. 
            Whether you&apos;re newly diagnosed, self-identified, or have known for years, 
            I&apos;m here to support your journey in a way that honours who you are.
          </p>
          <ServiceBookingCTA label="Book a Session" />
        </div>
      </section>

      {/* Support Areas */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Areas of Support
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {supportAreas.map((area, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl mb-4">{area.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{area.title}</h3>
                <p className="text-gray-600">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Affirming Approach */}
      <section className="py-16 bg-teal-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            My Affirming Approach
          </h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <ul className="space-y-4">
              {affirmingApproach.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-teal-600 mr-3 text-xl">🌈</span>
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
            Ready to Work With Someone Who Understands?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Finding the right support as a neurodivergent person can be challenging. 
            I&apos;m committed to providing a space where you can be authentically yourself.
          </p>
          <ServiceBookingCTA label="Book Your First Session" />
        </div>
      </section>
    </main>
  );
}
