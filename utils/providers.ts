import { NodeProvider } from '@alephium/web3'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes } from '@walletconnect/types'
import WalletConnectProvider from '@alephium/walletconnect-provider'
import QRCodeModal from "@walletconnect/qrcode-modal"
import { createContext } from 'vm'
import React, { useReducer } from 'react'

// Other providers
const localDevProvider = new NodeProvider('http://127.0.0.1:22973')
export const provider = localDevProvider
