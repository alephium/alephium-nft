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
    'browser-extension': {
      nodeUrl: 'http://127.0.0.1:22973',
      signerProvider: {
        type: 'BrowserExtensionProvider',
      }
    }
  }
}
