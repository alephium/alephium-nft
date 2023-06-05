import { connect, connection } from 'mongoose'
import { mongoUrl } from '../../configs/nft'

const options: any = {
  useUnifiedTopology: true,
  useNewUrlParser: true
}

export const connectToDatabase = async () => {
  if (!connection.readyState) {
    console.log('Connecting to ', mongoUrl)
    connect(mongoUrl, options)
  }
}