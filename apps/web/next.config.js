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
  env: {
    JWT_SECRET: process.env.JWT_SECRET ?? 'development-placeholder',
    CLIENT_JWT_SECRET: process.env.CLIENT_JWT_SECRET ?? process.env.JWT_SECRET ?? 'development-placeholder',
    REFRESH_SECRET: process.env.REFRESH_SECRET ?? 'development-refresh',
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