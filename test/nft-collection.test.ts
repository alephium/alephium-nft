import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress } from '@alephium/web3'
import * as utils from '../utils'
import { NFTCollection } from '../utils/nft-collection'
import { testAddress1, testWallet1 } from './signers'
import { fetchNFTOpenCollectionState, fetchNFTState } from '../utils/contracts'
import { NFTOpenCollectionInstance, NFTPreDesignedCollectionInstance } from '../artifacts/ts'

describe('nft collection', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl)

  it('should test minting nft in open collection', async () => {
    const nftCollection = await getNFTCollection()
    nftCollection.buildProject(false)

    const totalSupply = 3n
    const nftCollectionDeployTx = await nftCollection.createOpenCollection("CryptoPunk", "CP", totalSupply)
    const nftCollectionInstance = nftCollectionDeployTx.instance

    // First 3 NFTs should be ok
    await mintOpenNFTAndVerify(nftCollection, nftCollectionInstance, 0n)
    await mintOpenNFTAndVerify(nftCollection, nftCollectionInstance, 1n)
    await mintOpenNFTAndVerify(nftCollection, nftCollectionInstance, 2n)

    // The 4th should *not* be ok
    await expect(nftCollection.mintOpenNFT(
      nftCollectionInstance.contractId,
      getNFTUri(3n)
    )).rejects.toThrow(Error)
  }, 60000)

  it('should test minting nft in pre designed collection sequentially', async () => {
    await testPreDesignedNFT([0n, 1n, 2n])
  }, 60000)

  it('should test minting nft in pre designed collection randomly', async () => {
    await testPreDesignedNFT([2n, 1n, 0n])
  }, 60000)

  it('should test that nft in pre designed collection can not be minted twice', async () => {
    const nftCollection = await getNFTCollection()
    const nftCollectionDeployTx = await nftCollection.createPreDesignedCollection(
      "CryptoPunk",
      "CP",
      "https://cryptopunks.app/cryptopunks/details/",
      3n
    )

    const nftCollectionContractId = nftCollectionDeployTx.contractId
    await nftCollection.mintPreDesignedNFT(nftCollectionContractId, 1n)
    await expect(nftCollection.mintPreDesignedNFT(
      nftCollectionContractId,
      1n
    )).rejects.toThrow(Error)
  }, 60000)
})

async function mintOpenNFTAndVerify(
  nftCollection: NFTCollection,
  nftOpenCollectionInstance: NFTOpenCollectionInstance,
  tokenIndex: bigint
) {
  const nftCollectionContractAddress = addressFromContractId(nftOpenCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(
    nftOpenCollectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group
  )

  const nftCollectionContractState = await fetchNFTOpenCollectionState(nftCollectionContractAddress)
  expect(nftCollectionContractState.fields.currentTokenIndex).toEqual(tokenIndex)

  const { txId } = await nftCollection.mintOpenNFT(
    nftOpenCollectionInstance.contractId,
    getNFTUri(tokenIndex)
  )

  // NFT just minted
  const nftByIndexResult = await nftOpenCollectionInstance.callNftByIndexMethod({ args: { index: tokenIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)
  // NFT doesn't exist yet
  await expect(nftOpenCollectionInstance.callNftByIndexMethod({ args: { index: tokenIndex + 1n } })).rejects.toThrow(Error)

  await verifyMintEvent(nftCollectionContractAddress, tokenIndex, Number(tokenIndex))
  await verifyNFTState(nftContractId, tokenIndex)

  return txId
}

async function testPreDesignedNFT(tokenIndexes: bigint[]) {
  const nftCollection = await getNFTCollection()
  const totalSupply = BigInt(tokenIndexes.length)
  const nftCollectionDeployTx = await nftCollection.createPreDesignedCollection(
    "CryptoPunk",
    "CP",
    "https://cryptopunks.app/cryptopunks/details/",
    totalSupply
  )
  const nftPreDesignedCollectionInstane = nftCollectionDeployTx.instance

  for (const [sequence, tokenIndex] of tokenIndexes.entries()) {
    await mintPreDesignedNFTAndVerify(nftCollection, nftPreDesignedCollectionInstane, tokenIndex, sequence)
  }

  // Out-of-bound tokenIndex should *not* be ok
  await expect(nftCollection.mintPreDesignedNFT(
    nftPreDesignedCollectionInstane.contractId,
    totalSupply
  )).rejects.toThrow(Error)
}

async function mintPreDesignedNFTAndVerify(
  nftCollection: NFTCollection,
  nftPreDesignedCollectionInstance: NFTPreDesignedCollectionInstance,
  tokenIndex: bigint,
  sequence: number
) {
  const nftCollectionContractAddress = addressFromContractId(nftPreDesignedCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(nftPreDesignedCollectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group)

  await nftCollection.mintPreDesignedNFT(
    nftPreDesignedCollectionInstance.contractId,
    tokenIndex
  )

  // NFT just minted
  const nftByIndexResult = await nftPreDesignedCollectionInstance.callNftByIndexMethod({ args: { index: tokenIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)

  await verifyMintEvent(nftCollectionContractAddress, tokenIndex, sequence)
  await verifyNFTState(nftContractId, tokenIndex)
}

async function verifyMintEvent(nftCollectionContractAddress: string, tokenIndex: bigint, start: number) {
  const nftCollectionContractEvents = await web3.getCurrentNodeProvider().events.getEventsContractContractaddress(
    nftCollectionContractAddress, { start }
  )

  expect(nftCollectionContractEvents.events.length).toEqual(1)

  const nftMintedEventFields = nftCollectionContractEvents.events[0].fields
  // Minter address
  expect(nftMintedEventFields[0].value).toEqual(testAddress1)
  // NFT token index
  expect(nftMintedEventFields[1].value).toEqual(tokenIndex.toString())
}

async function verifyNFTState(nftContractId: string, tokenIndex: bigint) {
  const nftContractState = await fetchNFTState(addressFromContractId(nftContractId))
  utils.checkHexString(nftContractState.fields.uri, getNFTUri(tokenIndex))
}

async function getNFTCollection() {
  const signer = await testWallet1()
  return new NFTCollection(signer)
}

const nftBaseUri = "https://cryptopunks.app/cryptopunks/details/"
function getNFTUri(tokenIndex: bigint): string {
  return `${nftBaseUri}${tokenIndex}`
}
