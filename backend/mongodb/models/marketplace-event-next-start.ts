import mongoose, { Document, model, Model, Schema } from 'mongoose'

export interface IMarketplaceEventNextStart extends Document {
  nextStart: number
}


const MarketplaceEventNextStartSchema: Schema = new Schema({
  nextStart: {
    type: String
  }
})

export const MaketplaceEventNextStart = (mongoose.models.MarketplaceEventNextStart ||
  model('MarketplaceEventNextStart', MarketplaceEventNextStartSchema)) as Model<IMarketplaceEventNextStart>
