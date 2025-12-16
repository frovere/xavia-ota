/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  experimental: {
    reactCompiler: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
