/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  compress: true,
  // Enable experimental features if needed
  transpilePackages: ['zlib-sync'],
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons'],
  },
  // Add webpack optimizations
  webpack: (config, { isServer }) => {
    // Add rule for .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Handle native modules that might not be available
    config.resolve.alias = {
      ...config.resolve.alias,
      'zlib-sync': false,
    };

    // Handle native modules that might not be available
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'zlib-sync': 'zlib-sync',
      });

      // Add fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'zlib-sync': false,
      };
    }

    // Only run these optimizations on client builds
    if (!isServer) {
      // Add bundle analyzer in development
      if (process.env.ANALYZE) {
        const withBundleAnalyzer = require('@next/bundle-analyzer')({
          enabled: process.env.ANALYZE === 'true',
        })
        config = withBundleAnalyzer(config)
      }

      // Optimize moment.js and other large libraries
      config.resolve.alias = {
        ...config.resolve.alias,
        'moment$': 'moment/moment.js',
        'zlib-sync': false,
      };

      // Add fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'zlib-sync': false,
      };
    }

    return config;
  },
  // Add headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)/',
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
};

module.exports = nextConfig;