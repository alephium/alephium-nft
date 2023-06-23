import Validate from 'next-api-validation'
import { NFTListing } from '../../utils/mongodb/models/nft-listing'
import { connectToDatabase } from '../../utils/mongodb'

connectToDatabase()

const nftListingsCountHandler = Validate({
  async get(req, res) {
    try {
      const total = await NFTListing.count()
      res.json({ total })
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})


export default nftListingsCountHandler
