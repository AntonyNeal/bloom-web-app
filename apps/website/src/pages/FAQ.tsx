import { Helmet } from 'react-helmet-async';
import { BookingModal } from '../components/BookingModal';
import { useBooking } from '../hooks/useBooking';

const FAQ = () => {
  const { isBookingModalOpen, openBookingModal, closeBookingModal } =
    useBooking();

  const faqData = [
    {
      category: 'Getting started & booking',
      questions: [
        {
          question: 'Do I need a referral to book?',
          answer:
            "No. You can book directly. If you want a Medicare rebate, you'll need a Mental Health Treatment Plan from your general practitioner (GP) or psychiatrist.",
        },
        {
          question: 'How do I book an appointment?',
          answer:
            "Tap Book via Halaxy to choose a time, enter your details, and confirm. You'll receive automatic confirmations and reminders.",
        },
        {
          question: 'How soon can I be seen?',
          answer:
            'Availability changes during the week. The Halaxy booking page shows the latest times.',
        },
        {
          question: 'Do you see people outside the Greater Hunter?',
          answer:
            'Yes. Telehealth is available Australia-wide. Limited in-person appointments are available in the Greater Hunter.',
        },
        {
          question: 'Do you work with adults and young people?',
          answer:
            "We see adults and older adolescents. If you need support for a younger child, contact us and we'll advise on the most suitable pathway.",
        },
      ],
    },
    {
      category: 'Fees, Medicare & private cover',
      questions: [
        {
          question: 'How do fees and rebates work?',
          answer:
            "We're a private service. With a current Mental Health Treatment Plan, a Medicare rebate can reduce your out-of-pocket cost. Some private health policies also provide benefits for psychology—check your fund.",
        },
        {
          question: 'How many Medicare-rebated sessions can I get each year?',
          answer:
            'Medicare sets the number and any review requirements. Your GP or psychiatrist can advise on this.',
        },
        {
          question:
            'Can I use the National Disability Insurance Scheme (NDIS)?',
          answer:
            "If you're an NDIS participant, contact us with your plan details and we'll advise next steps based on your plan type.",
        },
        {
          question: 'Do you provide invoices and receipts for claims?',
          answer:
            "Yes. After payment you'll receive an invoice or receipt you can use for Medicare or private health claims.",
        },
      ],
    },
    {
      category: 'Telehealth setup & access',
      questions: [
        {
          question: 'What device and setup do I need?',
          answer:
            'A computer, tablet, or phone with camera and microphone, reliable internet, and a private space. Headphones help with privacy.',
        },
        {
          question: 'Is telehealth secure?',
          answer:
            'Yes. We use secure, encrypted platforms for video and a trusted booking system for payments and reminders. See our privacy policy for details.',
        },
        {
          question: 'What if my internet drops during an appointment?',
          answer:
            "Rejoin using the same link. If you can't reconnect, we'll contact you to reschedule at a convenient time.",
        },
        {
          question: 'Can I join from work or my car?',
          answer:
            "Yes, if you're stationary, safe, and in a private space where you won't be interrupted. Never connect while driving.",
        },
      ],
    },
    {
      category: 'Confidentiality & records',
      questions: [
        {
          question: 'Is what I say confidential?',
          answer:
            'Yes. Your information is private and handled under Australian privacy law. Standard legal limits apply (e.g., serious risk of harm, child protection duties, or a lawful court order). See our consent form and privacy policy.',
        },
        {
          question: 'Are sessions recorded?',
          answer: 'No.',
        },
        {
          question: 'How do you store my information?',
          answer:
            'We use secure systems for notes, bookings, and payments. See our privacy policy for details, including how to request access to your information.',
        },
      ],
    },
    {
      category: 'Scope of service',
      questions: [
        {
          question: 'What concerns do you help with?',
          answer:
            "Common reasons include anxiety, low mood, stress, relationship difficulties, work or study pressure, grief and adjustment, and motivation. If another service would suit you better, we'll discuss options and referral pathways.",
        },
        {
          question: 'Which therapy approaches do you use?',
          answer:
            'We draw on well-researched approaches including cognitive behaviour therapy (CBT), acceptance and commitment therapy (ACT), eye movement desensitisation and reprocessing (EMDR), dialectical behaviour therapy (DBT), and schema therapy. Your care plan is tailored to your goals.',
        },
        {
          question: 'Do you prescribe medication?',
          answer:
            "No. Psychologists don't prescribe. Your GP or psychiatrist can advise on medications if needed.",
        },
        {
          question: 'Do you write letters or reports?',
          answer:
            "We can provide attendance confirmations and brief clinical letters when appropriate. Detailed reports are considered case-by-case and may incur additional fees. We don't offer medico-legal or court reports.",
        },
      ],
    },
    {
      category: 'Before your first appointment',
      questions: [
        {
          question: 'What happens after I book?',
          answer:
            "You'll receive confirmation and reminders. If you have a Mental Health Treatment Plan or private health details, keep them handy. Test your device and internet beforehand.",
        },
        {
          question: 'How long is an appointment?',
          answer:
            'Standard appointments are approximately 50 minutes unless noted on your booking confirmation.',
        },
      ],
    },
    {
      category: 'Safety & emergencies',
      questions: [
        {
          question: 'Do you provide emergency or crisis support?',
          answer:
            "We don't provide crisis services. If you're in immediate danger or need urgent support, call 000. For 24/7 help, contact Lifeline 13 11 14, Beyond Blue 1300 224 636, NSW Mental Health Line 1800 011 511, or 1800RESPECT 1800 737 732.",
        },
      ],
    },
    {
      category: 'Cancellations & rescheduling',
      questions: [
        {
          question: 'What is your cancellation policy?',
          answer:
            'You can cancel or reschedule via your Halaxy patient portal. If you provide 24 hours or more notice, you will receive a full refund. Cancellations with less than 24 hours notice will be charged the full session fee. No reason is required to cancel.',
        },
      ],
    },
    {
      category: 'Practical details',
      questions: [
        {
          question: 'Where are you located?',
          answer: 'Telehealth is available across Australia.',
        },
        {
          question: 'Can a support person attend?',
          answer:
            'For individual therapy, appointments are usually one-to-one. If you want to involve a support person briefly, discuss this with your psychologist ahead of time.',
        },
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          Psychology FAQ | Common Questions About Therapy Services Newcastle |
          Zoe Semmler
        </title>
        <meta
          name="description"
          content="Frequently asked questions about psychology services in Newcastle NSW. Learn about booking, Medicare rebates, telehealth sessions, NDIS services, and what to expect from therapy with Zoe Semmler."
        />
        <meta
          name="keywords"
          content="psychology FAQ Newcastle, therapy questions, Medicare rebates, telehealth FAQ, NDIS psychology questions, booking psychology appointment"
        />
        <link rel="canonical" href="https://lifepsychology.com.au/faq" />
        <meta
          property="og:title"
          content="Psychology FAQ | Common Questions About Therapy Services Newcastle"
        />
        <meta
          property="og:description"
          content="Frequently asked questions about psychology services in Newcastle NSW. Learn about booking, Medicare rebates, telehealth sessions, NDIS services, and what to expect from therapy."
        />
        <meta property="og:url" content="https://lifepsychology.com.au/faq" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Psychology FAQ | Common Questions About Therapy Services Newcastle"
        />
        <meta
          name="twitter:description"
          content="Frequently asked questions about psychology services in Newcastle NSW. Learn about booking, Medicare rebates, telehealth sessions, NDIS services, and what to expect from therapy."
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto mb-8">
              We've gathered clear answers to the questions people ask most
              about telehealth psychology, fees and rebates, privacy, and
              booking. If you can't find what you need, contact us or go
              straight to the booking page.
            </p>
          </div>

          {/* FAQ Content */}
          <div className="space-y-12">
            {faqData.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {category.category}
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {category.questions.map((item, questionIndex) => (
                    <div key={questionIndex} className="px-6 py-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">
                        {item.question}
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Ready to book?</h2>
              <p className="text-blue-100 mb-6">
                Take the first step towards better mental health today.
              </p>
              <button
                onClick={(e) => openBookingModal(e)}
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <span>Book Appointment</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal isOpen={isBookingModalOpen} onClose={closeBookingModal} />
    </>
  );
};

export default FAQ;
