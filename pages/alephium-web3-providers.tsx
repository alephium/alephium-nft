import { NodeProvider, NodeWallet } from '@alephium/web3'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes } from '@walletconnect/types'
import WalletConnectProvider from '@alephium/walletconnect-provider'
import QRCodeModal from "@walletconnect/qrcode-modal"
import React, { Dispatch, useEffect, useReducer } from 'react'
import { Account } from '@alephium/web3'

type StateType = {
    signerProvider?: WalletConnectProvider | NodeWallet
    nodeProvider?: NodeProvider
    accounts: Account[]
}

type ActionType =
    | {
        type: 'SET_ACCOUNTS'
        accounts: StateType['accounts']
    }
    | {
        type: 'SET_SIGNER_PROVIDER'
        provider: StateType['signerProvider']
    }
    | {
        type: 'SET_NODE_PROVIDER'
        provider: StateType['nodeProvider']
    }
    | {
        type: 'DISCONNECT'
    }

const initialState: StateType = {
    signerProvider: null,
    nodeProvider: null,
    accounts: [] as Account[]
}

function reducer(state: StateType, action: ActionType): StateType {
    switch (action.type) {
        case 'SET_ACCOUNTS':
            return {
                ...state,
                accounts: action.accounts,
            }
        case 'SET_SIGNER_PROVIDER':
            return {
                ...state,
                signerProvider: action.provider,
            }
        case 'SET_NODE_PROVIDER':
            return {
                ...state,
                nodeProvider: action.provider,
            }
        case 'DISCONNECT':
            return initialState
        default:
            throw new Error()
    }
}

export const AlephiumWeb3Context = React.createContext<StateType>(initialState)

type SignerProviderType =
    | {
        type: 'NodeWalletProvider'
        nodeUrl: string
        walletName: string
        password: string
    }
    | {
        type: 'WalletConnectProvider'
        projectId: string
        relayUrl: string
        metadata: object
        networkId: number
        chainGroup: number
    }

interface EnvironmentConfig {
    nodeUrl: string
    signerProvider: SignerProviderType
}

const environmentConfigs: Map<string, EnvironmentConfig> = {
    "development1": {
        nodeUrl: 'http://127.0.0.1:22973',
        signerProvider: {
            type: 'NodeWalletProvider',
            nodeUrl: 'http://127.0.0.1:22973',
            walletName: 'alephium-web3-test-only-wallet',
            password: 'alph'
        }
    },
    "development2": {
        nodeUrl: 'http://127.0.0.1:22973',
        signerProvider: {
            type: 'WalletConnectProvider',
            projectId: '6e2562e43678dd68a9070a62b6d52207',
            relayUrl: 'wss://relay.walletconnect.com',
            metadata: {
                name: 'Alphium NFT',
                description: 'Alpephium NFT Marketplace',
                url: 'https://walletconnect.com/',
                icons: ['https://walletconnect.com/walletconnect-logo.png']
            },
            networkId: 4,
            chainGroup: -1
        }
    }
}

function getConfig(name: string): EnvironmentConfig {
    return environmentConfigs[name]
}

export const AlephiumWeb3Provider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState)

    async function loadProvider() {
        const config = getConfig("development1")
        const nodeProvider = new NodeProvider(config.nodeUrl)
        dispatch({
            type: 'SET_NODE_PROVIDER',
            provider: nodeProvider
        })

        if (config.signerProvider.type === 'NodeWalletProvider') {
            const wallet = new NodeWallet(nodeProvider, config.signerProvider.walletName)
            wallet.unlock(config.signerProvider.password)
            const accounts = await wallet.getAccounts()
            dispatch({
                type: 'SET_ACCOUNTS',
                accounts: accounts
            })

            dispatch({
                type: 'SET_SIGNER_PROVIDER',
                provider: wallet
            })
        } else if (config.signerProvider.type === 'WalletConnectProvider') {
            const provider = await getWalletConnectProvider(
                config.signerProvider.projectId,
                config.signerProvider.relayUrl,
                config.signerProvider.metadata,
                dispatch
            )
            dispatch({
                type: 'SET_SIGNER_PROVIDER',
                provider
            })
        }
    }

    useEffect(() => {
        loadProvider()
    }, [])


    return (
        <AlephiumWeb3Context.Provider
            value={{
                accounts: state.accounts,
                signerProvider: state.signerProvider,
                nodeProvider: state.nodeProvider
            }}
        >
            {children}
        </AlephiumWeb3Context.Provider>
    )
}

export async function getWalletConnectProvider(
    projectId: string,
    relayUrl: string,
    metadata: object,
    dispatch: (action: ActionType) => Dispatch<ActionType>
): Promise<WalletConnectProvider> {
    const walletConnect = await WalletConnectClient.init({
        projectId: projectId,
        relayUrl: relayUrl,
        metadata: metadata
    })

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

    return provider.connect()
}
