import * as web3 from '@alephium/web3'
import { addressFromContractId, binToHex, contractIdFromAddress, NodeProvider, node } from '@alephium/web3'
import * as base58 from 'bs58'
import { randomBytes } from 'crypto'
import { ONE_ALPH, prettifyNumber, prettifyNumberConfig } from '@alephium/web3';

export function checkHexString(value: any, expected: string) {
  expect(web3.hexToString(value)).toEqual(expected)
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

export const shortenName = (name: string) => (
  `${name.slice(0, 14)}...`
);

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

const prettifyConfig = {
  ...prettifyNumberConfig['ALPH'],
  maxDecimalPlaces: 2
}

export function formatAlphAmount(price: bigint): string | undefined {
  const priceStr = price.toString()
  if (priceStr.length > 30) {
    const result = (Number(price) / Number(ONE_ALPH * 1000000000000n)).toExponential(2)
    return result + 'T'
  }

  if (priceStr.length > 27) {
    return prettifyNumberWithUnit(price, 27, 'B')
  }
  if (priceStr.length > 24) {
    return prettifyNumberWithUnit(price, 24, 'M')
  }
  if (priceStr.length > 21) {
    return prettifyNumberWithUnit(price, 21, 'K')
  }
  return prettifyNumberWithUnit(price, 18, '')
}

function prettifyNumberWithUnit(number: bigint, decimals: number, unit: string): string | undefined {
  const prettifyAmount = prettifyNumber(number, decimals, prettifyConfig)
  if (prettifyAmount === undefined) return undefined
  return prettifyAmount + unit
}
