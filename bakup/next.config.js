/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Environment variables available to the client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },

  // Webpack configuration for node-pty
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'node-pty': 'commonjs node-pty',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
