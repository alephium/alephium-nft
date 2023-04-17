export const NETWORK: NetworkId = process.env.NEXT_PUBLIC_NETWORK as NetworkId || 'devnet'

import devnetDeployment from '../../artifacts/.deployments.devnet.json'
import testnetDeployment from '../../artifacts/.deployments.testnet.json'
import mainnetDeployment from '../../artifacts/.deployments.mainnet.json'
import { NetworkId } from '@alephium/web3'

export const marketplaceContractId: string =
  NETWORK === 'mainnet'
    // @ts-ignore
    ? mainnetDeployment['contracts']?.NFTMarketPlace.contractInstance.contractId
    : NETWORK === 'testnet'
      // @ts-ignore
      ? testnetDeployment['contracts']?.NFTMarketPlace.contractInstance.contractId
      // @ts-ignore
      : devnetDeployment['contracts']?.NFTMarketPlace.contractInstance.contractId

export const nftTemplateId: string =
  NETWORK === 'mainnet'
    // @ts-ignore
    ? mainnetDeployment['contracts']?.EnumerableNFT.contractInstance.contractId
    : NETWORK === 'testnet'
      // @ts-ignore
      ? testnetDeployment['contracts']?.EnumerableNFT.contractInstance.contractId
      // @ts-ignore
      : devnetDeployment['contracts']?.EnumerableNFT.contractInstance.contractId
