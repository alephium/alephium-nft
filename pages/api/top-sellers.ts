import Validate from 'next-api-validation'
import { NFTSold } from '../../utils/mongodb/models/nft-sold'
import { connectToDatabase } from '../../utils/mongodb'
import type { NextApiRequest, NextApiResponse } from "next";

connectToDatabase()

const topSellerHandler = Validate({
  async get(req: NextApiRequest, res: NextApiResponse) {
    try {
      // Only return top 9 for now
      const topSellers = await NFTSold.aggregate([
        {
          $group: { _id: "$previousOwner", totalAmount: { $sum: { $toDecimal: "$price" } } }
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