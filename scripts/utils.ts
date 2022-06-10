import * as web3 from 'alephium-web3'
import { blake2b } from 'blakejs'

export function hexToString(str: any): string {
  return Buffer.from(str.toString(), 'hex').toString()
}

export function checkHexString(value: any, expected: string) {
  expect(hexToString(value)).toEqual(expected)
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

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function relativeDiff(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(a, b)
}
