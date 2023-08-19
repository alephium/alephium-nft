import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress, addressFromTokenId, ONE_ALPH, SignerProvider } from '@alephium/web3'
import { getSigners } from '@alephium/web3-test'
import * as utils from '../../../shared'
import { checkEvent, checkWithdraw, getNFTCollection, getNFTUri } from '../utils'
import { NFTCollectionHelper } from '../../../shared/nft-collection'
import { NFTInstance, NFTPublicSaleCollectionRandom, NFTPublicSaleCollectionRandomInstance } from '../../../artifacts/ts'

describe('nft public sale collection - random', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl, undefined, fetch)

  it('should test minting nft in NFTPublicSaleCollectionRandom', async () => {
    const maxSupply = 10
    const sequential = Array.from(Array(maxSupply).keys())
    await testNFTMinting(sequential)

    const random = sequential.sort(() => Math.random() - 0.5)
    await testNFTMinting(random)
  }, 60000)
})

async function testNFTMinting(tokenIndexes: number[]) {
  const maxSupply = BigInt(tokenIndexes.length)
  const mintPrice = ONE_ALPH
  const [signer] = await getSigners(1)
  const nftCollection = await getNFTCollection(signer)
  const nftPublicSaleCollectionInstance = await getNFTPublicSaleCollectionRandomInstance(nftCollection, maxSupply, mintPrice, signer)
  const signerAddress = (await nftCollection.signer.getSelectedAccount()).address

  const balanceBefore = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPublicSaleCollectionInstance.address)
  for (const i of tokenIndexes) {
    await mintAndVerify(nftCollection, nftPublicSaleCollectionInstance, BigInt(i), mintPrice)
  }
  const balanceAfter = await nftCollection.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPublicSaleCollectionInstance.address)
  expect(BigInt(balanceBefore.balance)).toEqual(BigInt(balanceAfter.balance) - mintPrice * maxSupply)

  // Can't mint the same NFT again
  await expect(mintAndVerify(nftCollection, nftPublicSaleCollectionInstance, BigInt(4), mintPrice)).rejects.toThrow(Error)
  // Can't mint the NFT with out-of-bound index
  await expect(mintAndVerify(nftCollection, nftPublicSaleCollectionInstance, maxSupply, mintPrice)).rejects.toThrow(Error)
  // Withdraw too much
  await expect(checkWithdraw(nftCollection, nftPublicSaleCollectionInstance.contractId, signerAddress, BigInt(10.1e18))).rejects.toThrow(Error)
  // Successful Withdraw
  await checkWithdraw(nftCollection, nftPublicSaleCollectionInstance.contractId, signerAddress, BigInt(10e18))
}

async function mintAndVerify(
  nftCollection: NFTCollectionHelper,
  nftPublicSaleCollectionInstance: NFTPublicSaleCollectionRandomInstance,
  tokenIndex: bigint,
  mintPrice: bigint
) {
  const nftCollectionContractAddress = addressFromContractId(nftPublicSaleCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(nftPublicSaleCollectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group)

  const result = await nftCollection.mintSpecificPublicSaleNFT(tokenIndex, mintPrice, nftPublicSaleCollectionInstance.contractId)

  // NFT just minted
  const nftByIndexResult = await nftPublicSaleCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)

  const nftContractState = await new NFTInstance(addressFromContractId(nftContractId)).fetchState()
  expect(nftContractState.fields.collectionId).toEqual(nftPublicSaleCollectionInstance.contractId)
  expect(nftContractState.fields.nftIndex).toEqual(tokenIndex)
  const nftInstance = new NFTInstance(addressFromTokenId(nftContractId))
  const tokenUri = (await nftInstance.methods.getTokenUri()).returns
  utils.checkHexString(tokenUri, getNFTUri(tokenIndex))
  const collectionId = (await nftInstance.methods.getCollectionId()).returns
  expect(collectionId).toEqual(nftPublicSaleCollectionInstance.contractId)

  const account = await nftCollection.signer.getSelectedAccount()
  await checkEvent(NFTPublicSaleCollectionRandom, result.txId, {
    txId: result.txId,
    contractAddress: nftPublicSaleCollectionInstance.address,
    eventIndex: 0,
    name: 'Mint',
    fields: { minter: account.address, index: tokenIndex }
  })
}

async function getNFTPublicSaleCollectionRandomInstance(
  nftCollection: NFTCollectionHelper,
  maxSupply: bigint,
  mintPrice: bigint,
  signer: SignerProvider
) {
  const nftCollectionDeployTx = await nftCollection.createPublicSaleCollectionRandom(
    maxSupply,
    mintPrice,
    "https://crypto-punk-uri",
    "https://cryptopunks.app/cryptopunks/details/"
  )
  const nftPublicSaleCollectionRandomInstance = nftCollectionDeployTx.contractInstance

  const ownerAccount = await signer.getSelectedAccount()
  const nftCollectionState = await nftPublicSaleCollectionRandomInstance.fetchState()
  expect(nftCollectionState.fields.collectionOwner).toEqual(ownerAccount.address)

  return nftPublicSaleCollectionRandomInstance
}
