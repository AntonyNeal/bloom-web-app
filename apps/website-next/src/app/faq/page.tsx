import type { Metadata } from 'next';
import { ServiceBookingCTA } from '@/components/ServiceBookingCTA';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Life Psychology Australia',
  description: 'Find answers to common questions about psychology services, booking, Medicare rebates, telehealth, and more at Life Psychology Australia.',
  alternates: {
    canonical: '/faq',
  },
};

const faqData = [
  {
    category: 'Getting started & booking',
    questions: [
      {
        question: 'Do I need a referral to book?',
        answer: "No. You can book directly. If you want a Medicare rebate, you'll need a Mental Health Treatment Plan from your general practitioner (GP) or psychiatrist.",
      },
      {
        question: 'How do I book an appointment?',
        answer: "Tap Book Appointment to choose a time inside our secure booking portal, enter your details, and confirm. You'll receive automatic confirmations and reminders.",
      },
      {
        question: 'How soon can I be seen?',
        answer: 'Availability changes during the week. The booking portal always shows the latest available times.',
      },
      {
        question: 'Do you see people outside the Greater Hunter?',
        answer: 'Yes. Telehealth is available Australia-wide. Limited in-person appointments are available in the Greater Hunter.',
      },
    ],
  },
  {
    category: 'Fees, Medicare & private cover',
    questions: [
      {
        question: 'How do fees and rebates work?',
        answer: "We're a private service. With a current Mental Health Treatment Plan, a Medicare rebate can reduce your out-of-pocket cost. Some private health policies also provide benefits for psychology—check your fund.",
      },
      {
        question: 'How many Medicare-rebated sessions can I get each year?',
        answer: 'Medicare sets the number and any review requirements. Your GP or psychiatrist can advise on this.',
      },
      {
        question: 'Can I use the National Disability Insurance Scheme (NDIS)?',
        answer: "If you're an NDIS participant, contact us with your plan details and we'll advise next steps based on your plan type.",
      },
    ],
  },
  {
    category: 'Telehealth setup & access',
    questions: [
      {
        question: 'What device and setup do I need?',
        answer: 'A computer, tablet, or phone with camera and microphone, reliable internet, and a private space. Headphones help with privacy.',
      },
      {
        question: 'Is telehealth secure?',
        answer: 'Yes. We use secure, encrypted platforms for video and a trusted booking system for payments and reminders.',
      },
      {
        question: "What if my internet drops during an appointment?",
        answer: "Rejoin using the same link. If you can't reconnect, we'll contact you to reschedule at a convenient time.",
      },
    ],
  },
  {
    category: 'Confidentiality & records',
    questions: [
      {
        question: 'Is what I say confidential?',
        answer: 'Yes. Your information is private and handled under Australian privacy law. Standard legal limits apply (e.g., serious risk of harm, child protection duties).',
      },
      {
        question: 'Are sessions recorded?',
        answer: 'No.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/10 py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about our psychology services.
          </p>
        </div>

        <div className="space-y-12">
          {faqData.map((category, categoryIdx) => (
            <section key={categoryIdx}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                {category.category}
              </h2>
              <div className="space-y-6">
                {category.questions.map((faq, faqIdx) => (
                  <div key={faqIdx} className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Still Have Questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Feel free to reach out or book a session to discuss your needs.
          </p>
          <ServiceBookingCTA label="Book an Appointment" />
        </div>
      </div>
    </main>
  );
}
