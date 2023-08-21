import { web3, subContractId, binToHex, encodeU256, addressFromContractId, sleep, ONE_ALPH, NodeProvider } from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { getSigners } from '@alephium/web3-test'
import { NFTCollectionHelper } from '../../shared/nft-collection'
import { NFTMarketplace } from '../../shared/nft-marketplace'
import { NFTListingInstance, NFTMarketPlaceInstance } from '../../artifacts/ts'
import { contractExists } from '../../shared'
import { Balance } from '@alephium/web3/dist/src/api/api-alephium'

describe('nft marketplace', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl)
  const provider = web3.getCurrentNodeProvider()

  test('Test NFT marketplace', async () => {
    const [signer1, signer2] = await getSigners(2, ONE_ALPH * 1000n, 0)
    const nftCollection = new NFTCollectionHelper(signer1)
    const tokenId1 = await createOpenNFT(nftCollection, false)
    await testMarketplace(tokenId1, signer1, signer2, provider)

    const tokenId2 = await createOpenNFT(nftCollection, true)
    await testMarketplace(tokenId2, signer1, signer2, provider)
  }, 300000)

  test('Update metadata in the NFT marketplace', async () => {
    const [signer1, signer2] = await getSigners(2, ONE_ALPH * 1000n, 0)
    const nftMarketplace = new NFTMarketplace(signer1)
    await nftMarketplace.buildProject()

    const nftMarketplaceDeployTx = await nftMarketplace.create()
    const nftMarketplaceContractId = nftMarketplaceDeployTx.contractInstance.contractId

    // Update listing price
    await checkListingFee(
      nftMarketplace,
      nftMarketplaceContractId
    )(ONE_ALPH / 10n, ONE_ALPH / 5n, ONE_ALPH / 5n)

    // Update Commission Rate
    await checkCommissionRate(
      nftMarketplace,
      nftMarketplaceContractId
    )(200, 250, 250)

    // Update Admin
    await checkUpdateAdmin(
      nftMarketplace,
      nftMarketplaceContractId
    )(signer1.address, signer2.address, signer2.address)

    // Update with the wrong admin will fail
    await expect(
      nftMarketplace.updateListingFee(BigInt(10), nftMarketplaceContractId)
    ).rejects.toThrow(Error)

    await expect(
      nftMarketplace.updateCommissionRate(BigInt(200), nftMarketplaceContractId)
    ).rejects.toThrow(Error)

    await expect(
      nftMarketplace.updateAdmin(signer1.address, nftMarketplaceContractId)
    ).rejects.toThrow(Error)

    await expect(
      nftMarketplace.withdrawFromMarketPlace(signer1.address, ONE_ALPH / 10n, nftMarketplaceContractId)
    ).rejects.toThrow(Error)
  }, 30000)

})

const royaltyRate: bigint = 200n

async function testMarketplace(
  tokenId: string,
  signer1: PrivateKeyWallet,
  signer2: PrivateKeyWallet,
  provider: NodeProvider
) {
  const nftMarketplace = new NFTMarketplace(signer1)
  await nftMarketplace.buildProject()
  await nftMarketplace.create()

  const price = ONE_ALPH * 10n
  const newPrice = ONE_ALPH * 20n
  await listNFTAndVerify(nftMarketplace, tokenId, price, signer1, provider)
  await updateListingPriceAndVerify(nftMarketplace, tokenId, price, newPrice, signer2, provider)
  await buyNFTAndVerify(nftMarketplace, tokenId, newPrice, signer1, signer2, provider)
  await cancelListingAndVerify(nftMarketplace, tokenId, newPrice, signer2, provider)
  await withdrawAndVerify(nftMarketplace, signer2.address, NFTMarketplace.defaultListingFee)

}

async function createOpenNFT(
  nftCollection: NFTCollectionHelper,
  royalty: boolean
): Promise<string> {
  let nftCollectionContractId: string
  if (royalty) {
    const nftCollectionDeployTx = await nftCollection.openCollection.createWithRoyalty("https://crypto-punk-uri", royaltyRate)
    nftCollectionContractId = nftCollectionDeployTx.contractInstance.contractId
  } else {
    const nftCollectionDeployTx = await nftCollection.openCollection.create("https://crypto-punk-uri")
    nftCollectionContractId = nftCollectionDeployTx.contractInstance.contractId
  }

  const nftUri = "https://cryptopunks.app/cryptopunks/details/1"
  const nftContractId = subContractId(nftCollectionContractId, binToHex(encodeU256(0n)), 0)
  await nftCollection.openCollection.mint(
    nftCollectionContractId,
    nftUri,
    royalty
  )

  return nftContractId
}

async function listNFTAndVerify(
  nftMarketplace: NFTMarketplace,
  tokenId: string,
  price: bigint,
  signer: PrivateKeyWallet,
  provider: NodeProvider
) {
  const nftMarketplaceContractId = nftMarketplace.contractId!
  const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
  const nftListingContractId = subContractId(nftMarketplaceContractId, tokenId, 0)
  const nftListingContractAddress = addressFromContractId(nftListingContractId)

  await nftMarketplace.listNFT(tokenId, price, nftMarketplaceContractId)
  await sleep(3000)

  const nftMarketplaceContractEvents = await provider.events.getEventsContractContractaddress(
    nftMarketplaceContractAddress,
    { start: 0, group: 0 }
  )
  expect(nftMarketplaceContractEvents.events.length).toEqual(1)

  const nftListedEventFields = nftMarketplaceContractEvents.events[0].fields
  expect(BigInt(+nftListedEventFields[0].value)).toEqual(price)
  expect(nftListedEventFields[1].value).toEqual(tokenId)
  expect(nftListedEventFields[2].value).toEqual(signer.address)

  // Check the initial state for NFT listing
  const nftListingContractState = await new NFTListingInstance(nftListingContractAddress).fetchState()
  expect(nftListingContractState.fields.price).toEqual(price)
  expect(nftListingContractState.fields.tokenId).toEqual(tokenId)
  expect(nftListingContractState.fields.tokenOwner).toEqual(signer.address)
  expect(nftListingContractState.fields.marketContractId).toEqual(nftMarketplaceContractId)
}

async function updateListingPriceAndVerify(
  nftMarketplace: NFTMarketplace,
  tokenId: string,
  oldPrice: bigint,
  newPrice: bigint,
  wrongSigner: PrivateKeyWallet,
  provider: NodeProvider
) {
  const nftMarketplaceContractId = nftMarketplace.contractId!
  const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
  await nftMarketplace.updateNFTPrice(newPrice, tokenId, nftMarketplaceContractId)
  const nftListingContractId = subContractId(nftMarketplaceContractId, tokenId, 0)
  const nftListingContractAddress = addressFromContractId(nftListingContractId)

  const nftListingContractState = await new NFTListingInstance(nftListingContractAddress).fetchState()
  expect(nftListingContractState.fields.price).toEqual(newPrice)

  const nftMarketplaceContractEvents = await provider.events.getEventsContractContractaddress(
    nftMarketplaceContractAddress,
    { start: 1, group: 0 }
  )
  expect(nftMarketplaceContractEvents.events.length).toEqual(1)

  const nftPriceUpdatedEventFields = nftMarketplaceContractEvents.events[0].fields
  expect(nftPriceUpdatedEventFields[0].value).toEqual(tokenId)
  expect(BigInt(+nftPriceUpdatedEventFields[1].value)).toEqual(oldPrice)
  expect(BigInt(+nftPriceUpdatedEventFields[2].value)).toEqual(newPrice)

  await expect(nftMarketplace.updateNFTPrice(newPrice, tokenId, nftMarketplaceContractId, wrongSigner)).rejects.toThrow(Error)
}

async function buyNFTAndVerify(
  nftMarketplace: NFTMarketplace,
  tokenId: string,
  price: bigint,
  signer1: PrivateKeyWallet,
  signer2: PrivateKeyWallet,
  provider: NodeProvider
) {
  const nftMarketplaceContractId = nftMarketplace.contractId!
  const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
  const nftListingContractId = subContractId(nftMarketplaceContractId, tokenId, 0)

  const signer1BalanceBefore = await getBalance(signer1)
  const signer2BalanceBefore = await getBalance(signer2)
  const result = await nftMarketplace.buyNFT(price, tokenId, nftMarketplaceContractId, signer2)
  const consumedGas = BigInt(result.gasAmount) * BigInt(result.gasPrice)
  await sleep(3000)

  const nftMarketplaceContractEvents = await provider.events.getEventsContractContractaddress(
    nftMarketplaceContractAddress,
    { start: 2, group: 0 }
  )
  expect(nftMarketplaceContractEvents.events.length).toEqual(1)

  const nftSoldEventFields = nftMarketplaceContractEvents.events[0].fields
  expect(BigInt(+nftSoldEventFields[0].value)).toEqual(price)
  expect(nftSoldEventFields[1].value).toEqual(tokenId)
  expect(nftSoldEventFields[2].value).toEqual(signer1.address)
  expect(nftSoldEventFields[3].value).toEqual(signer2.address)

  // Check the balance of signer1
  const signer1BalanceAfter = await getBalance(signer1)
  const netPrice = priceAfterFee(price, NFTMarketplace.defaultCommissionRate, NFTMarketplace.defaultListingFee)
  expect(BigInt(signer1BalanceAfter.balance)).toEqual(BigInt(signer1BalanceBefore.balance) + netPrice + ONE_ALPH) // Extra ONE_ALPH is the listing contract deposit

  // Check the balance of signer2
  const signer2BalanceAfter = await getBalance(signer2)
  expect(BigInt(signer2BalanceAfter.balance)).toEqual(BigInt(signer2BalanceBefore.balance) - price - consumedGas)

  const listingExists = await contractExists(nftListingContractId, provider)
  expect(listingExists).toBeFalsy()
}

async function cancelListingAndVerify(
  nftMarketplace: NFTMarketplace,
  tokenId: string,
  price: bigint,
  signer: PrivateKeyWallet,
  provider: NodeProvider
) {
  const nftMarketplaceContractId = nftMarketplace.contractId!
  const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)

  await nftMarketplace.listNFT(tokenId, price, nftMarketplaceContractId, signer)

  const nftMarketplaceContractEvents = await provider.events.getEventsContractContractaddress(
    nftMarketplaceContractAddress,
    { start: 3, group: 0 }
  )

  expect(nftMarketplaceContractEvents.events.length).toEqual(1)

  const nftListedEventFields = nftMarketplaceContractEvents.events[0].fields
  const nftListingContractId = nftListedEventFields[3].value.toString()
  const nftListingContractAddress = addressFromContractId(nftListingContractId)

  const nftListingContractState = await new NFTListingInstance(nftListingContractAddress).fetchState()
  expect(nftListingContractState.fields.tokenOwner).toEqual(signer.address)

  await nftMarketplace.cancelNFTListing(tokenId, nftMarketplaceContractId, signer)

  // NFTListing doesn't exist any more
  await expect(new NFTListingInstance(nftListingContractAddress).fetchState()).rejects.toThrow(Error)
}

function checkListingFee(
  nftMarketplace: NFTMarketplace,
  nftMarketplaceContractId: string,
) {
  const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
  return async (previousValue: bigint, updateValue: bigint, updatedValue: bigint) => {
    const stateBefore = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
    expect(stateBefore.fields.listingFee).toEqual(previousValue)

    await nftMarketplace.updateListingFee(updateValue, nftMarketplaceContractId)

    const stateAfter = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
    expect(stateAfter.fields.listingFee).toEqual(updatedValue)
  }
}

function checkCommissionRate(
  nftMarketplace: NFTMarketplace,
  nftMarketplaceContractId: string,
) {
  const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
  return async (previousValue: number, updateValue: number, updatedValue: number) => {
    const stateBefore = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
    expect(stateBefore.fields.commissionRate).toEqual(BigInt(previousValue))

    await nftMarketplace.updateCommissionRate(BigInt(updateValue), nftMarketplaceContractId)

    const stateAfter = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
    expect(stateAfter.fields.commissionRate).toEqual(BigInt(updatedValue))
  }
}

function checkUpdateAdmin(
  nftMarketplace: NFTMarketplace,
  nftMarketplaceContractId: string,
) {
  const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
  return async (previousValue: string, updateValue: string, updatedValue: string) => {
    const stateBefore = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
    expect(stateBefore.fields.admin).toEqual(previousValue)

    await nftMarketplace.updateAdmin(updateValue, nftMarketplaceContractId)

    const stateAfter = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
    expect(stateAfter.fields.admin).toEqual(updatedValue)
  }
}

async function withdrawAndVerify(
  nftMarketplace: NFTMarketplace,
  to: string,
  withdrawAmount: bigint
) {
  const nftMarketplaceContractId = nftMarketplace.contractId!
  const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
  const balanceBefore = await nftMarketplace.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftMarketplaceContractAddress)
  await nftMarketplace.withdrawFromMarketPlace(to, withdrawAmount, nftMarketplaceContractId)
  const balanceAfter = await nftMarketplace.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftMarketplaceContractAddress)
  expect(BigInt(balanceAfter.balance)).toEqual(BigInt(balanceBefore.balance) - withdrawAmount)
}

function getBalance(signer: PrivateKeyWallet): Promise<Balance> {
  return signer.nodeProvider!.addresses.getAddressesAddressBalance(signer.address)
}

function priceAfterFee(price: bigint, commission: bigint, listingFee: bigint) {
  return (price - (price * commission) / 10000n) - listingFee
}
