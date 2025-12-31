import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ServicesCTA } from './ServicesCTA';

export const metadata: Metadata = {
  title: 'Psychology Services Newcastle | Anxiety, Depression & Couples Therapy',
  description: 'Comprehensive psychology services in Newcastle NSW. Individual therapy, couples counselling, anxiety treatment, depression support, neurodiversity services, and NDIS psychology via secure telehealth.',
  keywords: ['psychology services Newcastle', 'therapy Newcastle', 'mental health services Newcastle', 'counselling Newcastle', 'telehealth psychology'],
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: 'Psychology Services Newcastle | Anxiety, Depression & Couples Therapy',
    description: 'Comprehensive psychology services in Newcastle NSW. Individual therapy, couples counselling, anxiety treatment, depression support, neurodiversity services, and NDIS psychology.',
    url: '/services',
    type: 'website',
  },
};

const services = [
  {
    title: 'Individual Therapy',
    description: 'One-on-one CBT and ACT therapy for anxiety, depression, and life challenges. Build practical coping strategies in a safe, confidential space via secure telehealth sessions.',
    icon: '🧑‍⚕️',
    features: ['CBT & ACT', '50-min sessions', 'Medicare Rebate'],
    href: '/individual-therapy',
    price: 'A$250.00',
  },
  {
    title: 'Couples Counselling',
    description: 'Specialised couples counselling using Gottman Method and EFT approaches to improve communication, rebuild trust, and strengthen emotional connection.',
    icon: '👥',
    features: ['Gottman Method', 'EFT Therapy', 'Private Health'],
    href: '/couples-therapy',
    price: 'A$300.00',
  },
  {
    title: 'Anxiety & Depression',
    description: 'Evidence-based treatment combining CBT, mindfulness, and behavioural activation. Learn practical tools for managing symptoms and building resilience.',
    icon: '🧠',
    features: ['CBT Therapy', 'Mindfulness', 'Medicare Rebate'],
    href: '/anxiety-depression',
    price: 'A$250.00',
  },
  {
    title: 'Neurodiversity Support',
    description: 'Affirming support for ADHD and autism, focusing on strengths, self-advocacy, and practical life strategies for neurodivergent adults.',
    icon: '🌈',
    features: ['ADHD Support', 'ND Affirming', 'NDIS Eligible'],
    href: '/neurodiversity',
    price: 'A$250.00',
  },
  {
    title: 'NDIS Psychology Services',
    description: 'Registered NDIS provider offering therapeutic supports, capacity building, and assessments. Specialised psychological services for NDIS participants.',
    icon: '🛡️',
    features: ['NDIS Provider', 'Capacity Building', 'Assessments'],
    href: '/ndis-services',
    price: 'A$232.99',
  },
  {
    title: 'Trauma Recovery',
    description: 'Safe, paced trauma therapy using EMDR and somatic approaches. Process difficult experiences at your own speed with evidence-based trauma-informed care.',
    icon: '🌱',
    features: ['EMDR Therapy', 'Trauma-Informed', 'Medicare Rebate'],
    href: '/trauma-recovery',
    price: 'A$250.00',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Evidence-Based Psychology Services
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6">
              Professional therapeutic support for anxiety, depression, couples issues, and neurodiversity. 
              All sessions via secure telehealth with{' '}
              <span className="font-semibold text-blue-600">multiple funding options available</span>.
            </p>
          </div>

          {/* Trust Signal Strip */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-8 text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <span className="text-green-600">✓</span>
              Medicare Rebates Available
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <span className="text-blue-600">✓</span>
              NDIS Provider
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <span className="text-purple-600">✓</span>
              Available 6 Days/Week
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <span className="text-orange-600">✓</span>
              Evening Appointments
            </div>
          </div>

          {/* Primary CTA */}
          <ServicesCTA location="services_top_cta" />

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6">
            <Link
              href="/greater-hunter"
              className="text-blue-600 hover:text-blue-700 underline font-medium transition-colors"
            >
              Serving Newcastle and the Greater Hunter region
            </Link>
          </p>
        </div>

        {/* What to Expect Section */}
        <div className="mb-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-gray-100 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="order-2 md:order-1 relative h-64 md:h-auto min-h-[300px]">
                <Image
                  src="/assets/therapy-session-3-1200w.webp"
                  alt="Warm and professional therapy session environment"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Text Content */}
              <div className="order-1 md:order-2 p-8 lg:p-12 flex flex-col justify-center">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  What to Expect
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Every session is a safe, confidential space where you can explore your thoughts and feelings without judgment.
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  I use evidence-based approaches tailored to your unique needs, working collaboratively to help you achieve your goals.
                </p>
                <ul className="space-y-3 text-gray-700">
                  {['Warm, non-judgmental approach', 'Evidence-based therapeutic methods', 'Collaborative goal-setting', 'Practical tools for lasting change'].map((item) => (
                    <li key={item} className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.href}
              className="bg-blue-100/70 backdrop-blur-sm border border-blue-200/60 shadow-sm rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group block"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                {service.icon}
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3 group-hover:text-gray-700 transition-colors">
                {service.description}
              </p>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium group-hover:bg-blue-100 transition-colors"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Learn More */}
              <div className="text-blue-600 text-sm font-medium inline-flex items-center group-hover:translate-x-1 group-hover:text-blue-700 transition-all duration-200">
                Learn more
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Pricing Overview */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/60 p-8 lg:p-12 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Transparent Pricing</h2>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto">
              Clear session fees with multiple funding options to reduce your costs
            </p>
          </div>

          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-blue-600 mb-2">A$232.99-A$300.00</div>
            <div className="text-lg text-slate-700">per session</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl mb-2">💚</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Medicare Rebates</h3>
              <p className="text-slate-700 text-sm">Up to $98.95 back per session for eligible mental health services</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl mb-2">🛡️</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">NDIS Funding</h3>
              <p className="text-slate-700 text-sm">Full session cost covered for eligible NDIS participants</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl mb-2">🏥</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Private Health</h3>
              <p className="text-slate-700 text-sm">Psychology cover available with most private health funds</p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Calculate Your Costs
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 lg:p-12 text-center border border-blue-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Start Your Journey?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Take the first step toward better mental health. Book a confidential consultation with experienced psychological support available{' '}
            <span className="font-semibold text-blue-600">6 days a week</span>.
          </p>

          <ServicesCTA location="services_bottom_cta" />

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 mb-4 mt-6">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              Medicare rebates up to $98.95
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
              NDIS participants fully covered
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
              Private health extras cover
            </span>
          </div>

          <p className="text-sm text-gray-500">
            Secure telehealth appointments • Evening sessions available • No wait lists
          </p>
        </section>
      </div>
    </div>
  );
}
