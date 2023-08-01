import mongoose, { Document, model, Model, Schema } from 'mongoose'

export interface INFTSold extends Document {
  _id: string // transaction id
  tokenId: string
  price: string
  previousOwner: string
  newOwner: string
  createdAt: Date
}

const NFTSoldSchema: Schema = new Schema({
  _id: {
    type: String
  },
  tokenId: {
    type: String
  },
  price: {
    type: String
  },
  previousOwner: {
    type: String
  },
  newOwner: {
    type: String
  },
  createdAt: {
    type: Date
  }
})

NFTSoldSchema.index({ tokenId: 1 })
NFTSoldSchema.index({ previousOwner: 1 })
NFTSoldSchema.index({ newOwner: 1 })

export const NFTSold = (mongoose.models.NFTSold ||
  model('NFTSold', NFTSoldSchema)) as Model<INFTSold>