import type { Metadata } from 'next';
import { TeamPageClient } from './TeamPageClient';

export const metadata: Metadata = {
  title: 'Our Psychologists | Meet the Team | Life Psychology Australia',
  description: 'Meet our team of registered psychologists in Newcastle and Greater Hunter region. Professional support for anxiety, depression, couples therapy, neurodiversity, and NDIS services.',
  alternates: {
    canonical: '/team',
  },
  openGraph: {
    title: 'Our Psychologists | Life Psychology Australia',
    description: 'Meet our team of registered psychologists providing professional mental health support across Newcastle and the Greater Hunter region.',
    url: '/team',
    type: 'website',
  },
};

export default function TeamPage() {
  return <TeamPageClient />;
}
