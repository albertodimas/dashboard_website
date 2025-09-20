/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dashboard/db'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fixes for Prisma on Windows with pnpm
      config.externals.push('@prisma/client')
    }
    return config
  },
}

module.exports = nextConfig