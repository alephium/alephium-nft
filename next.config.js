/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ENVIRONMENT: "development-walletconnect"
    //ENVIRONMENT: "development-nodewallet"
    //ENVIRONMENT: "browser-extension-softfork"
    // ENVIRONMENT: "browser-extension-local"
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    config.experiments = {
      asyncWebAssembly: true,
      syncWebAssembly: true
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
