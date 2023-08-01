export const NETWORK: NetworkId = process.env.NEXT_PUBLIC_NETWORK as NetworkId || 'devnet'

import { addressFromContractId, groupOfAddress, NetworkId } from '@alephium/web3'
import { loadDeployments } from '../../artifacts/ts/deployments'

import devnetConfig from './devnet.json'
import testnetConfig from './testnet.json'
import mainnetConfig from './mainnet.json'

const deployment = loadDeployments(NETWORK)

export const marketplaceContractId: string = deployment.contracts.NFTMarketPlace.contractInstance.contractId
export const marketplaceContractAddress = addressFromContractId(marketplaceContractId)
export const nftTemplateId: string = deployment.contracts.NFT.contractInstance.contractId
export const openCollectionTemplateId: string = deployment.contracts.NFTOpenCollection.contractInstance.contractId
export const publicSaleCollectionTemplateId: string = deployment.contracts.NFTPublicSaleCollectionSequential.contractInstance.contractId
export const pollingInterval = NETWORK === 'devnet' ? 1000 : 10000

const config = NETWORK === 'devnet' ? devnetConfig : NETWORK === 'testnet' ? testnetConfig : mainnetConfig
export const defaultNodeUrl = config.defaultNodeUrl
export const defaultExplorerUrl = config.defaultExplorerUrl
export const mongoUrl = config.mongodbUrl
export const backendUrl = config.backendUrl
export const groupIndex = groupOfAddress(marketplaceContractAddress)