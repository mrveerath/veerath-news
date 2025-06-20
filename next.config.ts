/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    resolveAlias: {
      'lexical': './node_modules/lexical',
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb' // Increase limit as needed (e.g., 10mb, 20mb)
    },
     serverComponentsExternalPackages: ["mongoose"],
  },
  images: {
    domains: ['ik.imagekit.io'], // Add your external image domain here
  },
};
module.exports = nextConfig;