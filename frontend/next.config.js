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
};

module.exports = nextConfig;
