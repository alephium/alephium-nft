import { fetchContractState } from '@alephium/web3'

import { NFT, NFTInstance } from '../artifacts/ts/NFT'
import { NFTListing, NFTListingInstance } from '../artifacts/ts/NFTListing'
import { NFTMarketPlace, NFTMarketPlaceInstance } from '../artifacts/ts/NFTMarketPlace'
import { NFTCollectionFIFO, NFTCollectionFIFOInstance } from '../artifacts/ts/NFTCollectionFIFO'

export async function fetchNFTMarketplaceState(address: string) {
  return await fetchContractState(NFTMarketPlace, new NFTMarketPlaceInstance(address))
}

export async function fetchNFTCollectionState(address: string) {
  return await fetchContractState(NFTCollectionFIFO, new NFTCollectionFIFOInstance(address))
}

export async function fetchNFTListingState(address: string) {
  return await fetchContractState(NFTListing, new NFTListingInstance(address))
}

export async function fetchNFTState(address: string) {
  return await fetchContractState(NFT, new NFTInstance(address))
}
