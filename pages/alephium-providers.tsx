import { NodeProvider } from '@alephium/web3'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes } from '@walletconnect/types'
import WalletConnectProvider from '@alephium/walletconnect-provider'
import QRCodeModal from "@walletconnect/qrcode-modal"
import { createContext } from 'vm'
import React, { Dispatch, useCallback, useEffect, useReducer, useState } from 'react'
import { Account } from '@alephium/web3'
// Other providers
const localDevProvider = new NodeProvider('http://127.0.0.1:22973')
export const provider = localDevProvider

type StateType = {
    provider?: WalletConnectProvider
    web3Provider?: any
    address?: string
    chainId?: number,
    accounts: Account[]
}

type ActionType =
    | {
        type: 'SET_ACCOUNTS'
        accounts: StateType['accounts']
    }
    | {
        type: 'DISCONNECT'
    }

const initialState: StateType = {
    provider: null,
    web3Provider: null,
    address: null,
    chainId: null,
    accounts: []
}

function reducer(state: StateType, action: ActionType): StateType {
    switch (action.type) {
        case 'SET_ACCOUNTS':
            return {
                ...state,
                accounts: action.accounts,
            }
        case 'DISCONNECT':
            return initialState
        default:
            throw new Error()
    }
}

export const WalletConnectContext = React.createContext<StateType>(initialState)

export const Web3Provider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState)
    const [provider, setProvider] = useState<WalletConnectProvider | undefined>(undefined)
    const getWalletConnectProviderCached = useCallback(getWalletConnectProvider)
    useEffect(() => {
        loadProvider()
    }, [])
    async function loadProvider() {
        const p = await getWalletConnectProviderCached(dispatch)
        setProvider(p)
    }

    return (
        <WalletConnectContext.Provider
            value={{
                accounts: state.accounts,
                provider: provider
            }}
        >
            {children}
        </WalletConnectContext.Provider>
    )
}

export async function getWalletConnectProvider(
    dispatch: (action: ActionType) => Dispatch<ActionType>
): Promise<WalletConnectProvider> {
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
        if (uri) {
            QRCodeModal.open(uri, () => {
                console.log("EVENT", "QR Code Modal closed");
            })
        }
    })

    walletConnect.on(CLIENT_EVENTS.session.deleted, () => {
        console.log('session deleted')
    })

    walletConnect.on(CLIENT_EVENTS.session.sync, (e) => {
        QRCodeModal.close()
        console.log('session sync', e)
    })

    provider.on('accountsChanged', (accounts: Account[]) => {
        dispatch({
            type: 'SET_ACCOUNTS',
            accounts
        })
        console.log('accounts changed', accounts)
    })

    provider.on('disconnect', (code: number, reason: string) => {
        dispatch({
            type: 'DISCONNECT'
        })
        console.log('disconnect', code, reason)
    })

    return provider
}
