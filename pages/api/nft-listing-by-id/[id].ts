import Validate from 'next-api-validation'
import type { NextApiRequest, NextApiResponse } from "next";
import { NFTListing } from '../../../utils/mongodb/models/nft-listing'
import { connectToDatabase } from '../../../utils/mongodb'
import { trySaveNewNFTListings } from '../../../utils/nft-listings';

connectToDatabase()

const nftListingByIdHandler = Validate({
  async get(req: NextApiRequest, res: NextApiResponse) {
    try {
      await trySaveNewNFTListings()
      const { id } = req.query
      const listing = await NFTListing.findById(id)
      res.json(listing)
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})

export default nftListingByIdHandler