import Validate from 'next-api-validation'
import axios from "axios"
import { IMarketplaceEvent, MaketplaceEvent } from '../../utils/mongodb/models/marketplace-event'
import { NFTListing as NFTListingFactory } from '../../artifacts/ts'
import { NFTListing } from '../../utils/mongodb/models/nft-listing'
import { NodeProvider, hexToString, addressFromContractId, web3 } from '@alephium/web3'
import { connectToDatabase } from '../../utils/mongodb'
import { defaultNodeUrl, marketplaceContractAddress } from '../../configs/nft'
import { fetchNFTListingState, fetchNonEnumerableNFTState } from "../../utils/contracts"
import { SortOrder } from 'mongoose'

connectToDatabase()

const nftListingsHandler = Validate({
  async get(req, res) {
    try {
      const searchText = req.query.search as string
      const priceOrder = req.query.priceOrder as SortOrder | undefined
      const page = Number(req.query.page as string)
      const size = Number(req.query.size as string)
      const nodeProvider = new NodeProvider(defaultNodeUrl)
      web3.setCurrentNodeProvider(nodeProvider)
      const count = await MaketplaceEvent.count()
      const contractEvents = await nodeProvider.events.getEventsContractContractaddress(
        marketplaceContractAddress,
        { start: count }
      )

      const events = contractEvents.events;
      for (var event of events) {
        const newEvent = new MaketplaceEvent(event)
        var result = await MaketplaceEvent.exists(
          { 'txId': event.txId, 'eventIndex': event.eventIndex }
        )
        if (result?._id) {
          console.log("Saving forked event", event)
        }
        await newEvent.save()
        await nftListingEventReducer(newEvent)
      }

      const filterArgs = searchText ? { $text: { $search: searchText, $caseSensitive: false } } : {}
      const skipped = page * size
      const listings = priceOrder ?
        await NFTListing.find(filterArgs).sort({ "price": priceOrder }).collation({ locale: "en_US", numericOrdering: true }).skip(skipped).limit(size) :
        await NFTListing.find(filterArgs).sort({ "createdAt": -1 }).skip(skipped).limit(size)
      res.json(listings)
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})

export async function nftListingEventReducer(
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
      listingContractId: listingContractId,
      collectionId: nftState.fields.collectionId,
      createdAt: new Date()
    }
  }
}


export default nftListingsHandler