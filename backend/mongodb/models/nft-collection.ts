import mongoose, { Document, model, Model, Schema } from 'mongoose'

export interface INFTCollection extends Document {
  _id: string  // NFTCollection contract id
  type: 'NFTOpenCollection' | 'NFTPublicSaleCollection'
  owner: string
  name: string
  description: string
  image: string
  nftIndex: number
  createdAt: Date
}

const NFTCollectionSchema: Schema = new Schema({
  _id: {
    type: String
  },
  type: {
    type: String
  },
  owner: {
    type: String
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  nftIndex: {
    type: Number
  },
  createdAt: {
    type: Date
  }
})

NFTCollectionSchema.index({ owner: 1 })
NFTCollectionSchema.index({ createdAt: 1 })
NFTCollectionSchema.index({ name: "text" })
NFTCollectionSchema.index({ description: "text" })

export const NFTCollection = (mongoose.models.NFTCollection ||
  model('NFTCollection', NFTCollectionSchema)) as Model<INFTCollection>