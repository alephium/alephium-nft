import { NodeProvider } from 'alephium-web3'
import WalletConnectClient from '@walletconnect/client'

const localDevProvider = new NodeProvider('http://127.0.0.1:22973')
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
}