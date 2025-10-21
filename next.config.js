/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure path aliases work in OpenNext builds
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
  // Image optimization - använd Cloudflare Images eller disable
  images: {
    unoptimized: true, // Disable Next.js image optimization (Cloudflare stödjer inte det)
  },
  // Optimize for Cloudflare Pages - reduce bundle size
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  // ESLint configuration - behandla warnings som warnings, inte errors
  eslint: {
    // Cloudflare buildmiljö saknar eslint, hoppa över under build
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

