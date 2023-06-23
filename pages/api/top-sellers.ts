import Validate from 'next-api-validation'
import axios from "axios"
import { IMarketplaceEvent, MaketplaceEvent } from '../../utils/mongodb/models/marketplace-event'
import { NFTListing } from '../../utils/mongodb/models/nft-listing'
import { connectToDatabase } from '../../utils/mongodb'

connectToDatabase()

const topSellerHandler = Validate({
  async get(req, res) {
    try {
      // Only return top 9 for now
      const topSellers = await NFTListing.aggregate([
        {
          $group: { _id: "$tokenOwner", totalAmount: { $sum: { $toDecimal: "$price" } } }
        },
        {
          $sort: { totalAmount: -1 }
        },
        {
          $limit: 9
        }
      ])

      res.json(topSellers)
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})


export default topSellerHandler