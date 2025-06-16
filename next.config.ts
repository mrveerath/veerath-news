/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    resolveAlias: {
      'lexical': './node_modules/lexical',
    },
  },
};
module.exports = nextConfig;