/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure path aliases work in OpenNext builds
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    
    // Aggressively reduce bundle size for Cloudflare Pages
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 200000, // 200KB max per chunk
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
              maxSize: 200000,
            },
            framer: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              priority: 10,
              chunks: 'all',
              maxSize: 100000,
            },
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'lucide-react',
              priority: 10,
              chunks: 'all',
              maxSize: 50000,
            },
          },
        },
      };
    }
    
    // Reduce server bundle size
    if (isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 200000,
        },
      };
    }
    
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
  // Disable source maps to reduce build size
  productionBrowserSourceMaps: false,
  // Reduce build size
  compress: true,
  poweredByHeader: false,
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

