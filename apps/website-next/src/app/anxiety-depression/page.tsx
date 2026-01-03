import type { Metadata } from 'next';
import { ServiceBookingCTA } from '@/components/ServiceBookingCTA';

export const metadata: Metadata = {
  title: 'Anxiety Therapy Newcastle | Depression Counselling',
  description: 'Professional anxiety therapy and depression counselling in Newcastle NSW. Comprehensive mental health support via secure telehealth. Overcome anxiety, manage depression, and regain wellbeing.',
  alternates: {
    canonical: '/anxiety-depression',
  },
  openGraph: {
    title: 'Anxiety Therapy Newcastle | Depression Counselling',
    description: 'Professional anxiety therapy and depression counselling in Newcastle NSW. Comprehensive mental health support via secure telehealth.',
    url: '/anxiety-depression',
  },
};

const commonExperiences = [
  {
    title: 'Physical & Emotional Symptoms',
    description: 'Feeling overwhelmed by racing thoughts, persistent worry, or a heaviness that makes everyday tasks feel impossible.',
    icon: '🌊',
  },
  {
    title: 'Changes in Daily Life',
    description: 'Difficulty sleeping, changes in appetite, or struggling to find joy in activities you once enjoyed.',
    icon: '🕐',
  },
  {
    title: 'Impact on Relationships',
    description: 'Feeling disconnected from loved ones or withdrawing from social situations when you need support the most.',
    icon: '💔',
  },
  {
    title: 'Self-Doubt & Worry',
    description: 'Questioning your worth, fearing the worst, or feeling like you should be able to handle this alone.',
    icon: '🤔',
  },
];

const signsForSupport = [
  'Feeling overwhelmed more days than not',
  'Sleep or appetite changes affecting your wellbeing',
  'Difficulty enjoying things you used to love',
  'Isolation from friends and family',
  'Work, study, or daily tasks becoming harder',
  'Physical symptoms that persist without clear medical cause',
  'Racing thoughts that are hard to quiet',
  'Feeling stuck in patterns of worry or low mood',
];

export default function AnxietyDepressionPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-blue-50/10">
      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Anxiety & Depression Support
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional support to help you navigate anxiety and depression. 
            You don&apos;t have to face these challenges alone. Secure telehealth 
            sessions available across Newcastle and the Greater Hunter region.
          </p>
          <ServiceBookingCTA label="Book Your First Session" />
        </div>
      </section>

      {/* Common Experiences */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            You Might Be Experiencing
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {commonExperiences.map((exp, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl mb-4">{exp.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{exp.title}</h3>
                <p className="text-gray-600">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signs for Support */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Signs It Might Be Time to Reach Out
          </h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <ul className="grid md:grid-cols-2 gap-4">
              {signsForSupport.map((sign, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-600 mr-3">✓</span>
                  <span className="text-gray-700">{sign}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How I Can Help */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            How I Can Help
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Using evidence-based approaches including Cognitive Behavioural Therapy (CBT), 
            Acceptance and Commitment Therapy (ACT), and other proven methods, I&apos;ll work 
            with you to develop practical strategies for managing anxiety and depression. 
            Together, we&apos;ll build your toolkit for lasting wellbeing.
          </p>
          <p className="text-gray-600 mb-8">
            Anxiety and depression often affect our closest relationships. If relationship stress 
            is contributing to how you&apos;re feeling, we also offer{' '}
            <a href="/couples-therapy" className="text-blue-600 hover:text-blue-800 underline">couples therapy</a>{' '}
            to support both you and your partner.
          </p>
          <ServiceBookingCTA label="Start Your Journey Today" />
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Related Services</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <a href="/individual-therapy" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-2">Individual Therapy</h3>
              <p className="text-gray-600 text-sm">Comprehensive support for a wide range of mental health concerns and life challenges.</p>
            </a>
            <a href="/couples-therapy" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">💑</div>
              <h3 className="font-semibold text-gray-900 mb-2">Couples Therapy</h3>
              <p className="text-gray-600 text-sm">When anxiety or depression affects your relationship, couples therapy can help.</p>
            </a>
            <a href="/trauma-recovery" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🌱</div>
              <h3 className="font-semibold text-gray-900 mb-2">Trauma Recovery</h3>
              <p className="text-gray-600 text-sm">Trauma can contribute to anxiety and depression — specialised support is available.</p>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
