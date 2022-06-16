import WalletConnectProvider from '@alephium/walletconnect-provider'
import { useContext } from "react"
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
                    <button className="mt-4 bg-blue-500 text-white font-bold py-2 px-12 rounded" onClick={connect}>Connect</button> :
                    <button className="mt-4 bg-blue-500 text-white font-bold py-2 px-12 rounded" onClick={disconnect}>Disconnect</button>
            ) : null
    )
}