import * as web3 from '@alephium/web3'
import { binToHex, contractIdFromAddress } from '@alephium/web3'
import * as base58 from 'bs58'
import { randomBytes } from 'crypto'

export function checkHexString(value: any, expected: string) {
  expect(web3.hexToString(value)).toEqual(expected)
}

export async function verifyContractState(
  provider: web3.NodeProvider,
  contractAddress: string,
  verify: (state: web3.node.ContractState) => any
): Promise<any> {
  const state = await provider.contracts.getContractsAddressState(
    contractAddress, { group: 0 }
  )

  verify(state)
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
