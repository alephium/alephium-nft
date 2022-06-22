import * as web3 from '@alephium/web3'

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
