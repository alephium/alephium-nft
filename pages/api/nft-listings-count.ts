import Validate from 'next-api-validation'
import type { NextApiRequest, NextApiResponse } from "next";
import { NFTListing } from '../../utils/mongodb/models/nft-listing'
import { connectToDatabase } from '../../utils/mongodb'

connectToDatabase()

const nftListingsCountHandler = Validate({
  async get(req: NextApiRequest, res: NextApiResponse) {
    try {
      const searchText = req.query.search as string
      const filterArgs = searchText ? { $text: { $search: searchText, $caseSensitive: false } } : {}
      const total = await NFTListing.count(filterArgs)
      res.json({ total })
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})


export default nftListingsCountHandler
