/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // SWC minification for better performance
  swcMinify: true,

  // Webpack configuration to ignore optional dependencies
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that cause warnings
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };

    // Add externals for optional dependencies
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        "@react-native-async-storage/async-storage":
          "commonjs @react-native-async-storage/async-storage",
        "pino-pretty": "commonjs pino-pretty",
      });
    }

    return config;
  },
};

module.exports = nextConfig;
