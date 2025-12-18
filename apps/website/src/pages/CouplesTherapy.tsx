import { Helmet } from 'react-helmet-async';

import { useEffect } from 'react';
import { tracker } from '../utils/UnifiedTracker';
import { useBooking } from '../hooks/useBooking';

const CouplesTherapy = () => {
  const { openBookingModal } = useBooking('couples_therapy_page');

  useEffect(() => {
    try {
      tracker.trackServicePage();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Analytics] Error tracking service_page_viewed:', err);
      }
    }
  }, []);
  const relationshipChallenges = [
    {
      title: 'Communication Breakdown',
      description:
        'Struggling to express needs, active listening issues, or frequent misunderstandings.',
      icon: '💬',
    },
    {
      title: 'Trust & Infidelity Recovery',
      description:
        'Rebuilding trust after betrayal, navigating infidelity recovery, or rebuilding security.',
      icon: '🤝',
    },
    {
      title: 'Intimacy & Connection Issues',
      description:
        'Feeling like roommates, lack of emotional or physical intimacy, or growing apart.',
      icon: '❤️',
    },
    {
      title: 'Conflict Patterns',
      description:
        'Same arguments repeatedly, escalating conflicts, or inability to resolve disagreements.',
      icon: '⚡',
    },
    {
      title: 'Life Transitions',
      description:
        'New baby, career changes, retirement, or other major life shifts affecting your relationship.',
      icon: '🔄',
    },
    {
      title: 'Blended Family Challenges',
      description:
        'Step-parenting issues, ex-partner conflicts, or integrating families successfully.',
      icon: '👨‍👩‍👧‍👦',
    },
    {
      title: 'Pre-marital Counselling',
      description:
        'Building strong foundations, discussing expectations, or preparing for marriage.',
      icon: '💍',
    },
    {
      title: 'Separation Support',
      description:
        'Considering separation, navigating divorce, or deciding whether to stay together.',
      icon: '🛤️',
    },
  ];

  const faqs = [
    {
      question: "What if my partner doesn't want to come?",
      answer:
        'This is a common concern. Sometimes one partner is more ready for therapy than the other. We can start with individual sessions to help prepare for couples work, or explore ways to encourage your partner to join. Many couples find that seeing positive changes in one partner motivates the other to participate.',
    },
    {
      question: 'Do we need to be married?',
      answer:
        'Not at all! Couples therapy is for any committed relationship - married, de facto, same-sex, or long-term partners. What matters is your commitment to working on the relationship together.',
    },
    {
      question: "Can therapy help if we're considering separation?",
      answer:
        'Absolutely. Couples therapy can provide clarity about whether to stay together or separate. Even if you decide to separate, therapy can help you do so with more understanding and less conflict, which is especially important if children are involved.',
    },
    {
      question: 'Will you take sides?',
      answer:
        'No. My role is to remain neutral and help both partners feel heard and understood. I work to create a safe space where both perspectives are validated, and we focus on understanding patterns rather than assigning blame.',
    },
    {
      question: 'What if we need individual sessions too?',
      answer:
        'This is quite common. Sometimes individual sessions alongside couples work can be very helpful. We can incorporate both approaches, and I can provide referrals if you prefer to see different therapists for individual and couples work.',
    },
    {
      question: 'How long does couples therapy typically take?',
      answer:
        'It varies greatly depending on your goals and challenges. Some couples benefit from 6-12 sessions for specific issues, while others prefer longer-term support for more complex concerns. We regularly review progress together and adjust our approach as needed.',
    },
  ];

  const whenToSeekHelp = [
    'Feeling disconnected or like roommates rather than partners',
    'Having the same arguments repeatedly without resolution',
    'Considering separation or divorce',
    'Experiencing stress from major life transitions',
    'Trust has been broken and needs rebuilding',
    'Intimacy has declined significantly',
    'Different parenting styles causing ongoing conflict',
    'Communication has become mostly negative or critical',
    'One or both partners are experiencing mental health challenges',
  ];

  return (
    <>
      <Helmet>
        <title>
          Couples Therapy Newcastle | Marriage Therapy & Counselling | Zoe
          Semmler
        </title>
        <meta
          name="description"
          content="Professional couples therapy in Newcastle NSW. Comprehensive marriage counselling and relationship therapy via secure telehealth. Strengthen communication, rebuild trust, and deepen connection."
        />
        <meta
          name="keywords"
          content="couples therapy Newcastle, marriage therapy Newcastle, couples counselling Newcastle, relationship therapy, marriage counselling, telehealth couples therapy, Zoe Semmler"
        />
        <link
          rel="canonical"
          href="https://www.life-psychology.com.au/couples-therapy"
        />
        <meta
          property="og:title"
          content="Couples Therapy Newcastle | Marriage Therapy & Counselling"
        />
        <meta
          property="og:description"
          content="Professional couples therapy in Newcastle NSW. Comprehensive marriage counselling and relationship therapy via secure telehealth."
        />
        <meta
          property="og:url"
          content="https://www.life-psychology.com.au/couples-therapy"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Couples Therapy Newcastle | Marriage Therapy & Counselling"
        />
        <meta
          name="twitter:description"
          content="Professional couples therapy in Newcastle NSW. Comprehensive marriage counselling and relationship therapy via secure telehealth."
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50/10">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Couples Therapy Newcastle | Marriage Therapy & Counselling
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Professional couples counselling in Newcastle and the Greater
              Hunter region. Strengthen your connection and build a relationship
              that thrives through secure telehealth sessions.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                Couples Therapist Newcastle
              </span>
              <span className="bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm font-medium">
                Secure Telehealth
              </span>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                NDIS Provider
              </span>
            </div>
          </div>
        </section>

        {/* Welcome Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Professional Couples Counselling Newcastle | Marriage Therapy
                Services
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                As an experienced couples therapist in Newcastle, I provide
                compassionate marriage therapy and couples counselling services
                across the Greater Hunter region. Whether you're seeking
                relationship support, navigating challenges, or strengthening
                your partnership, our telehealth psychology services make
                quality care accessible from your home.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
              {/* Taking the First Step */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-purple-500 mr-3">💪</span>
                  Taking the First Step Takes Courage
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  I understand that reaching out for couples therapy in
                  Newcastle takes courage from both partners. As a qualified
                  couples therapist serving the Greater Hunter region, I provide
                  marriage therapy and relationship counselling through
                  convenient telehealth sessions. You might be feeling
                  frustrated, disconnected, or unsure if couples counselling can
                  really help your relationship - and that's completely normal.
                </p>
              </div>

              {/* Common Challenges */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-blue-500 mr-3">🤝</span>
                  You're Not Alone in These Feelings
                </h3>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 leading-relaxed mb-3">
                    <strong>Whether you're facing:</strong>
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      Communication breakdowns
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      Trust issues or betrayal
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      Feeling like roommates rather than partners
                    </li>
                  </ul>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Know that seeking support together is a powerful step toward
                  reconnection.
                </p>
              </div>

              {/* What to Expect */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-green-500 mr-3">🌱</span>A Safe Space
                  for Both Voices
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  In our sessions, we'll create a safe space where both voices
                  are heard and validated. Every relationship has its own unique
                  dynamics, and your therapy journey will honour what makes your
                  partnership special.
                </p>
              </div>

              {/* Access & Support */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-purple-500 mr-3">🏠</span>
                  Convenient, Accessible Support
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">
                      Flexible Scheduling
                    </h4>
                    <p className="text-gray-700 text-sm">
                      Telehealth appointments available evenings from the
                      comfort and privacy of your own home.
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Flexible Payment Options
                    </h4>
                    <p className="text-gray-700 text-sm">
                      Private health fund rebates available for eligible
                      couples. Payment plans and flexible scheduling options
                      available.
                    </p>
                  </div>
                </div>
              </div>

              {/* Closing Promise */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                <p className="text-gray-800 leading-relaxed text-center font-medium">
                  Together, we'll build the foundation for deeper intimacy,
                  better communication, and lasting connection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Areas We Can Support */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Couples Therapy Newcastle | Relationship Support Services
            </h2>
            <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
              As a leading couples therapist in Newcastle, I provide marriage
              therapy and couples counselling for relationships facing
              challenges. Whether you're navigating communication issues, trust
              concerns, or life transitions, our telehealth psychology services
              across the Greater Hunter region offer the support you need to
              strengthen your partnership.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relationshipChallenges.map((challenge, index) => (
                <div
                  key={index}
                  className="bg-blue-100/70 backdrop-blur-sm p-6 rounded-lg border border-blue-200/60 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="text-3xl mb-3">{challenge.icon}</div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    {challenge.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {challenge.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* When to Seek Help */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              When to Consider Couples Therapy
            </h2>
            <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
              recognising when to seek support can make all the difference for
              your relationship.
            </p>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="grid md:grid-cols-2 gap-4">
                {whenToSeekHelp.map((sign, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-purple-500 mr-3 mt-1">•</span>
                    <span className="text-gray-700">{sign}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Strengthen Your Connection?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Taking the first step together shows commitment to your
                relationship. Whether you're in crisis or simply want to deepen
                your bond, I'm here to support your journey.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <button
                  type="button"
                  onClick={openBookingModal}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100/70 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm mr-3">
                    <span className="text-sm">📅</span>
                  </span>
                  Book Your First Session Together
                </button>
              </div>

              <p className="text-sm text-gray-500">
                Questions? Email info@life-psychology.com.au
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CouplesTherapy;
