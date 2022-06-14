import * as web3 from '@alephium/web3'
import { blake2b } from 'blakejs'

export function hexToString(str: any): string {
  return Buffer.from(str.toString(), 'hex').toString()
}
