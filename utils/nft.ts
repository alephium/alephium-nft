import { addressFromTokenId, groupOfAddress, hexToString, web3 } from "@alephium/web3"
import axios from "axios"
import { EnumerableNFT, EnumerableNFTTypes, NonEnumerableNFT, NonEnumerableNFTTypes } from "../artifacts/ts"

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