import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress, addressFromTokenId, ONE_ALPH } from '@alephium/web3'
import { testNodeWallet } from '@alephium/web3-test'
import * as utils from '../utils'
import { NFTCollection } from '../utils/nft-collection'
import { EnumerableNFTInstance, NFTOpenCollectionInstance, NFTPublicSaleCollectionRandomInstance, NFTPublicSaleCollectionSequentialInstance, NonEnumerableNFTInstance } from '../artifacts/ts'

describe('nft collection', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl, undefined, fetch)

  it('should test minting nft in open collection', async () => {
    const nftCollection = await getNFTCollection()
    nftCollection.buildProject(false)

    const nftCollectionDeployTx = await nftCollection.createOpenCollection("https://crypto-punk-uri")
    const nftCollectionInstance = nftCollectionDeployTx.contractInstance

    const signer = await testNodeWallet()
    const ownerAccount = await signer.getSelectedAccount()
    const nftCollectionState = await nftCollectionInstance.fetchState()
    expect(nftCollectionState.fields.collectionOwner).toEqual(ownerAccount.address)

    for (let i = 0n; i < 10n; i++) {
      await mintOpenNFTAndVerify(nftCollection, nftCollectionInstance, i)
    }
  }, 60000)

  it('should test minting nft sequentially in NFTPublicSaleCollectionRandom', async () => {
    const maxSupply = 10n
    const mintPrice = ONE_ALPH
    const nftCollection = await getNFTCollection()
    const nftPublicSaleCollectionInstance = await getNFTPublicSaleCollectionRandomInstance(nftCollection, maxSupply, mintPrice)
    const signerAddress = (await nftCollection.signer.getSelectedAccount()).address

    const balanceBefore = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPublicSaleCollectionInstance.address)
    for (let i = 0n; i < maxSupply; i++) {
      await mintSpecificPublicSaleNFTAndVerify(nftCollection, nftPublicSaleCollectionInstance, i, mintPrice)
    }
    const balanceAfter = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPublicSaleCollectionInstance.address)
    expect(BigInt(balanceBefore.balance)).toEqual(BigInt(balanceAfter.balance) - mintPrice * maxSupply)

    // Can't mint the same NFT again
    await expect(mintSpecificPublicSaleNFTAndVerify(nftCollection, nftPublicSaleCollectionInstance, 4n, mintPrice)).rejects.toThrow(Error)
    // Can't mint the NFT with out-of-bound index
    await expect(mintSpecificPublicSaleNFTAndVerify(nftCollection, nftPublicSaleCollectionInstance, maxSupply, mintPrice)).rejects.toThrow(Error)
    // Withdraw too much
    await expect(checkWithdraw(nftCollection, nftPublicSaleCollectionInstance.contractId, signerAddress, BigInt(10.1e18))).rejects.toThrow(Error)
    // Successful Withdraw
    await checkWithdraw(nftCollection, nftPublicSaleCollectionInstance.contractId, signerAddress, BigInt(10e18))
  }, 30000)

  it('should test minting nft non-sequentially in NFTPublicSaleCollectionRandom', async () => {
    const maxSupply = 10n
    const mintPrice = ONE_ALPH
    const nftCollection = await getNFTCollection()
    const nftPublicSaleCollectionInstance = await getNFTPublicSaleCollectionRandomInstance(nftCollection, maxSupply, mintPrice)
    const signerAddress = (await nftCollection.signer.getSelectedAccount()).address

    const balanceBefore = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPublicSaleCollectionInstance.address)
    await mintSpecificPublicSaleNFTAndVerify(nftCollection, nftPublicSaleCollectionInstance, 0n, mintPrice)
    await mintSpecificPublicSaleNFTAndVerify(nftCollection, nftPublicSaleCollectionInstance, 6n, mintPrice)
    await mintSpecificPublicSaleNFTAndVerify(nftCollection, nftPublicSaleCollectionInstance, 9n, mintPrice)
    const balanceAfter = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPublicSaleCollectionInstance.address)
    expect(BigInt(balanceBefore.balance)).toEqual(BigInt(balanceAfter.balance) - mintPrice * 3n)

    // Can't mint the same NFT again
    await expect(mintSpecificPublicSaleNFTAndVerify(nftCollection, nftPublicSaleCollectionInstance, 6n, mintPrice)).rejects.toThrow(Error)
    // Can't mint the NFT with out-of-bound index
    await expect(mintSpecificPublicSaleNFTAndVerify(nftCollection, nftPublicSaleCollectionInstance, maxSupply + 1n, mintPrice)).rejects.toThrow(Error)
    // Withdraw too much
    await expect(checkWithdraw(nftCollection, nftPublicSaleCollectionInstance.contractId, signerAddress, BigInt(3.1e18))).rejects.toThrow(Error)
    // Successful Withdraw
    await checkWithdraw(nftCollection, nftPublicSaleCollectionInstance.contractId, signerAddress, BigInt(3e18))
  }, 30000)

  it('should test minting next nft in NFTPublicSaleCollectionSequential', async () => {
    const maxSupply = 10n
    const mintPrice = ONE_ALPH
    const maxBatchMintSize = 5n
    const nftCollection = await getNFTCollection()
    const nftCollectionInstance = await getNFTPublicSaleCollectionSequentialInstance(nftCollection, maxSupply, mintPrice, maxBatchMintSize)
    const signerAddress = (await nftCollection.signer.getSelectedAccount()).address

    const state0 = await nftCollectionInstance.fetchState()
    expect(state0.fields.totalSupply).toEqual(0n)
    for (let i = 0n; i < maxSupply; i++) {
      await mintNextPublicSaleSequentialNFTAndVerify(nftCollection, nftCollectionInstance, mintPrice)
    }
    const state1 = await nftCollectionInstance.fetchState()
    expect(state1.fields.totalSupply).toEqual(maxSupply)
    expect(BigInt(state1.asset.alphAmount)).toEqual(BigInt(state0.asset.alphAmount) + maxSupply * mintPrice)

    // Can't mint NFT any more
    await expect(mintNextPublicSaleSequentialNFTAndVerify(nftCollection, nftCollectionInstance, mintPrice)).rejects.toThrow(Error)
    // Withdraw too much
    await expect(checkWithdraw(nftCollection, nftCollectionInstance.contractId, signerAddress, BigInt(10.1e18))).rejects.toThrow(Error)
    // Successful Withdraw
    await checkWithdraw(nftCollection, nftCollectionInstance.contractId, signerAddress, BigInt(10e18))
  }, 30000)

  it('should test minting batch in NFTPublicSaleCollectionSequential', async () => {
    const maxSupply = 10n
    const mintPrice = ONE_ALPH
    const maxBatchMintSize = 5n
    const nftCollection = await getNFTCollection()
    const nftCollectionInstance = await getNFTPublicSaleCollectionSequentialInstance(nftCollection, maxSupply, mintPrice, maxBatchMintSize)
    const signerAddress = (await nftCollection.signer.getSelectedAccount()).address

    const state0 = await nftCollectionInstance.fetchState()
    expect(state0.fields.totalSupply).toEqual(0n)
    // Mint one nft
    await mintNextPublicSaleSequentialNFTAndVerify(nftCollection, nftCollectionInstance, mintPrice)
    // Batch size exceed the maxBatchMintSize
    await expect(nftCollection.mintBatchSequential(maxBatchMintSize + 1n, mintPrice, nftCollectionInstance.contractId)).rejects.toThrow(Error)
    // Batch size exceed the number of unminted nfts
    await expect(nftCollection.mintBatchSequential(maxSupply, mintPrice, nftCollectionInstance.contractId)).rejects.toThrow(Error)
    await mintBatchPublicSaleNFTAndVerify(nftCollection, nftCollectionInstance, mintPrice, maxBatchMintSize)
    await mintBatchPublicSaleNFTAndVerify(nftCollection, nftCollectionInstance, mintPrice, maxBatchMintSize - 1n)
    const state1 = await nftCollectionInstance.fetchState()
    expect(state1.fields.totalSupply).toEqual(maxSupply)
    expect(BigInt(state1.asset.alphAmount)).toEqual(BigInt(state0.asset.alphAmount) + mintPrice * maxSupply)

    // Can't mint NFT any more
    await expect(mintNextPublicSaleSequentialNFTAndVerify(nftCollection, nftCollectionInstance, mintPrice)).rejects.toThrow(Error)
    await expect(nftCollection.mintBatchSequential(1n, mintPrice, nftCollectionInstance.contractId)).rejects.toThrow(Error)
    // Withdraw too much
    await expect(checkWithdraw(nftCollection, nftCollectionInstance.contractId, signerAddress, BigInt(10.1e18))).rejects.toThrow(Error)
    // Successful Withdraw
    await checkWithdraw(nftCollection, nftCollectionInstance.contractId, signerAddress, BigInt(10e18))
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

  const nftContractState = await new NonEnumerableNFTInstance(addressFromContractId(nftContractId)).fetchState()
  utils.checkHexString(nftContractState.fields.uri, getNFTUri(tokenIndex))

  return txId
}

async function mintSpecificPublicSaleNFTAndVerify(
  nftCollection: NFTCollection,
  nftPublicSaleCollectionInstance: NFTPublicSaleCollectionRandomInstance,
  tokenIndex: bigint,
  mintPrice: bigint
) {
  const nftCollectionContractAddress = addressFromContractId(nftPublicSaleCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(nftPublicSaleCollectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group)

  await nftCollection.mintSpecificPublicSaleNFT(tokenIndex, mintPrice, nftPublicSaleCollectionInstance.contractId)

  // NFT just minted
  const nftByIndexResult = await nftPublicSaleCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)

  const nftContractState = await new EnumerableNFTInstance(addressFromContractId(nftContractId)).fetchState()
  expect(nftContractState.fields.collectionId).toEqual(nftPublicSaleCollectionInstance.contractId)
  expect(nftContractState.fields.nftIndex).toEqual(tokenIndex)
  const nftInstance = new EnumerableNFTInstance(addressFromTokenId(nftContractId))
  const tokenUri = (await nftInstance.methods.getTokenUri()).returns
  utils.checkHexString(tokenUri, getNFTUri(tokenIndex))
  const collectionId = (await nftInstance.methods.getCollectionId()).returns
  expect(collectionId).toEqual(nftPublicSaleCollectionInstance.contractId)
}

async function mintNextPublicSaleSequentialNFTAndVerify(
  nftCollection: NFTCollection,
  nftCollectionInstance: NFTPublicSaleCollectionSequentialInstance,
  mintPrice: bigint
) {
  const nftCollectionContractAddress = addressFromContractId(nftCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const state0 = await nftCollectionInstance.fetchState()
  const tokenIndex = state0.fields.totalSupply
  const nftContractId = subContractId(nftCollectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group)

  await nftCollection.mintNextSequential(mintPrice, nftCollectionInstance.contractId)

  const state1 = await nftCollectionInstance.fetchState()
  expect(state1.fields.totalSupply).toEqual(tokenIndex + 1n)
  expect(BigInt(state1.asset.alphAmount)).toEqual(BigInt(state0.asset.alphAmount) + mintPrice)

  // NFT just minted
  const nftByIndexResult = await nftCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)

  const nftContractState = await new EnumerableNFTInstance(addressFromContractId(nftContractId)).fetchState()
  expect(nftContractState.fields.collectionId).toEqual(nftCollectionInstance.contractId)
  expect(nftContractState.fields.nftIndex).toEqual(tokenIndex)
  const nftInstance = new EnumerableNFTInstance(addressFromTokenId(nftContractId))
  const tokenUri = (await nftInstance.methods.getTokenUri()).returns
  utils.checkHexString(tokenUri, getNFTUri(tokenIndex))
  const collectionId = (await nftInstance.methods.getCollectionId()).returns
  expect(collectionId).toEqual(nftCollectionInstance.contractId)
}

async function mintBatchPublicSaleNFTAndVerify(
  nftCollection: NFTCollection,
  nftCollectionInstance: NFTPublicSaleCollectionSequentialInstance,
  mintPrice: bigint,
  batchSize: bigint
) {
  const nftCollectionContractAddress = addressFromContractId(nftCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const state0 = await nftCollectionInstance.fetchState()
  const startIndex = state0.fields.totalSupply

  await nftCollection.mintBatchSequential(batchSize, mintPrice, nftCollectionInstance.contractId)

  const state1 = await nftCollectionInstance.fetchState()
  expect(state1.fields.totalSupply).toEqual(startIndex + batchSize)
  expect(BigInt(state1.asset.alphAmount)).toEqual(BigInt(state0.asset.alphAmount) + batchSize * mintPrice)

  for (let index = 0n; index < batchSize; index += 1n) {
    // NFT just minted
    const tokenIndex = startIndex + index
    const nftContractId = subContractId(nftCollectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group)
    const nftByIndexResult = await nftCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex } })
    expect(nftByIndexResult.returns).toEqual(nftContractId)

    const nftContractState = await new EnumerableNFTInstance(addressFromContractId(nftContractId)).fetchState()
    expect(nftContractState.fields.collectionId).toEqual(nftCollectionInstance.contractId)
    expect(nftContractState.fields.nftIndex).toEqual(tokenIndex)
    const nftInstance = new EnumerableNFTInstance(addressFromTokenId(nftContractId))
    const tokenUri = (await nftInstance.methods.getTokenUri()).returns
    utils.checkHexString(tokenUri, getNFTUri(tokenIndex))
    const collectionId = (await nftInstance.methods.getCollectionId()).returns
    expect(collectionId).toEqual(nftCollectionInstance.contractId)
  }
}

async function getNFTCollection() {
  const signer = await testNodeWallet()
  return new NFTCollection(signer)
}

const nftBaseUri = "https://cryptopunks.app/cryptopunks/details/"
function getNFTUri(tokenIndex: bigint): string {
  return `${nftBaseUri}${tokenIndex}`
}

async function getNFTPublicSaleCollectionRandomInstance(nftCollection: NFTCollection, maxSupply: bigint, mintPrice: bigint) {
  const nftCollectionDeployTx = await nftCollection.createPublicSaleCollectionRandom(
    maxSupply,
    mintPrice,
    "https://crypto-punk-uri",
    "https://cryptopunks.app/cryptopunks/details/"
  )
  const nftPublicSaleCollectionRandomInstance = nftCollectionDeployTx.contractInstance

  const signer = await testNodeWallet()
  const ownerAccount = await signer.getSelectedAccount()
  const nftCollectionState = await nftPublicSaleCollectionRandomInstance.fetchState()
  expect(nftCollectionState.fields.collectionOwner).toEqual(ownerAccount.address)

  return nftPublicSaleCollectionRandomInstance
}

async function getNFTPublicSaleCollectionSequentialInstance(nftCollection: NFTCollection, maxSupply: bigint, mintPrice: bigint, maxBatchMintSize: bigint) {
  const nftCollectionDeployTx = await nftCollection.createPublicSaleCollectionSequential(
    maxSupply,
    mintPrice,
    "https://crypto-punk-uri",
    "https://cryptopunks.app/cryptopunks/details/",
    maxBatchMintSize
  )
  const nftPublicSaleCollectionSequentialInstance = nftCollectionDeployTx.contractInstance

  const signer = await testNodeWallet()
  const ownerAccount = await signer.getSelectedAccount()
  const nftCollectionState = await nftPublicSaleCollectionSequentialInstance.fetchState()
  expect(nftCollectionState.fields.collectionOwner).toEqual(ownerAccount.address)

  return nftPublicSaleCollectionSequentialInstance
}

async function checkWithdraw(
  nftCollection: NFTCollection,
  collectionId: string,
  to: string,
  withdrawAmount: bigint
) {
  const collectionAddress = addressFromContractId(collectionId)
  const balanceBefore = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(collectionAddress)
  await nftCollection.withdrawFromPublicSaleCollection(to, withdrawAmount, collectionId)
  const balanceAfter = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(collectionAddress)
  expect(BigInt(balanceAfter.balance)).toEqual(BigInt(balanceBefore.balance) - withdrawAmount)
}