export const NETWORK: string = process.env.NEXT_PUBLIC_NETWORK || 'devnet'

import devnetDeployment from '../../artifacts/.deployments.devnet.json'
import testnetDeployment from '../../artifacts/.deployments.testnet.json'
import mainnetDeployment from '../../artifacts/.deployments.mainnet.json'

export const marketplaceContractId: string =
  NETWORK === 'mainnet'
    // @ts-ignore
    ? mainnetDeployment['contracts']?.NFTMarketPlace.contractId
    : NETWORK === 'testnet'
      // @ts-ignore
      ? testnetDeployment['contracts']?.NFTMarketPlace.contractId
      // @ts-ignore
      : devnetDeployment['contracts']?.NFTMarketPlace.contractId
