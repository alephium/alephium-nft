import { addressFromContractId, addressFromTokenId, groupOfAddress, hexToString, node, web3 } from "@alephium/web3"
import axios from "axios"
import { NFT, NFTTypes } from "../artifacts/ts"

const LegacyEnumerableNFTCodeHash = '9754329f7623044ec5edeb7a3349eb36066ec1140fb41e2ba5828685df1e1012'
const LegacyNonEnumerableNFTCodeHash = '657b46b2236b78c955660db6731d43b42dd8204bb6220181de3c5f8678d90da0'

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
    if (nftState.codeHash === NFT.contract.codeHash) {
      const contractState = NFT.contract.fromApiContractState(nftState) as NFTTypes.State
      return {
        tokenUri: hexToString(contractState.fields.tokenUri),
        collectionId: contractState.fields.collectionId
      }
    } else if (nftState.codeHash === LegacyNonEnumerableNFTCodeHash) {
      return {
        collectionId: nftState.immFields[0].value as string,
        tokenUri: hexToString(nftState.immFields[1].value as string)
      }
    } else if (nftState.codeHash === LegacyEnumerableNFTCodeHash) {
      const collectionId = nftState.immFields[0].value as string
      const nftIndex = nftState.immFields[1]
      const address = addressFromContractId(collectionId)
      const call: node.CallContract = {
        group: groupOfAddress(address),
        address: address,
        methodIndex: 4,
        args: [nftIndex]
      }
      const callResult = await nodeProvider.contracts.postContractsCallContract(call)
      const tokenUri = hexToString(callResult.returns[0].value as string)
      return { tokenUri, collectionId }
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