import { Helmet } from 'react-helmet-async';

import { useEffect } from 'react';
import { tracker } from '../utils/UnifiedTracker';
import { useBooking } from '../hooks/useBooking';
const Neurodiversity = () => {
  const { openBookingModal } = useBooking('neurodiversity_page');

  useEffect(() => {
    try {
      tracker.trackServicePage();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Analytics] Error tracking service_page_viewed:', err);
      }
    }
  }, []);
  const supportAreas = [
    {
      title: 'ADHD Support',
      description:
        'Understanding executive function challenges, developing practical strategies for focus and Organisation, and navigating the unique strengths of ADHD minds.',
      icon: '🧠',
    },
    {
      title: 'Autism Support',
      description:
        'Supporting autistic individuals in understanding their neurotype, managing sensory sensitivities, and building communication strategies that work for them.',
      icon: '🌈',
    },
    {
      title: 'Learning Differences',
      description:
        'Practical support for dyslexia, dyscalculia, and other learning differences, focusing on strengths and developing effective learning strategies.',
      icon: '📚',
    },
    {
      title: 'Executive Function Support',
      description:
        'Building systems and strategies to support planning, Organisation, time management, and task initiation that align with how your brain works.',
      icon: '📋',
    },
    {
      title: 'Sensory Processing Support',
      description:
        'Understanding sensory sensitivities and developing coping strategies for overwhelming environments and sensory experiences.',
      icon: '👂',
    },
    {
      title: 'Social Navigation',
      description:
        'Practical strategies for social situations, understanding social cues, and building authentic connections while honoring your unique social style.',
      icon: '🤝',
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          Neurodiversity Support Newcastle | Autism & ADHD Psychologist | Zoe
          Semmler
        </title>
        <meta
          name="description"
          content="Affirming neurodiversity support in Newcastle NSW. specialised psychology services for autism, ADHD, and neurodivergent adults. Telehealth sessions with neurodiversity-affirming approach."
        />
        <meta
          name="keywords"
          content="autism psychologist Newcastle, ADHD therapy Newcastle, neurodiversity support Newcastle, autism assessment Newcastle, ADHD counselling Newcastle, neurodivergent psychologist"
        />
        <link
          rel="canonical"
          href="https://www.life-psychology.com.au/neurodiversity"
        />
        <meta
          property="og:title"
          content="Neurodiversity Support Newcastle | Autism & ADHD Psychologist"
        />
        <meta
          property="og:description"
          content="Affirming neurodiversity support in Newcastle NSW. specialised psychology services for autism, ADHD, and neurodivergent adults."
        />
        <meta
          property="og:url"
          content="https://www.life-psychology.com.au/neurodiversity"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Neurodiversity Support Newcastle | Autism & ADHD Psychologist"
        />
        <meta
          name="twitter:description"
          content="Affirming neurodiversity support in Newcastle NSW. specialised psychology services for autism, ADHD, and neurodivergent adults."
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Autism Psychologist Newcastle | ADHD Therapy Services
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Professional autism and ADHD therapy in Newcastle. Supporting
              neurodivergent individuals across the Greater Hunter region with
              evidence-based strategies, secure telehealth sessions, and
              NDIS-registered psychology services.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                NDIS Psychologist Newcastle
              </span>
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                Medicare Rebates
              </span>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                Telehealth Psychology NDIS
              </span>
            </div>
          </div>

          {/* Welcome Section */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 lg:p-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                You're Not Broken – You're Different
              </h2>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Neurodivergent minds bring incredible strengths, creativity,
                    and unique perspectives to the world. But navigating a
                    neurotypical society can feel exhausting and overwhelming.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We don't believe in "fixing" neurodivergence. Instead, we
                    partner with you to understand how your brain works, build
                    practical strategies that align with your neurotype, and
                    help you advocate for the support you need.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Whether you're autistic, have ADHD, or experience other
                    forms of neurodivergence, we're here to meet you where you
                    are and help you build a life that feels authentic and
                    sustainable.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-6xl mb-4">🧠✨</div>
                  <p className="text-gray-600 italic">
                    "Your neurodivergence is not a deficit – it's a different
                    operating system with its own unique advantages."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Support Areas */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Areas of Support
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {supportAreas.map((area, index) => (
                <div
                  key={index}
                  className="bg-blue-100/70 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-blue-200/60"
                >
                  <div className="text-4xl mb-4">{area.icon}</div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    {area.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {area.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Approach Section */}
          <section className="mb-16">
            <div className="bg-white rounded-xl p-8 lg:p-12 shadow-sm">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Our Neurodiversity-Affirming Approach
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    Partnership First
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    We work as partners, not experts telling you what's wrong.
                    Your insights about your own experience are invaluable.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🎭</div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    Understanding Masking
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    We recognise the toll of masking and help you develop
                    strategies to live more authentically while managing social
                    expectations.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    Burnout Prevention
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    We help you recognise burnout signs early and build
                    sustainable strategies to maintain your mental health and
                    well-being.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    Flexible Communication
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Sessions can be adapted to your communication preferences –
                    whether that's verbal, written, or using visual supports.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🏠</div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    Comfortable Environment
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Telehealth allows you to participate from your most
                    comfortable environment, reducing sensory overload and
                    anxiety.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🌟</div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    Strength-Based Focus
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    We identify and build upon your unique strengths and
                    abilities, helping you harness them in all areas of your
                    life.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Practical Support Section */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 lg:p-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Practical Support for Daily Life
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-xl text-gray-800 mb-4">
                    Work & Education Support
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Navigating workplace accommodations and reasonable
                      adjustments
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Developing study strategies that work with your neurotype
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Managing executive function challenges in professional
                      settings
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Building confidence in self-advocacy conversations
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-gray-800 mb-4">
                    Relationships & Social Life
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Understanding and communicating your social needs
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Managing sensory aspects of social situations
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Building authentic connections that feel sustainable
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Setting boundaries and managing overwhelm in relationships
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 lg:p-12 text-center border border-blue-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to Build a Life That Works for You?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Let's work together to understand your unique neurotype and
              develop practical strategies that help you thrive in work,
              relationships, and daily life.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                type="button"
                onClick={openBookingModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="mr-2">📅</span>
                Book a consultation
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Medicare rebates available
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                NDIS participants welcome
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Flexible scheduling available
              </span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Neurodiversity;
