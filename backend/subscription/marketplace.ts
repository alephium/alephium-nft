import { getAlephiumNFTConfig } from '../../shared/configs'
import { NFTMarketPlace } from '../../artifacts/ts'
import { ContractEvent, EventSubscribeOptions } from '@alephium/web3'
import { MaketplaceEventNextStart } from '../mongodb/models/marketplace-event-next-start'
import { MaketplaceEvent } from '../mongodb/models/marketplace-event'
import { nftListingEventReducer } from '../utils/nft-listings'

function createSubscribeOptions(eventHandler: (event: ContractEvent) => Promise<void>): EventSubscribeOptions<ContractEvent> {
  const config = getAlephiumNFTConfig()
  return {
    pollingInterval: config.pollingInterval,
    messageCallback: (event: ContractEvent): Promise<void> => {
      return eventHandler(event)
    },
    errorCallback: (error: any, subscription): Promise<void> => {
      console.error(`subscribe marketplace events error: ${error}`)
      subscription.unsubscribe()
      return subscribeMarketplaceEvents()
    },
    onEventCountChanged: async (eventCount: number): Promise<void> => {
      await MaketplaceEventNextStart.findOneAndUpdate({}, { $set: { nextStart: eventCount } })
    }
  }
}

async function getNextStart(): Promise<number> {
  const nextStartResult = await MaketplaceEventNextStart.findOne()
  if (!nextStartResult) {
    await MaketplaceEventNextStart.create({ nextStart: 0 })
  }
  return nextStartResult ? nextStartResult.nextStart : 0
}

const eventHandler = async (event: ContractEvent): Promise<void> => {
  const newEvent = new MaketplaceEvent(event)
  const eventExists = await MaketplaceEvent.exists(
    { 'txId': event.txId, 'eventIndex': event.eventIndex, 'blockHash': event.blockHash }
  )
  if (eventExists?._id) {
    console.log("Skipping duplicated event", event)
    return
  }

  await newEvent.save()
  nftListingEventReducer(event)
}

export async function subscribeMarketplaceEvents() {
  const config = getAlephiumNFTConfig()
  const nextStart = await getNextStart()
  console.log(`from event count: ${nextStart}`)
  const marketplace = NFTMarketPlace.at(config.marketplaceContractAddress)
  const options = createSubscribeOptions(eventHandler)
  marketplace.subscribeAllEvents(options as any, nextStart)
}
