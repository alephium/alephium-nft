import WalletConnectProvider from '@alephium/walletconnect-provider'
import { useContext, useEffect } from "react"
import { AlephiumWeb3Context } from './alephium-web3-providers'

export const WalletButton = () => {
    const context = useContext(AlephiumWeb3Context)

    async function connect() {
        if (context.signerProvider instanceof WalletConnectProvider) {
            await context.signerProvider.connect()
        }
    }

    async function disconnect() {
        if (context.signerProvider instanceof WalletConnectProvider) {
            await context.signerProvider.disconnect()
        }
    }

    return (
        context.signerProvider instanceof WalletConnectProvider ?
            (
                context.accounts && context.accounts.length === 0 ?
                    <button class="btn btn-outline btn-sm btn-accent" onClick={connect}>Connect</button> :
                    <button class="btn btn-outline btn-sm btn-secondary" onClick={disconnect}>Disconnect</button>
            ) : null
    )
}