/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static generation for API routes
  experimental: {
    // Enable experimental features if needed
  },
  // Image optimization - använd Cloudflare Images eller disable
  images: {
    unoptimized: true, // Disable Next.js image optimization (Cloudflare stödjer inte det)
  },
  // Output standalone for better compatibility
  output: 'standalone',
  // ESLint configuration - behandla warnings som warnings, inte errors
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

