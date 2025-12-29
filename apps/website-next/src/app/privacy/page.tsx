import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Life Psychology Australia',
  description: 'Privacy Policy for Life Psychology Australia. Learn how we collect, use, and protect your personal information.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="text-sm text-gray-500 mb-8">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p>
              Life Psychology Australia (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our psychology services and website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="mb-4">We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth</li>
              <li><strong>Health Information:</strong> Information relevant to your psychological care and treatment</li>
              <li><strong>Payment Information:</strong> Billing details for processing payments</li>
              <li><strong>Technical Information:</strong> IP address, browser type, device information for website analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide psychology services and treatment</li>
              <li>Schedule and manage appointments</li>
              <li>Process payments and provide receipts for Medicare/insurance claims</li>
              <li>Communicate with you about your care</li>
              <li>Comply with legal and professional obligations</li>
              <li>Improve our services and website</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Confidentiality</h2>
            <p>
              All information shared during therapy sessions is confidential. We adhere to the 
              Australian Psychological Society Code of Ethics and relevant privacy legislation.
            </p>
            <p className="mt-4">
              There are limited circumstances where we may be required to disclose information:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>If there is a serious and imminent risk to your life or health, or that of another person</li>
              <li>If required by law (e.g., court order, mandatory reporting of child abuse)</li>
              <li>With your written consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Encrypted telehealth platforms</li>
              <li>Secure storage of electronic records</li>
              <li>Restricted access to personal information</li>
              <li>Regular security reviews</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information (subject to legal retention requirements)</li>
              <li>Withdraw consent for certain uses of your information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to make a request regarding 
              your personal information, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong>{' '}
              <a href="mailto:info@life-psychology.com.au" className="text-blue-600 hover:text-blue-700">
                info@life-psychology.com.au
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any 
              significant changes by posting the new policy on our website.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
