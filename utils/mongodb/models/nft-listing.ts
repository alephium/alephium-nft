import mongoose, { Document, model, Model, Schema } from 'mongoose'

export interface NFTListing {
  _id: string,  // Token Id
  price: bigint
  name: string,
  description: string,
  image: string,
  tokenOwner: string,
  marketAddress: string
  listingContractId: string,
  collectionId: string
}

export interface INFTListing extends NFTListing { }
export interface INFTListingDoc extends Document { }

const NFTListingSchema: Schema = new Schema({
  _id: {
    type: String
  },
  price: {
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
  tokenOwner: {
    type: String
  },
  marketAddress: {
    type: String
  },
  listingContractId: {
    type: String
  },
  collectionId: {
    type: String
  }
})

NFTListingSchema.index({ price: 1 })
NFTListingSchema.index({ name: "text" })
NFTListingSchema.index({ description: "text" })

export const NFTListing = (mongoose.models.NFTListing ||
  model('NFTListing', NFTListingSchema)) as Model<INFTListingDoc>
