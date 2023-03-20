import { web3, addressFromTokenId, hexToString, SignerProvider } from "@alephium/web3"
import { fetchNFTState } from "../utils/contracts"
import { NFT as NFTFactory } from '../artifacts/ts'
import axios from "axios"
import { fetchNFTListings } from "./nft-listing"

export interface NFT {
  name: string,
  description: string,
  image: string,
  tokenId: string,
  listed: boolean
}

export interface NFTCollection {
  name: string,
  symbol: string
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
): Promise<NFT[]> {
  const items = []

  const listings = await fetchNFTListings(signerProvider, marketplaceContractAddress, address)
  const tokenIds = Array.from(listings.values()).map((listing) => listing.tokenId)
  for (var tokenId of tokenIds) {
    const nft = await fetchNFT(signerProvider, tokenId, true)
    nft && items.push(nft)
  }

  return items
}

export async function fetchNFTsFromUTXOs(
  signerProvider: SignerProvider,
  address: string
): Promise<NFT[]> {
  const items = []

  if (signerProvider.nodeProvider) {
    const balances = await signerProvider.nodeProvider.addresses.getAddressesAddressBalance(address)
    const tokenBalances = balances.tokenBalances !== undefined ? balances.tokenBalances : []
    const tokenIds = tokenBalances
      .filter((token) => +token.amount == 1)
      .map((token) => token.id)

    for (var tokenId of tokenIds) {
      const nft = await fetchNFT(signerProvider, tokenId, false)
      nft && items.push(nft)
    }
  }

  return items;
}
