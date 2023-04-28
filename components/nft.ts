import axios from "axios"
import useSWR from "swr"
import { NETWORK } from '../configs/nft'
import { NonEnumerableNFT } from '../artifacts/ts'
import { fetchNFTListings } from "./nft-listing"
import { fetchNFTMarketplaceState } from '../utils/contracts'
import { fetchNFTOpenCollectionState, fetchNonEnumerableNFTState } from "../utils/contracts"
import { marketplaceContractId } from '../configs/nft'
import { web3, addressFromTokenId, hexToString, SignerProvider, addressFromContractId, contractIdFromAddress, binToHex, Account } from "@alephium/web3"

export interface NFT {
  name: string,
  description: string,
  image: string,
  tokenId: string,
  listed: boolean,
  collectionId: string
}

export interface NFTCollection {
  id: string,
  name: string,
  description: string,
  totalSupply: bigint,
  image: string,
  nfts: NFT[]
}

export type NFTsByCollection = Map<NFTCollection, NFT[]>

export async function fetchNFT(
  tokenId: string,
  listed: boolean
): Promise<NFT | undefined> {
  var nftState = undefined

  const nodeProvider = web3.getCurrentNodeProvider()
  if (!!nodeProvider) {
    try {
      nftState = await fetchNonEnumerableNFTState(
        addressFromTokenId(tokenId)
      )
    } catch (e) {
      console.debug(`error fetching state for ${tokenId}`, e)
    }

    if (nftState && nftState.codeHash === NonEnumerableNFT.contract.codeHash) {
      const metadataUri = hexToString(nftState.fields.uri as string)
      try {
        const metadata = (await axios.get(metadataUri)).data
        return {
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          tokenId: tokenId,
          collectionId: nftState.fields.collectionId,
          listed
        }
      } catch {
        return undefined
      }
    }
  }
}

export async function fetchListedNFTs(
  signerProvider: SignerProvider,
  marketplaceContractAddress: string,
  address: string
): Promise<NFTCollection[]> {
  const listings = await fetchNFTListings(signerProvider, marketplaceContractAddress, address)
  const tokenIds = listings.map((listing) => listing._id)
  return await fetchNFTCollections(tokenIds, true)
}

export async function fetchNFTsFromUTXOs(
  address: string
): Promise<NFTCollection[]> {

  const nodeProvider = web3.getCurrentNodeProvider()
  if (nodeProvider) {
    const balances = await nodeProvider.addresses.getAddressesAddressBalance(address)
    const tokenBalances = balances.tokenBalances !== undefined ? balances.tokenBalances : []
    const tokenIds = tokenBalances
      .filter((token) => +token.amount == 1)
      .map((token) => token.id)

    return await fetchNFTCollections(tokenIds, false)
  }

  return [];
}

export function mergeNFTCollections(
  left: NFTCollection[],
  right: NFTCollection[]
): NFTCollection[] {
  for (const l of left) {
    const index = right.findIndex((item) => item.id === l.id)
    if (index === -1) {
      right.push(l)
    } else {
      right[index].nfts = right[index].nfts.concat(l.nfts)
    }
  }

  return right
}

export async function fetchNFTCollection(
  collectionId: string
): Promise<NFTCollection> {
  const collectionAddress = addressFromContractId(collectionId)
  const collectionState = await fetchNFTOpenCollectionState(collectionAddress)
  const metadataUri = hexToString(collectionState.fields.collectionUri)
  const explorerProvider = web3.getCurrentExplorerProvider()

  const metadata = (await axios.get(metadataUri)).data
  const nfts = []
  if (explorerProvider) {
    const { subContracts } = await explorerProvider.contracts.getContractsContractSubContracts(collectionAddress)
    for (const tokenAddress of subContracts || []) {
      const tokenId = binToHex(contractIdFromAddress(tokenAddress))
      const nft = await fetchNFT(tokenId, false)
      if (nft) {
        nfts.push(nft)
      }
    }
  }

  return {
    id: collectionId,
    name: metadata.name,
    description: metadata.description,
    totalSupply: collectionState.fields.totalSupply,
    image: metadata.image,
    nfts
  }
}

async function fetchNFTCollections(
  tokenIds: string[],
  listed: boolean,
): Promise<NFTCollection[]> {
  const items = []

  for (var tokenId of tokenIds) {
    const nft = await fetchNFT(tokenId, listed)

    if (!!nft) {
      const index = items.findIndex((item) => item.id === nft.collectionId)
      if (index === -1) {
        const collectionAddress = addressFromContractId(nft.collectionId)
        const collectionState = await fetchNFTOpenCollectionState(collectionAddress)
        const metadataUri = hexToString(collectionState.fields.collectionUri)
        const metadata = (await axios.get(metadataUri)).data
        items.push({
          id: nft.collectionId,
          name: metadata.name,
          description: metadata.description,
          totalSupply: collectionState.fields.totalSupply,
          image: metadata.image,
          nfts: [nft]
        })
      } else {
        items[index].nfts.push(nft)
      }
    }
  }

  return items
}

export const useCollections = (
  signerProvider?: SignerProvider,
  account?: Account
) => {
  const { data: nftCollections, error, ...rest } = useSWR(
    account &&
    signerProvider?.nodeProvider &&
    signerProvider?.explorerProvider &&
    [
      getAccountIdentifier(account),
      "collections",
    ],
    async () => {
      if (!account || !signerProvider || !signerProvider.nodeProvider || !signerProvider.explorerProvider) {
        return [];
      }

      web3.setCurrentNodeProvider(signerProvider.nodeProvider)
      web3.setCurrentExplorerProvider(signerProvider.explorerProvider)

      const marketplaceContractAddress = addressFromContractId(marketplaceContractId)
      const nftsFromUTXOs = await fetchNFTsFromUTXOs(account.address)
      const listedNFTs = await fetchListedNFTs(
        signerProvider,
        marketplaceContractAddress,
        account.address
      )

      return mergeNFTCollections(listedNFTs, nftsFromUTXOs)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { nftCollections: nftCollections || [], isLoading: !nftCollections && !error, ...rest }
}

export const useCollection = (
  collectionId?: string,
  signerProvider?: SignerProvider
) => {
  const { data: collection, error, ...rest } = useSWR(
    collectionId &&
    signerProvider?.nodeProvider &&
    signerProvider?.explorerProvider &&
    [
      collectionId,
      "collection",
    ],
    async () => {
      if (!signerProvider || !signerProvider.nodeProvider || !signerProvider.explorerProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(signerProvider.nodeProvider)
      web3.setCurrentExplorerProvider(signerProvider.explorerProvider)

      return await fetchNFTCollection(collectionId as string)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { collection, ...rest }
}

export const useNFTListings = (
  signerProvider?: SignerProvider
) => {
  const { data, error, ...rest } = useSWR(
    signerProvider &&
    [
      "nftListings",
    ],
    async () => {
      if (!signerProvider || !signerProvider.nodeProvider || !signerProvider.explorerProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(signerProvider.nodeProvider)
      web3.setCurrentExplorerProvider(signerProvider.explorerProvider)

      const marketplaceContractAddress = addressFromContractId(marketplaceContractId)
      return await fetchNFTListings(signerProvider, marketplaceContractAddress)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { nftListings: data || [], isLoading: !data && !error, ...rest }
}

export const useCommissionRate = (
  signerProvider?: SignerProvider
) => {
  const { data, error, ...rest } = useSWR(
    signerProvider &&
    signerProvider.nodeProvider &&
    [
      "commissionRate",
    ],
    async () => {
      if (!signerProvider || !signerProvider.nodeProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(signerProvider.nodeProvider)

      const marketplaceState = await fetchNFTMarketplaceState(
        addressFromContractId(marketplaceContractId)
      )

      return marketplaceState.fields.commissionRate as bigint
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { commissionRate: data, isLoading: !data && !error, ...rest }
}

export const getAccountIdentifier = (account: Account) =>
  `${NETWORK}::${account.address}`
