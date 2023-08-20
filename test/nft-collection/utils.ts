import { web3, addressFromContractId, SignerProvider, Contract, ContractFactory, ContractEvent } from "@alephium/web3"
import { NFTCollectionHelper } from "../../shared/nft-collection"

export const nftBaseUri = "https://cryptopunks.app/cryptopunks/details/"
export function getNFTUri(tokenIndex: bigint): string {
  return `${nftBaseUri}${tokenIndex}`
}

export async function checkWithdraw(
  nftCollection: NFTCollectionHelper,
  collectionId: string,
  to: string,
  withdrawAmount: bigint,
  royalty: boolean
) {
  const collectionAddress = addressFromContractId(collectionId)
  const balanceBefore = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(collectionAddress)
  await nftCollection.publicSaleCollection.random.withdraw(to, withdrawAmount, collectionId, royalty)
  const balanceAfter = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(collectionAddress)
  expect(BigInt(balanceAfter.balance)).toEqual(BigInt(balanceBefore.balance) - withdrawAmount)
}

export async function getNFTCollection(signer: SignerProvider) {
  const nftCollection = new NFTCollectionHelper(signer)
  nftCollection.buildProject()
  return nftCollection
}

export async function checkEvent<C extends ContractFactory<any>>(
  factory: C,
  txId: string,
  expected: Partial<ContractEvent>
) {
  const nodeProvider = web3.getCurrentNodeProvider()
  const result = await nodeProvider.events.getEventsTxIdTxid(txId)
  const events = result.events.filter((e) => e.eventIndex !== Contract.ContractCreatedEventIndex)
  expect(events.length).toEqual(1)
  const parsedEvent = Contract.fromApiEvent(events[0], factory.contract.codeHash, txId)
  expect(parsedEvent.txId).toEqual(expected.txId)
  expect(parsedEvent.contractAddress).toEqual(expected.contractAddress)
  expect(parsedEvent.eventIndex).toEqual(expected.eventIndex)
  expect(parsedEvent.name).toEqual(expected.name)
  expect(parsedEvent.fields).toEqual(expected.fields)
}
