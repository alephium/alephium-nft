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
