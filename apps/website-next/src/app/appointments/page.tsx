import type { Metadata } from 'next';
import { AppointmentsContent } from './AppointmentsContent';

export const metadata: Metadata = {
  title: 'Book an Appointment - Life Psychology Australia',
  description: 'Book your psychology appointment online. Medicare rebates, NDIS, private health insurance accepted. Individual therapy, couples counselling, professional supervision.',
  alternates: {
    canonical: '/appointments',
  },
};

export default function AppointmentsPage() {
  return <AppointmentsContent />;
}
