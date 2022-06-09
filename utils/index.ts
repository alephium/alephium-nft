import * as web3 from 'alephium-web3'
import { blake2b } from 'blakejs'

export function subContractId(parentContractId: string, pathInHex: string): string {
  const data = Buffer.concat([
    web3.hexToBinUnsafe(parentContractId),
    web3.hexToBinUnsafe(pathInHex),
  ])

  return web3.binToHex(
    blake2b(blake2b(data, undefined, 32), undefined, 32)
  )
}

export function addressFromContractId(contractId: string): string {
  const addressType = Buffer.from([0x03])
  const hash = Buffer.from(web3.hexToBinUnsafe(contractId))
  const bytes = Buffer.concat([addressType, hash])
  return web3.bs58.encode(bytes)
}

export function hexToString(str: any): string {
  return Buffer.from(str.toString(), 'hex').toString()
}
