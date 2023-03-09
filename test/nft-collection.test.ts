import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress, ContractState } from '@alephium/web3'
import * as utils from '../utils'
import { NFTCollection } from '../utils/nft-collection'
import { testAddress1, testWallet1 } from './signers'
import { fetchNFTCollectionState, fetchNFTState } from '../utils/contracts'

describe('nft collection', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl)
  const provider = web3.getCurrentNodeProvider()

  it('should test nft open collection', async () => {
    const signer = await testWallet1()
    const nftCollection = new NFTCollection(provider, signer)
    await nftCollection.buildProject()

    const totalSupply = 3n
    const nftCollectionDeployTx = await nftCollection.createOpenCollection("CryptoPunk", "CP", totalSupply)
    const nftCollectionContractId = nftCollectionDeployTx.contractId

    const mintNFT = (tokenIndex: bigint) => {
      return nftCollection.mintOpenNFT(
        nftCollectionContractId,
        getNftUri(tokenIndex)
      )
    }
    // First 3 NFTs should be ok
    await mintAndVerify(nftCollection, nftCollectionContractId, 0n, mintNFT)
    await mintAndVerify(nftCollection, nftCollectionContractId, 1n, mintNFT)
    await mintAndVerify(nftCollection, nftCollectionContractId, 2n, mintNFT)

    // The 4th should *not* be ok
    await expect(nftCollection.mintOpenNFT(
      nftCollectionContractId,
      getNftUri(3n)
    )).rejects.toThrow(Error)
  }, 60000)

  //  it('should test nft pre designed collection', async () => {
  //    const signer = await testWallet1()
  //    const nftCollection = new NFTCollection(provider, signer)
  //    await nftCollection.buildProject()
  //
  //    const totalSupply = 3n
  //    const nftCollectionDeployTx = await nftCollection.createPreDesignedCollection(
  //      "CryptoPunk",
  //      "CP",
  //      "https://cryptopunks.app/cryptopunks/details/",
  //      totalSupply
  //    )
  //    const nftCollectionContractId = nftCollectionDeployTx.contractId
  //
  //    const mintNFT = (tokenIndex: bigint) => {
  //      return nftCollection.mintPreDesignedNFT(
  //        nftCollectionContractId,
  //        tokenIndex
  //      )
  //    }
  //
  //    // First 3 NFTs should be ok
  //    await mintAndVerify(nftCollection, nftCollectionContractId, 0n, mintNFT)
  //    await mintAndVerify(nftCollection, nftCollectionContractId, 1n, mintNFT)
  //    await mintAndVerify(nftCollection, nftCollectionContractId, 2n, mintNFT)
  //
  //    // The 4th should *not* be ok
  //    await expect(nftCollection.mintPreDesignedNFT(nftCollectionContractId, 3n)).rejects.toThrow(Error)
  //  }, 60000)
})

async function mintAndVerify(
  nftCollection: NFTCollection,
  nftCollectionContractId: string,
  tokenIndex: bigint,
  mintNFT: (tokenIndex: bigint) => Promise<any>
) {
  const nftUri = getNftUri(tokenIndex)
  const nftCollectionContractAddress = addressFromContractId(nftCollectionContractId)

  const nftCollectionContractState = await fetchNFTCollectionState(nftCollectionContractAddress)
  expect(nftCollectionContractState.fields.currentTokenIndex).toEqual(tokenIndex)

  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(nftCollectionContractId, binToHex(encodeU256(tokenIndex)), group)

  await mintNFT(tokenIndex)

  const nftCollectionContractEvents = await web3.getCurrentNodeProvider().events.getEventsContractContractaddress(
    nftCollectionContractAddress, { start: Number(tokenIndex) }
  )

  expect(nftCollectionContractEvents.events.length).toEqual(1)

  const nftMintedEventFields = nftCollectionContractEvents.events[0].fields
  // Minter address
  expect(nftMintedEventFields[0].value).toEqual(testAddress1)
  // NFT token index
  expect(nftMintedEventFields[1].value).toEqual(tokenIndex.toString())

  const nftContractState = await fetchNFTState(addressFromContractId(nftContractId))
  expect(nftContractState.fields.owner).toEqual(testAddress1)
  expect(nftContractState.fields.isTokenWithdrawn).toEqual(true)
  utils.checkHexString(nftContractState.fields.uri, nftUri)
  expect(nftContractState.fields.collectionId).toEqual(nftCollectionContractId)
  expect(nftContractState.fields.tokenIndex).toEqual(tokenIndex)

  await burnAndVerify(nftCollection, nftCollectionContractId, tokenIndex, nftContractState)
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

const nftBaseUri = "https://cryptopunks.app/cryptopunks/details/"
function getNftUri(tokenIndex: bigint): string {
  return `${nftBaseUri}${tokenIndex}`
}
