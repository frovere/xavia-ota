/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};
