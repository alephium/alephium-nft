export const NETWORK: NetworkId = process.env.NEXT_PUBLIC_NETWORK as NetworkId || 'devnet'

import { NetworkId } from '@alephium/web3'
import { loadDeployments } from '../../artifacts/ts/deployments'

const deployment = loadDeployments(NETWORK)

export const marketplaceContractId: string = deployment.contracts.NFTMarketPlace.contractInstance.contractId
export const nftTemplateId: string = deployment.contracts.EnumerableNFT.contractInstance.contractId
