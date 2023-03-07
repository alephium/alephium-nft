import { Configuration } from '@alephium/cli'
import { devnetConfig, testnetConfig, mainnetConfig } from './configs/nft'

export type Settings = {
  marketplaceContractId: string
  marketplaceAdminAddress: string
  defaultNftCollectionContractId: string
  commissionRate: number // basis point. e.g. 200: 2%
  listingFee: number
}

function loadSettings(network: 'devnet' | 'testnet' | 'mainnet'): Settings {
  const config = network === 'devnet' ? devnetConfig : network === 'testnet' ? testnetConfig : mainnetConfig
  return {
    marketplaceContractId: config.marketplaceContractId,
    defaultNftCollectionContractId: config.defaultNftCollectionContractId,
    marketplaceAdminAddress: config.marketplaceAdminAddress,
    commissionRate: config.commissionRate,
    listingFee: config.listingFee
  }
}

const configuration: Configuration<Settings> = {
  deploymentScriptDir: 'scripts',
  compilerOptions: {
    errorOnWarnings: true,
    ignoreUnusedConstantsWarnings: true
  },

  defaultNetwork: 'devnet',
  networks: {
    devnet: {
      networkId: 4,
      nodeUrl: 'http://localhost:22973',
      privateKeys: [
        'a642942e67258589cd2b1822c631506632db5a12aabcf413604e785300d762a5'
      ],
      confirmations: 1,
      settings: loadSettings('devnet')
    },

    testnet: {
      nodeUrl: process.env.NODE_URL as string,
      privateKeys: process.env.PRIVATE_KEYS === undefined ? [] : process.env.PRIVATE_KEYS.split(','),
      confirmations: 2,
      settings: loadSettings('testnet')
    },

    mainnet: {
      nodeUrl: process.env.NODE_URL as string,
      privateKeys: process.env.PRIVATE_KEYS === undefined ? [] : process.env.PRIVATE_KEYS.split(','),
      confirmations: 2,
      settings: loadSettings('mainnet')
    }
  }
}

export default configuration
