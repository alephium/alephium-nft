import { ExplorerProvider, NodeProvider, addressFromTokenId, groupOfAddress, hexToString } from "@alephium/web3"
import axios from "axios"
import { NFT, NFTTypes } from "../artifacts/ts"

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

export async function fetchMintedNFTMetadata(
  nodeProvider: NodeProvider,
  explorerProvider: ExplorerProvider,
  tokenId: string
): Promise<{ collectionId: string, tokenUri: string } | undefined> {
  const tokenAddress = addressFromTokenId(tokenId)
  try {
    const tokenType = await nodeProvider.guessStdTokenType(tokenId)
    if (tokenType !== 'non-fungible') return undefined
    const { parent } = await explorerProvider.contracts.getContractsContractParent(tokenAddress)
    if (!parent) return undefined

    const nftInstance = NFT.at(tokenAddress)
    const tokenUri = (await nftInstance.methods.getTokenUri()).returns
    return {
      tokenUri: hexToString(tokenUri),
      collectionId: parent
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
  nodeProvider: NodeProvider,
  explorerProvider: ExplorerProvider,
  tokenId: string,
  listed: boolean
): Promise<NFT | undefined> {
  const nftMetadata = await fetchMintedNFTMetadata(nodeProvider, explorerProvider, tokenId)
  if (nftMetadata === undefined) return undefined
  return await fetchMintedNFTByMetadata(tokenId, nftMetadata, listed)
}