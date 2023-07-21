import Validate from 'next-api-validation'
import type { NextApiRequest, NextApiResponse } from "next";
import { NFTCollection } from '../../utils/mongodb/models/nft-collection'
import { connectToDatabase } from '../../utils/mongodb'
import { trySaveNewNFTListings } from '../../utils/nft-listings'

connectToDatabase()

const nftCollectionsHandler = Validate({
  async get(req: NextApiRequest, res: NextApiResponse) {
    try {
      await trySaveNewNFTListings()
      const collections = await NFTCollection.find({})
      res.json(collections)
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})

export default nftCollectionsHandler