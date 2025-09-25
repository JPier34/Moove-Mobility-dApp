/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for development
  experimental: {
    // Optimize compilation
    optimizePackageImports: [
      "framer-motion",
      "@rainbow-me/rainbowkit",
      "wagmi",
      "ethers",
      "viem",
      "@tanstack/react-query",
    ],
    // Faster compilation
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
    // Enable SWC minification for better performance
    swcMinify: true,
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Optimize dev server performance
      config.watchOptions = {
        poll: 2000, // Increased for better performance
        aggregateTimeout: 500,
        ignored: ["**/node_modules", "**/.git", "**/.next", "**/dist"],
      };

      // Reduce bundle analysis in dev
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        // Disable source maps in dev for faster builds
        minimize: false,
      };

      // Faster rebuilds
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // Optimize for production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
          },
        },
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
    formats: ["image/webp", "image/avif"],
  },

  // Reduce unnecessary work
  eslint: {
    ignoreDuringBuilds: false,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
