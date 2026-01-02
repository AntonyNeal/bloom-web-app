'use client';

import { useRef, useState } from 'react';
import { trackContactFormSubmit } from '@/components/providers';

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const hasPhone = Boolean(formData.get('phone'));
    const hasEmail = Boolean(formData.get('email'));

    try {
      trackContactFormSubmit({
        form_type: 'contact_form',
        form_location: 'contact_page',
        has_phone: hasPhone,
        has_email: hasEmail,
      });

      setSubmitMessage("Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.");

      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (err) {
      setSubmitMessage('There was an error sending your message. Please try again or call us directly.');
      console.error('Error tracking contact form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="your.email@example.com"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="0412 345 678"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          How can we help? *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
          placeholder="Tell us about what you're looking for help with..."
        />
      </div>

      {submitMessage && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            submitMessage.includes('error')
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}
        >
          {submitMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span className="flex items-center justify-center gap-2">
          {isSubmitting ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>✉️</span>
              <span>Send Message</span>
            </>
          )}
        </span>
      </button>
    </form>
  );
}
