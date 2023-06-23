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

export async function fetchNFTListings(
  address?: string,
  priceOrder?: string,
  searchText?: string
): Promise<NFTListing[]> {
  let url: string = `api/nft-listings`
  const priceOrderQuery = priceOrder ? `priceOrder=${priceOrder}` : undefined
  const searchTextQuery = searchText ? `search=${searchText}` : undefined
  if (priceOrder && searchText) {
    const query = [priceOrderQuery, searchTextQuery].join('&')
    url = `${url}?${query}`
  } else if (priceOrder) {
    url = `${url}?${priceOrderQuery}`
  } else if (searchText) {
    url = `${url}?${searchTextQuery}`
  }

  const result = await axios.get(url)
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
