import Validate from 'next-api-validation'
import axios from "axios"
import { IMarketplaceEvent, MaketplaceEvent } from '../../utils/mongodb/models/marketplace-event'
import { NFTListing as NFTListingFactory } from '../../artifacts/ts'
import { NFTListing, INFTListing } from '../../utils/mongodb/models/nft-listing'
import { NodeProvider, hexToString, addressFromContractId, web3 } from '@alephium/web3'
import { connectToDatabase } from '../../utils/mongodb'
import { defaultNodeUrl, marketplaceContractAddress } from '../../configs/nft'
import { fetchNFTListingState, fetchNonEnumerableNFTState } from "../../utils/contracts"

connectToDatabase()

const nftListingsHandler = Validate({
  async get(req, res) {
    try {
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
        if (!result?._id) {
          result = await newEvent.save()
        }

        await nftListingEventReducer(newEvent)
      }

      const listings = await NFTListing.find()
      res.json(listings.reverse())
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  },
  async post(req, res) {
    try {
      const body: INFTListing = req.body
      const newListing = new NFTListing(body)
      const result = await NFTListing.findOneAndUpdate(
        { '_id': body._id },
        newListing,
        { upsert: true }
      )
      res.send(result)
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  },
  async delete(req, res) {
    const { id } = req.query
    try {
      const deletedListing = await NFTListing.findByIdAndDelete(id)
      res.send(deletedListing)
    } catch (err) {
      res.status(500).send({
        error: 'Failed to remove NFT listing'
      })
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
      const result = await NFTListing.create(listedNFT)
      console.log("Persist nft listing", result)
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
      collectionId: nftState.fields.collectionId
    }
  }
}


export default nftListingsHandler