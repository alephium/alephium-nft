import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress, addressFromTokenId } from '@alephium/web3'
import * as utils from '../utils'
import { NFTCollection } from '../utils/nft-collection'
import { testWallet1 } from './signers'
import { fetchNonEnumerableNFTState, fetchEnumerableNFTState } from '../utils/contracts'
import { EnumerableNFTInstance, NFTOpenCollectionInstance, NFTPreDesignedCollectionInstance } from '../artifacts/ts'

describe('nft collection', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl, undefined, fetch)

  it('should test minting nft in open collection', async () => {
    const nftCollection = await getNFTCollection()
    nftCollection.buildProject(false)

    const nftCollectionDeployTx = await nftCollection.createOpenCollection("https://crypto-punk-uri")
    const nftCollectionInstance = nftCollectionDeployTx.contractInstance


    for (let i = 0n; i < 10n; i++) {
      await mintOpenNFTAndVerify(nftCollection, nftCollectionInstance, i)
    }
  }, 60000)

  it('should test minting nft in pre designed collection', async () => {
    const nftCollection = await getNFTCollection()
    const nftCollectionDeployTx = await nftCollection.createPreDesignedCollection(
      "https://crypto-punk-uri",
      "https://cryptopunks.app/cryptopunks/details/"
    )
    const nftPreDesignedCollectionInstane = nftCollectionDeployTx.contractInstance

    for (let i = 0n; i < 10n; i++) {
      await mintPreDesignedNFTAndVerify(nftCollection, nftPreDesignedCollectionInstane, i)
    }
  }, 30000)
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

  const { txId } = await nftCollection.mintOpenNFT(nftOpenCollectionInstance.contractId, getNFTUri(tokenIndex))

  // NFT just minted
  const nftByIndexResult = await nftOpenCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)
  // NFT doesn't exist yet
  await expect(nftOpenCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex + 1n } })).rejects.toThrow(Error)

  const nftContractState = await fetchNonEnumerableNFTState(addressFromContractId(nftContractId))
  utils.checkHexString(nftContractState.fields.uri, getNFTUri(tokenIndex))

  return txId
}

async function mintPreDesignedNFTAndVerify(
  nftCollection: NFTCollection,
  nftPreDesignedCollectionInstance: NFTPreDesignedCollectionInstance,
  tokenIndex: bigint,
) {
  const nftCollectionContractAddress = addressFromContractId(nftPreDesignedCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(nftPreDesignedCollectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group)

  await nftCollection.mintPreDesignedNFT(nftPreDesignedCollectionInstance.contractId)

  // NFT just minted
  const nftByIndexResult = await nftPreDesignedCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)

  const nftContractState = await fetchEnumerableNFTState(addressFromContractId(nftContractId))
  expect(nftContractState.fields.collection).toEqual(nftPreDesignedCollectionInstance.contractId)
  expect(nftContractState.fields.nftIndex).toEqual(tokenIndex)
  const nftInstance = new EnumerableNFTInstance(addressFromTokenId(nftContractId))
  const tokenUri = (await nftInstance.methods.getTokenUri()).returns
  utils.checkHexString(tokenUri, getNFTUri(tokenIndex))
  const collectionId = (await nftInstance.methods.getCollectionId()).returns
  expect(collectionId).toEqual(nftPreDesignedCollectionInstance.contractId)
}

async function getNFTCollection() {
  const signer = await testWallet1()
  return new NFTCollection(signer)
}

const nftBaseUri = "https://cryptopunks.app/cryptopunks/details/"
function getNFTUri(tokenIndex: bigint): string {
  return `${nftBaseUri}${tokenIndex}`
}
