import mongoose, { Document, model, Model, Schema } from 'mongoose'

export interface INFTCollection extends Document {
  _id: string  // NFTCollection contract id
  type: 'NFTOpenCollection' | 'NFTPublicSaleCollection'
  name: string
  description: string
  image: string
  createdAt: Date
}

const NFTCollectionSchema: Schema = new Schema({
  _id: {
    type: String
  },
  type: {
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
  createdAt: {
    type: Date
  }
})

NFTCollectionSchema.index({ createdAt: 1 })
NFTCollectionSchema.index({ name: "text" })
NFTCollectionSchema.index({ description: "text" })

export const NFTCollection = (mongoose.models.NFTCollection ||
  model('NFTCollection', NFTCollectionSchema)) as Model<INFTCollection>