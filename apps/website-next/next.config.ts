import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use static export for Azure Static Web Apps
  // This generates static HTML files that can be deployed to any static host
  output: "export",
  
  // Trailing slash for consistent routing on static hosts
  trailingSlash: true,
  
  // Enable React compiler for better performance
  reactCompiler: true,
  
  // Image optimization configuration
  images: {
    // Static export requires unoptimized images (use next/image with static loader)
    unoptimized: true,
  },
  
  // Environment variables to expose to the browser
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://life-psychology.com.au',
  },
};

export default nextConfig;
