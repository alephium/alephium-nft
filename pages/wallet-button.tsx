import { useContext } from "react"
import { AlephiumWeb3Context, connectWallet, getAccounts, instanceOfIAlephiumWindowObject } from './alephium-web3-providers'
import { disconnect as extensionDisconnect } from "@h0ngcha0/get-alephium"

const WalletButton = () => {
    const context = useContext(AlephiumWeb3Context)

    async function connect() {
        switch (context.signerProvider?.type) {
            case 'WalletConnectProvider': {
                await context.signerProvider.provider.connect()
            }

            case 'BrowserExtensionProvider': {
                const windowAlephium = await connect({
                    include: ["alephium"],
                })
                await windowAlephium?.enable()
                if (windowAlephium && context.setSignerProviderFunc && context.setAccountsFunc) {
                    context.setSignerProviderFunc(windowAlephium)
                    const addresses = await windowAlephium.getAccounts()
                    context.setAccountsFunc(addresses)
                }
            }
        }
    }

    async function disconnect() {
        switch (context.signerProvider?.type) {
            case 'WalletConnectProvider': {
                await context.signerProvider.disconnect()
            }

            case 'BrowserExtensionProvider': {
                extensionDisconnect()
            }
        }
    }

    const showButton = context.signerProvider && (
        context.signerProvider.type === 'WalletConnectProvider' ||
        context.signerProvider.type === 'BrowserExtensionProvider'
    )

    return (
        showButton ?
            (
                context.accounts && context.accounts.length === 0 ?
                    <button className="btn btn-outline btn-sm btn-accent" onClick={connect}>Connect</button> :
                    <button className="btn btn-outline btn-sm btn-secondary" onClick={disconnect}>Disconnect</button>
            ) : null
    )
}

export default WalletButton