import mongoose, { Document, model, Model, Schema } from 'mongoose'

export interface INFTListing extends Document {
  _id: string,  // Token Id
  price: bigint
  name: string,
  description: string,
  image: string,
  tokenOwner: string,
  marketAddress: string
  commissionRate: bigint,
  listingContractId: string
}

const NFTListingSchema: Schema = new Schema({
  _id: {
    type: String
  },
  price: {
    type: Number
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
  tokenOwner: {
    type: String
  },
  marketAddress: {
    type: String
  },
  commissionRate: {
    type: Number
  },
  listingContractId: {
    type: String
  }
})

export const NFTListing = (mongoose.models.NFTListing ||
  model('NFTListing', NFTListingSchema)) as Model<INFTListing>
