import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Azure Static Web Apps
  // Generates fully static HTML files - optimal for CDN delivery
  output: "export",
  
  // Trailing slash for consistent routing on static hosts
  trailingSlash: true,
  
  // Enable React compiler for better performance
  reactCompiler: true,
  
  // Image optimization configuration
  images: {
    // Use unoptimized for static export (images pre-optimized in public folder)
    unoptimized: true,
    // Allow external images from these domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  
  // Environment variables to expose to the browser
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://life-psychology.com.au',
  },
  
  // Disable powered by header
  poweredByHeader: false,
  
  // Generate ETags for caching
  generateEtags: true,
  
  // Compress output
  compress: true,
};

export default nextConfig;
