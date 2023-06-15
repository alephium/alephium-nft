import mongoose, { Document, model, Model, Schema } from 'mongoose'

export interface NFTListing {
  _id: string,  // Token Id
  price: bigint
  name: string,
  description: string,
  image: string,
  tokenOwner: string,
  marketAddress: string
  commissionRate: bigint,
  listingContractId: string,
  collectionId: string
}

export interface INFTListing extends NFTListing { }
export interface INFTListing2 extends Document { }


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
  commissionRate: {
    type: String
  },
  listingContractId: {
    type: String
  },
  collectionId: {
    type: String
  }
})

export const NFTListing = (mongoose.models.NFTListing ||
  model('NFTListing', NFTListingSchema)) as Model<INFTListing2>
