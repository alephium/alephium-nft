import { NodeProvider } from 'alephium-web3'

const localProvider = new NodeProvider('http://127.0.0.1:22973')
// Other providers

export const provider = localProvider