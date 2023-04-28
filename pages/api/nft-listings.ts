import Validate from 'next-api-validation'
import { NFTListing, INFTListing } from '../../utils/mongodb/models/nft-listing'
import { connectToDatabase } from '../../utils/mongodb'

connectToDatabase()

const nftListingsHandler = Validate({
  async get(req, res) {
    try {
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
        { '_id': body.id },
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

export default nftListingsHandler