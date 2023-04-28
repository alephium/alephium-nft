import Validate from 'next-api-validation'
import { MaketplaceEvent, IMarketplaceEvent } from '../../../utils/mongodb/models/marketplace-event'
import { connectToDatabase } from '../../../utils/mongodb'

connectToDatabase()

const marketplaceEventsHandler = Validate({
  async get(req, res) {
    try {
      const events = await MaketplaceEvent.find()
      res.json(events.reverse())
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  },
  async post(req, res) {
    try {
      const body: IMarketplaceEvent = req.body
      const newEvent = new MaketplaceEvent(body)
      var result = await MaketplaceEvent.exists(
        { 'txId': body.txId, 'eventIndex': body.eventIndex }
      )
      if (!result?._id) {
        result = await newEvent.save()
      }
      res.send(result)
    } catch (err) {
      console.log(err)
      res.status(500).send('error')
    }
  }
})

export default marketplaceEventsHandler