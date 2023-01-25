import { Configuration } from '@alephium/cli'
import { default as devnetConfig } from './configs/devnet.json'
import { default as testnetConfig } from './configs/testnet.json'
import { default as mainnetConfig } from './configs/mainnet.json'

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
      mnemonic:
        'vault alarm sad mass witness property virus style good flower rice alpha viable evidence run glare pretty scout evil judge enroll refuse another lava',
      confirmations: 1,
      settings: loadSettings('devnet')
    },

    testnet: {
      networkId: 1,
      nodeUrl: 'https://wallet-v16.testnet.alephium.org',
      mnemonic: process.env.MNEMONIC as string,
      confirmations: 2,
      settings: loadSettings('testnet')
    },

    mainnet: {
      networkId: 0,
      nodeUrl: process.env.ALPH_NODE_URL as string,
      mnemonic: process.env.MNEMONIC as string,
      confirmations: 2,
      settings: loadSettings('mainnet')
    }
  }
}

export default configuration
