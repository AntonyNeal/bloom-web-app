import { Helmet } from 'react-helmet-async';
import { Shield, Server, CheckCircle, Lock } from 'lucide-react';
import { useBooking } from '../hooks/useBooking';

const Privacy = () => {
  const { openBookingModal } = useBooking('privacy_page');

  return (
    <>
      <Helmet>
        <title>Privacy Policy | Life Psychology Australia | Zoe Semmler</title>
        <meta
          name="description"
          content="Privacy policy for Life Psychology Australia. Learn how we collect, use, and protect your personal information. Secure telehealth psychology services in Newcastle NSW."
        />
        <meta
          name="keywords"
          content="privacy policy psychology, telehealth privacy, mental health privacy, psychologist privacy policy, data protection psychology"
        />
        <link rel="canonical" href="https://www.life-psychology.com.au/privacy" />
        <meta
          property="og:title"
          content="Privacy Policy | Life Psychology Australia"
        />
        <meta
          property="og:description"
          content="Privacy policy for Life Psychology Australia. Learn how we collect, use, and protect your personal information."
        />
        <meta
          property="og:url"
          content="https://www.life-psychology.com.au/privacy"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Privacy Policy | Life Psychology Australia"
        />
        <meta
          name="twitter:description"
          content="Privacy policy for Life Psychology Australia. Learn how we collect, use, and protect your personal information."
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your privacy and confidentiality are our priority. Learn how we
              collect, use, and protect your personal information.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last updated: November 2024
            </p>
          </div>
          {/* Important Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Important:</strong> Life Psychology Australia manages
                  all appointment bookings and client data through our secure,
                  in-house practice systems. Your personal information is
                  collected and stored in accordance with Australian privacy
                  legislation and professional guidelines.
                </p>
              </div>
            </div>
          </div>
          {/* Information We Collect */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Information We Collect
            </h2>
            <p className="text-gray-700 mb-4">
              When you book an appointment with Life Psychology Australia, your
              personal information is collected through our secure intake forms
              and encrypted practice management system. This includes:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Contact details (name, phone, email)
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Appointment preferences and scheduling information
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Health information relevant to your psychological care
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Medicare and private health insurance details
              </li>
            </ul>
          </section>
          {/* How We Use Your Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">
              Your information is used solely for:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Providing psychological services and telehealth consultations
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Managing appointments and sending appointment reminders
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Processing Medicare claims and private health fund rebates
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Maintaining clinical records as required by professional
                standards
              </li>
            </ul>
          </section>
          {/* Data Security and Storage */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Data Security & Privacy
            </h2>
            <p className="text-gray-700 mb-8">
              Your personal health information is protected with
              enterprise-grade security that meets or exceeds Australian health
              privacy requirements. Here's how we keep your data safe:
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <Shield className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    End-to-End Encryption
                  </h3>
                </div>
                <p className="text-gray-600">
                  All your personal health information is encrypted from the
                  moment it's entered until it's accessed, ensuring complete
                  privacy and security.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <Server className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Australian Data Centers
                  </h3>
                </div>
                <p className="text-gray-600">
                  Your data is stored securely in Australian data centers,
                  complying with local privacy laws and providing fast, reliable
                  access.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Regular Security Audits
                  </h3>
                </div>
                <p className="text-gray-600">
                  We undergo regular security audits and compliance monitoring
                  to maintain the highest standards of data protection.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <Lock className="h-8 w-8 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Access Controls
                  </h3>
                </div>
                <p className="text-gray-600">
                  Strict access controls ensure only authorized personnel can
                  view your information, with detailed audit logs of all access.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700 mb-3">
                <strong>Privacy Notice:</strong> Your booking and personal
                information is securely managed by the Life Psychology Australia
                clinical team using encrypted practice management systems with
                strict access controls.
              </p>
            </div>
          </section>
          {/* Security Overview */}
          <div className="max-w-xl mx-auto mt-12">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm0 0V7m0 4v4m0 0H7m5 0h4"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900">
                  Data Security & Storage
                </h2>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">→</span>
                  End-to-end encryption of all personal health information
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">→</span>
                  Secure data storage within Australian data centers
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">→</span>
                  Regular security audits and compliance monitoring
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">→</span>
                  Restricted access controls for authorized personnel only
                </li>
              </ul>
            </div>
          </div>
          {/* Additional Information */}
          <div className="max-w-xl mx-auto mt-8">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm0 0V7m0 4v4m0 0H7m5 0h4"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900">
                  Need More Information?
                </h2>
              </div>
              <p className="text-gray-700">
                We are happy to answer questions about how your information is
                collected, stored, and used within our practice. Please reach
                out if you require additional details about our privacy
                safeguards, policies, or data handling procedures.
              </p>
              <a
                href="mailto:info@life-psychology.com.au"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-fit"
              >
                Contact Our Team
              </a>
            </div>
          </div>
          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Rights
            </h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Access your personal information held by our practice
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Request corrections to inaccurate information
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Understand how your information is being used
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Request deletion of your information (subject to professional
                record-keeping requirements)
              </li>
            </ul>
          </section>
          {/* Professional Obligations */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Professional Obligations
            </h2>
            <p className="text-gray-700 mb-4">
              As registered psychologists, we are bound by:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Australian Health Practitioner Regulation Agency (AHPRA)
                guidelines
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Australian Psychological Society (APS) Code of Ethics
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Privacy Act 1988 (Commonwealth) requirements
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                Professional confidentiality and record-keeping standards
              </li>
            </ul>
          </section>
          {/* Website Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Website Information
            </h2>
            <p className="text-gray-700">
              Our website (life-psychology.com.au) may collect basic analytics
              information to improve user experience. We do not collect personal
              information directly through browsing activity—personal data is
              only requested when you submit booking or intake details through
              our secure practice systems.
            </p>
          </section>
          {/* Call to Action */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Your privacy and confidentiality are our priority. Book your
              secure telehealth appointment today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={openBookingModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="mr-2">📅</span>
                Book an Appointment
              </button>
              <a
                href="/about"
                className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-6 rounded-lg border border-blue-600 hover:border-blue-700 transition-all duration-200"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100/70 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm mr-3">
                  <span className="text-sm">ℹ️</span>
                </span>
                Learn About Our Approach
              </a>
            </div>
          </section>
          {/* Contact Information */}
          <section className="mt-12 text-center">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Life Psychology Australia
              </h3>
              <div className="space-y-2 text-gray-600">
                <p>
                  Telehealth psychology for Newcastle and the Greater Hunter,
                  available Australia-wide.
                </p>
                <p>
                  Email:{' '}
                  <a
                    href="mailto:info@life-psychology.com.au"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      if (window.gtag) {
                        window.gtag('event', 'email_click', {
                          event_category: 'Contact',
                          event_label: 'privacy_page_email_click',
                          value: 30,
                          email_address: 'info@life-psychology.com.au',
                          click_location: 'privacy_page',
                        });
                      }
                    }}
                  >
                    info@life-psychology.com.au
                  </a>
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                  <span className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span>
                    Medicare rebates (with a valid plan)
                  </span>
                  <span className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span>
                    NDIS (self or plan managed)
                  </span>
                  <span className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span>
                    Private health rebates
                  </span>
                  <span className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span>
                    Telehealth: video and phone options
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Privacy;
