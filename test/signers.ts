import { NodeProvider, NodeWallet } from '@alephium/web3'

export const testAddress1 = '1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH'
export async function testWallet1(provider: NodeProvider): Promise<NodeWallet> {
  return await testWallet(provider, 'alephium-web3-test-only-wallet')
}

export const testAddress2 = '19PEu7VJMqbZDLtY8Jk9LNpwx5juUiC1WdFwo9QsPyX6y'
export async function testWallet2(provider: NodeProvider): Promise<NodeWallet> {
  return await testWallet(provider, 'alephium-web3-test-only-wallet-2')
}

async function testWallet(provider: NodeProvider, name: string): Promise<NodeWallet> {
  const wallet = new NodeWallet(provider, name)
  await wallet.unlock('alph')
  return wallet
}
