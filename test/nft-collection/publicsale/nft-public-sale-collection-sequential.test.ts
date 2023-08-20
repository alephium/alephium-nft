import {
  web3,
  subContractId,
  addressFromContractId,
  encodeU256,
  binToHex,
  groupOfAddress,
  addressFromTokenId,
  ONE_ALPH,
  SignerProvider
} from '@alephium/web3'
import { getSigners } from '@alephium/web3-test'
import * as utils from '../../../shared'
import { checkEvent, checkWithdraw, getNFTCollection, getNFTUri } from '../utils'
import { NFTCollectionHelper } from '../../../shared/nft-collection'
import {
  NFTInstance,
  NFTPublicSaleCollectionSequential,
  NFTPublicSaleCollectionSequentialInstance,
  NFTPublicSaleCollectionSequentialWithRoyaltyInstance
} from '../../../artifacts/ts'

describe('nft public sale collection - sequential', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl, undefined, fetch)

  it('should test minting next NFT', async () => {
    const mintSpecific = async (
      nftCollectionHelper: NFTCollectionHelper,
      nftCollectionInstance: NFTPublicSaleCollectionSequentialInstance | NFTPublicSaleCollectionSequentialWithRoyaltyInstance,
      maxSupply: bigint,
      mintPrice: bigint,
      royalty: boolean
    ) => {
      for (let i = 0n; i < maxSupply; i++) {
        await mintAndVerify(nftCollectionHelper, nftCollectionInstance, mintPrice, 1n, royalty)
      }
    }

    await testNFTMinting(mintSpecific, false)
    await testNFTMinting(mintSpecific, true)
  }, 30000)

  it('should test batch minting NFTs', async () => {
    const maxBatchMintSize = 5n
    const batchMint = async (
      nftCollectionHelper: NFTCollectionHelper,
      nftCollectionInstance: NFTPublicSaleCollectionSequentialInstance | NFTPublicSaleCollectionSequentialWithRoyaltyInstance,
      maxSupply: bigint,
      mintPrice: bigint,
      royalty: boolean
    ) => {
      // Mint one nft
      await mintAndVerify(nftCollectionHelper, nftCollectionInstance, mintPrice, 1n, royalty)
      // Batch size exceed the maxBatchMintSize
      await expect(nftCollectionHelper.publicSaleCollection.sequential.batchMint(maxBatchMintSize + 1n, mintPrice, nftCollectionInstance.contractId, royalty)).rejects.toThrow(Error)
      // Batch size exceed the number of unminted nfts
      await expect(nftCollectionHelper.publicSaleCollection.sequential.batchMint(maxSupply, mintPrice, nftCollectionInstance.contractId, royalty)).rejects.toThrow(Error)
      await mintAndVerify(nftCollectionHelper, nftCollectionInstance, mintPrice, maxBatchMintSize, royalty)
      await mintAndVerify(nftCollectionHelper, nftCollectionInstance, mintPrice, maxBatchMintSize - 1n, royalty)
    }

    await testNFTMinting(batchMint, false)
    await testNFTMinting(batchMint, true)
  }, 30000)

  const royaltyRate = BigInt(200)

  async function testNFTMinting(
    testFunc: (
      nftCollectionHelper: NFTCollectionHelper,
      nftCollectionInstance: NFTPublicSaleCollectionSequentialInstance | NFTPublicSaleCollectionSequentialWithRoyaltyInstance,
      maxSupply: bigint,
      mintPrice: bigint,
      royalty: boolean
    ) => Promise<void>,
    royalty: boolean = false
  ) {
    const maxSupply = 10n
    const mintPrice = ONE_ALPH
    const maxBatchMintSize = 5n
    const [signer] = await getSigners(1)
    const nftCollection = await getNFTCollection(signer)
    const nftCollectionInstance = await getCollectionInstance(nftCollection, maxSupply, mintPrice, maxBatchMintSize, royalty, signer)
    const signerAddress = (await nftCollection.signer.getSelectedAccount()).address

    const state0 = await nftCollectionInstance.fetchState()
    expect(state0.fields.totalSupply).toEqual(0n)

    await testFunc(nftCollection, nftCollectionInstance, maxSupply, mintPrice, royalty)

    const state1 = await nftCollectionInstance.fetchState()
    expect(state1.fields.totalSupply).toEqual(maxSupply)
    expect(BigInt(state1.asset.alphAmount)).toEqual(BigInt(state0.asset.alphAmount) + maxSupply * mintPrice)

    // Can't mint NFT any more
    await expect(mintAndVerify(nftCollection, nftCollectionInstance, mintPrice, 1n, royalty)).rejects.toThrow(Error)
    // Withdraw too much
    await expect(checkWithdraw(nftCollection, nftCollectionInstance.contractId, signerAddress, BigInt(10.1e18), false)).rejects.toThrow(Error)
    // Successful Withdraw
    await checkWithdraw(nftCollection, nftCollectionInstance.contractId, signerAddress, BigInt(10e18), royalty)

    if (royalty) {
      const instance = nftCollectionInstance as NFTPublicSaleCollectionSequentialWithRoyaltyInstance
      const tokenIdResult = await instance.methods.nftByIndex({ args: { index: maxSupply - 1n } })
      const tokenId = tokenIdResult.returns
      const royaltyAmount = await instance.methods.royaltyAmount({ args: { tokenId: tokenId, salePrice: BigInt(100) } })
      expect(royaltyAmount.returns).toEqual(BigInt(100) * royaltyRate / BigInt(10000))
    }
  }

  async function mintAndVerify(
    nftCollectionHelper: NFTCollectionHelper,
    nftCollectionInstance: NFTPublicSaleCollectionSequentialInstance | NFTPublicSaleCollectionSequentialWithRoyaltyInstance,
    mintPrice: bigint,
    batchSize: bigint,
    royalty: boolean
  ) {
    const nftCollectionContractAddress = addressFromContractId(nftCollectionInstance.contractId)
    const group = groupOfAddress(nftCollectionContractAddress)
    const state0 = await nftCollectionInstance.fetchState()
    const fromIndex = state0.fields.totalSupply

    let result = undefined
    if (batchSize === 1n) {
      result = await nftCollectionHelper.publicSaleCollection.sequential.mintNext(mintPrice, nftCollectionInstance.contractId, royalty)
    } else {
      result = await nftCollectionHelper.publicSaleCollection.sequential.batchMint(batchSize, mintPrice, nftCollectionInstance.contractId, royalty)
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
    royalty: boolean,
    signer: SignerProvider
  ): Promise<NFTPublicSaleCollectionSequentialInstance | NFTPublicSaleCollectionSequentialWithRoyaltyInstance> {
    let collectionInstance = undefined

    if (royalty) {
      const nftCollectionDeployTx = await nftCollectionHelper.publicSaleCollection.sequential.createWithRoyalty(
        maxSupply,
        mintPrice,
        "https://crypto-punk-uri",
        "https://cryptopunks.app/cryptopunks/details/",
        maxBatchMintSize,
        royaltyRate,
      )
      collectionInstance = nftCollectionDeployTx.contractInstance
    } else {
      const nftCollectionDeployTx = await nftCollectionHelper.publicSaleCollection.sequential.create(
        maxSupply,
        mintPrice,
        "https://crypto-punk-uri",
        "https://cryptopunks.app/cryptopunks/details/",
        maxBatchMintSize
      )
      collectionInstance = nftCollectionDeployTx.contractInstance
    }

    const ownerAccount = await signer.getSelectedAccount()
    const nftCollectionState = await collectionInstance.fetchState()
    expect(nftCollectionState.fields.collectionOwner).toEqual(ownerAccount.address)
    return collectionInstance
  }
})
