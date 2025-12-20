/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for development
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  // Redirects for authentication
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/tasks',
        permanent: false,
      },
    ];
  },

  // Headers for security
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
        ],
      },
    ];
  },

  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  turbopack: {},

  // Webpack configuration
  webpack: (config, { isServer }) => {
    return config;
  },

  // Experimental features
  experimental: {
    // Enable new features as needed
  },
};

module.exports = nextConfig;
