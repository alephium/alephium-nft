import { IMarketplaceEvent, MaketplaceEvent } from './mongodb/models/marketplace-event'
import { NFTListing } from './mongodb/models/nft-listing'
import { NodeProvider, hexToString, addressFromContractId, web3 } from '@alephium/web3'
import { fetchNFTListingState, fetchNonEnumerableNFTState } from "./contracts"
import { EnumerableNFT, EnumerableNFTInstance, NFTListing as NFTListingFactory, NonEnumerableNFT, NonEnumerableNFTInstance } from '../artifacts/ts'
import { defaultNodeUrl, marketplaceContractAddress } from '../configs/nft'
import { MaketplaceEventNextStart } from './mongodb/models/marketplace-event-next-start'
import axios from "axios"

export async function trySaveNewNFTListings() {
  const nodeProvider = new NodeProvider(defaultNodeUrl)
  web3.setCurrentNodeProvider(nodeProvider)

  const nextStartResult = await MaketplaceEventNextStart.findOne()
  let nextStart = nextStartResult && nextStartResult.nextStart || 0
  if (!nextStartResult) {
    await MaketplaceEventNextStart.create({ nextStart: 0 })
  }

  const contractEvents = await nodeProvider.events.getEventsContractContractaddress(
    marketplaceContractAddress,
    { start: nextStart }
  )

  const events = contractEvents.events;
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
      await nftListingEventReducer(newEvent)
    } else {
      console.log("Skipping duplicated event", event)
    }
  }
  await MaketplaceEventNextStart.findOneAndUpdate({}, { $set: { nextStart: contractEvents.nextStart } })
}


async function nftListingEventReducer(
  event: IMarketplaceEvent,
) {
  console.log("Reduce event", event)
  // NFTListed
  if (event.eventIndex === 0) {
    const listedNFT = await fetchNFTListing(event)
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
  }

  // NFTSold or NFTListingCancelled
  if (event.eventIndex === 1 || event.eventIndex === 2) {
    const tokenId = event.eventIndex === 1 ? event.fields[1].value : event.fields[0].value

    // Remove NFT Listing
    const result = await NFTListing.findByIdAndDelete(tokenId)
    console.log("Deleted nft listing", result, tokenId)
  }
}

async function fetchNFTListing(
  event: IMarketplaceEvent
): Promise<NFTListing | undefined> {
  const tokenId = event.fields[1].value
  const listingContractId = event.fields[3].value

  var listingState = undefined

  try {
    listingState = await fetchNFTListingState(
      addressFromContractId(listingContractId)
    )
  } catch (e) {
    console.debug(`error fetching state for ${tokenId}`, e)
  }

  if (listingState && listingState.codeHash === NFTListingFactory.contract.codeHash) {
    const tokenAddress = addressFromContractId(tokenId)
    const nodeProvider = web3.getCurrentNodeProvider()
    const nftState = await nodeProvider.contracts.getContractsAddressState(tokenAddress, { group: 0 })

    let metadataUri: string | undefined
    let collectionId: string | undefined
    if (nftState.codeHash === NonEnumerableNFT.contract.codeHash) {
      const nonEnumerableNFTInstance = new NonEnumerableNFTInstance(tokenAddress)
      metadataUri = hexToString((await nonEnumerableNFTInstance.methods.getTokenUri()).returns)
      collectionId = (await nonEnumerableNFTInstance.methods.getCollectionId()).returns
    } else if (nftState.codeHash === EnumerableNFT.contract.codeHash) {
      const enumerableNFTInstance = new EnumerableNFTInstance(tokenAddress)
      metadataUri = hexToString((await enumerableNFTInstance.methods.getTokenUri()).returns)
      collectionId = (await enumerableNFTInstance.methods.getCollectionId()).returns
    }

    if (metadataUri && collectionId) {
      const metadata = (await axios.get(metadataUri)).data
      return {
        _id: tokenId,
        price: listingState.fields.price as bigint,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        tokenOwner: listingState.fields.tokenOwner as string,
        marketAddress: listingState.fields.marketAddress as string,
        listingContractId: listingContractId,
        collectionId: collectionId,
        createdAt: new Date()
      }
    }
  }
}
