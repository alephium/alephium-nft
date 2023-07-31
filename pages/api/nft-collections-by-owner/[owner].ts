import Validate from 'next-api-validation'
import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from '../../../utils/mongodb'
import { NFTCollection } from '../../../utils/mongodb/models/nft-collection';

connectToDatabase()

const nftCollectionsByOwnerHandler = Validate({
  async get(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { owner } = req.query
      const collections = await NFTCollection.find({'owner': owner})
      res.json(collections)
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})

export default nftCollectionsByOwnerHandler