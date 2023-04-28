import mongoose, { Document, model, Model, Schema } from 'mongoose'

export interface IMarketplaceEvent extends Document {
  txId: string,
  contractAddress: string,
  eventIndex: number,
  fields: string[];
}

const MarketplaceEventSchema: Schema = new Schema({
  txId: {
    type: String
  },
  contractAddress: {
    type: String
  },
  eventIndex: {
    type: Number
  },
  fields: {
    type: Array<String>
  }
})

export const MaketplaceEvent = (mongoose.models.MarketplaceEvent ||
  model('MarketplaceEvent', MarketplaceEventSchema)) as Model<IMarketplaceEvent>
