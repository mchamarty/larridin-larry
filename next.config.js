/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-day-picker'],
  async rewrites() {
    return [
      {
        source: '/api/claude',
        destination: 'https://api.anthropic.com/v1/messages'
      }
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  swcMinify: true
}

module.exports = nextConfig