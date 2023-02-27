export const NETWORK: string = process.env.NEXT_PUBLIC_NETWORK || 'devnet'

import { default as devnetConfig } from './devnet.json'
import { default as testnetConfig } from './testnet.json'
import { default as mainnetConfig } from './mainnet.json'

export const defaultNftCollectionContractId: string =
  NETWORK === 'mainnet'
    ? mainnetConfig.marketplaceContractId
    : NETWORK === 'testnet'
      ? testnetConfig.defaultNftCollectionContractId
      : devnetConfig.defaultNftCollectionContractId

export const marketplaceContractId: string =
  NETWORK === 'mainnet'
    ? mainnetConfig.marketplaceContractId
    : NETWORK === 'testnet'
      ? testnetConfig.marketplaceContractId
      : devnetConfig.marketplaceContractId
