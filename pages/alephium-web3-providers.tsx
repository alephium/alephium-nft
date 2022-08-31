import { NodeProvider, NodeWallet } from '@alephium/web3'
import React, { useEffect, useReducer } from 'react'
import { Account } from '@alephium/web3'
// @ts-ignore
import AlephiumConfigs from '../configs/alephium-configs'
import { connect, IAlephiumWindowObject } from "@h0ngcha0/get-alephium"

type SignerProvider =
  | {
    type: 'NodeWalletProvider',
    provider: NodeWallet
  }
  | {
    type: 'BrowserExtensionProvider',
    provider: IAlephiumWindowObject | undefined
  }

type SetSignerProviderFunc = (provider: IAlephiumWindowObject) => void
type SetSelectedAccountFunc = (accounts: Account) => void
type StateType = {
  signerProvider?: SignerProvider
  nodeProvider?: NodeProvider
  selectedAccount?: Account,
  setSignerProviderFunc?: SetSignerProviderFunc
  setSelectedAccountFunc?: SetSelectedAccountFunc
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
    type: 'SET_NODE_PROVIDER'
    nodeProvider: StateType['nodeProvider']
  }
  | {
    type: 'SET_SIGNER_PROVIDER_FUNC'
    func: StateType['setSignerProviderFunc']
  }
  | {
    type: 'SET_SELECTED_ACCOUNT_FUNC'
    func: StateType['setSelectedAccountFunc']
  }
  | {
    type: 'DISCONNECT'
  }

const initialState: StateType = {
  signerProvider: undefined,
  nodeProvider: undefined,
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

    case 'SET_SELECTED_ACCOUNT_FUNC':
      return {
        ...state,
        setSelectedAccountFunc: action.func
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
        dispatch({
          type: 'SET_SIGNER_PROVIDER_FUNC',
          func: (provider: IAlephiumWindowObject) => {
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
          type: 'SET_SELECTED_ACCOUNT_FUNC',
          func: (account: Account) => {
            dispatch({
              type: 'SET_SELECTED_ACCOUNT',
              selectedAccount: account
            })
          }
        })

        const windowAlephium = await connect({ showList: false })

        if (windowAlephium) {
          await windowAlephium.enable()
          const accounts = await windowAlephium.getAccounts()

          windowAlephium.on("addressesChanged", (_data) => {
            dispatch({
              type: 'SET_SELECTED_ACCOUNT',
              selectedAccount: windowAlephium.selectedAccount
            })
          })

          dispatch({
            type: 'SET_SELECTED_ACCOUNT',
            selectedAccount: windowAlephium.selectedAccount
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
        selectedAccount: state.selectedAccount,
        signerProvider: state.signerProvider,
        nodeProvider: state.nodeProvider,
        setSignerProviderFunc: state.setSignerProviderFunc,
        setSelectedAccountFunc: state.setSelectedAccountFunc
      }}
    >
      {children}
    </AlephiumWeb3Context.Provider>
  )
}

export default AlephiumWeb3Provider