import {
  addressFromTokenId,
  NFTMetaData
} from "@alephium/web3"
import axios from "axios"
import { getExplorerProvider, getNodeProvider } from "."
import { NFT } from "../artifacts/ts"

export interface NFT {
  name: string,
  description: string,
  image: string,
  tokenId: string,
  listed: boolean,
  minted: boolean,
  nftIndex: number
  collectionId: string,
  price?: bigint,
}

export async function fetchMintedNFTMetadata(
  tokenId: string
): Promise<NFTMetaData | undefined> {
  const nodeProvider = getNodeProvider()
  const explorerProvider = getExplorerProvider()
  if (!explorerProvider) return undefined

  try {
    const tokenType = await nodeProvider.guessStdTokenType(tokenId)
    if (tokenType !== 'non-fungible') return undefined
    return await nodeProvider.fetchNFTMetaData(tokenId)
  } catch (error) {
    console.error(`failed to fetch nft metadata, token id: ${tokenId}, error: ${error}`)
    return undefined
  }
}

export async function fetchMintedNFTByMetadata(
  tokenId: string,
  metadata: NFTMetaData,
  listed: boolean
): Promise<NFT | undefined> {
  try {
    const { tokenUri, nftIndex, collectionId } = metadata
    if (tokenUri && collectionId) {
      const metadata = (await axios.get(tokenUri)).data
      return {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        tokenId: tokenId,
        nftIndex: Number(nftIndex),
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