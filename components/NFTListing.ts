import axios from "axios"
import { ContractEvent } from "@alephium/web3/dist/src/api/api-alephium"
import { NFTListing as NFTListingFactory } from '../artifacts/ts'
import { fetchNFTListingState, fetchNonEnumerableNFTState } from "../utils/contracts"
import { addressFromContractId, hexToString, NodeProvider } from "@alephium/web3"

export interface NFTListing {
  _id: string,
  price: bigint
  name: string,
  description: string,
  image: string,
  tokenOwner: string,
  marketAddress: string
  commissionRate: bigint,
  listingContractId: string
}

export async function fetchNFTListings(
  marketplaceContractAddress: string,
  nodeProvider: NodeProvider,
  address?: string
): Promise<NFTListing[]> {
  const res = await axios.get(`api/marketplace-events/count`)
  const contractEvents = await nodeProvider.events.getEventsContractContractaddress(
    marketplaceContractAddress,
    { start: res.data.count }
  )
  const events = contractEvents.events;
  for (var event of events) {
    await nftListingEventReducer(event, marketplaceContractAddress)
  }

  const result = await axios.get(`api/nft-listings`)
  const nftListings: NFTListing[] = result.data

  if (address) {
    return nftListings.filter((listing) => listing.tokenOwner === address)
  } else {
    return nftListings
  }
}

async function fetchNFTListing(
  event: ContractEvent
): Promise<NFTListing | undefined> {
  const tokenId = event.fields[1].value.toString()
  const listingContractId = event.fields[3].value.toString()

  var listingState = undefined

  try {
    listingState = await fetchNFTListingState(
      addressFromContractId(listingContractId)
    )
  } catch (e) {
    console.debug(`error fetching state for ${tokenId}`, e)
  }

  if (listingState && listingState.codeHash === NFTListingFactory.contract.codeHash) {
    const nftState = await fetchNonEnumerableNFTState(
      addressFromContractId(tokenId)
    )

    const metadataUri = hexToString(nftState.fields.uri as string)
    const metadata = (await axios.get(metadataUri)).data
    return {
      _id: tokenId,
      price: listingState.fields.price as bigint,
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      tokenOwner: listingState.fields.tokenOwner as string,
      marketAddress: listingState.fields.marketAddress as string,
      commissionRate: listingState.fields.commissionRate as bigint,
      listingContractId: listingContractId
    }
  }
}

async function nftListingEventReducer(
  event: ContractEvent,
  marketplaceContractAddress: string,
) {
  axios.post(`api/marketplace-events`, {
    txId: event.txId,
    contractAddress: marketplaceContractAddress,
    eventIndex: event.eventIndex,
    fields: event.fields
  })

  // NFTListed or NFTListingPriceUpdated
  if (event.eventIndex === 0 || event.eventIndex === 3) {
    const listedNFT = await fetchNFTListing(event)
    if (listedNFT) {
      // Persist NFT Listing
      const result = await axios.post(`api/nft-listings`, {
        id: listedNFT._id,
        price: listedNFT.price,
        name: listedNFT.name,
        description: listedNFT.description,
        image: listedNFT.image,
        tokenOwner: listedNFT.tokenOwner,
        marketAddress: listedNFT.marketAddress,
        commissionRate: listedNFT.commissionRate,
        listingContractId: listedNFT.listingContractId
      })

      console.log("Persist nft listing", result, event)
    }
  }

  // NFTSold or NFTListingCancelled
  if (event.eventIndex === 1 || event.eventIndex === 2) {
    const tokenId = event.fields[0].value.toString()
    // Remove NFT Listing
    const result = await axios.delete(`api/nft-listings?id=${tokenId}`)
    console.log("Deleted nft listing", result, event)
  }
}
