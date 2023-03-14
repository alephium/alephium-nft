export const NETWORK: string = process.env.NEXT_PUBLIC_NETWORK || 'devnet'

import devnetDeployment from '../../.deployments.devnet.json'
import testnetDeployment from '../../.deployments.testnet.json'
import mainnetDeployment from '../../.deployments.mainnet.json'

export const defaultNftCollectionContractId: string =
  NETWORK === 'mainnet'
    // @ts-ignore
    ? mainnetDeployment['contracts']?.NFTOpenCollection.contractId
    : NETWORK === 'testnet'
      // @ts-ignore
      ? testnetDeployment['contracts']?.NFTOpenCollection.contractId
      // @ts-ignore
      : devnetDeployment['contracts']?.NFTOpenCollection.contractId

export const marketplaceContractId: string =
  NETWORK === 'mainnet'
    // @ts-ignore
    ? mainnetDeployment['contracts']?.NFTMarketPlace.contractId
    : NETWORK === 'testnet'
      // @ts-ignore
      ? testnetDeployment['contracts']?.NFTMarketPlace.contractId
      // @ts-ignore
      : devnetDeployment['contracts']?.NFTMarketPlace.contractId
