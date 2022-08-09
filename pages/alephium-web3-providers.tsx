import { NodeProvider, NodeWallet } from '@alephium/web3'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { AppMetadata, PairingTypes } from '@walletconnect/types'
import WalletConnectProvider from '@alephium/walletconnect-provider'
import QRCodeModal from "@walletconnect/qrcode-modal"
import React, { Dispatch, useEffect, useReducer } from 'react'
import { Account } from '@alephium/web3'
// @ts-ignore
import AlephiumConfigs from '../configs/alephium-configs'
import { connect, IAlephiumWindowObject } from "@h0ngcha0/get-alephium"

type SignerProvider =
    | {
        type: 'WalletConnectProvider',
        provider: WalletConnectProvider
    }
    | {
        type: 'NodeWalletProvider',
        provider: NodeWallet
    }
    | {
        type: 'BrowserExtensionProvider',
        provider: IAlephiumWindowObject | undefined
    }

type SetSignerProviderFunc = (provider: SignerProvider) => void
type SetAccountsFunc = (accounts: Account[]) => void
type StateType = {
    signerProvider?: SignerProvider
    nodeProvider?: NodeProvider
    accounts: Account[]
    setSignerProviderFunc?: SetSignerProviderFunc
    setAccountsFunc?: SetAccountsFunc
}

type ActionType =
    | {
        type: 'SET_ACCOUNTS'
        accounts: StateType['accounts']
    }
    | {
        type: 'SET_SIGNER_PROVIDER'
        signerProvider: StateType['signerProvider']
    }
    | {
        type: 'SET_NODE_PROVIDER'
        nodeProvider: StateType['nodeProvider']
    }
    | {
        type: 'SET_SIGNER_PROVIDER_FUNC'
        func: StateType['setSignerProvider']
    }
    | {
        type: 'SET_ACCOUNTS_FUNC'
        func: StateType['setAccounts']
    }
    | {
        type: 'DISCONNECT'
    }

const initialState: StateType = {
    signerProvider: undefined,
    nodeProvider: undefined,
    accounts: [] as Account[],
    setSignerProviderFunc: undefined,
    setAccountsFunc: undefined
}

function reducer(state: StateType, action: ActionType): StateType {
    console.log("received action", action)
    switch (action.type) {
        case 'SET_ACCOUNTS':
            return {
                ...state,
                accounts: action.accounts
            }
        case 'SET_SIGNER_PROVIDER':
            return {
                ...state,
                signerProvider: action.signerProvider
            }

        case 'SET_NODE_PROVIDER':
            return {
                ...state,
                nodeProvider: action.nodeProvider
            }

        case 'DISCONNECT':
            return initialState

        case 'SET_SIGNER_PROVIDER_FUNC':
            return {
                ...state,
                setSignerProviderFunc: action.func
            }

        case 'SET_ACCOUNTS_FUNC':
            return {
                ...state,
                setAccountsFunc: action.func
            }

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
        metadata: AppMetadata,
        networkId: number
        chainGroup: number
    }
    | {
        type: 'BrowserExtensionProvider'
    }

interface EnvironmentConfig {
    nodeUrl: string
    signerProvider: SignerProviderType
}

function getConfig(name: string): EnvironmentConfig {
    const environments: Map<string, EnvironmentConfig> = AlephiumConfigs.environments
    // @ts-ignore
    return environments[name]
}

interface AlephiumWeb3ProviderProps {
    children: React.ReactNode
}

const AlephiumWeb3Provider = ({ children }: AlephiumWeb3ProviderProps) => {
    const [state, dispatch] = useReducer(reducer, initialState)

    useEffect(() => {
        loadProvider()
    }, [])

    async function loadProvider() {
        const env = process.env.ENVIRONMENT || "development-nodewallet"
        const config = getConfig(env)
        const nodeProvider = new NodeProvider(config.nodeUrl)
        dispatch({
            type: 'SET_NODE_PROVIDER',
            nodeProvider
        })

        switch (config.signerProvider.type) {
            case 'NodeWalletProvider': {
                const wallet = new NodeWallet(nodeProvider, config.signerProvider.walletName)
                wallet.unlock(config.signerProvider.password)
                const accounts = await wallet.getAccounts()
                dispatch({
                    type: 'SET_ACCOUNTS',
                    accounts: accounts
                })

                dispatch({
                    type: 'SET_SIGNER_PROVIDER',
                    signerProvider: {
                        provider: wallet,
                        type: 'NodeWalletProvider'
                    }
                })

                return
            }

            case 'WalletConnectProvider': {
                const provider = await getWalletConnectProvider(
                    config.signerProvider.projectId,
                    config.signerProvider.relayUrl,
                    config.signerProvider.metadata,
                    dispatch
                )


                dispatch({
                    type: 'SET_SIGNER_PROVIDER',
                    signerProvider: {
                        provider,
                        type: 'WalletConnectProvider'
                    }
                })

                provider.connect()

                return
            }

            case 'BrowserExtensionProvider': {
                dispatch({
                    type: 'SET_SIGNER_PROVIDER_FUNC',
                    func: (provider: SignerProvider) => {
                        dispatch({
                            type: 'SET_SIGNER_PROVIDER',
                            signerProvider: {
                                provider,
                                type: 'BrowserExtensionProvider'
                            }
                        })
                    }
                })

                dispatch({
                    type: 'SET_ACCOUNTS_FUNC',
                    func: (accounts: Account[]) => {
                        dispatch({
                            type: 'SET_ACCOUNTS',
                            accounts: accounts
                        })
                    }
                })

                const windowAlephium = await connect({ showList: false })

                if (windowAlephium) {
                    await windowAlephium.enable()
                    const accounts = await windowAlephium.getAccounts()

                    dispatch({
                        type: 'SET_ACCOUNTS',
                        accounts: accounts
                    })
                }

                dispatch({
                    type: 'SET_SIGNER_PROVIDER',
                    signerProvider: {
                        provider: windowAlephium,
                        type: 'BrowserExtensionProvider'
                    }
                })

                return
            }
        }
    }

    return (
        <AlephiumWeb3Context.Provider
            value={{
                accounts: state.accounts,
                signerProvider: state.signerProvider,
                nodeProvider: state.nodeProvider,
                setSignerProviderFunc: state.setSignerProviderFunc,
                setAccountsFunc: state.setAccountsFunc
            }}
        >
            {children}
        </AlephiumWeb3Context.Provider>
    )
}

export async function getWalletConnectProvider(
    projectId: string,
    relayUrl: string,
    metadata: AppMetadata,
    dispatch: Dispatch<ActionType>
): Promise<WalletConnectProvider> {

    // Sometimes initialization takes a long time or doesn't return
    console.log('Initializaing WalletConnectClient')
    const walletConnect = await WalletConnectClient.init({
        projectId: projectId,
        relayUrl: relayUrl,
        metadata: metadata
    })
    console.log('WalletConnectClient initialized')

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

    walletConnect.on(CLIENT_EVENTS.session.sync, (e: any) => {
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

export default AlephiumWeb3Provider