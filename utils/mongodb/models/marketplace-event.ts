import mongoose, { Document, model, Model, Schema } from 'mongoose'

export interface IMarketplaceEvent extends Document {
  txId: string,
  contractAddress: string,
  eventIndex: number,
  fields: { type: string, value: string }[];
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
    type: Array<{ String, String }>
  }
})

MarketplaceEventSchema.index({ txId: 1, eventIndex: 1 }, { unique: true })

export const MaketplaceEvent = (mongoose.models.MarketplaceEvent ||
  model('MarketplaceEvent', MarketplaceEventSchema)) as Model<IMarketplaceEvent>
