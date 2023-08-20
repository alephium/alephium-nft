import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress, addressFromTokenId, ONE_ALPH, SignerProvider } from '@alephium/web3'
import { getSigners } from '@alephium/web3-test'
import * as utils from '../../../shared'
import { checkEvent, checkWithdraw, getNFTCollection, getNFTUri } from '../utils'
import { NFTCollectionHelper } from '../../../shared/nft-collection'
import { NFTInstance, NFTPublicSaleCollectionSequential, NFTPublicSaleCollectionSequentialInstance } from '../../../artifacts/ts'

describe('nft public sale collection - sequential', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl, undefined, fetch)

  it('should test minting next nft in NFTPublicSaleCollectionSequential', async () => {
    await testNFTMinting(async (nftCollection, nftCollectionInstance, maxSupply, mintPrice) => {
      for (let i = 0n; i < maxSupply; i++) {
        await mintAndVerify(nftCollection, nftCollectionInstance, mintPrice, 1n)
      }
    })
  }, 30000)

  it('should test minting batch in NFTPublicSaleCollectionSequential', async () => {
    const maxBatchMintSize = 5n

    await testNFTMinting(async (nftCollection, nftCollectionInstance, maxSupply, mintPrice) => {
      // Mint one nft
      await mintAndVerify(nftCollection, nftCollectionInstance, mintPrice, 1n)
      // Batch size exceed the maxBatchMintSize
      await expect(nftCollection.mintBatchSequential(maxBatchMintSize + 1n, mintPrice, nftCollectionInstance.contractId)).rejects.toThrow(Error)
      // Batch size exceed the number of unminted nfts
      await expect(nftCollection.mintBatchSequential(maxSupply, mintPrice, nftCollectionInstance.contractId)).rejects.toThrow(Error)
      await mintAndVerify(nftCollection, nftCollectionInstance, mintPrice, maxBatchMintSize)
      await mintAndVerify(nftCollection, nftCollectionInstance, mintPrice, maxBatchMintSize - 1n)
    })
  }, 30000)
})

async function testNFTMinting(
  testFunc: (
    nftCollectionHelper: NFTCollectionHelper,
    nftCollectionInstance: NFTPublicSaleCollectionSequentialInstance,
    maxSupply: bigint,
    mintPrice: bigint
  ) => Promise<void>
) {
  const maxSupply = 10n
  const mintPrice = ONE_ALPH
  const maxBatchMintSize = 5n
  const [signer] = await getSigners(1)
  const nftCollection = await getNFTCollection(signer)
  const nftCollectionInstance = await getCollectionInstance(nftCollection, maxSupply, mintPrice, maxBatchMintSize, signer)
  const signerAddress = (await nftCollection.signer.getSelectedAccount()).address

  const state0 = await nftCollectionInstance.fetchState()
  expect(state0.fields.totalSupply).toEqual(0n)

  await testFunc(nftCollection, nftCollectionInstance, maxSupply, mintPrice)

  const state1 = await nftCollectionInstance.fetchState()
  expect(state1.fields.totalSupply).toEqual(maxSupply)
  expect(BigInt(state1.asset.alphAmount)).toEqual(BigInt(state0.asset.alphAmount) + maxSupply * mintPrice)

  // Can't mint NFT any more
  await expect(mintAndVerify(nftCollection, nftCollectionInstance, mintPrice, 1n)).rejects.toThrow(Error)
  // Withdraw too much
  await expect(checkWithdraw(nftCollection, nftCollectionInstance.contractId, signerAddress, BigInt(10.1e18))).rejects.toThrow(Error)
  // Successful Withdraw
  await checkWithdraw(nftCollection, nftCollectionInstance.contractId, signerAddress, BigInt(10e18))
}

async function mintAndVerify(
  nftCollectionHelper: NFTCollectionHelper,
  nftCollectionInstance: NFTPublicSaleCollectionSequentialInstance,
  mintPrice: bigint,
  batchSize: bigint
) {
  const nftCollectionContractAddress = addressFromContractId(nftCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const state0 = await nftCollectionInstance.fetchState()
  const fromIndex = state0.fields.totalSupply

  let result = undefined
  if (batchSize === 1n) {
    result = await nftCollectionHelper.mintNextSequential(mintPrice, nftCollectionInstance.contractId)
  } else {
    result = await nftCollectionHelper.mintBatchSequential(batchSize, mintPrice, nftCollectionInstance.contractId)
  }

  const state1 = await nftCollectionInstance.fetchState()
  expect(state1.fields.totalSupply).toEqual(fromIndex + batchSize)
  expect(BigInt(state1.asset.alphAmount)).toEqual(BigInt(state0.asset.alphAmount) + batchSize * mintPrice)

  for (let index = 0n; index < batchSize; index += 1n) {
    // NFT just minted
    const tokenIndex = fromIndex + index
    const nftContractId = subContractId(nftCollectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group)
    const nftByIndexResult = await nftCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex } })
    expect(nftByIndexResult.returns).toEqual(nftContractId)

    const nftContractState = await new NFTInstance(addressFromContractId(nftContractId)).fetchState()
    expect(nftContractState.fields.collectionId).toEqual(nftCollectionInstance.contractId)
    expect(nftContractState.fields.nftIndex).toEqual(tokenIndex)
    const nftInstance = new NFTInstance(addressFromTokenId(nftContractId))
    const tokenUri = (await nftInstance.methods.getTokenUri()).returns
    utils.checkHexString(tokenUri, getNFTUri(tokenIndex))
    const collectionId = (await nftInstance.methods.getCollectionId()).returns
    expect(collectionId).toEqual(nftCollectionInstance.contractId)
  }

  const account = await nftCollectionHelper.signer.getSelectedAccount()
  await checkEvent(NFTPublicSaleCollectionSequential, result.txId, {
    txId: result.txId,
    contractAddress: nftCollectionInstance.address,
    eventIndex: 0,
    name: 'Mint',
    fields: { minter: account.address, fromIndex, mintSize: batchSize }
  })
}

async function getCollectionInstance(
  nftCollectionHelper: NFTCollectionHelper,
  maxSupply: bigint,
  mintPrice: bigint,
  maxBatchMintSize: bigint,
  signer: SignerProvider
) {
  const nftCollectionDeployTx = await nftCollectionHelper.createPublicSaleCollectionSequential(
    maxSupply,
    mintPrice,
    "https://crypto-punk-uri",
    "https://cryptopunks.app/cryptopunks/details/",
    maxBatchMintSize
  )
  const nftPublicSaleCollectionSequentialInstance = nftCollectionDeployTx.contractInstance

  const ownerAccount = await signer.getSelectedAccount()
  const nftCollectionState = await nftPublicSaleCollectionSequentialInstance.fetchState()
  expect(nftCollectionState.fields.collectionOwner).toEqual(ownerAccount.address)

  return nftPublicSaleCollectionSequentialInstance
}
