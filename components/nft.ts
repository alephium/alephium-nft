import axios from "axios"
import useSWR from "swr"
import { EnumerableNFT, EnumerableNFTTypes, NFTMarketPlaceInstance, NFTPublicSaleCollectionSequentialInstance, NonEnumerableNFT, NonEnumerableNFTTypes } from '../artifacts/ts'
import { marketplaceContractId } from '../configs/nft'
import { web3, addressFromTokenId, hexToString, SignerProvider, addressFromContractId, NodeProvider, subContractId, binToHex, encodeU256, groupOfAddress, } from "@alephium/web3"
import { fetchNFTListingsByOwner } from "./NFTListing"

export interface NFT {
  name: string,
  description: string,
  image: string,
  tokenId: string,
  listed: boolean,
  minted: boolean,
  collectionId: string,
  price?: bigint,
  tokenIndex?: number
}

export async function fetchMintedNFTMetadata(tokenId: string): Promise<{ collectionId: string, tokenUri: string } | undefined> {
  const tokenAddress = addressFromTokenId(tokenId)
  const nodeProvider = web3.getCurrentNodeProvider()
  try {
    const nftState = await nodeProvider.contracts.getContractsAddressState(tokenAddress, { group: groupOfAddress(tokenAddress) })
    if (nftState.codeHash === NonEnumerableNFT.contract.codeHash) {
      const contractState = NonEnumerableNFT.contract.fromApiContractState(nftState) as NonEnumerableNFTTypes.State
      return {
        tokenUri: hexToString(contractState.fields.uri),
        collectionId: contractState.fields.collectionId
      }
    } else if (nftState.codeHash === EnumerableNFT.contract.codeHash) {
      const contractState = EnumerableNFT.contract.fromApiContractState(nftState) as EnumerableNFTTypes.State
      return {
        tokenUri: hexToString(contractState.fields.tokenUri),
        collectionId: contractState.fields.collectionId
      }
    }
  } catch (error) {
    console.error(`failed to fetch nft metadata, token id: ${tokenId}, error: ${error}`)
  }
}

export async function fetchMintedNFTByMetadata(
  tokenId: string,
  metadata: { tokenUri: string, collectionId: string },
  listed: boolean
): Promise<NFT | undefined> {
  try {
    const { tokenUri, collectionId } = metadata
    if (tokenUri && collectionId) {
      const metadata = (await axios.get(tokenUri)).data
      return {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        tokenId: tokenId,
        collectionId: collectionId,
        minted: true,
        listed
      }
    }
  } catch (error) {
    console.error(`failed to fetch nft, token id: ${tokenId}, error: ${error}`)
  }
}

export async function fetchMintedNFT(
  tokenId: string,
  listed: boolean
): Promise<NFT | undefined> {
  const nftMetadata = await fetchMintedNFTMetadata(tokenId)
  if (nftMetadata === undefined) return undefined
  return await fetchMintedNFTByMetadata(tokenId, nftMetadata, listed)
}

export async function fetchPreMintNFT(
  collectionId: string,
  tokenIndex: bigint,
  mintPrice?: bigint
): Promise<NFT | undefined> {
  const nodeProvider = web3.getCurrentNodeProvider()
  const tokenId = subContractId(collectionId, binToHex(encodeU256(tokenIndex)), 0)
  if (!!nodeProvider) {
    try {
      const collectionAddress = addressFromContractId(collectionId)
      const collection = new NFTPublicSaleCollectionSequentialInstance(collectionAddress)
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
