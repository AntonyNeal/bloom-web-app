import type { Metadata } from 'next';
import PricingContent from './PricingContent';

export const metadata: Metadata = {
  title: 'Psychology Session Fees & Funding Options | Medicare, NDIS, Private Health | Life Psychology Australia',
  description: 'Psychology session fees and funding options. Medicare rebates up to $98.95, NDIS $232.99, private health insurance. Transparent pricing for therapy sessions.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
