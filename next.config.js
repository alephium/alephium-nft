/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    config.experiments = {
      asyncWebAssembly: true,
      syncWebAssembly: true,
      layers: true
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/my-nfts',
        permanent: true
      }
    ]
  }
}

module.exports = nextConfig
