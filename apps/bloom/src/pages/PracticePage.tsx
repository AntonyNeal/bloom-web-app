/**
 * Practice Page - Standalone Clinic Management
 * BLOOM Design System - Miyazaki/Studio Ghibli aesthetic
 */

import { useAuth } from '@/hooks';
import { PracticeDashboard } from '@/components/practice';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config';

export function PracticePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bloom-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-bloom-sage border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Get practitioner ID from user (adjust based on your auth structure)
  const practitionerId = user.practitionerId || user.id;
  const practitionerName = user.name || user.firstName || 'Practitioner';

  return (
    <PracticeDashboard 
      practitionerId={practitionerId} 
      practitionerName={practitionerName}
    />
  );
}
