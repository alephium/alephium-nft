import axios from "axios"
import useSWR from "swr"
import { NFTPublicSaleCollectionSequential } from '../../artifacts/ts'
import { web3, hexToString, addressFromContractId, NodeProvider, subContractId, binToHex, encodeU256, ExplorerProvider } from "@alephium/web3"
import { fetchNFTListingsByOwner } from "./NFTListing"
import { fetchMintedNFT, fetchMintedNFTByMetadata, fetchMintedNFTMetadata, NFT } from "../../shared/nft"
import { getNodeProvider } from "../../shared"

export async function fetchPreMintNFT(
  collectionId: string,
  tokenIndex: bigint,
  mintPrice?: bigint,
): Promise<NFT | undefined> {
  const tokenId = subContractId(collectionId, binToHex(encodeU256(tokenIndex)), 0)
  try {
    const collectionAddress = addressFromContractId(collectionId)
    const collection = NFTPublicSaleCollectionSequential.at(collectionAddress)
    const tokenUri = hexToString((await collection.methods.getNFTUri({ args: { index: tokenIndex } })).returns)
    if (mintPrice === undefined) {
      mintPrice = (await collection.methods.getMintPrice()).returns
    }
    const metadata = (await axios.get(tokenUri)).data
    return {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      tokenId: tokenId,
      collectionId: collectionId,
      listed: false,
      minted: false,
      price: mintPrice,
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

async function fetchNFTsFromUTXOs(address: string): Promise<NFT[]> {
  const nodeProvider = getNodeProvider()
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

export async function fetchNFTsByAddress(address: string): Promise<NFT[]> {
  const nftsFromUTXOs = await fetchNFTsFromUTXOs(address)
  const listedNFTs = await fetchListedNFTs(address)

  const isListed = (nftTokenId: string) => listedNFTs.find((nft) => nft.tokenId === nftTokenId) !== undefined
  const removeDuplicates = nftsFromUTXOs.filter((nft) => !isListed(nft.tokenId))
  return [...removeDuplicates, ...listedNFTs]
}

export const useNFT = (
  tokenId: string,
  listed: boolean,
  nodeProvider?: NodeProvider,
  explorerProvider?: ExplorerProvider
) => {
  const { data, error, ...rest } = useSWR(
    nodeProvider &&
    explorerProvider &&
    [
      tokenId,
      "nft",
    ],
    async () => {
      if (!nodeProvider || !explorerProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(nodeProvider)
      web3.setCurrentExplorerProvider(explorerProvider)

      return await fetchMintedNFT(tokenId, listed)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { nft: data, isLoading: !data && !error, ...rest }
}
