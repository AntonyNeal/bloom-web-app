import type { Metadata } from 'next';
import { TraumaRecoveryCTA } from './TraumaRecoveryCTA';

export const metadata: Metadata = {
  title: 'Trauma Recovery Therapy Newcastle | EMDR & PTSD Treatment',
  description: 'Specialised trauma recovery therapy in Newcastle NSW. EMDR therapy, PTSD treatment, and trauma-informed care via secure telehealth. Supporting survivors through evidence-based trauma recovery approaches.',
  keywords: ['trauma therapy Newcastle', 'EMDR therapy Newcastle', 'PTSD treatment Newcastle', 'trauma recovery', 'trauma counselling Newcastle', 'EMDR psychologist'],
  alternates: {
    canonical: '/trauma-recovery',
  },
  openGraph: {
    title: 'Trauma Recovery Therapy Newcastle | EMDR & PTSD Treatment',
    description: 'Specialised trauma recovery therapy in Newcastle NSW. EMDR therapy, PTSD treatment, and trauma-informed care via secure telehealth.',
    url: '/trauma-recovery',
    type: 'website',
  },
};

const traumaApproaches = [
  { title: 'EMDR Therapy', description: 'Eye Movement Desensitization and Reprocessing (EMDR) helps process traumatic memories and reduce the emotional impact of past experiences.', icon: '👁️' },
  { title: 'Somatic Approaches', description: 'Body-based therapies that help release trauma stored in the nervous system and restore a sense of safety in the body.', icon: '🫂' },
  { title: 'Trauma-Informed CBT', description: 'Cognitive Behavioural Therapy adapted for trauma, focusing on safety, stabilization, and gradual processing of difficult experiences.', icon: '🧠' },
  { title: 'Narrative Therapy', description: 'Helping you re-author your story, separate from traumatic experiences, and rebuild a coherent sense of self and life.', icon: '📖' },
  { title: 'Grounding Techniques', description: 'Practical tools to stay present and manage dissociation, flashbacks, and overwhelming emotions in daily life.', icon: '🌱' },
  { title: 'Attachment-Based Therapy', description: 'Healing relational wounds and building secure attachment patterns to support recovery and healthy relationships.', icon: '💝' },
];

export default function TraumaRecoveryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Trauma Recovery</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Safe, paced trauma therapy using EMDR and somatic approaches. Process difficult experiences at your own speed with evidence-based trauma-informed care.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">EMDR Therapy</span>
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">Trauma-Informed</span>
            <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">Medicare Rebates</span>
          </div>
        </div>

        {/* Welcome Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Healing at Your Own Pace</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Trauma recovery is a deeply personal journey. We understand that healing happens at your own pace, and there&apos;s no &quot;right&quot; timeline for processing difficult experiences.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our trauma-informed approach prioritizes your safety, choice, and empowerment. We work collaboratively to build the skills and resources you need to process trauma and rebuild a sense of safety and trust in yourself and the world.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Whether you&apos;re dealing with single-incident trauma, complex PTSD, or relational trauma, we&apos;re here to support you with evidence-based therapies delivered with warmth and understanding.
                </p>
              </div>
              <div className="text-center">
                <div className="text-6xl mb-4">🌱</div>
                <p className="text-gray-600 italic">
                  &quot;Your healing journey is unique to you – we&apos;re honoured to walk alongside you with patience and care.&quot;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trauma Approaches */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Our Trauma Recovery Approaches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {traumaApproaches.map((approach, index) => (
              <div key={index} className="bg-blue-100/70 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-blue-200/60">
                <div className="text-4xl mb-4">{approach.icon}</div>
                <h3 className="font-semibold text-lg text-gray-800 mb-3">{approach.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{approach.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 lg:p-12 text-center border border-blue-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Begin Your Healing Journey</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Trauma recovery is possible. We&apos;re here to support you with evidence-based therapies in a safe, compassionate environment.
          </p>

          <TraumaRecoveryCTA />

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mt-6">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              Medicare rebates available
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
              Secure telehealth sessions
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
              Flexible appointment times
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
