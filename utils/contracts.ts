import {
  NonEnumerableNFTInstance,
  NFTListingInstance,
  NFTMarketPlaceInstance,
  NFTOpenCollectionInstance,
  NFTPreDesignedCollectionInstance,
  EnumerableNFTInstance
} from '../artifacts/ts'

export async function fetchNFTMarketplaceState(address: string) {
  return new NFTMarketPlaceInstance(address).fetchState()
}

export async function fetchNFTOpenCollectionState(address: string) {
  return new NFTOpenCollectionInstance(address).fetchState()
}

export async function fetchNFTPreDesignedCollectionState(address: string) {
  return new NFTPreDesignedCollectionInstance(address).fetchState()
}

export async function fetchNFTListingState(address: string) {
  return new NFTListingInstance(address).fetchState()
}

export async function fetchNonEnumerableNFTState(address: string) {
  return new NonEnumerableNFTInstance(address).fetchState()
}

export async function fetchEnumerableNFTState(address: string) {
  return new EnumerableNFTInstance(address).fetchState()
}
