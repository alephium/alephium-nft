import { web3, NodeProvider, Address, Account } from '@alephium/web3'
import { NodeWallet } from '@alephium/web3-wallet'
import React, { useEffect, useReducer } from 'react'
// @ts-ignore
import AlephiumConfigs from '../configs/alephium-configs'
import { connect, AlephiumWindowObject } from "@alephium/get-extension-wallet"
import { NETWORK } from '../configs/addresses'

type SignerProvider =
  | {
    type: 'NodeWalletProvider',
    provider: NodeWallet
  }
  | {
    type: 'BrowserExtensionProvider',
    provider?: AlephiumWindowObject
  }

type SetSignerProviderFunc = (provider: AlephiumWindowObject) => void
type SetSelectedAccountFunc = (account?: Account) => void
type StateType = {
  signerProvider?: SignerProvider
  nodeProvider?: NodeProvider
  selectedAccount?: Account,
  setSignerProviderFunc?: SetSignerProviderFunc
  setSelectedAccountFunc?: SetSelectedAccountFunc
  disconnectFunc?: () => void
}

type ActionType =
  | {
    type: 'SET_SELECTED_ACCOUNT'
    selectedAccount: StateType['selectedAccount']
  }
  | {
    type: 'SET_SIGNER_PROVIDER'
    signerProvider: StateType['signerProvider']
  }
  | {
    type: 'DISCONNECT'
  }

const initialState: StateType = {
  signerProvider: undefined,
  selectedAccount: undefined,
  setSignerProviderFunc: undefined,
  setSelectedAccountFunc: undefined
}

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case 'SET_SELECTED_ACCOUNT':
      return {
        ...state,
        selectedAccount: action.selectedAccount
      }

    case 'SET_SIGNER_PROVIDER':
      return {
        ...state,
        signerProvider: action.signerProvider,
        nodeProvider: action.signerProvider?.provider?.nodeProvider
      }

    case 'DISCONNECT':
      return initialState

    default:
      throw new Error()
  }
}

export const AlephiumWeb3Context = React.createContext<StateType>(initialState)

type NodeWalletProviderType = {
  type: 'NodeWalletProvider'
  nodeUrl: string
  walletName: string
  password: string
}
type BrowserExtensionProviderType = {
  type: 'BrowserExtensionProvider'
}
type SignerProviderType = NodeWalletProviderType | BrowserExtensionProviderType

interface EnvironmentConfig {
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

    switch (config.signerProvider.type) {
      case 'NodeWalletProvider': {
        web3.setCurrentNodeProvider(config.signerProvider.nodeUrl)
        const wallet = new NodeWallet(config.signerProvider.walletName)
        wallet.unlock(config.signerProvider.password)
        const accounts = await wallet.getAccounts()

        dispatch({
          type: 'SET_SELECTED_ACCOUNT',
          selectedAccount: accounts[0]
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

      case 'BrowserExtensionProvider': {
        const windowAlephium = await connect({
          showList: false,
          include: ['alephium']
        })
        if (windowAlephium) {
          const selectedAccount = await windowAlephium.enable({
            networkId: NETWORK,
            onDisconnected: () => {
              return Promise.resolve(
                dispatch({
                  type: 'DISCONNECT'
                })
              )
            }
          })

          dispatch({
            type: 'SET_SIGNER_PROVIDER',
            signerProvider: {
              provider: windowAlephium,
              type: 'BrowserExtensionProvider'
            }
          })

          dispatch({
            type: 'SET_SELECTED_ACCOUNT',
            selectedAccount: selectedAccount
          })
        } else {
          dispatch({
            type: 'SET_SIGNER_PROVIDER',
            signerProvider: {
              provider: undefined,
              type: 'BrowserExtensionProvider'
            }
          })
        }

        return
      }
    }
  }

  return (
    <AlephiumWeb3Context.Provider
      value={{
        selectedAccount: state.selectedAccount,
        signerProvider: state.signerProvider,
        nodeProvider: state.nodeProvider,
        setSignerProviderFunc: (provider: AlephiumWindowObject) => {
          dispatch({
            type: 'SET_SIGNER_PROVIDER',
            signerProvider: {
              provider,
              type: 'BrowserExtensionProvider'
            }
          })
        },
        setSelectedAccountFunc: (account?: Account) => {
          dispatch({
            type: 'SET_SELECTED_ACCOUNT',
            selectedAccount: account
          })
        },
        disconnectFunc: () => {
          dispatch({
            type: 'DISCONNECT'
          })
        }
      }}
    >
      {children}
    </AlephiumWeb3Context.Provider>
  )
}

export default AlephiumWeb3Provider
