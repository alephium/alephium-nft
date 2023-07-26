import axios from "axios"
import useSWR from "swr"
import { NFTMarketPlaceInstance, NFTPublicSaleCollectionSequentialInstance } from '../artifacts/ts'
import { marketplaceContractId } from '../configs/nft'
import { web3, hexToString, SignerProvider, addressFromContractId, NodeProvider, subContractId, binToHex, encodeU256, groupOfAddress } from "@alephium/web3"
import { fetchNFTListingsByOwner } from "./NFTListing"
import { fetchMintedNFT, fetchMintedNFTByMetadata, fetchMintedNFTMetadata, NFT } from "../utils/nft"
import { NFTCollectionMetadata, NFTPublicSaleCollectionMetadata } from "../utils/nft-collection"
import { contractExists } from "../utils"

export async function fetchNFTByIndex(
  metadata: NFTCollectionMetadata,
  tokenIndex: bigint
): Promise<{ tokenId: string, minted: boolean }> {
  const collectionAddress = addressFromContractId(metadata.id)
  const tokenId = subContractId(metadata.id, binToHex(encodeU256(tokenIndex)), groupOfAddress(collectionAddress))
  if (metadata.collectionType === 'NFTOpenCollection' || metadata.collectionType === 'NFTPublicSaleCollectionSequential') {
    return { tokenId, minted: tokenIndex < metadata.totalSupply }
  }
  const minted = await contractExists(tokenId, web3.getCurrentNodeProvider())
  return { tokenId, minted }
}

export async function fetchPreMintNFT(
  collectionMetadata: NFTPublicSaleCollectionMetadata,
  tokenIndex: bigint
): Promise<NFT | undefined> {
  const collectionAddress = addressFromContractId(collectionMetadata.id)
  const tokenId = subContractId(collectionMetadata.id, binToHex(encodeU256(tokenIndex)), groupOfAddress(collectionAddress))
  try {
    const hexStr = collectionMetadata.nftBaseUri + Buffer.from(tokenIndex.toString(), 'ascii').toString('hex')
    const nftMetadata = (await axios.get(hexToString(hexStr))).data
    return {
      name: nftMetadata.name,
      description: nftMetadata.description,
      image: nftMetadata.image,
      tokenId: tokenId,
      collectionId: collectionMetadata.id,
      listed: false,
      minted: false,
      price: collectionMetadata.mintPrice,
      tokenIndex: Number(tokenIndex)
    }
  } catch (e) {
    console.error(`error fetching information for pre mint NFT ${tokenId}`, e)
    return undefined
  }
}

async function fetchListedNFTs(address: string): Promise<NFT[]> {
  const listings = await fetchNFTListingsByOwner(address)
  return listings.map((listing) => ({ tokenId: listing._id, listed: true, minted: true, ...listing }))
}

async function fetchNFTsFromUTXOs(
  nodeProvider: NodeProvider,
  address: string
): Promise<NFT[]> {
  const balances = await nodeProvider.addresses.getAddressesAddressBalance(address, { mempool: false })
  const tokenBalances = balances.tokenBalances !== undefined ? balances.tokenBalances : []
  const tokenIds = tokenBalances
    .filter((token) => +token.amount == 1)
    .map((token) => token.id)

  const nftMetadataPromises = tokenIds.map((tokenId) => fetchMintedNFTMetadata(tokenId))
  const nftMetadatas = await Promise.all(nftMetadataPromises)
  const nftPromises = tokenIds.map((tokenId, index) => {
    const metadata = nftMetadatas[index]
    if (metadata === undefined) return Promise.resolve(undefined)
    return fetchMintedNFTByMetadata(tokenId, metadata, false)
  })
  return (await Promise.all(nftPromises)).filter((nft) => nft !== undefined) as NFT[]
}

export async function fetNFTsByAddress(nodeProvider: NodeProvider, address: string): Promise<NFT[]> {
  web3.setCurrentNodeProvider(nodeProvider)
  const nftsFromUTXOs = await fetchNFTsFromUTXOs(nodeProvider, address)
  const listedNFTs = await fetchListedNFTs(address)

  const isListed = (nftTokenId: string) => listedNFTs.find((nft) => nft.tokenId === nftTokenId) !== undefined
  const removeDuplicates = nftsFromUTXOs.filter((nft) => !isListed(nft.tokenId))
  return [...removeDuplicates, ...listedNFTs]
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

      const marketplaceState = await new NFTMarketPlaceInstance(addressFromContractId(marketplaceContractId)).fetchState()
      return marketplaceState.fields.commissionRate as bigint
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { commissionRate: data, isLoading: !data && !error, ...rest }
}

export const useNFT = (
  tokenId: string,
  listed: boolean,
  nodeProvider?: NodeProvider
) => {
  const { data, error, ...rest } = useSWR(
    nodeProvider &&
    [
      tokenId,
      "nft",
    ],
    async () => {
      if (!nodeProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(nodeProvider)

      return await fetchMintedNFT(tokenId, listed)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { nft: data, isLoading: !data && !error, ...rest }
}
