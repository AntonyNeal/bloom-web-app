import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { tracker } from '../utils/UnifiedTracker';
import { useBooking } from '../hooks/useBooking';
import { BookingModal } from '../components/BookingModal';

const AnxietyDepression = () => {
  const { isBookingModalOpen, openBookingModal, closeBookingModal } =
    useBooking();

  useEffect(() => {
    try {
      tracker.trackServicePage();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Analytics] Error tracking service_page_viewed:', err);
      }
    }
  }, []);
  const commonExperiences = [
    {
      title: 'Physical & Emotional Symptoms',
      description:
        'Feeling overwhelmed by racing thoughts, persistent worry, or a heaviness that makes everyday tasks feel impossible.',
      icon: '🌊',
    },
    {
      title: 'Changes in Daily Life',
      description:
        'Difficulty sleeping, changes in appetite, or struggling to find joy in activities you once enjoyed.',
      icon: '🕐',
    },
    {
      title: 'Impact on Relationships',
      description:
        'Feeling disconnected from loved ones or withdrawing from social situations when you need support the most.',
      icon: '💔',
    },
    {
      title: 'Self-Doubt & Worry',
      description:
        'Questioning your worth, fearing the worst, or feeling like you should be able to handle this alone.',
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

  const faqs = [
    {
      question:
        "How do I know if what I'm experiencing is anxiety or depression?",
      answer:
        "These experiences exist on a spectrum and often overlap. What matters most is how they're affecting your daily life and wellbeing. A professional assessment can help clarify your experience and connect you with appropriate support.",
    },
    {
      question: 'Can I get better without medication?',
      answer:
        'Many people find significant relief through therapy alone. The right approach depends on your unique situation and preferences. We can explore all available options together.',
    },
    {
      question: 'How long until I feel better?',
      answer:
        "Everyone's journey is different. Some notice changes within weeks, while others experience gradual improvement over months. What's most important is finding sustainable support that works for you.",
    },
    {
      question: "What if I've tried therapy before and it didn't help?",
      answer:
        "Different approaches work for different people at different times. Sometimes the timing wasn't right, or a different therapeutic style might be more effective. We can discuss what you've tried before and explore new possibilities.",
    },
    {
      question: 'Is online therapy effective for anxiety and depression?',
      answer:
        'Research shows telehealth can be just as effective as in-person therapy for many people. Many find it more comfortable, especially when dealing with anxiety about leaving home or social situations.',
    },
  ];

  const hesitations = [
    {
      concern: 'I should be able to handle this myself',
      response:
        "Many of the strongest people I work with have struggled with this same thought. Seeking support doesn't mean you're weak - it means you're taking proactive steps toward wellbeing.",
    },
    {
      concern: 'Others have it worse than me',
      response:
        "Comparing your pain to others' doesn't diminish your experience. Your struggles are valid, and your wellbeing matters regardless of what others are facing.",
    },
    {
      concern: 'What if talking about it makes it worse?',
      response:
        "While it's normal to worry about this, most people find that having a safe space to process their experiences actually brings relief and new perspective.",
    },
    {
      concern: "I don't have the energy for this",
      response:
        "When you're exhausted, even small steps can feel overwhelming. We can start gently and build from there, meeting you exactly where you are today.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          Anxiety Therapy Newcastle | Depression Counselling | Zoe Semmler
        </title>
        <meta
          name="description"
          content="Professional anxiety therapy and depression counselling in Newcastle NSW. Comprehensive mental health support via secure telehealth. Overcome anxiety, manage depression, and regain wellbeing."
        />
        <meta
          name="keywords"
          content="anxiety therapy Newcastle, depression counselling Newcastle, anxiety treatment, depression therapy, mental health support, telehealth psychology, Zoe Semmler"
        />
        <link
          rel="canonical"
          href="https://lifepsychology.com.au/anxiety-depression"
        />
        <meta
          property="og:title"
          content="Anxiety Therapy Newcastle | Depression Counselling"
        />
        <meta
          property="og:description"
          content="Professional anxiety therapy and depression counselling in Newcastle NSW. Comprehensive mental health support via secure telehealth."
        />
        <meta
          property="og:url"
          content="https://lifepsychology.com.au/anxiety-depression"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Anxiety Therapy Newcastle | Depression Counselling"
        />
        <meta
          name="twitter:description"
          content="Professional anxiety therapy and depression counselling in Newcastle NSW. Comprehensive mental health support via secure telehealth."
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-blue-50/10">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Anxiety Therapy Newcastle | Depression Counselling Services
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Professional anxiety counselling and depression therapy in
              Newcastle. Evidence-based support through secure telehealth
              sessions to help you find calm and reconnect with joy across the
              Greater Hunter region.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                Medicare Rebates Available
              </span>
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                Secure Telehealth
              </span>
              <span className="bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium">
                NDIS Registered
              </span>
            </div>
          </div>
        </section>

        {/* Welcome Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Anxiety Counselling Newcastle | Depression Therapy Services
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                As a registered psychologist in Newcastle, I provide specialised
                anxiety therapy and depression counselling through secure
                telehealth sessions. Serving the Greater Hunter region, our
                evidence-based approach helps individuals with anxiety
                disorders, depression, and co-occurring mental health
                challenges.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
              <p className="text-gray-700 leading-relaxed mb-6">
                Living with anxiety or depression can feel isolating and
                exhausting. You might be pushing through each day feeling
                overwhelmed, disconnected, or wondering if things will ever feel
                different. Perhaps you've been telling yourself you should be
                able to handle this alone, or that others have it worse. Let me
                reassure you - your struggles matter, and seeking support is a
                sign of strength, not weakness.
              </p>

              <p className="text-gray-700 leading-relaxed mb-6">
                Whether you're experiencing racing thoughts that keep you awake,
                a heaviness that makes everyday tasks feel impossible, or a
                combination of anxiety and low mood that leaves you feeling
                stuck, there is hope. Many people who felt exactly as you do now
                have found their way to calmer, brighter days. Recovery isn't
                always linear, but with professional support and evidence-based
                approaches, meaningful change is possible.
              </p>

              <p className="text-gray-700 leading-relaxed">
                With flexible telehealth appointments available evenings and
                weekends, you can access support from the safety and comfort of
                your own home - no need to navigate traffic or waiting rooms
                when you're already feeling vulnerable. Medicare rebates, NDIS
                funding, and private health coverage help make this vital
                support accessible. Together, we'll work at your pace toward a
                life where anxiety and depression no longer control your days.
              </p>
            </div>
          </div>
        </section>

        {/* Understanding Your Experience */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Understanding Your Experience
            </h2>
            <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
              You're not alone in what you're experiencing. Many people face
              similar challenges and find their way to brighter days.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {commonExperiences.map((experience, index) => (
                <div
                  key={index}
                  className="bg-blue-100/70 backdrop-blur-sm p-6 rounded-lg border border-blue-200/60 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="text-3xl mb-3">{experience.icon}</div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    {experience.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {experience.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Signs It's Time for Support */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Signs It Might Be Time for Support
            </h2>
            <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
              recognising when to seek support can be the first step toward
              feeling better.
            </p>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="grid md:grid-cols-2 gap-4">
                {signsForSupport.map((sign, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-teal-500 mr-3 mt-1">•</span>
                    <span className="text-gray-700">{sign}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why People Hesitate */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Why People Sometimes Hesitate
            </h2>
            <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
              It's completely normal to have concerns about seeking support.
              Here are some common worries and gentle responses.
            </p>

            <div className="space-y-6">
              {hesitations.map((hesitation, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="mb-3">
                    <span className="text-gray-800 font-medium italic">
                      "{hesitation.concern}"
                    </span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {hesitation.response}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Common Questions
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
            <div className="text-center bg-gradient-to-r from-teal-50 to-green-50 rounded-xl p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                You Don't Have to Face This Alone
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Taking the first step can feel daunting when you're already
                exhausted. Know that I'm here to meet you where you are, without
                judgment or pressure.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <button
                  onClick={(e) => openBookingModal(e)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100/70 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm mr-3">
                    <span className="text-sm">📅</span>
                  </span>
                  Book a Consultation
                </button>
              </div>

              {/* Subtle reassurance */}
              <p className="text-sm text-gray-600 text-center max-w-md mx-auto">
                Secure telehealth sessions available. New clients welcome.
              </p>

              <p className="text-sm text-gray-500">
                Questions? Email info@life-psychology.com.au
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Booking Modal */}
      <BookingModal isOpen={isBookingModalOpen} onClose={closeBookingModal} />
    </>
  );
};

export default AnxietyDepression;
