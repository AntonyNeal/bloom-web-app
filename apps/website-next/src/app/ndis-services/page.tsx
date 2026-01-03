import type { Metadata } from 'next';
import { ServiceBookingCTA } from '@/components/ServiceBookingCTA';

export const metadata: Metadata = {
  title: 'NDIS Psychology Services Newcastle | NDIS Provider',
  description: 'NDIS-registered psychology services in Newcastle. Specialised support for NDIS participants including mental health, neurodiversity, and capacity building. Telehealth available.',
  alternates: {
    canonical: '/ndis-services',
  },
  openGraph: {
    title: 'NDIS Psychology Services Newcastle | NDIS Provider',
    description: 'NDIS-registered psychology services in Newcastle. Specialised support for NDIS participants.',
    url: '/ndis-services',
  },
};

const servicesOffered = [
  {
    title: 'Mental Health Support',
    description: 'Evidence-based therapy for anxiety, depression, trauma, and other mental health concerns related to your disability.',
    icon: '🧠',
  },
  {
    title: 'Capacity Building',
    description: 'Developing skills to manage emotions, build resilience, and increase your independence in daily life.',
    icon: '💪',
  },
  {
    title: 'Neurodiversity Support',
    description: 'Affirming support for autistic participants and those with ADHD, focused on your strengths and goals.',
    icon: '🌈',
  },
  {
    title: 'Behaviour Support',
    description: 'Understanding and addressing behaviours of concern through compassionate, positive approaches.',
    icon: '🎯',
  },
];

const howItWorks = [
  {
    step: '1',
    title: 'Check Your Plan',
    description: 'Ensure you have funding under Capacity Building - Improved Daily Living or similar categories.',
  },
  {
    step: '2',
    title: 'Book an Initial Session',
    description: 'Contact me to schedule your first appointment. I accept self-managed and plan-managed participants.',
  },
  {
    step: '3',
    title: 'Begin Your Support',
    description: 'We\'ll work together to create a plan aligned with your NDIS goals and personal wellbeing.',
  },
];

export default function NDISServicesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-blue-50/10">
      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            NDIS Psychology Services
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Registered NDIS provider offering specialised psychology support for 
            participants. Flexible telehealth sessions designed to help you achieve 
            your goals and improve your quality of life.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ NDIS Registered Provider
            </span>
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              ✓ Self-Managed Welcome
            </span>
            <span className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              ✓ Plan-Managed Welcome
            </span>
          </div>
          <ServiceBookingCTA label="Book NDIS Session" />
        </div>
      </section>

      {/* Services Offered */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Services for NDIS Participants
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {servicesOffered.map((service, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How to Access Services
          </h2>
          <div className="space-y-6">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-sm flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Related Services</h2>
          <p className="text-lg text-gray-600 text-center mb-8">
            NDIS participants may also benefit from these specialised services.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <a href="/neurodiversity" className="block bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🌈</div>
              <h3 className="font-semibold text-gray-900 mb-2">Neurodiversity Support</h3>
              <p className="text-gray-600 text-sm">Affirming support for autistic adults and those with ADHD.</p>
            </a>
            <a href="/anxiety-depression" className="block bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="font-semibold text-gray-900 mb-2">Anxiety & Depression</h3>
              <p className="text-gray-600 text-sm">Evidence-based support for mental health concerns.</p>
            </a>
            <a href="/trauma-recovery" className="block bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🌱</div>
              <h3 className="font-semibold text-gray-900 mb-2">Trauma Recovery</h3>
              <p className="text-gray-600 text-sm">EMDR and trauma-informed care for processing difficult experiences.</p>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            I&apos;m here to support you in achieving your NDIS goals. 
            Get in touch to discuss how I can help.
          </p>
          <ServiceBookingCTA label="Book Your NDIS Session" />
        </div>
      </section>
    </main>
  );
}
