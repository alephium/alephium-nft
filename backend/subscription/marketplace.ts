import { marketplaceContractAddress, pollingInterval } from '../../configs/nft/index'
import { NFTListingInstance, NFTMarketPlace, NFTMarketPlaceTypes, NFTListing as NFTListingFactory } from '../../artifacts/ts'
import { ContractEvent, EventSubscription, SubscribeOptions, addressFromContractId, web3 } from '@alephium/web3'
import { MaketplaceEventNextStart } from '../mongodb/models/marketplace-event-next-start'
import { MaketplaceEvent } from '../mongodb/models/marketplace-event'
import { NFTListing } from '../mongodb/models/nft-listing'
import { fetchMintedNFT } from '../../shared/nft'
import { NFTSold } from '../mongodb/models/nft-sold'

let eventSubscription: EventSubscription | undefined = undefined

function createSubscribeOptions(eventHandler: (event: ContractEvent) => Promise<void>): SubscribeOptions<ContractEvent> {
  return {
    pollingInterval,
    messageCallback: (event: ContractEvent): Promise<void> => {
      return eventHandler(event)
    },
    errorCallback: (error: any, subscription): Promise<void> => {
      console.error(`subscribe marketplace events error: ${error}`)
      subscription.unsubscribe()
      return subscribeMarketplaceEvents()
    }
  }
}

async function getNextStart(): Promise<number> {
  const nextStartResult = await MaketplaceEventNextStart.findOne()
  if (!nextStartResult) {
    await MaketplaceEventNextStart.create({ nextStart: 0 })
  }
  return nextStartResult ? nextStartResult.nextStart : 0
}

async function saveNextStart(): Promise<void> {
  if (eventSubscription === undefined) return
  const nextStart = eventSubscription.currentEventCount()
  await MaketplaceEventNextStart.findOneAndUpdate({}, { $set: { nextStart: nextStart } })
}

const eventHandler = async (event: ContractEvent): Promise<void> => {
  // TODO: improve this
  await saveNextStart()
  const newEvent = new MaketplaceEvent(event)
  const eventExists = await MaketplaceEvent.exists(
    { 'txId': event.txId, 'eventIndex': event.eventIndex, 'blockHash': event.blockHash }
  )
  if (eventExists?._id) {
    console.log("Skipping duplicated event", event)
    return
  }

  await newEvent.save()
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

async function fetchNFTListing(
  nftListedEvent: NFTMarketPlaceTypes.NFTListedEvent
): Promise<NFTListing | undefined> {
  const tokenId = nftListedEvent.fields.tokenId
  const listingContractId = nftListedEvent.fields.listingContractId
  const listingState = await new NFTListingInstance(addressFromContractId(listingContractId)).fetchState()

  if (listingState && listingState.codeHash === NFTListingFactory.contract.codeHash) {
    const nft = await fetchMintedNFT(web3.getCurrentNodeProvider(), tokenId, true)
    if (nft === undefined) return undefined
    return {
      _id: tokenId,
      price: listingState.fields.price as bigint,
      name: nft.name,
      description: nft.description,
      image: nft.image,
      tokenOwner: listingState.fields.tokenOwner as string,
      marketAddress: listingState.fields.marketAddress as string,
      listingContractId: listingContractId,
      collectionId: nft.collectionId,
      createdAt: new Date()
    }
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

export async function subscribeMarketplaceEvents() {
  const nextStart = await getNextStart()
  console.log(`from event count: ${nextStart}`)
  const marketplace = NFTMarketPlace.at(marketplaceContractAddress)
  const options = createSubscribeOptions(eventHandler)
  eventSubscription = marketplace.subscribeAllEvents(options as any, nextStart)
}
