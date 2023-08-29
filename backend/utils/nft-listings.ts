import { ContractEvent, addressFromContractId, web3, NodeProvider, decodeEvent, ExplorerProvider } from "@alephium/web3"
import { MaketplaceEvent } from "../mongodb/models/marketplace-event"
import { MaketplaceEventNextStart } from "../mongodb/models/marketplace-event-next-start"
import { NFTListing } from "../mongodb/models/nft-listing"
import { NFTListingInstance, NFTMarketPlaceTypes, NFTListing as NFTListingFactory, NFTMarketPlace } from "../../artifacts/ts"
import { NFTSold } from "../mongodb/models/nft-sold"
import { fetchMintedNFT } from "../../shared/nft"
import { getAlephiumNFTConfig } from "../../shared/configs"

const nodeUrl = process.env.NODE_URL || getAlephiumNFTConfig().defaultNodeUrl

export async function trySaveNewNFTListings() {
  const nodeProvider = new NodeProvider(nodeUrl)
  web3.setCurrentNodeProvider(nodeProvider)

  const nextStartResult = await MaketplaceEventNextStart.findOne()
  let nextStart = nextStartResult && nextStartResult.nextStart || 0
  if (!nextStartResult) {
    await MaketplaceEventNextStart.create({ nextStart: 0 })
  }

  const marketplaceContractAddress = getAlephiumNFTConfig().marketplaceContractAddress
  const contractEvents = await nodeProvider.events.getEventsContractContractaddress(
    marketplaceContractAddress,
    { start: nextStart }
  )

  if (contractEvents.events.length === 0) {
    return
  }

  const marketplaceContract = NFTMarketPlace.contract
  const marketplaceContractInstance = NFTMarketPlace.at(marketplaceContractAddress)
  const events = contractEvents.events.map((event) =>
    decodeEvent(marketplaceContract, marketplaceContractInstance, event, event.eventIndex)
  );
  for (var event of events) {
    const newEvent = new MaketplaceEvent(event)
    var eventExists = await MaketplaceEvent.exists(
      { 'txId': event.txId, 'eventIndex': event.eventIndex, 'blockHash': event.blockHash }
    )

    if (!eventExists?._id) {
      var result = await MaketplaceEvent.exists(
        { 'txId': event.txId, 'eventIndex': event.eventIndex }
      )

      if (result?._id) {
        console.log("Saving forked event", event)
      }

      await newEvent.save()
      await nftListingEventReducer(event)
    } else {
      console.log("Skipping duplicated event", event)
    }
  }

  await MaketplaceEventNextStart.findOneAndUpdate({}, { $set: { nextStart: contractEvents.nextStart } })
}

export async function nftListingEventReducer(
  event: ContractEvent,
) {
  console.log("Reduce event", event)
  // NFTListed
  switch (event.eventIndex) {
    case 0:
      const nftListedEvent = event as NFTMarketPlaceTypes.NFTListedEvent
      const listedNFT = await fetchNFTListing(nftListedEvent)
      if (listedNFT) {
        const result = await NFTListing.exists(
          { '_id': listedNFT._id }
        )
        if (!result?._id) {
          const result = await NFTListing.create(listedNFT)
          console.log("Persist nft listing", result)
        } else {
          console.log("Persis nft listing but it already exists", listedNFT._id)
        }
      }
      break

    case 1:
    case 2:
      const marketplaceEvent = event as (NFTMarketPlaceTypes.NFTSoldEvent | NFTMarketPlaceTypes.NFTListingCancelledEvent)
      const tokenId = marketplaceEvent.fields.tokenId

      // Remove NFT Listing
      const result = await NFTListing.findByIdAndDelete(tokenId)
      console.log('Deleted nft listing', result, tokenId)
      if (event.eventIndex === 1) await saveNFTSold(event as NFTMarketPlaceTypes.NFTSoldEvent)
      break
    default:
      console.log('Ignore other events')
  }
}

async function saveNFTSold(event: NFTMarketPlaceTypes.NFTSoldEvent) {
  const nftSold = new NFTSold({
    _id: event.txId,
    tokenId: event.fields.tokenId,
    price: event.fields.price.toString(),
    previousOwner: event.fields.previousOwner,
    newOwner: event.fields.newOwner,
    createdAt: new Date()
  })
  await nftSold.save()
}

async function fetchNFTListing(
  nftListedEvent: NFTMarketPlaceTypes.NFTListedEvent
): Promise<NFTListing | undefined> {
  const tokenId = nftListedEvent.fields.tokenId
  const listingContractId = nftListedEvent.fields.listingContractId
  const listingState = await new NFTListingInstance(addressFromContractId(listingContractId)).fetchState()

  if (listingState && listingState.codeHash === NFTListingFactory.contract.codeHash) {
    const nft = await fetchMintedNFT(tokenId, true)
    if (nft === undefined) return undefined
    return {
      _id: tokenId,
      price: listingState.fields.price as bigint,
      name: nft.name,
      description: nft.description,
      image: nft.image,
      tokenOwner: listingState.fields.tokenOwner as string,
      marketAddress: addressFromContractId(listingState.fields.marketContractId as string),
      listingContractId: listingContractId,
      collectionId: nft.collectionId,
      createdAt: new Date()
    }
  }
}
