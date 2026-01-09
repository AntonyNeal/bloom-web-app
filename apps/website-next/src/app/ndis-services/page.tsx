import type { Metadata } from 'next';
import { ServiceBookingCTA } from '@/components/ServiceBookingCTA';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'NDIS Psychology Newcastle | Registered Provider | Telehealth',
  description: 'NDIS registered psychologist in Newcastle. Capacity building, mental health support & neurodiversity services via telehealth. Self-managed & plan-managed welcome.',
  keywords: ['NDIS psychology newcastle', 'NDIS psychologist hunter valley', 'NDIS mental health support', 'NDIS capacity building', 'NDIS telehealth psychology'],
  alternates: {
    canonical: '/ndis-services',
  },
  openGraph: {
    title: 'NDIS Psychology Newcastle | Registered Provider',
    description: 'NDIS registered psychologist in Newcastle. Capacity building, mental health & neurodiversity support via telehealth.',
    url: '/ndis-services',
  },
};

// FAQ Schema for SEO
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What NDIS funding categories cover psychology?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Psychology services are typically funded under Capacity Building - Improved Daily Living (CB Daily Activity). Some participants may also have funding under Core Supports or Capital. Check your plan or contact your plan manager to confirm your funding categories.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you accept self-managed and plan-managed NDIS participants?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we welcome both self-managed and plan-managed NDIS participants. For self-managed participants, we provide detailed invoices for you to claim. For plan-managed, we can invoice your plan manager directly.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can NDIS psychology sessions be done via telehealth?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all our NDIS psychology services are available via secure telehealth. This can be particularly beneficial for participants with mobility challenges, those in regional areas, or anyone who prefers the comfort and convenience of sessions from home.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is capacity building in NDIS psychology?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Capacity building focuses on developing skills and strategies to increase your independence and ability to participate in daily life. This might include emotional regulation, social skills, managing anxiety, building resilience, or developing coping strategies specific to your disability.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I book an NDIS psychology appointment?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can book directly through our website or contact us via email. We\'ll need to confirm your NDIS funding category and plan management type. No GP referral is required for NDIS-funded psychology sessions.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the NDIS rate for psychology sessions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We charge in accordance with the NDIS Price Guide rates. The current rate for a registered psychologist is set by the NDIA. Contact us for current pricing and to discuss how your funding can be used.',
      },
    },
  ],
};

// LocalBusiness Schema
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'NDIS Psychology Services - Life Psychology Australia',
  description: 'NDIS registered psychology provider offering capacity building, mental health support, and neurodiversity services across Newcastle, Lake Macquarie, and the Hunter Valley.',
  url: 'https://life-psychology.com.au/ndis-services',
  telephone: '+61489032116',
  email: 'info@life-psychology.com.au',
  priceRange: 'NDIS Price Guide rates',
  paymentAccepted: ['NDIS Self-Managed', 'NDIS Plan-Managed', 'Credit Card'],
  areaServed: [
    { '@type': 'City', name: 'Newcastle', containedInPlace: { '@type': 'State', name: 'New South Wales' } },
    { '@type': 'City', name: 'Lake Macquarie' },
    { '@type': 'City', name: 'Maitland' },
    { '@type': 'AdministrativeArea', name: 'Hunter Valley' },
    { '@type': 'State', name: 'New South Wales' },
  ],
  availableService: [
    {
      '@type': 'MedicalTherapy',
      name: 'NDIS Capacity Building Psychology',
      description: 'Psychological supports to build skills and independence.',
    },
    {
      '@type': 'MedicalTherapy', 
      name: 'NDIS Mental Health Support',
      description: 'Evidence-based therapy for mental health concerns related to disability.',
    },
  ],
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
    <>
      {/* Schema Markup */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-blue-50/10">
        {/* Hero Section */}
        <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              NDIS Psychology Services Newcastle
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Registered NDIS provider offering specialised psychology support for 
              NDIS participants. Flexible telehealth sessions designed to help you achieve 
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

        {/* Local Service Area */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              NDIS Psychology Throughout NSW
            </h2>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p>
                Life Psychology provides NDIS-registered psychology services to participants 
                throughout <strong>New South Wales</strong>. Based in <strong>Newcastle</strong>, 
                we understand the unique challenges facing NDIS participants in regional areas, 
                from the <strong>Hunter Valley</strong> to the <strong>Central Coast</strong>, 
                <strong>Western Sydney</strong>, and beyond.
              </p>
              <p>
                Our telehealth-first model means you can access quality NDIS psychology 
                support from anywhere in NSW — no need to arrange transport or navigate accessibility 
                barriers. Whether you&apos;re in Newcastle, Sydney, Wollongong, or regional NSW, 
                you can connect with us via secure video from the comfort of your own home.
              </p>
              <p>
                We understand that accessing services can be challenging for many NDIS 
                participants. Telehealth removes many of these barriers while still providing 
                the same quality, evidence-based psychological support.
              </p>
            </div>
          </div>
        </section>

        {/* Services Offered */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Services for NDIS Participants
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              We offer a range of psychological supports that can be funded through your 
              NDIS plan under Capacity Building - Improved Daily Living.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {servicesOffered.map((service, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-3xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NDIS Funding Info */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Understanding Your NDIS Funding
            </h2>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p>
                Psychology services for NDIS participants are typically funded under 
                <strong> Capacity Building - Improved Daily Living</strong> (CB Daily Activity). 
                This funding is designed to help you build skills and strategies to increase 
                your independence and participation in daily life.
              </p>
              <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">What Can NDIS Psychology Help With?</h3>
              <ul className="space-y-2">
                <li>Managing anxiety, depression, or other mental health impacts of your disability</li>
                <li>Developing emotional regulation and coping strategies</li>
                <li>Building social skills and confidence</li>
                <li>Processing trauma related to disability experiences</li>
                <li>Neurodiversity support for autism and ADHD</li>
                <li>Addressing behaviours of concern through positive approaches</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Plan Management Options</h3>
              <p>
                <strong>Self-Managed:</strong> You have full control over your funding. We provide 
                detailed invoices for you to submit for reimbursement.
              </p>
              <p>
                <strong>Plan-Managed:</strong> Your plan manager handles payments. We invoice them 
                directly, so you don&apos;t need to manage the paperwork.
              </p>
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
            <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">No GP Referral Required</h3>
              <p className="text-gray-600">
                Unlike Medicare-funded psychology, NDIS participants don&apos;t need a GP referral 
                or Mental Health Care Plan. You can book directly as long as you have appropriate 
                funding in your NDIS plan.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What NDIS funding categories cover psychology?
                </h3>
                <p className="text-gray-600">
                  Psychology services are typically funded under Capacity Building - Improved 
                  Daily Living (CB Daily Activity). Some participants may also have funding 
                  under Core Supports or Capital. Check your plan or contact your plan manager 
                  to confirm your funding categories.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you accept self-managed and plan-managed NDIS participants?
                </h3>
                <p className="text-gray-600">
                  Yes, we welcome both self-managed and plan-managed NDIS participants. For 
                  self-managed participants, we provide detailed invoices for you to claim. 
                  For plan-managed, we can invoice your plan manager directly.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can NDIS psychology sessions be done via telehealth?
                </h3>
                <p className="text-gray-600">
                  Yes, all our NDIS psychology services are available via secure telehealth. 
                  This can be particularly beneficial for participants with mobility challenges, 
                  those in regional areas, or anyone who prefers the comfort and convenience 
                  of sessions from home.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What is capacity building in NDIS psychology?
                </h3>
                <p className="text-gray-600">
                  Capacity building focuses on developing skills and strategies to increase 
                  your independence and ability to participate in daily life. This might 
                  include emotional regulation, social skills, managing anxiety, building 
                  resilience, or developing coping strategies specific to your disability.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How do I book an NDIS psychology appointment?
                </h3>
                <p className="text-gray-600">
                  You can book directly through our website or contact us via email. We&apos;ll 
                  need to confirm your NDIS funding category and plan management type. No GP 
                  referral is required for NDIS-funded psychology sessions.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What is the NDIS rate for psychology sessions?
                </h3>
                <p className="text-gray-600">
                  We charge in accordance with the NDIS Price Guide rates. The current rate 
                  for a registered psychologist is set by the NDIA. Contact us for current 
                  pricing and to discuss how your funding can be used.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Related Services */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Related Services</h2>
            <p className="text-lg text-gray-600 text-center mb-8">
              NDIS participants may also benefit from these specialised services.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <a href="/neurodiversity" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🌈</div>
                <h3 className="font-semibold text-gray-900 mb-2">Neurodiversity Support</h3>
                <p className="text-gray-600 text-sm">Affirming support for autistic adults and those with ADHD.</p>
              </a>
              <a href="/anxiety-depression" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🧠</div>
                <h3 className="font-semibold text-gray-900 mb-2">Anxiety & Depression</h3>
                <p className="text-gray-600 text-sm">Evidence-based support for mental health concerns.</p>
              </a>
              <a href="/trauma-recovery" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🌱</div>
                <h3 className="font-semibold text-gray-900 mb-2">Trauma Recovery</h3>
                <p className="text-gray-600 text-sm">EMDR and trauma-informed care for processing difficult experiences.</p>
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Wherever you are in NSW, we&apos;re here to support you in achieving your NDIS goals.
            </p>
            <ServiceBookingCTA label="Book Your NDIS Session" />
            <p className="mt-6 text-sm text-gray-500">
              Secure telehealth sessions available throughout NSW and beyond
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
