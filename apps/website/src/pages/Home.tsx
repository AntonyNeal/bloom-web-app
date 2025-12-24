import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { BUILD_INFO } from '../build-info';
import DebugPanel from '../components/DebugPanel';
import SEO from '../components/SEO';
import SmartHeader from '../components/SmartHeader';
import ServicesSection from '../components/sections/ServicesSection';
import HorizonBackground from '../components/HorizonBackground';
import { getEnvBool, getEnvVar, isAzureStaticWebApps } from '../utils/env';

declare global {
  interface Window {
    deploymentIteration: string;
  }
}

const Home = () => {
  // Debug banner visibility rules:
  // - If VITE_DEBUG_PANEL is explicitly true (runtime or build) => show everywhere (explicit opt-in)
  // - Otherwise, allow URL/localStorage opt-in only in development mode
  const explicitDebug = getEnvBool('VITE_DEBUG_PANEL');
  // Treat Azure preview/hosted static sites as production even if the bundle
  // was built with MODE=development or BUILD_INFO.viteMode indicates 'development'.
  // This prevents dev-only UI from auto-displaying on hosted previews. Use
  // explicit VITE_DEBUG_PANEL to opt-in on hosted sites.
  const builtAsDev = BUILD_INFO && BUILD_INFO.viteMode === 'development';
  const isDevMode =
    (import.meta.env.MODE === 'development' || builtAsDev) &&
    !isAzureStaticWebApps();
  const urlOptIn =
    window.location.search.includes('debug=true') ||
    window.location.search.includes('showDebug=true');
  const localOptIn = localStorage.getItem('showDebugPanel') === 'true';
  const showBanner = explicitDebug || (isDevMode && (urlOptIn || localOptIn));

  useEffect(() => {
    // Lazy load analytics to avoid forced reflows
    import('../utils/analytics').then(({ intentScorer }) => {
      intentScorer.trackPageView('/');
    });
    // Note: preloadAvailability() is now called globally in App.tsx
  }, []);

  // Streamlined services data for better performance
  const servicesData = {
    title: 'How I can help',
    services: [
      {
        title: 'Anxiety & Depression',
        description:
          'Professional support for anxiety, depression, and stress management.',
        href: '/anxiety-depression',
        icon: '🧠',
      },
      {
        title: 'Couples Therapy',
        description: 'Strengthen relationships through improved communication.',
        href: '/couples-therapy',
        icon: '💑',
      },
      {
        title: 'Neurodiversity Support',
        description:
          'Affirming support for autistic and neurodivergent adults.',
        href: '/neurodiversity',
        icon: '🌈',
      },
      {
        title: 'NDIS Services',
        description: 'Specialised psychology support for NDIS participants.',
        href: '/ndis-services',
        icon: '📋',
      },
    ],
  };

  // Removed aboutData as AboutSection is no longer used on homepage for performance

  return (
    <>
      {/* SEO Component with Canonical Tag */}
      <SEO
        title="Psychologist Newcastle | Anxiety & Depression Therapy"
        description="Professional psychologist in Newcastle providing anxiety therapy, depression counselling, couples therapy, and NDIS psychology services. Secure telehealth sessions across the Greater Hunter region."
      />

      <Helmet>
        <meta
          name="keywords"
          content="psychologist Newcastle, anxiety therapy Newcastle, depression counselling Newcastle, couples therapy Newcastle, marriage therapy Newcastle, autism psychologist Newcastle, ADHD therapy Newcastle, NDIS psychologist Newcastle, telehealth psychology NDIS, mental health services Newcastle"
        />
        <link rel="canonical" href={`${getEnvVar('VITE_BASE_URL')}/`} />
        <meta
          property="og:title"
          content="Life Psychology Australia | Psychologist Newcastle | Anxiety & Depression Therapy"
        />
        <meta
          property="og:description"
          content="Professional psychologist in Newcastle providing anxiety therapy, depression counselling, couples therapy, and NDIS psychology services. Secure telehealth sessions across the Greater Hunter region."
        />
        <meta property="og:url" content={`${getEnvVar('VITE_BASE_URL')}/`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {`{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Life Psychology Australia",
          "description": "Professional counselling and psychology services in Newcastle NSW",
          "url": "${getEnvVar('VITE_BASE_URL')}",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Newcastle",
            "addressRegion": "NSW",
            "addressCountry": "AU"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "-32.9283",
            "longitude": "151.7817"
          },
          "openingHours": "Mo-Sa 09:00-17:00",
          "priceRange": "$$",
          "paymentAccepted": ["Cash", "Credit Card", "Medicare", "NDIS"],
          "currenciesAccepted": "AUD"
        }`}
        </script>
        <meta
          name="twitter:title"
          content="Life Psychology Australia | Psychologist Newcastle | Anxiety & Depression Therapy"
        />
        <meta
          name="twitter:description"
          content="Professional psychologist in Newcastle providing anxiety therapy, depression counselling, couples therapy, and NDIS psychology services. Secure telehealth sessions across the Greater Hunter region."
        />
      </Helmet>
      <div className="min-h-screen relative bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100">
        {/* Special Demo for Mother-in-Law */}
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="text-8xl mb-8 animate-pulse">💐</div>
          <h1 className="text-5xl md:text-7xl font-bold text-purple-800 mb-6">
            Welcome, Mum! 💜
          </h1>
          <p className="text-2xl md:text-3xl text-purple-600 mb-8 max-w-2xl">
            We're so grateful to have you in our family.
          </p>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-xl">
            Thank you for being such a wonderful mother-in-law and for all your love and support.
          </p>
          <div className="text-6xl space-x-4">
            ✨ 🌸 💖 🌸 ✨
          </div>
          <p className="mt-12 text-lg text-purple-500 italic">
            This is Zoe's online booking system - and you're getting a VIP preview!
          </p>
        </div>
      </div>
    </>
  );
};

export default Home;
