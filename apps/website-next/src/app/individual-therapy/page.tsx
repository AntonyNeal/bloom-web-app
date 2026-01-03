import type { Metadata } from 'next';
import { IndividualTherapyCTA } from './IndividualTherapyCTA';

export const metadata: Metadata = {
  title: 'Individual Therapy Newcastle | Anxiety & Depression Counselling',
  description: 'Professional individual therapy in Newcastle NSW. CBT & ACT therapy for anxiety, depression, stress, and mental health challenges. Secure telehealth sessions with Medicare rebates.',
  keywords: ['individual therapy Newcastle', 'CBT therapy Newcastle', 'anxiety counselling Newcastle', 'depression therapy Newcastle', 'mental health support', 'telehealth psychology'],
  alternates: {
    canonical: '/individual-therapy',
  },
  openGraph: {
    title: 'Individual Therapy Newcastle | Anxiety & Depression Counselling',
    description: 'Professional individual therapy in Newcastle NSW. CBT & ACT therapy for anxiety, depression, stress, and mental health challenges.',
    url: '/individual-therapy',
    type: 'website',
  },
};

const conditions = [
  { title: 'Anxiety Disorders', description: 'Generalised anxiety, social anxiety, panic attacks, and specific phobias.', icon: '😰' },
  { title: 'Depression & Low Mood', description: 'Persistent sadness, loss of interest, low energy, and motivation difficulties.', icon: '😔' },
  { title: 'Stress & Burnout', description: 'Work-related stress, chronic fatigue, and emotional exhaustion.', icon: '😫' },
  { title: 'Life Transitions', description: 'Major life changes, career shifts, relationship changes, or personal milestones.', icon: '🔄' },
  { title: 'Grief & Loss', description: 'Processing loss, bereavement, or significant life changes.', icon: '💔' },
  { title: 'Self-Esteem Issues', description: 'Low self-worth, self-doubt, and negative self-talk.', icon: '🤔' },
  { title: 'Relationship Difficulties', description: 'Interpersonal conflicts, communication challenges, or relationship patterns.', icon: '💬' },
  { title: 'Work-Related Stress', description: 'Workplace challenges, career dissatisfaction, or professional burnout.', icon: '💼' },
  { title: 'Trauma & PTSD', description: 'Past trauma, PTSD symptoms, or difficult life experiences.', icon: '🌱' },
];

const faqs = [
  {
    question: "What's the difference between a psychologist and counsellor?",
    answer: "Psychologists have advanced university training in psychological assessment, diagnosis, and evidence-based treatments. As a registered psychologist, I can provide formal diagnoses, Medicare-rebated services, and comprehensive psychological interventions.",
  },
  {
    question: 'Can I claim Medicare rebates?',
    answer: "Yes, if you have a Mental Health Care Plan from your GP. Medicare rebates are available for eligible services. I'm also registered with private health funds and NDIS.",
  },
  {
    question: 'Is online therapy as effective as in-person?',
    answer: 'Research shows telehealth therapy is equally effective for most mental health concerns. Many clients find it more convenient and comfortable, especially for anxiety-related issues. We use secure, encrypted platforms for complete confidentiality.',
  },
];

export default function IndividualTherapyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Individual Therapy Newcastle | Psychologist Services
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Professional psychologist in Newcastle providing individual therapy and counselling services across the Greater Hunter region. Supporting anxiety, depression, trauma, and life transitions through secure telehealth sessions.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              Medicare rebates available (up to $98.95 per session with a Mental Health Care Plan)
            </span>
            <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              Secure Telehealth
            </span>
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              NDIS Provider
            </span>
          </div>
        </div>
      </section>

      {/* Your Space Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Safe Space Awaits</h2>
            <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
              I know that taking the first step toward therapy can feel daunting. You might be wondering if your struggles are &ldquo;serious enough&rdquo; or if talking to someone will really help. Let me assure you - whatever you&apos;re facing, your feelings are valid and deserving of support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🌟 A Warm, Non-Judgmental Space</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                In our sessions, you&apos;ll find a warm, non-judgmental environment where we can explore your challenges at your own pace.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Whether you&apos;re dealing with anxiety that keeps you awake at night, navigating difficult relationships, processing past experiences, or simply feeling stuck in patterns that no longer serve you.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🎯 Your Unique Journey</h3>
              <p className="text-gray-600 leading-relaxed">
                There&apos;s no one-size-fits-all approach here - your therapy journey will be as unique as you are. We&apos;ll work together to find strategies that fit your life and values, creating meaningful change in your relationships, career, and overall wellbeing.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">⏰ Flexible Support When You Need It</h3>
            <p className="text-gray-600 leading-relaxed text-center max-w-2xl mx-auto">
              With flexible telehealth appointments available outside traditional 9-5 hours, including evenings, you can access professional support when it works for your schedule. From the comfort and privacy of your own home, Medicare rebates, NDIS funding, and private health coverage help make quality mental health care accessible.
            </p>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium text-gray-800 mb-4">
              Remember, seeking support isn&apos;t a sign of weakness - it&apos;s an act of courage and self-care.
            </p>
            <p className="text-gray-600">When you&apos;re ready to take that step, I&apos;m here to walk alongside you.</p>
          </div>
        </div>
      </section>

      {/* Conditions We Address */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Areas We Can Support</h2>
          <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
            While this list covers common areas of focus, therapy can address any concern that&apos;s important to you. Every person&apos;s journey is unique.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conditions.map((condition, index) => (
              <div key={index} className="bg-blue-100/70 backdrop-blur-sm p-6 rounded-lg border border-blue-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="text-3xl mb-3">{condition.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-3">{condition.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{condition.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Related Services</h2>
          <p className="text-lg text-gray-600 text-center mb-8">
            We also offer specialised support for specific concerns and relationship dynamics.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <a href="/couples-therapy" className="block bg-rose-50 p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">💑</div>
              <h3 className="font-semibold text-gray-900 mb-2">Couples Therapy</h3>
              <p className="text-gray-600 text-sm">Strengthen your relationship through improved communication and deeper connection.</p>
            </a>
            <a href="/anxiety-depression" className="block bg-teal-50 p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="font-semibold text-gray-900 mb-2">Anxiety & Depression</h3>
              <p className="text-gray-600 text-sm">Specialised support for anxiety disorders, depression, and mood difficulties.</p>
            </a>
            <a href="/trauma-recovery" className="block bg-green-50 p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🌱</div>
              <h3 className="font-semibold text-gray-900 mb-2">Trauma Recovery</h3>
              <p className="text-gray-600 text-sm">EMDR and trauma-informed approaches for healing from difficult experiences.</p>
            </a>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Begin Your Journey?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Taking the first step can feel daunting, but you don&apos;t have to face life&apos;s challenges alone. I&apos;m here to support you every step of the way with warmth, understanding, and evidence-based care.
            </p>

            <IndividualTherapyCTA />

            <p className="text-sm text-gray-500 mt-6">Questions? Email info@life-psychology.com.au</p>
          </div>
        </div>
      </section>
    </div>
  );
}
