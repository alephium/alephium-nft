import { useContext } from "react"
import { AlephiumWeb3Context } from './alephium-web3-providers'
import { disconnect as extensionDisconnect, connect as extensionConnect } from "@alephium/get-extension-wallet"
import { NETWORK } from "../configs/addresses"

const WalletButton = () => {
  const context = useContext(AlephiumWeb3Context)

  async function connect() {
    console.log("provider", context.signerProvider?.type)
    switch (context.signerProvider?.type) {
      case 'BrowserExtensionProvider': {
        const windowAlephium = await extensionConnect({
          include: ["alephium"],
        })

        if (windowAlephium && context.setSignerProviderFunc && context.setSelectedAccountFunc) {
          const selectedAccount = await windowAlephium?.enable({
            networkId: NETWORK,
            onDisconnected: () => Promise.resolve(disconnectContext())
          })
          context.setSignerProviderFunc(windowAlephium)
          context.setSelectedAccountFunc(selectedAccount)
        }
        break;
      }
    }
  }

  async function disconnect() {
    switch (context.signerProvider?.type) {
      case 'BrowserExtensionProvider': {
        disconnectContext()
        extensionDisconnect()
        break;
      }
    }
  }

  function disconnectContext() {
    context.disconnectFunc && context.disconnectFunc()
  }

  const showButton = !(context.signerProvider && context.signerProvider.type === 'NodeWalletProvider')

  return (
    showButton ?
      (
        !context.selectedAccount ?
          <button className="btn btn-outline btn-sm btn-accent" onClick={connect}>Connect</button> :
          <button className="btn btn-outline btn-sm btn-secondary" onClick={disconnect}>Disconnect</button>
      ) : null
  )
}

export default WalletButton