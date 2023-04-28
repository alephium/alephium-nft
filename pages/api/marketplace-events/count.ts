import Validate from 'next-api-validation'
import { MaketplaceEvent } from '../../../utils/mongodb/models/marketplace-event'
import { connectToDatabase } from '../../../utils/mongodb'

connectToDatabase()

const marketplaceEventsCountHandler = Validate({
  async get(req, res) {
    try {
      const count = await MaketplaceEvent.count()
      res.json({ count: count })
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})

export default marketplaceEventsCountHandler