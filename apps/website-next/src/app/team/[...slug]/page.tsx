import type { Metadata } from 'next';
import { PractitionerPageClient } from './PractitionerPageClient';

// Static metadata - generic since we can't fetch at build time with static export
export const metadata: Metadata = {
  title: 'Psychologist Profile | Life Psychology Australia',
  description: 'View psychologist profile and book an appointment for professional mental health support.',
};

// For static export with catch-all route: generate a placeholder path
// SWA navigationFallback will serve this for any /team/* path
// The slug will be extracted from the URL on the client side
export function generateStaticParams() {
  // Return a placeholder that Next.js will generate
  // Actual routing is handled by SWA navigationFallback
  return [{ slug: ['_'] }];
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function PractitionerPage({ params }: PageProps) {
  const { slug } = await params;
  // Join slug segments (e.g., ['john-smith'] -> 'john-smith')
  const practitionerSlug = slug?.join('/') || '';
  return <PractitionerPageClient slug={practitionerSlug} />;
}
