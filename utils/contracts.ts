import { fetchContractState } from '@alephium/web3'
import {
  NFT,
  NFTInstance,
  NFTListing,
  NFTListingInstance,
  NFTMarketPlace,
  NFTMarketPlaceInstance,
  NFTOpenCollection,
  NFTOpenCollectionInstance,
  NFTPreDesignedCollection,
  NFTPreDesignedCollectionInstance
} from '../artifacts/ts'

export async function fetchNFTMarketplaceState(address: string) {
  return await fetchContractState(NFTMarketPlace, new NFTMarketPlaceInstance(address))
}

export async function fetchNFTOpenCollectionState(address: string) {
  return await fetchContractState(NFTOpenCollection, new NFTOpenCollectionInstance(address))
}

export async function fetchNFTPreDesignedCollectionState(address: string) {
  return await fetchContractState(NFTPreDesignedCollection, new NFTPreDesignedCollectionInstance(address))
}

export async function fetchNFTListingState(address: string) {
  return await fetchContractState(NFTListing, new NFTListingInstance(address))
}

export async function fetchNFTState(address: string) {
  return await fetchContractState(NFT, new NFTInstance(address))
}
