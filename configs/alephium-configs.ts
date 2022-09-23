// @ts-ignore
module.exports = {
  environments: {
    'development-nodewallet': {
      nodeUrl: 'http://127.0.0.1:22973',
      signerProvider: {
        type: 'NodeWalletProvider',
        nodeUrl: 'http://127.0.0.1:22973',
        walletName: 'alephium-web3-test-only-wallet',
        password: 'alph'
      }
    },
    'browser-extension-local': {
      nodeUrl: 'http://127.0.0.1:22973',
      signerProvider: {
        type: 'BrowserExtensionProvider',
      }
    },
    'browser-extension-softfork': {
      nodeUrl: 'https://alephium-dev.softfork.se',
      signerProvider: {
        type: 'BrowserExtensionProvider',
      }
    },
    'development-walletconnect': {
      nodeUrl: 'http://127.0.0.1:22973',
      signerProvider: {
        type: 'WalletConnectProvider',
        projectId: '6e2562e43678dd68a9070a62b6d52207',
        relayUrl: 'wss://relay.walletconnect.com',
        metadata: {
          name: 'Alphium NFT',
          description: 'Alephium NFT Marketplace',
          url: 'https://walletconnect.com/',
          icons: ['https://walletconnect.com/walletconnect-logo.png']
        },
        networkId: 4,
        chainGroup: -1
      }
    }
  }
}
