import { web3, NodeProvider, Address } from '@alephium/web3'
import { NodeWallet } from '@alephium/web3-wallet'
import { Account } from '@alephium/web3'
import { WalletConnectProvider, QRCodeModal, ProjectMetaData, ChainGroup, NetworkId } from '@alephium/walletconnect-provider'
import React, { Dispatch, useEffect, useReducer } from 'react'
// @ts-ignore
import AlephiumConfigs from '../configs/alephium-configs'
import { connect, AlephiumWindowObject } from "@alephium/get-extension-wallet"

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
    provider?: AlephiumWindowObject
  }

type SetSignerProviderFunc = (provider: AlephiumWindowObject) => void
type SetSelectedAddressFunc = (address: Address) => void
type StateType = {
  signerProvider?: SignerProvider
  nodeProvider?: NodeProvider
  selectedAddress?: Address,
  setSignerProviderFunc?: SetSignerProviderFunc
  setSelectedAddressFunc?: SetSelectedAddressFunc
}

type ActionType =
  | {
    type: 'SET_SELECTED_ADDRESS'
    selectedAddress: StateType['selectedAddress']
  }
  | {
    type: 'SET_SIGNER_PROVIDER'
    signerProvider: StateType['signerProvider']
  }
  | {
    type: 'SET_SIGNER_PROVIDER_FUNC'
    func: StateType['setSignerProviderFunc']
  }
  | {
    type: 'SET_SELECTED_ADDRESS_FUNC'
    func: StateType['setSelectedAddressFunc']
  }
  | {
    type: 'DISCONNECT'
  }

const initialState: StateType = {
  signerProvider: undefined,
  selectedAddress: undefined,
  setSignerProviderFunc: undefined,
  setSelectedAddressFunc: undefined
}

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case 'SET_SELECTED_ADDRESS':
      return {
        ...state,
        selectedAddress: action.selectedAddress
      }

    case 'SET_SIGNER_PROVIDER':
      return {
        ...state,
        signerProvider: action.signerProvider,
        nodeProvider: action.signerProvider?.provider?.nodeProvider
      }

    case 'DISCONNECT':
      return initialState

    case 'SET_SIGNER_PROVIDER_FUNC':
      return {
        ...state,
        setSignerProviderFunc: action.func
      }

    case 'SET_SELECTED_ADDRESS_FUNC':
      return {
        ...state,
        setSelectedAddressFunc: action.func
      }

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
type WalletConnectProviderType = {
  type: 'WalletConnectProvider'
  projectId: string
  relayUrl: string
  metadata: ProjectMetaData,
  networkId: NetworkId
  chainGroup: ChainGroup
}
type BrowserExtensionProviderType = {
  type: 'BrowserExtensionProvider'
}
type SignerProviderType = NodeWalletProviderType | WalletConnectProviderType | BrowserExtensionProviderType

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
          type: 'SET_SELECTED_ADDRESS',
          selectedAddress: accounts[0].address
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
          config.signerProvider,
          dispatch
        )

        dispatch({
          type: 'SET_SIGNER_PROVIDER',
          signerProvider: {
            provider,
            type: 'WalletConnectProvider'
          }
        })

        await provider.connect()
        QRCodeModal.close()

        return
      }

      case 'BrowserExtensionProvider': {
        dispatch({
          type: 'SET_SIGNER_PROVIDER_FUNC',
          func: (provider: AlephiumWindowObject) => {
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
          type: 'SET_SELECTED_ADDRESS_FUNC',
          func: (address: Address) => {
            dispatch({
              type: 'SET_SELECTED_ADDRESS',
              selectedAddress: address
            })
          }
        })

        const windowAlephium = await connect({ showList: false })
        if (windowAlephium) {
          const selectedAddress = await windowAlephium.enable()

          dispatch({
            type: 'SET_SIGNER_PROVIDER',
            signerProvider: {
              provider: windowAlephium,
              type: 'BrowserExtensionProvider'
            }
          })

          dispatch({
            type: 'SET_SELECTED_ADDRESS',
            selectedAddress: selectedAddress
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
        selectedAddress: state.selectedAddress,
        signerProvider: state.signerProvider,
        nodeProvider: state.nodeProvider,
        setSignerProviderFunc: state.setSignerProviderFunc,
        setSelectedAddressFunc: state.setSelectedAddressFunc
      }}
    >
      {children}
    </AlephiumWeb3Context.Provider>
  )
}

export async function getWalletConnectProvider(
  options: WalletConnectProviderType,
  dispatch: Dispatch<ActionType>
): Promise<WalletConnectProvider> {
  const provider = await WalletConnectProvider.init({
    networkId: options.networkId,
    chainGroup: options.chainGroup,

    projectId: options.projectId,
    logger: "info",
    relayUrl: options.relayUrl,
    metadata: options.metadata
  })

  provider.on('displayUri', (uri: string) => {
    if (uri) {
      QRCodeModal.open(uri, () => {
        console.log("EVENT", "QR Code Modal closed");
      })
    }
  });

  provider.on('accountChanged', (account: Account) => {
    dispatch({
      type: 'SET_SELECTED_ADDRESS',
      selectedAddress: account.address
    })
    console.log('accounts changed', account)
  })

  provider.on('session_delete', () => {
    dispatch({
      type: 'DISCONNECT'
    })
    console.log('session_deleted')
  })

  return provider
}

export default AlephiumWeb3Provider
