import { useContext } from "react"
import { AlephiumWeb3Context } from './alephium-web3-providers'
import { disconnect as extensionDisconnect, connect as extensionConnect } from "@h0ngcha0/get-alephium"

const WalletButton = () => {
    const context = useContext(AlephiumWeb3Context)

    async function connect() {
        switch (context.signerProvider?.type) {
            case 'BrowserExtensionProvider': {
                const windowAlephium = await extensionConnect({
                    include: ["alephium"],
                })
                await windowAlephium?.enable()
                if (windowAlephium && context.setSignerProviderFunc && context.setSelectedAccountFunc) {
                    context.setSignerProviderFunc(windowAlephium)
                    windowAlephium.selectedAccount &&
                        context.setSelectedAccountFunc(windowAlephium.selectedAccount)
                }
            }
        }
    }

    async function disconnect() {
        switch (context.signerProvider?.type) {
            case 'BrowserExtensionProvider': {
                extensionDisconnect()
            }
        }
    }

    const showButton = context.signerProvider && (
        context.signerProvider.type === 'BrowserExtensionProvider'
    )

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