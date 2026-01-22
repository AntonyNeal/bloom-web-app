import dynamic from 'next/dynamic';
import { HeroSection } from "@/components/HeroSection";
import { HorizonBackground } from "@/components/HorizonBackground";
import { TeamSection } from "@/components/TeamSection";
import { getPractitioners } from "@/services/practitioner-service";
import type { Metadata } from "next";

// Lazy load below-fold components to reduce initial bundle
const ServicesSection = dynamic(
  () => import('@/components/ServicesSection').then(mod => mod.ServicesSection),
  { 
    loading: () => <div className="py-16 lg:py-24 bg-white" aria-hidden="true" />,
    ssr: true // Keep SSR for SEO
  }
);

export const metadata: Metadata = {
  title: "Psychologist Newcastle | Anxiety & Depression Therapy",
  description: "Professional psychologist in Newcastle providing anxiety therapy, depression counselling, couples therapy, and NDIS psychology services. Secure telehealth sessions across the Greater Hunter region.",
  alternates: {
    canonical: "/",
  },
};

// Service data for the homepage
const servicesData = {
  title: "How we can help",
  services: [
    {
      title: "Anxiety & Depression",
      description: "Professional support for anxiety, depression, and stress management.",
      href: "/anxiety-depression",
      icon: "🧠",
    },
    {
      title: "Couples Therapy",
      description: "Strengthen relationships through improved communication.",
      href: "/couples-therapy",
      icon: "💑",
    },
    {
      title: "Neurodiversity Support",
      description: "Affirming support for autistic and neurodivergent adults.",
      href: "/neurodiversity",
      icon: "🌈",
    },
    {
      title: "NDIS Services",
      description: "Specialised psychology support for NDIS participants.",
      href: "/ndis-services",
      icon: "📋",
    },
  ],
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Life Psychology Australia",
  "description": "Professional counselling and psychology services in Newcastle NSW",
  "url": "https://life-psychology.com.au",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Newcastle",
    "addressRegion": "NSW",
    "addressCountry": "AU",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "-32.9283",
    "longitude": "151.7817",
  },
  "openingHours": "Mo-Sa 09:00-17:00",
  "priceRange": "$$",
  "paymentAccepted": ["Cash", "Credit Card", "Medicare", "NDIS"],
  "currenciesAccepted": "AUD",
};

export default async function HomePage() {
  // Fetch practitioners for team section
  const practitioners = await getPractitioners();

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen relative">
        {/* Horizon background - earth and sky for the tree to grow from */}
        <HorizonBackground earthHeight="20%" animated={true} />
        
        {/* Hero Section - Server-rendered for instant LCP */}
        <HeroSection />
        
        {/* Services Section */}
        <div className="mt-16 lg:mt-24">
          <ServicesSection {...servicesData} />
        </div>

        {/* Meet Our Team Section */}
        <TeamSection practitioners={practitioners} />
      </div>
    </>
  );
}
