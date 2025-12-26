import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

/**
 * SEO Component with Canonical Tags
 *
 * Automatically generates canonical URLs based on current route.
 * Normalizes URLs by removing trailing slashes (except root).
 *
 * Usage:
 *   <SEO title="About Us" description="Learn about our practice" />
 *   <SEO canonicalUrl="https://life-psychology.com.au/specific-page" />
 */
export function SEO({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  noindex = false,
}: SEOProps) {
  const location = useLocation();

  // Always use production URL for canonical (staging/dev should not be indexed)
  // Use www subdomain consistently for SEO
  const baseUrl = 'https://www.life-psychology.com.au';
  
  // Auto-detect staging/dev environments and set noindex
  const isNonProduction = typeof window !== 'undefined' && 
    (window.location.hostname.includes('staging') || 
     window.location.hostname === 'localhost' ||
     window.location.hostname.includes('azurestaticapps.net'));
  const shouldNoindex = noindex || isNonProduction;

  // Normalize path: remove trailing slash except for root
  const normalizePath = (path: string): string => {
    if (path === '/' || path === '') return '';
    return path.endsWith('/') ? path.slice(0, -1) : path;
  };

  // Generate canonical URL
  const normalizedPath = normalizePath(location.pathname);
  const fullCanonicalUrl = canonicalUrl || `${baseUrl}${normalizedPath}`;

  // Default values
  const siteTitle = 'Life Psychology Australia';
  const pageTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription =
    'Professional psychological services in the Hunter Region, NSW. Specialising in individual therapy, couples counselling, anxiety, depression, trauma recovery, and NDIS support.';
  const metaDescription = description || defaultDescription;
  const defaultImage = `${baseUrl}/og-image-sunflower.png`;
  const socialImage = ogImage || defaultImage;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />

      {/* Canonical Tag - Critical for SEO */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Robots Meta - auto-noindex for staging/dev environments */}
      {shouldNoindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph Tags */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="en_AU" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={socialImage} />

      {/* Additional SEO Tags */}
      <meta name="geo.region" content="AU-NSW" />
      <meta name="geo.placename" content="Hunter Region" />
    </Helmet>
  );
}

export default SEO;
