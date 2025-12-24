import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO';
import { getEnvVar } from '../utils/env';

const Home = () => {
  useEffect(() => {
    // Lazy load analytics to avoid forced reflows
    import('../utils/analytics').then(({ intentScorer }) => {
      intentScorer.trackPageView('/');
    });
  }, []);

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
        {/* Special Demo for Brooke */}
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="text-8xl mb-8 animate-pulse">🌟</div>
          <h1 className="text-5xl md:text-7xl font-bold text-purple-800 mb-6">
            Hey Brooke! 💜
          </h1>
          <p className="text-2xl md:text-3xl text-purple-600 mb-8 max-w-2xl">
            Welcome to Zoe's new online booking system!
          </p>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-xl">
            You're getting an exclusive sneak peek because you're the best sister-in-law ever! 🎉
          </p>
          <div className="text-6xl space-x-4">
            ✨ 💖 🌸 💖 ✨
          </div>
          <p className="mt-12 text-lg text-purple-500 italic">
            Merry Christmas Brooke! 🎄
          </p>
        </div>
      </div>
    </>
  );
};

export default Home;
