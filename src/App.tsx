import { useState, useEffect } from 'react';
import { DesignSystemTest } from './DesignSystemTest';
import ApplicationsList from './pages/admin/ApplicationsList';
import ApplicationDetail from './pages/admin/ApplicationDetail';
import { JoinUs } from './pages/JoinUs';
import { Admin } from './pages/admin/ApplicationManagement';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const [route, setRoute] = useState('');
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setRoute(hash);

      // Extract application ID from hash like #/admin/applications/xxx-xxx-xxx
      const match = hash.match(/\/admin\/applications\/([a-zA-Z0-9-]+)/);
      if (match) {
        setApplicationId(match[1]);
      } else {
        setApplicationId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Proto-Bloom Application Management Routes
  if (route === '/join-us') {
    return (
      <>
        <JoinUs />
        <Toaster />
      </>
    );
  }

  if (route === '/admin') {
    return (
      <>
        <Admin />
        <Toaster />
      </>
    );
  }

  // Design system test route
  if (route === '/design-test') {
    return <DesignSystemTest />;
  }

  // Default home page - Proto-Bloom landing
  if (!route || route === '/') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-5xl font-semibold text-neutral-950 mb-4">
            Welcome to Bloom
          </h1>
          <p className="text-xl text-neutral-600 mb-8">
            Life Psychology Australia's Practitioner Onboarding Portal
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#/join-us"
              className="inline-block px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-lg font-medium transition-colors"
            >
              Join Our Team →
            </a>
            <a
              href="#/admin"
              className="inline-block px-8 py-4 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 text-lg font-medium transition-colors"
            >
              Admin Portal →
            </a>
          </div>
          <div className="mt-8 text-sm text-neutral-500">
            <a href="#/design-test" className="hover:text-neutral-700 underline">
              View Design System
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Route to detail page (old admin routes - keeping for backwards compatibility)
  if (route.startsWith('/admin/applications/') && applicationId) {
    return <ApplicationDetail applicationId={applicationId} />;
  }

  // Route to list page (old admin routes - keeping for backwards compatibility)
  if (route === '/admin/applications') {
    return <ApplicationsList />;
  }

  // Default/home page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bloom Admin
        </h1>
        <p className="text-gray-600 mb-8">
          Life Psychology Australia - Proto-Bloom MVP
        </p>
        <div className="space-x-4">
          <a
            href="#/join-us"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-lg font-medium"
          >
            Join Our Team →
          </a>
          <a
            href="#/admin"
            className="inline-block px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 text-lg font-medium"
          >
            Admin Portal →
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
