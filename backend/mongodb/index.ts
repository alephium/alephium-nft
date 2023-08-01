import { connect, connection } from 'mongoose'
import { mongoUrl as defaultMongoUrl } from '../../configs/nft'

const options: any = {
  useUnifiedTopology: true,
  useNewUrlParser: true
}

export const connectToDatabase = async () => {
  if (!connection.readyState) {
    const mongoUrl = process.env.MONGO_URL ?? defaultMongoUrl
    console.log('Connecting to ', mongoUrl)
    connect(mongoUrl, options)
  }
}