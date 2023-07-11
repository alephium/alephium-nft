import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress, addressFromTokenId, ONE_ALPH } from '@alephium/web3'
import { testNodeWallet } from '@alephium/web3-test'
import * as utils from '../utils'
import { NFTCollection } from '../utils/nft-collection'
import { EnumerableNFTInstance, NFTOpenCollectionInstance, NFTPreDesignedCollectionInstance, NonEnumerableNFTInstance } from '../artifacts/ts'

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
    const nftPreDesignedCollectionInstance = await getNftPreDesignedCollectionInstance(nftCollection, maxSupply, mintPrice)
    const signerAddress = (await nftCollection.signer.getSelectedAccount()).address

    const balanceBefore = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPreDesignedCollectionInstance.address)
    for (let i = 0n; i < maxSupply; i++) {
      await mintPreDesignedNFTAndVerify(nftCollection, nftPreDesignedCollectionInstance, i, mintPrice)
    }
    const balanceAfter = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPreDesignedCollectionInstance.address)
    expect(BigInt(balanceBefore.balance)).toEqual(BigInt(balanceAfter.balance) - mintPrice * maxSupply)

    // Can't mint the same NFT again
    await expect(mintPreDesignedNFTAndVerify(nftCollection, nftPreDesignedCollectionInstance, 4n, mintPrice)).rejects.toThrow(Error)
    // Can't mint the NFT with out-of-bound index
    await expect(mintPreDesignedNFTAndVerify(nftCollection, nftPreDesignedCollectionInstance, maxSupply, mintPrice)).rejects.toThrow(Error)
    // Withdraw too much
    await expect(checkWithdraw(nftCollection, nftPreDesignedCollectionInstance.contractId, signerAddress, BigInt(10.1e18))).rejects.toThrow(Error)
    // Successful Withdraw
    await checkWithdraw(nftCollection, nftPreDesignedCollectionInstance.contractId, signerAddress, BigInt(10e18))
  }, 30000)

  it('should test minting nft non-sequentially in pre designed collection', async () => {
    const maxSupply = 10n
    const mintPrice = ONE_ALPH
    const nftCollection = await getNFTCollection()
    const nftPreDesignedCollectionInstance = await getNftPreDesignedCollectionInstance(nftCollection, maxSupply, mintPrice)
    const signerAddress = (await nftCollection.signer.getSelectedAccount()).address

    const balanceBefore = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPreDesignedCollectionInstance.address)
    await mintPreDesignedNFTAndVerify(nftCollection, nftPreDesignedCollectionInstance, 0n, mintPrice)
    await mintPreDesignedNFTAndVerify(nftCollection, nftPreDesignedCollectionInstance, 6n, mintPrice)
    await mintPreDesignedNFTAndVerify(nftCollection, nftPreDesignedCollectionInstance, 9n, mintPrice)
    const balanceAfter = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPreDesignedCollectionInstance.address)
    expect(BigInt(balanceBefore.balance)).toEqual(BigInt(balanceAfter.balance) - mintPrice * 3n)

    // Can't mint the same NFT again
    await expect(mintPreDesignedNFTAndVerify(nftCollection, nftPreDesignedCollectionInstance, 6n, mintPrice)).rejects.toThrow(Error)
    // Can't mint the NFT with out-of-bound index
    await expect(mintPreDesignedNFTAndVerify(nftCollection, nftPreDesignedCollectionInstance, maxSupply + 1n, mintPrice)).rejects.toThrow(Error)
    // Withdraw too much
    await expect(checkWithdraw(nftCollection, nftPreDesignedCollectionInstance.contractId, signerAddress, BigInt(3.1e18))).rejects.toThrow(Error)
    // Successful Withdraw
    await checkWithdraw(nftCollection, nftPreDesignedCollectionInstance.contractId, signerAddress, BigInt(3e18))
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

async function mintPreDesignedNFTAndVerify(
  nftCollection: NFTCollection,
  nftPreDesignedCollectionInstance: NFTPreDesignedCollectionInstance,
  tokenIndex: bigint,
  mintPrice: bigint
) {
  const nftCollectionContractAddress = addressFromContractId(nftPreDesignedCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(nftPreDesignedCollectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group)

  await nftCollection.mintPreDesignedNFT(tokenIndex, mintPrice, nftPreDesignedCollectionInstance.contractId)

  // NFT just minted
  const nftByIndexResult = await nftPreDesignedCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)

  const nftContractState = await new EnumerableNFTInstance(addressFromContractId(nftContractId)).fetchState()
  expect(nftContractState.fields.collection).toEqual(nftPreDesignedCollectionInstance.contractId)
  expect(nftContractState.fields.nftIndex).toEqual(tokenIndex)
  const nftInstance = new EnumerableNFTInstance(addressFromTokenId(nftContractId))
  const tokenUri = (await nftInstance.methods.getTokenUri()).returns
  utils.checkHexString(tokenUri, getNFTUri(tokenIndex))
  const collectionId = (await nftInstance.methods.getCollectionId()).returns
  expect(collectionId).toEqual(nftPreDesignedCollectionInstance.contractId)
}

async function getNFTCollection() {
  const signer = await testNodeWallet()
  return new NFTCollection(signer)
}

const nftBaseUri = "https://cryptopunks.app/cryptopunks/details/"
function getNFTUri(tokenIndex: bigint): string {
  return `${nftBaseUri}${tokenIndex}`
}

async function getNftPreDesignedCollectionInstance(nftCollection: NFTCollection, maxSupply: bigint, mintPrice: bigint) {
  const nftCollectionDeployTx = await nftCollection.createPreDesignedCollection(
    maxSupply,
    mintPrice,
    "https://crypto-punk-uri",
    "https://cryptopunks.app/cryptopunks/details/"
  )
  const nftPreDesignedCollectionInstane = nftCollectionDeployTx.contractInstance

  const signer = await testNodeWallet()
  const ownerAccount = await signer.getSelectedAccount()
  const nftCollectionState = await nftPreDesignedCollectionInstane.fetchState()
  expect(nftCollectionState.fields.collectionOwner).toEqual(ownerAccount.address)

  return nftPreDesignedCollectionInstane
}

async function checkWithdraw(
  nftCollection: NFTCollection,
  preDesignedCollectionId: string,
  to: string,
  withdrawAmount: bigint
) {
  const preDesignedCollectionAddress = addressFromContractId(preDesignedCollectionId)
  const balanceBefore = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(preDesignedCollectionAddress)
  await nftCollection.withdrawFromPreDesignedCollection(to, withdrawAmount, preDesignedCollectionId)
  const balanceAfter = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(preDesignedCollectionAddress)
  expect(BigInt(balanceAfter.balance)).toEqual(BigInt(balanceBefore.balance) - withdrawAmount)
}