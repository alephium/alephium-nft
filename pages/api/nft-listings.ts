import Validate from 'next-api-validation'
import type { NextApiRequest, NextApiResponse } from "next";
import { NFTListing } from '../../utils/mongodb/models/nft-listing'
import { SortOrder } from 'mongoose'
import { connectToDatabase } from '../../utils/mongodb'
import { trySaveNewNFTListings } from '../../utils/nft-listings'

connectToDatabase()

const nftListingsHandler = Validate({
  async get(req: NextApiRequest, res: NextApiResponse) {
    try {
      const searchText = req.query.search as string
      const priceOrder = req.query.priceOrder as SortOrder | undefined
      const page = Number(req.query.page as string)
      const size = Number(req.query.size as string)

      await trySaveNewNFTListings()

      const idOrder = (priceOrder === 'asc' || priceOrder === 'ascending') ? -1 : 1
      const filterArgs = searchText ? { $text: { $search: searchText, $caseSensitive: false } } : {}
      const skipped = page * size
      const listings = priceOrder ?
        await NFTListing.find(filterArgs).sort({ "price": priceOrder, "_id": idOrder }).collation({ locale: "en_US", numericOrdering: true }).skip(skipped).limit(size) :
        await NFTListing.find(filterArgs).sort({ "createdAt": -1 }).skip(skipped).limit(size)
      res.json(listings)
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})

export default nftListingsHandler
