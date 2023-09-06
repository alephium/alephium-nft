import { web3, hexToString, ExplorerProvider } from '@alephium/web3'
import { addressFromContractId, binToHex, contractIdFromAddress, NodeProvider, node } from '@alephium/web3'
import * as base58 from 'bs58'
import { randomBytes } from 'crypto'
import { getAlephiumNFTConfig } from './configs'

export function checkHexString(value: any, expected: string) {
  expect(hexToString(value)).toEqual(expected)
}

export function relativeDiff(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(a, b)
}

export function randomContractId(): string {
  return binToHex(contractIdFromAddress(randomContractAddress()))
}

export function randomContractAddress(): string {
  const prefix = Buffer.from([0x03])
  const bytes = Buffer.concat([prefix, randomBytes(32)])
  return base58.encode(bytes)
}

function isConfirmed(txStatus: node.TxStatus): txStatus is node.Confirmed {
  return txStatus.type === 'Confirmed'
}

export function getNodeProvider(): NodeProvider {
  const nodeUrl = process.env.NODE_URL || getAlephiumNFTConfig().defaultNodeUrl
  return web3.getCurrentNodeProvider() ?? new NodeProvider(nodeUrl)
}

export function getExplorerProvider(): ExplorerProvider {
  const explorerUrl = process.env.EXPLORER_URL || getAlephiumNFTConfig().defaultExplorerUrl
  return web3.getCurrentExplorerProvider() ?? new ExplorerProvider(explorerUrl)
}

export async function waitTxConfirmed(
  provider: NodeProvider,
  txId: string
): Promise<node.Confirmed> {
  const status = await provider.transactions.getTransactionsStatus({ txId: txId })
  if (isConfirmed(status)) {
    return status
  }
  await new Promise((r) => setTimeout(r, 5000))
  return waitTxConfirmed(provider, txId)
}

export const maxU256 = (1n << 256n) - 1n

export async function contractExists(contractId: string, provider: NodeProvider): Promise<boolean> {
  const address = addressFromContractId(contractId)
  return provider
    .addresses
    .getAddressesAddressGroup(address)
    .then(_ => true)
    .catch((e: any) => {
      if (e instanceof Error && e.message.indexOf("Group not found") !== -1) {
        return false
      }
      throw e
    })
}
