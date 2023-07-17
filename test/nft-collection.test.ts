import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress, addressFromTokenId, ONE_ALPH } from '@alephium/web3'
import { testNodeWallet } from '@alephium/web3-test'
import * as utils from '../utils'
import { NFTCollection } from '../utils/nft-collection'
import { EnumerableNFTInstance, NFTOpenCollectionInstance, NFTPublicSaleCollectionRandomInstance, NonEnumerableNFTInstance } from '../artifacts/ts'

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

  it('should test minting nft sequentially in pre designed collection', async () => {
    const maxSupply = 10n
    const mintPrice = ONE_ALPH
    const nftCollection = await getNFTCollection()
    const nftPublicSaleCollectionInstance = await getNFTPublicSaleCollectionInstance(nftCollection, maxSupply, mintPrice)
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

  it('should test minting nft non-sequentially in pre designed collection', async () => {
    const maxSupply = 10n
    const mintPrice = ONE_ALPH
    const nftCollection = await getNFTCollection()
    const nftPublicSaleCollectionInstance = await getNFTPublicSaleCollectionInstance(nftCollection, maxSupply, mintPrice)
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

async function getNFTCollection() {
  const signer = await testNodeWallet()
  return new NFTCollection(signer)
}

const nftBaseUri = "https://cryptopunks.app/cryptopunks/details/"
function getNFTUri(tokenIndex: bigint): string {
  return `${nftBaseUri}${tokenIndex}`
}

async function getNFTPublicSaleCollectionInstance(nftCollection: NFTCollection, maxSupply: bigint, mintPrice: bigint) {
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