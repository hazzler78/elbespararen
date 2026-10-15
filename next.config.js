/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure path aliases work in OpenNext builds
  webpack: (config, { isServer, webpack }) => {
    const path = require("path");
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      'node:stream': path.resolve(__dirname, 'src/shims/node-stream'),
      'node:child_process': path.resolve(__dirname, 'src/shims/node-child-process'),
    };

    // Client chunks use `self.webpackChunk_*`. Polyfill when those
    // accidentally get evaluated during server page-data collection.
    if (isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          self: "globalThis",
        })
      );
    }
    
    // Aggressively reduce client bundle size for Cloudflare Pages.
    // Do NOT apply maxSize splitChunks on the server — it emits
    // browser-style chunks that break `next build` with `self is not defined`.
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
  // Security headers (also mirrored in public/_headers for Cloudflare Pages)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.hotjar.com https://script.hotjar.com https://analytics.tiktok.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://*.hotjar.com https://*.hotjar.io wss://*.hotjar.com https://analytics.tiktok.com https://api.x.ai https://api.openai.com",
              "frame-src 'self' https://skaffa.salesys.se https://www.youtube-nocookie.com https://www.svtplay.se",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
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

