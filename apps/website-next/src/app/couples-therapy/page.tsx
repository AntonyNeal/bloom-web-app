import type { Metadata } from 'next';
import { ServiceBookingCTA } from '@/components/ServiceBookingCTA';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Couples Therapy Newcastle | Telehealth | Life Psychology',
  description: 'Couples therapy in Newcastle via secure telehealth. Evidence-based relationship counselling with Medicare rebates available. Book your first session online.',
  keywords: ['couples therapy newcastle', 'relationship counselling newcastle', 'couples counselling lake macquarie', 'marriage counselling hunter valley', 'telehealth couples therapy'],
  alternates: {
    canonical: '/couples-therapy',
  },
  openGraph: {
    title: 'Couples Therapy Newcastle | Relationship Counselling',
    description: 'Professional couples therapy and relationship counselling for Newcastle and the Hunter Region. Strengthen communication and deepen your connection.',
    url: '/couples-therapy',
  },
};

// FAQ Schema for SEO
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How long does couples therapy take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The duration of couples therapy varies depending on your unique situation and goals. Some couples find meaningful progress in 6-8 sessions, while others benefit from longer-term support. Your psychologist will discuss expectations and check in on progress regularly.',
      },
    },
    {
      '@type': 'Question',
      name: 'What if my partner won\'t come to couples therapy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'While couples therapy works best with both partners present, individual therapy can still help you develop skills, gain clarity about your relationship, and work on your own patterns. Sometimes one partner starting therapy encourages the other to join later.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can couples therapy be done via telehealth?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, couples therapy via telehealth is highly effective. Both partners can join from the same location or connect from different places if needed. Video sessions offer the same quality care with added convenience and flexibility.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does couples therapy cost with Medicare?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'With a Mental Health Care Plan from your GP, you may be eligible for Medicare rebates on psychology sessions. The rebate amount and out-of-pocket costs vary. Contact us for current pricing and to discuss your options.',
      },
    },
    {
      '@type': 'Question',
      name: 'When should couples consider therapy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Couples seek therapy for many reasons: communication difficulties, trust issues, life transitions, feeling disconnected, or simply wanting to strengthen their relationship. There\'s no "right time" — if you\'re thinking about it, that\'s often a good sign you\'re ready.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do both partners need to be in the same room for telehealth?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not necessarily. While many couples prefer to sit together, partners can join from separate locations when needed — whether due to work schedules, travel, or personal preference. Your psychologist can advise on what works best for your situation.',
      },
    },
  ],
};

// LocalBusiness Schema
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'PsychologicalTreatment',
  name: 'Couples Therapy - Life Psychology Australia',
  description: 'Professional couples therapy and relationship counselling services for Newcastle, Lake Macquarie, Maitland, and the Hunter Valley region.',
  url: 'https://life-psychology.com.au/couples-therapy',
  provider: {
    '@type': 'MedicalBusiness',
    name: 'Life Psychology Australia',
    '@id': 'https://life-psychology.com.au',
    url: 'https://life-psychology.com.au',
    telephone: '+61489032116',
    email: 'info@life-psychology.com.au',
    priceRange: '$$',
    paymentAccepted: ['Cash', 'Credit Card', 'Medicare', 'NDIS'],
    areaServed: [
      { '@type': 'City', name: 'Newcastle', containedInPlace: { '@type': 'State', name: 'New South Wales' } },
      { '@type': 'City', name: 'Lake Macquarie' },
      { '@type': 'City', name: 'Maitland' },
      { '@type': 'AdministrativeArea', name: 'Hunter Valley' },
      { '@type': 'State', name: 'New South Wales' },
      { '@type': 'Country', name: 'Australia' },
    ],
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceType: 'Telehealth',
      availableLanguage: 'English',
    },
  },
  availableService: {
    '@type': 'MedicalTherapy',
    name: 'Emotionally Focused Therapy (EFT)',
    description: 'Evidence-based approach to couples therapy focused on attachment and emotional connection.',
  },
};

const relationshipChallenges = [
  {
    title: 'Communication Breakdown',
    description: 'Feeling unheard or misunderstood, struggling to express needs, or arguments that go in circles without resolution.',
    icon: '💬',
  },
  {
    title: 'Trust Issues',
    description: 'Rebuilding after betrayal, managing jealousy, or working through past hurts that continue to affect your relationship.',
    icon: '🔒',
  },
  {
    title: 'Growing Apart',
    description: 'Feeling disconnected, leading parallel lives, or losing the closeness that brought you together.',
    icon: '🌱',
  },
  {
    title: 'Major Life Transitions',
    description: 'Navigating parenthood, career changes, relocation, health challenges, or other significant life events together.',
    icon: '🔄',
  },
  {
    title: 'Intimacy Concerns',
    description: 'Physical or emotional distance, mismatched needs, or difficulty maintaining closeness over time.',
    icon: '💕',
  },
  {
    title: 'Conflict Patterns',
    description: 'Recurring arguments, difficulty resolving disagreements, or feeling stuck in negative cycles.',
    icon: '🔁',
  },
];

const whatToExpect = [
  'A safe, non-judgmental space for both partners',
  'Evidence-based therapeutic approaches',
  'Practical tools you can use in your relationship',
  'Support in understanding each other\'s perspectives',
  'Guidance tailored to your unique situation',
  'Flexible telehealth sessions that fit your schedule',
];

export default function CouplesTherapyPage() {
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

      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-purple-50/10">
        {/* Hero Section */}
        <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Couples Therapy &amp; Relationship Counselling
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Strengthen your relationship with professional support. Whether you&apos;re 
              working through challenges or wanting to deepen your connection, couples 
              therapy can help you build a stronger partnership.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <span className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                📍 Newcastle-based psychologists
              </span>
              <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                🌏 Available Australia-wide via telehealth
              </span>
            </div>
            <ServiceBookingCTA label="Book a Couples Session" />
          </div>
        </section>

        {/* Relationship Challenges */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Common Relationship Challenges
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              Couples come to therapy for many different reasons. You don&apos;t need to be 
              in crisis — many couples seek support to strengthen an already good relationship 
              or address issues before they escalate.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relationshipChallenges.map((challenge, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-3xl mb-4">{challenge.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{challenge.title}</h3>
                  <p className="text-gray-600">{challenge.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About EFT */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Evidence-Based Approach
            </h2>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p>
                Our psychologists draw on evidence-based approaches, including <strong>Emotionally 
                Focused Therapy (EFT)</strong>, one of the most researched and effective models 
                for couples therapy.
              </p>
              <p>
                Developed by Dr. Sue Johnson, EFT is grounded in attachment theory — the 
                understanding that humans have an innate need for secure emotional bonds. 
                When these bonds feel threatened, we often respond with patterns that can 
                inadvertently push our partner away rather than draw them closer.
              </p>
              <p>
                Research shows that 70-75% of couples move from distress to recovery through 
                EFT, and approximately 90% show significant improvement. These outcomes have 
                been replicated across diverse populations and relationship challenges.
              </p>
              <p>
                While EFT provides a strong foundation, your psychologist will tailor their 
                approach to your unique situation, drawing on their training and experience 
                to best support your relationship goals.
              </p>
            </div>
          </div>
        </section>

        {/* Local Connection */}
        <section className="py-16 bg-purple-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Based in Newcastle, Available Throughout NSW
            </h2>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p>
                Life Psychology is based in Newcastle, serving couples throughout New South Wales 
                and beyond via secure telehealth. Our psychologists understand the unique challenges 
                facing couples in regional areas, from the Hunter Valley to the Central Coast, 
                Western Sydney, and across NSW.
              </p>
              <p>
                Our telehealth-first approach means you can access quality psychological support 
                from anywhere — no need to navigate traffic, find parking, or coordinate complicated 
                logistics. Whether you&apos;re in Newcastle, Sydney, Wollongong, or regional NSW, 
                you can connect with our experienced psychologists via secure video from the comfort 
                of your own home.
              </p>
              <p>
                Telehealth has proven particularly valuable for couples therapy, offering 
                flexibility for busy schedules and removing practical barriers that might 
                otherwise prevent couples from seeking support. Many of our clients find 
                that being in their own space actually helps them feel more relaxed and 
                open during sessions.
              </p>
            </div>
          </div>
        </section>

        {/* What to Expect */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              What to Expect
            </h2>
            <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
              <ul className="space-y-4">
                {whatToExpect.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-purple-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p>
                <strong>Your first session</strong> is about getting to know you and your 
                relationship. Your psychologist will want to understand your history, 
                your concerns, and what you&apos;re hoping to achieve.
              </p>
              <p>
                <strong>Session frequency</strong> varies based on your situation and goals. 
                Many couples start with weekly or fortnightly sessions, adjusting as they 
                progress. Your psychologist will discuss what might work best for you.
              </p>
            </div>
          </div>
        </section>

        {/* Telehealth for Couples */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Telehealth for Couples
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📍 Same Location</h3>
                <p className="text-gray-600">
                  Most couples join sessions together from home. Find a private space 
                  where you won&apos;t be interrupted, and position yourselves so you&apos;re 
                  both visible on camera. A laptop or tablet on a table works well.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📍 Different Locations</h3>
                <p className="text-gray-600">
                  If needed, partners can join from separate locations — useful for 
                  work travel, separated couples, or when one partner isn&apos;t yet 
                  comfortable sharing space during sessions.
                </p>
              </div>
            </div>
            <div className="mt-8 prose prose-lg max-w-none text-gray-600">
              <h3 className="text-xl font-semibold text-gray-900">Technical Setup</h3>
              <ul>
                <li>Stable internet connection (WiFi or mobile data)</li>
                <li>Device with camera and microphone (phone, tablet, or computer)</li>
                <li>Private, quiet space where you can speak freely</li>
                <li>Headphones optional but can improve audio quality</li>
              </ul>
              <p>
                We use secure, healthcare-compliant video platforms. You&apos;ll receive 
                a link before your session — just click to join. If you&apos;re new to 
                telehealth, we&apos;re happy to do a quick tech check beforehand.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How long does couples therapy take?
                </h3>
                <p className="text-gray-600">
                  The duration varies depending on your unique situation and goals. Some 
                  couples find meaningful progress in 6-8 sessions, while others benefit 
                  from longer-term support. Your psychologist will discuss expectations 
                  and check in on progress regularly.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What if my partner won&apos;t come to couples therapy?
                </h3>
                <p className="text-gray-600">
                  While couples therapy works best with both partners present, individual 
                  therapy can still help you develop skills, gain clarity about your 
                  relationship, and work on your own patterns. Sometimes one partner 
                  starting therapy encourages the other to join later.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can couples therapy be done via telehealth?
                </h3>
                <p className="text-gray-600">
                  Yes, couples therapy via telehealth is highly effective. Both partners 
                  can join from the same location or connect from different places if 
                  needed. Video sessions offer the same quality care with added 
                  convenience and flexibility.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How much does couples therapy cost with Medicare?
                </h3>
                <p className="text-gray-600">
                  With a Mental Health Care Plan from your GP, you may be eligible for 
                  Medicare rebates on psychology sessions. The rebate amount and 
                  out-of-pocket costs vary. Contact us for current pricing and to 
                  discuss your options.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  When should couples consider therapy?
                </h3>
                <p className="text-gray-600">
                  Couples seek therapy for many reasons: communication difficulties, 
                  trust issues, life transitions, feeling disconnected, or simply 
                  wanting to strengthen their relationship. There&apos;s no &quot;right 
                  time&quot; — if you&apos;re thinking about it, that&apos;s often a 
                  good sign you&apos;re ready.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do both partners need to be in the same room for telehealth?
                </h3>
                <p className="text-gray-600">
                  Not necessarily. While many couples prefer to sit together, partners 
                  can join from separate locations when needed — whether due to work 
                  schedules, travel, or personal preference. Your psychologist can 
                  advise on what works best for your situation.
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
              We also offer individual support for concerns that may be affecting your relationship.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <a href="/individual-therapy" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-2">Individual Therapy</h3>
                <p className="text-gray-600 text-sm">Personal support alongside couples work, or if your partner isn&apos;t ready to join.</p>
              </a>
              <a href="/anxiety-depression" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🧠</div>
                <h3 className="font-semibold text-gray-900 mb-2">Anxiety & Depression</h3>
                <p className="text-gray-600 text-sm">Individual mental health concerns that may be impacting your relationship.</p>
              </a>
              <a href="/trauma-recovery" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🌱</div>
                <h3 className="font-semibold text-gray-900 mb-2">Trauma Recovery</h3>
                <p className="text-gray-600 text-sm">Past experiences can affect relationships — healing support is available.</p>
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Strengthen Your Relationship?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Taking the step to seek help is a sign of commitment to your relationship. 
              Wherever you are in NSW, we&apos;re here to help.
            </p>
            <ServiceBookingCTA label="Book Your First Session" />
            <p className="mt-6 text-sm text-gray-500">
              Secure telehealth sessions available throughout NSW and beyond
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
