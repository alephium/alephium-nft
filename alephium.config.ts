import { Configuration } from '@alephium/cli'
import { ONE_ALPH } from '@alephium/web3'

export type Settings = {
  commissionRate: number // basis point. e.g. 200: 2%
  listingFee: number
}

export function loadSettings(network: 'devnet' | 'testnet' | 'mainnet'): { commissionRate: number, listingFee: bigint } {
  return {
    commissionRate: 200,
    listingFee: network === 'devnet' ? ONE_ALPH : (ONE_ALPH / BigInt(10))
  }
}

const configuration: Configuration<Settings> = {
  deploymentScriptDir: 'scripts',
  compilerOptions: {
    errorOnWarnings: true,
    ignoreUnusedConstantsWarnings: false
  },

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
