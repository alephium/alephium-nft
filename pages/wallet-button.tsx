import WalletConnectProvider from '@alephium/walletconnect-provider'
import { useContext, useEffect, useState } from "react"
import { WalletConnectContext } from './alephium-providers'

export const WalletButton = () => {
    const context = useContext(WalletConnectContext)
    const provider = context.provider
    async function connect() {
        provider && await provider.connect()
    }

    async function disconnect() {
        provider && await provider.disconnect()
    }

    return (
        context.accounts && context.accounts.length === 0 ?
            <button className="mt-4 bg-blue-500 text-white font-bold py-2 px-12 rounded" onClick={connect}>Connect</button> :
            <button className="mt-4 bg-blue-500 text-white font-bold py-2 px-12 rounded" onClick={disconnect}>Disconnect</button>
    )
}