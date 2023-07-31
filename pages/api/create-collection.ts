import Validate from 'next-api-validation'
import { connectToDatabase } from '../../utils/mongodb'
import type { NextApiRequest, NextApiResponse } from "next";
import { checkAndGetCollectionMetadata } from '../../utils/nft-collection';
import { NFTCollection } from '../../utils/mongodb/models/nft-collection';

connectToDatabase()

type Payload = { collectionId: string }

const createCollectionHandler = Validate({
  async post(req: NextApiRequest, res: NextApiResponse) {
    try {
      const payload: Payload = req.body
      const collectionMetadata = await checkAndGetCollectionMetadata(payload.collectionId)
      const exists = await NFTCollection.exists({ '_id': collectionMetadata.id })
      if (!exists) {
        const nftCollection = new NFTCollection({
          _id: collectionMetadata.id,
          type: collectionMetadata.collectionType,
          owner: collectionMetadata.owner,
          name: collectionMetadata.name,
          description: collectionMetadata.description,
          image: collectionMetadata.image,
          createdAt: new Date()
        })
        await nftCollection.save()
      }
      res.json(collectionMetadata)
    } catch (err) {
      console.log(err)
      res.status(500).send(`error: ${err}`)
    }
  }
})


export default createCollectionHandler