import { NodeProvider } from '@alephium/web3'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes } from '@walletconnect/types'
const localDevProvider = new NodeProvider('http://127.0.0.1:22973')
import WalletConnectProvider from '@alephium/walletconnect-provider'
// Other providers

export const provider = localDevProvider

export async function walletConnectCallback() {
  const walletConnect = await WalletConnectClient.init({
    projectId: '6e2562e43678dd68a9070a62b6d52207',
    relayUrl: 'wss://relay.walletconnect.com',
    metadata: {
      name: 'Alphium NFT',
      description: 'Alpephium NFT Marketplace',
      url: 'https://walletconnect.com/',
      icons: ['https://walletconnect.com/walletconnect-logo.png']
    }
  })

  console.log(walletConnect)

  const provider = new WalletConnectProvider({
    networkId: 4,
    chainGroup: -1, // -1 means all groups, 0/1/2/3 means only the specific group is allowed
    client: walletConnect
  })

  walletConnect.on(CLIENT_EVENTS.pairing.proposal, async (proposal: PairingTypes.Proposal) => {
    const { uri } = proposal.signal.params
    console.log('proposal uri', uri)
  })

  walletConnect.on(CLIENT_EVENTS.session.deleted, () => {
    console.log('session deleted')
  })
  walletConnect.on(CLIENT_EVENTS.session.sync, () => {
    console.log('session sync')
  })

  provider.on('accountsChanged', (accounts: Account[]) => {
    console.log(`========= ${JSON.stringify(accounts)}`)
  })

  await provider.connect()
}