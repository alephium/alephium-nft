import Validate from 'next-api-validation'
import { MaketplaceEvent } from '../../../utils/mongodb/models/marketplace-event'
import { NFTListing } from '../../../utils/mongodb/models/nft-listing'
import { connectToDatabase } from '../../../utils/mongodb'
import { nftListingEventReducer } from '../nft-listings'

connectToDatabase()

const marketplaceEventsCountHandler = Validate({
  async post(req, res) {
    try {
      const events = (await MaketplaceEvent.find()).reverse()
      for (var event of events) {
        await nftListingEventReducer(event)
      }

      const listings = await NFTListing.find()
      res.json(listings.reverse())

    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})

export default marketplaceEventsCountHandler