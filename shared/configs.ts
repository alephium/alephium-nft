import { NetworkId, ONE_ALPH } from "@alephium/web3"
import { loadDeployments } from "../artifacts/ts/deployments"

export interface AlephiumNFTConfig {
  network: NetworkId,
  groupIndex: number,
  commissionRate: number,
  listingFee: bigint,
  marketplaceContractId: string,
  marketplaceContractAddress: string,
  marketplaceAdminAddress: string,
  nftTemplateId: string,
  openCollectionTemplateId: string,
  openCollectionWithRoyaltyTemplateId: string,
  publicSaleCollectionTemplateId: string,
  pollingInterval: number,
  defaultNodeUrl: string,
  defaultExplorerUrl: string,
  backendUrl: string,
  mongoUrl: string
}

export function getNetwork(): NetworkId {
  const network = (process.env.NEXT_PUBLIC_NETWORK ?? 'devnet') as NetworkId
  return network
}

export function getDefaultNodeUrl(): string {
  const network = getNetwork()
  return network === 'devnet' ?
    'http://127.0.0.1:22973' : network === 'testnet' ?
      'https://wallet-v20.testnet.alephium.org' : 'https://wallet-v20.mainnet.alephium.org'
}

export function getDefaultExplorerUrl(): string {
  const network = getNetwork()
  return network === 'devnet' ?
    'http://localhost:9090' : network === 'testnet' ?
      'https://backend-v113.testnet.alephium.org' : 'https://backend-v113.mainnet.alephium.org'
}

export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3019'
}

export function getMongoUrl(): string {
  return process.env.MONGO_URL ?? 'mongodb://localhost:27017'
}

function getPollingInterval(): number {
  const network = getNetwork()
  return network === 'devnet' ? 1000 : 100000
}

export function loadSettings(network: 'devnet' | 'testnet' | 'mainnet'): { commissionRate: number, listingFee: bigint } {
  return {
    commissionRate: 200,
    listingFee: network === 'devnet' ? ONE_ALPH * 2n : network === 'testnet' ? ONE_ALPH : ONE_ALPH,
  }
}

export function getAlephiumNFTConfig(): AlephiumNFTConfig {
  const network = getNetwork()
  const deploymentConfig = loadSettings(network)

  const deployments = loadDeployments(network)
  const marketPlace = deployments.contracts.NFTMarketPlace.contractInstance
  const groupIndex = marketPlace.groupIndex
  const marketplaceAdminAddress = deployments.deployerAddress
  return {
    network,
    groupIndex,
    commissionRate: deploymentConfig.commissionRate,
    listingFee: deploymentConfig.listingFee,
    marketplaceAdminAddress,
    marketplaceContractId: marketPlace.contractId,
    marketplaceContractAddress: marketPlace.address,
    nftTemplateId: deployments.contracts.NFT.contractInstance.contractId,
    openCollectionTemplateId: deployments.contracts.NFTOpenCollection.contractInstance.contractId,
    openCollectionWithRoyaltyTemplateId: deployments.contracts.NFTOpenCollectionWithRoyalty!.contractInstance.contractId,
    publicSaleCollectionTemplateId: deployments.contracts.NFTPublicSaleCollectionSequential.contractInstance.contractId,
    defaultNodeUrl: getDefaultNodeUrl(),
    defaultExplorerUrl: getDefaultExplorerUrl(),
    backendUrl: getBackendUrl(),
    pollingInterval: getPollingInterval(),
    mongoUrl: getMongoUrl()
  }
}
