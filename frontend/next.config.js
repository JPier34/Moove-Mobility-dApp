/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for development
  experimental: {
    // Optimize compilation
    optimizePackageImports: [
      "framer-motion",
      "@rainbow-me/rainbowkit",
      "wagmi",
    ],
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Optimize dev server performance
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules", "**/.git", "**/.next"],
      };

      // Reduce bundle analysis in dev
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    return config;
  },

  // Faster builds
  swcMinify: true,

  // Image optimization
  images: {
    unoptimized: false,
    domains: ["xsdctknbxfzpxukj.public.blob.vercel-storage.com"],
  },

  // Reduce unnecessary work
  eslint: {
    ignoreDuringBuilds: false,
  },

  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
