import { connect, connection } from 'mongoose'
import { getMongoUrl } from '../../shared/configs'

const options: any = {
  useUnifiedTopology: true,
  useNewUrlParser: true
}

export const connectToDatabase = async () => {
  if (!connection.readyState) {
    const mongoUrl = getMongoUrl()
    console.log('Connecting to ', mongoUrl)
    connect(mongoUrl, options)
  }
}