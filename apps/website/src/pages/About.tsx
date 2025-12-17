import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useBooking } from '../hooks/useBooking';
import { tracker } from '../utils/UnifiedTracker';
import { trackBookNowClick } from '../tracking';
const About = () => {
  const { openBookingModal } = useBooking('about_page');
  useEffect(() => {
    // Initialize about page tracking with unified tracker (matches Pricing.tsx pattern)
    tracker.trackAboutPage();
  }, []);

  return (
    <>
      <Helmet>
        <title>
          About Zoe Semmler | Registered Psychologist Newcastle | Life
          Psychology Australia
        </title>
        <meta
          name="description"
          content="Meet Zoe Semmler, registered psychologist in Newcastle NSW. Professional support for anxiety, depression, couples therapy, neurodiversity, and NDIS services. Telehealth psychology across Greater Hunter region."
        />
        <meta
          name="keywords"
          content="Zoe Semmler psychologist, registered psychologist Newcastle, psychology services Newcastle, telehealth psychologist, Greater Hunter psychologist"
        />
        <link rel="canonical" href="https://www.life-psychology.com.au/about" />
        <meta
          property="og:title"
          content="About Zoe Semmler | Registered Psychologist Newcastle"
        />
        <meta
          property="og:description"
          content="Meet Zoe Semmler, registered psychologist in Newcastle NSW. Professional support for anxiety, depression, couples therapy, neurodiversity, and NDIS services."
        />
        <meta property="og:url" content="https://www.life-psychology.com.au/about" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="About Zoe Semmler | Registered Psychologist Newcastle"
        />
        <meta
          name="twitter:description"
          content="Meet Zoe Semmler, registered psychologist in Newcastle NSW. Professional support for anxiety, depression, couples therapy, neurodiversity, and NDIS services."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalBusiness',
            name: 'Life Psychology Australia',
            description:
              'Professional psychology services in Newcastle and Greater Hunter region, specializing in anxiety, depression, couples therapy, neurodiversity support, and NDIS services.',
            url: 'https://www.life-psychology.com.au',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Newcastle',
              addressRegion: 'NSW',
              addressCountry: 'AU',
            },
            medicalSpecialty: 'Psychology',
            availableService: [
              {
                '@type': 'MedicalTherapy',
                name: 'Individual Therapy',
                description: 'Personalized therapy for mental health concerns',
              },
              {
                '@type': 'MedicalTherapy',
                name: 'Couples Therapy',
                description: 'Relationship counseling and therapy',
              },
              {
                '@type': 'MedicalTherapy',
                name: 'Anxiety & Depression Support',
                description: 'specialised treatment for anxiety and depression',
              },
              {
                '@type': 'MedicalTherapy',
                name: 'Neurodiversity Support',
                description: 'Support for neurodivergent individuals',
              },
            ],
            founder: {
              '@type': 'Person',
              name: 'Zoe Semmler',
              jobTitle: 'Registered Psychologist',
              description:
                'AHPRA registered psychologist providing professional psychology services',
            },
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section - Personal Introduction */}
          <div className="text-center mb-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Meet Zoe Semmler, Your Registered Psychologist
              </h1>

              {/* Professional Photo - Therapy Session Context */}
              <div className="mb-8 max-w-2xl mx-auto">
                <picture>
                  <source
                    srcSet="/assets/therapy-session-2-1200w.webp"
                    type="image/webp"
                    media="(min-width: 768px)"
                  />
                  <source
                    srcSet="/assets/therapy-session-2-800w.webp"
                    type="image/webp"
                  />
                  <img
                    src="/assets/therapy-session-2-1200w.jpg"
                    alt="Zoe Semmler in a therapy session - demonstrating warm, empathetic, and professional approach to psychology practice"
                    className="w-full h-auto rounded-2xl shadow-xl"
                    loading="lazy"
                    width="1200"
                    height="800"
                    decoding="async"
                  />
                </picture>
              </div>

              {/* Introduction */}
              <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-3xl mx-auto">
                I'm passionate about helping people navigate life's challenges
                and discover their inner strength. As a registered psychologist,
                I'm committed to supporting individuals and couples through
                anxiety, depression, relationship difficulties, and major life
                transitions. My approach combines evidence-based methods with
                genuine care, guiding you towards wellbeing.
              </p>

              {/* Key Credentials */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  AHPRA Registered Psychologist (PsyBA)
                </span>
                <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  APS Full Member (MAPS)
                </span>
                <span className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  NDIS Registered Provider
                </span>
              </div>
            </div>
          </div>

          {/* Professional Journey Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                My Professional Journey
              </h2>

              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p>
                  My journey into psychology began with a deep desire to help
                  people find their way through life's most challenging moments.
                  After completing my Master of Psychology and working in
                  various settings, I established Life Psychology Australia to
                  make quality mental health care more accessible to everyone. I
                  believe that when we address our mental health with intention
                  and support, we open doors to greater personal fulfillment,
                  stronger relationships, and the courage that comes from facing
                  our challenges.
                </p>

                <p>
                  I specialise in working with adults experiencing anxiety,
                  depression, and relationship difficulties, while also
                  providing neurodiversity-affirming care. My approach is rooted
                  in evidence-based practices combined with genuine compassion
                  and understanding.
                </p>

                <p>
                  The transition to telehealth has been a natural evolution of
                  my practice, allowing me to serve clients across the Greater
                  Hunter region and beyond. I believe that quality mental health
                  support should be accessible from the comfort of your own
                  home, without compromising on the therapeutic relationship or
                  treatment effectiveness.
                </p>
              </div>
            </div>
          </div>

          {/* Treatment Approach Section */}
          <section className="bg-blue-50 rounded-lg p-8 lg:p-12 mb-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                My Approach to Therapy
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 font-bold text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Evidence-Based Methods
                      </h3>
                      <p className="text-gray-600 text-sm">
                        CBT, ACT, mindfulness, and EMDR techniques
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 font-bold text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Collaborative Partnership
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Working together to achieve your goals
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 font-bold text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Holistic Growth Focus
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Supporting your journey toward health and fulfillment
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 font-bold text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Safe Environment
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Non-judgmental, confidential space
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 font-bold text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Individualised Care
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Treatment plans tailored to you
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 font-bold text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Ongoing Support
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Flexible sessions including evenings, with ongoing
                        follow-up care
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Qualifications & Registrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Qualifications
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Master of Psychology
                    </div>
                    <div className="text-gray-600 text-sm">
                      Advanced training and practice
                    </div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Bachelor of Psychology (Honours)
                    </div>
                    <div className="text-gray-600 text-sm">
                      Foundation in psychological science
                    </div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Graduate Diploma of Psychology
                    </div>
                    <div className="text-gray-600 text-sm">
                      Professional psychology qualification
                    </div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Advanced Training
                    </div>
                    <div className="text-gray-600 text-sm">
                      CBT, ACT, EMDR, and trauma-informed care
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Professional Memberships
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      AHPRA Registered (PsyBA)
                    </div>
                    <div className="text-gray-600 text-sm">
                      Psychology Board of Australia
                    </div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      APS Full Member (MAPS)
                    </div>
                    <div className="text-gray-600 text-sm">
                      Australian Psychological Society
                    </div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Medicare Provider
                    </div>
                    <div className="text-gray-600 text-sm">
                      Rebates available for eligible clients
                    </div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      NDIS Registered
                    </div>
                    <div className="text-gray-600 text-sm">
                      Approved disability support provider
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              My Core Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">💙</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  Compassion
                </h3>
                <p className="text-gray-600 text-sm">
                  Every person deserves understanding, respect, and genuine care
                  in their journey toward healing.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  Evidence-Based
                </h3>
                <p className="text-gray-600 text-sm">
                  Using proven therapeutic approaches backed by research and
                  experience.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  Accessibility
                </h3>
                <p className="text-gray-600 text-sm">
                  Quality mental health care from the comfort of your own home.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  Growth & Hope
                </h3>
                <p className="text-gray-600 text-sm">
                  Believing in every person's capacity for positive change and
                  personal growth.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Touch Section - Centered */}
          <div className="text-center mb-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                A Personal Connection
              </h2>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 lg:p-12">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Living and working in the beautiful Newcastle and Greater
                  Hunter region, I understand the unique challenges and
                  opportunities that come with life in our community. Whether
                  you're dealing with work-related stress, family changes, or
                  simply seeking greater peace of mind, I'm here to support you.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  My passion for telehealth comes from a genuine belief that
                  mental health support should fit into your life, not the other
                  way around. Through secure, convenient online sessions, we can
                  work together to help you build the life you deserve, with the
                  flexibility and accessibility that modern life demands.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <section className="text-center bg-gray-50 rounded-lg p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Take the first step toward positive change with compassionate,
              professional support tailored to your unique needs and
              circumstances.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                onClick={(e) => {
                  // GA4 tracking
                  trackBookNowClick({
                    page_section: 'about_cta',
                    button_location: 'about_page_bottom',
                  });

                  openBookingModal(e);
                }}
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100/70 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm mr-3">
                  <span className="text-sm">📅</span>
                </span>
                Book a Consultation
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
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
                Private health covered
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* Booking Modal */}
      
    </>
  );
};

export default About;
