import type { Metadata } from 'next';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us | Life Psychology Australia',
  description: 'Get in touch with Life Psychology Australia. Professional psychology services in Newcastle NSW. Email, phone, and contact form available.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Contact Us</h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Get In Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">📧</span>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600">info@life-psychology.com.au</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">📍</span>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">Newcastle, NSW</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">📞</span>
                    <div>
                      <p className="font-medium">Phone</p>
                      <a href="tel:131114" className="text-blue-600 hover:text-blue-700 underline">
                        Lifeline: 13 11 14
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Office Hours</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
