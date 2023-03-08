import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress, ContractState } from '@alephium/web3'
import * as utils from '../utils'
import { NFTCollection } from '../utils/nft-collection'
import { testAddress1, testWallet1 } from './signers'
import { fetchNFTCollectionState, fetchNFTState } from '../utils/contracts'

describe('nft collection', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl)
  const provider = web3.getCurrentNodeProvider()

  it('should test nft collection', async () => {
    const signer = await testWallet1()
    const nftCollection = new NFTCollection(provider, signer)
    await nftCollection.buildProject()

    const nftCollectionDeployTx = await nftCollection.create("CryptoPunk", "CP")
    const nftCollectionContractId = nftCollectionDeployTx.contractId

    // Mint 1st NFT
    const nft1Uri = "https://cryptopunks.app/cryptopunks/details/1"
    const nft1ContractState = await mintAndVerify(nftCollection, nftCollectionContractId, 0n, nft1Uri)
    // Burn and verify
    await burnAndVerify(nftCollection, nftCollectionContractId, 0n, nft1ContractState)

    // Mint 2nd NFT
    const nft2Uri = "https://cryptopunks.app/cryptopunks/details/1"
    const nft2ContractState = await mintAndVerify(nftCollection, nftCollectionContractId, 1n, nft2Uri)
    // Burn and verify
    await burnAndVerify(nftCollection, nftCollectionContractId, 1n, nft2ContractState)
  }, 60000)
})

async function mintAndVerify(
  nftCollection: NFTCollection,
  nftCollectionContractId: string,
  tokenIndex: bigint,
  nftUri: string,
) {
  const nftCollectionContractAddress = addressFromContractId(nftCollectionContractId)

  const nftCollectionContractState = await fetchNFTCollectionState(nftCollectionContractAddress)
  expect(nftCollectionContractState.fields.currentTokenIndex).toEqual(tokenIndex)

  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(nftCollectionContractId, binToHex(encodeU256(tokenIndex)), group)
  await nftCollection.mintNFT(
    nftCollectionContractId,
    nftUri
  )

  const nftCollectionContractEvents = await web3.getCurrentNodeProvider().events.getEventsContractContractaddress(
    nftCollectionContractAddress, { start: Number(tokenIndex) }
  )

  expect(nftCollectionContractEvents.events.length).toEqual(1)

  const nftMintedEventFields = nftCollectionContractEvents.events[0].fields
  // Minter address
  expect(nftMintedEventFields[0].value).toEqual(testAddress1)
  // NFT collection contract id
  expect(nftMintedEventFields[1].value).toEqual(nftCollectionContractId)
  // Info of the minted NFT
  expect(utils.checkHexString(nftMintedEventFields[2].value, nftUri))
  // NFT contract id
  expect(nftMintedEventFields[3].value).toEqual(nftContractId)
  // Current token index
  expect(nftMintedEventFields[4].value).toEqual(binToHex(encodeU256(tokenIndex)))

  const nftContractState = await fetchNFTState(addressFromContractId(nftContractId))
  expect(nftContractState.fields.owner).toEqual(testAddress1)
  expect(nftContractState.fields.isTokenWithdrawn).toEqual(true)
  utils.checkHexString(nftContractState.fields.uri, "https://cryptopunks.app/cryptopunks/details/1")
  expect(nftContractState.fields.collectionId).toEqual(nftCollectionContractId)
  expect(nftContractState.fields.tokenIndex).toEqual(tokenIndex)

  return nftContractState
}

async function burnAndVerify(
  nftCollection: NFTCollection,
  nftCollectionContractId: string,
  tokenIndex: bigint,
  nftContractState: ContractState
) {
  const provider = web3.getCurrentNodeProvider()
  // Deposit NFT since it is withdrawn automatically when minted
  await nftCollection.depositNFT(nftContractState.contractId)
  // Burn NFT
  const balanceBeforeBurning = await provider.addresses.getAddressesAddressBalance(testAddress1)

  const gasAmount = 20000
  const gasPrice = 1000000000 * 100
  const totalGas = gasAmount * gasPrice
  await nftCollection.burnNFT(
    subContractId(nftCollectionContractId, binToHex(encodeU256(tokenIndex)), 0),
    gasAmount,
    BigInt(gasPrice)
  )

  const alphAmountInNFT = +nftContractState.asset.alphAmount.toString()
  const balanceAfterBurning = await provider.addresses.getAddressesAddressBalance(testAddress1)
  const refundedFromNFT = +balanceAfterBurning.balance + totalGas - +balanceBeforeBurning.balance

  const relativeDiff = utils.relativeDiff(alphAmountInNFT, refundedFromNFT)
  expect(relativeDiff).toBeLessThan(0.001)
}