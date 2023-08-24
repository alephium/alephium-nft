/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  reactStrictMode: true,
  env: {
    //ENVIRONMENT: "development-walletconnect"
    //ENVIRONMENT: "development-nodewallet"
    ENVIRONMENT: "browser-extension"
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
  images: {
    domains: ['alephium-nft.infura-ipfs.io', 'ipfs.io']
  }
}

module.exports = nextConfig
