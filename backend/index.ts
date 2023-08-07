import express, { Express, Request, Response } from 'express'
import { connectToDatabase } from './mongodb'
import { NFTListing } from './mongodb/models/nft-listing'
import { SortOrder } from 'mongoose'
import { NFTCollection } from './mongodb/models/nft-collection'
import { checkAndGetCollectionMetadata } from '../shared/nft-collection'
import cors from 'cors'
import { subscribeMarketplaceEvents } from './subscription/marketplace'
import { NFTSold } from './mongodb/models/nft-sold'
import { web3 } from '@alephium/web3'
import { getAlephiumNFTConfig } from '../shared/configs'

const app: Express = express()
const port = process.env.PORT || '3019'
const nodeUrl = process.env.NODE_URL || getAlephiumNFTConfig().defaultNodeUrl

web3.setCurrentNodeProvider(nodeUrl)
connectToDatabase()
subscribeMarketplaceEvents()

app.use(cors<Request>())
app.use(express.json())

app.get('/api/top-sellers', async (req: Request, res: Response) => {
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
})

app.get('/api/nft-listings-count', async (req: Request, res: Response) => {
  try {
    const searchText = req.query.search as string
    const filterArgs = searchText ? { $text: { $search: searchText, $caseSensitive: false } } : {}
    const total = await NFTListing.count(filterArgs)
    res.json({ total })
  } catch (err) {
    console.log(err)
    res.status(500).send('error')
  }
})

app.get('/api/nft-listings', async (req: Request, res: Response) => {
  try {
    const searchText = req.query.search as string
    const priceOrder = req.query.priceOrder as SortOrder | undefined
    const page = Number(req.query.page as string)
    const size = Number(req.query.size as string)

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
})

app.get('/api/nft-listing-by-id/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const listing = await NFTListing.findById(id)
    res.json(listing)
  } catch (err) {
    console.log(err)
    res.status(500).send('error')
  }
})

app.get('/api/nft-listings-by-owner/:owner', async (req: Request, res: Response) => {
  try {
    const owner = req.params.owner
    const listing = await NFTListing.find({ 'tokenOwner': owner })
    res.json(listing)
  } catch (err) {
    console.log(err)
    res.status(500).send('error')
  }
})

app.post('/api/create-collection', async (req: Request, res: Response) => {
  try {
    const payload = req.body
    const collectionMetadata = await checkAndGetCollectionMetadata(web3.getCurrentNodeProvider(), payload.collectionId)
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
})

app.get('/api/nft-collections-by-owner/:owner', async (req: Request, res: Response) => {
  try {
    const owner = req.params.owner
    const collections = await NFTCollection.find({ 'owner': owner })
    res.json(collections)
  } catch (err) {
    console.log(err)
    res.status(500).send('error')
  }
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
