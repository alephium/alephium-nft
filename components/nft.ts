import { web3, addressFromTokenId, hexToString, SignerProvider, addressFromContractId } from "@alephium/web3"
import { fetchNFTOpenCollectionState, fetchNFTState } from "../utils/contracts"
import { NFT as NFTFactory } from '../artifacts/ts'
import axios from "axios"
import { fetchNFTListings } from "./nft-listing"

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
  symbol: string,
  nfts: NFT[]
}

export type NFTsByCollection = Map<NFTCollection, NFT[]>

export async function fetchNFT(
  signerProvider: SignerProvider,
  tokenId: string,
  listed: boolean
): Promise<NFT | undefined> {
  var nftState = undefined

  if (signerProvider.nodeProvider) {
    try {
      web3.setCurrentNodeProvider(signerProvider.nodeProvider)
      nftState = await fetchNFTState(
        addressFromTokenId(tokenId)
      )
    } catch (e) {
      console.debug(`error fetching state for ${tokenId}`, e)
    }

    if (nftState && nftState.codeHash === NFTFactory.contract.codeHash) {
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
  const tokenIds = Array.from(listings.values()).map((listing) => listing.tokenId)
  return await fetchNFTCollections(signerProvider, tokenIds, true)
}

export async function fetchNFTsFromUTXOs(
  signerProvider: SignerProvider,
  address: string
): Promise<NFTCollection[]> {

  if (signerProvider.nodeProvider) {
    const balances = await signerProvider.nodeProvider.addresses.getAddressesAddressBalance(address)
    const tokenBalances = balances.tokenBalances !== undefined ? balances.tokenBalances : []
    const tokenIds = tokenBalances
      .filter((token) => +token.amount == 1)
      .map((token) => token.id)

    return await fetchNFTCollections(signerProvider, tokenIds, false)
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

async function fetchNFTCollections(
  signerProvider: SignerProvider,
  tokenIds: string[],
  listed: boolean,
): Promise<NFTCollection[]> {
  const items = []

  for (var tokenId of tokenIds) {
    const nft = await fetchNFT(signerProvider, tokenId, listed)

    if (nft) {
      const index = items.findIndex((item) => item.id === nft.collectionId)
      if (index === -1) {
        const collectionAddress = addressFromContractId(nft.collectionId)
        const collectionState = await fetchNFTOpenCollectionState(collectionAddress)
        items.push({
          id: nft.collectionId,
          name: hexToString(collectionState.fields.name),
          symbol: hexToString(collectionState.fields.symbol),
          nfts: [nft]
        })
      } else {
        items[index].nfts.push(nft)
      }
    }
  }

  return items
}
