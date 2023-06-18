import axios from "axios"

export interface NFTListing {
  _id: string,
  price: bigint
  name: string,
  description: string,
  image: string,
  tokenOwner: string,
  marketAddress: string
  listingContractId: string,
  collectionId: string
}

export async function fetchNFTListings(address?: string): Promise<NFTListing[]> {
  const result = await axios.get(`api/nft-listings`)
  const nftListings: NFTListing[] = result.data

  if (address) {
    return nftListings.filter((listing) => listing.tokenOwner === address)
  } else {
    return nftListings
  }
}

export async function replayNFTListings(
  address?: string
): Promise<NFTListing[]> {
  const result = await axios.post(`api/marketplace-events/replay`)
  const nftListings: NFTListing[] = result.data

  if (address) {
    return nftListings.filter((listing) => listing.tokenOwner === address)
  } else {
    return nftListings
  }
}
