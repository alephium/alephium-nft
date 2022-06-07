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

export function subContractId(parentContractId: string, pathInHex: string): string {
  const data = Buffer.concat([
    web3.hexToBinUnsafe(parentContractId),
    web3.hexToBinUnsafe(pathInHex),
  ])

  return web3.binToHex(
    blake2b(blake2b(data, undefined, 32), undefined, 32)
  )
}

export function relativeDiff(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(a, b)
}

// Use the addressFromContractId function in web3 when it is released
export function addressFromContractId(contractId: string): string {
  const addressType = Buffer.from([0x03])
  const hash = Buffer.from(web3.hexToBinUnsafe(contractId))
  const bytes = Buffer.concat([addressType, hash])
  return web3.bs58.encode(bytes)
}
