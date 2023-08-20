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
  NFTPublicSaleCollectionRandom,
  NFTPublicSaleCollectionRandomInstance,
  NFTPublicSaleCollectionRandomWithRoyaltyInstance
} from '../../../artifacts/ts'

describe('nft public sale collection - random', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl, undefined, fetch)

  it('should test minting nft in NFTPublicSaleCollectionRandom', async () => {
    const maxSupply = 10
    const sequential = Array.from(Array(maxSupply).keys())
    // Sequential, without royalty
    await testNFTMinting(sequential, false)
    // Sequential, with royalty
    await testNFTMinting(sequential, true)

    const random = sequential.sort(() => Math.random() - 0.5)
    // Specific, without royalty
    await testNFTMinting(random, false)
    // Specific, royalty
    await testNFTMinting(random, true)
  }, 60000)
})

const royaltyRate = BigInt(200)

async function testNFTMinting(tokenIndexes: number[], royalty: boolean = false) {
  const maxSupply = BigInt(tokenIndexes.length)
  const mintPrice = ONE_ALPH
  const [signer] = await getSigners(1)
  const nftCollectionHelper = await getNFTCollection(signer)
  const nftPublicSaleCollectionInstance = await getCollectionInstance(nftCollectionHelper, maxSupply, mintPrice, royalty, signer)
  const signerAddress = (await nftCollectionHelper.signer.getSelectedAccount()).address

  const balanceBefore = await nftCollectionHelper.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPublicSaleCollectionInstance.address)
  for (const i of tokenIndexes) {
    await mintAndVerify(nftCollectionHelper, nftPublicSaleCollectionInstance, BigInt(i), mintPrice)
  }
  const balanceAfter = await nftCollectionHelper.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftPublicSaleCollectionInstance.address)
  expect(BigInt(balanceBefore.balance)).toEqual(BigInt(balanceAfter.balance) - mintPrice * maxSupply)

  // Can't mint the same NFT again
  await expect(mintAndVerify(nftCollectionHelper, nftPublicSaleCollectionInstance, BigInt(4), mintPrice)).rejects.toThrow(Error)
  // Can't mint the NFT with out-of-bound index
  await expect(mintAndVerify(nftCollectionHelper, nftPublicSaleCollectionInstance, maxSupply, mintPrice)).rejects.toThrow(Error)
  // Withdraw too much
  await expect(checkWithdraw(nftCollectionHelper, nftPublicSaleCollectionInstance.contractId, signerAddress, BigInt(10.1e18), royalty)).rejects.toThrow(Error)
  // Successful Withdraw
  await checkWithdraw(nftCollectionHelper, nftPublicSaleCollectionInstance.contractId, signerAddress, BigInt(10e18), royalty)
}

async function mintAndVerify(
  nftCollection: NFTCollectionHelper,
  collectionInstance: NFTPublicSaleCollectionRandomInstance | NFTPublicSaleCollectionRandomWithRoyaltyInstance,
  tokenIndex: bigint,
  mintPrice: bigint
) {
  let royalty = false
  if (collectionInstance instanceof NFTPublicSaleCollectionRandomWithRoyaltyInstance) {
    royalty = true
  }

  const nftCollectionContractAddress = addressFromContractId(collectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(collectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group)

  const result = await nftCollection.mintSpecific(tokenIndex, mintPrice, collectionInstance.contractId, royalty)

  // NFT just minted
  const nftByIndexResult = await collectionInstance.methods.nftByIndex({ args: { index: tokenIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)

  const nftContractState = await new NFTInstance(addressFromContractId(nftContractId)).fetchState()
  expect(nftContractState.fields.collectionId).toEqual(collectionInstance.contractId)
  expect(nftContractState.fields.nftIndex).toEqual(tokenIndex)
  const nftInstance = new NFTInstance(addressFromTokenId(nftContractId))
  const tokenUri = (await nftInstance.methods.getTokenUri()).returns
  utils.checkHexString(tokenUri, getNFTUri(tokenIndex))
  const collectionId = (await nftInstance.methods.getCollectionId()).returns
  expect(collectionId).toEqual(collectionInstance.contractId)

  const account = await nftCollection.signer.getSelectedAccount()
  await checkEvent(NFTPublicSaleCollectionRandom, result.txId, {
    txId: result.txId,
    contractAddress: collectionInstance.address,
    eventIndex: 0,
    name: 'Mint',
    fields: { minter: account.address, index: tokenIndex }
  })

  if (royalty) {
    const nftPublicSaleCollectionRandomWithRoyaltyInstance = collectionInstance as NFTPublicSaleCollectionRandomWithRoyaltyInstance
    const tokenIdResult = await nftPublicSaleCollectionRandomWithRoyaltyInstance.methods.nftByIndex({ args: { index: tokenIndex } })
    const tokenId = tokenIdResult.returns
    const royaltyAmount = await nftPublicSaleCollectionRandomWithRoyaltyInstance.methods.royaltyAmount({ args: { tokenId: tokenId, salePrice: BigInt(100) } })
    expect(royaltyAmount.returns).toEqual(BigInt(100) * royaltyRate / BigInt(10000))
  }
}

async function getCollectionInstance(
  nftCollection: NFTCollectionHelper,
  maxSupply: bigint,
  mintPrice: bigint,
  royalty: boolean,
  signer: SignerProvider
): Promise<NFTPublicSaleCollectionRandomInstance | NFTPublicSaleCollectionRandomWithRoyaltyInstance> {
  let collectionInstance = undefined
  if (royalty) {
    const nftCollectionDeployTx = await nftCollection.createPublicSaleCollectionRandomWithRoyalty(
      maxSupply,
      mintPrice,
      "https://crypto-punk-uri",
      "https://cryptopunks.app/cryptopunks/details/",
      royaltyRate
    )
    collectionInstance = nftCollectionDeployTx.contractInstance
  } else {
    const nftCollectionDeployTx = await nftCollection.createPublicSaleCollectionRandom(
      maxSupply,
      mintPrice,
      "https://crypto-punk-uri",
      "https://cryptopunks.app/cryptopunks/details/"
    )
    collectionInstance = nftCollectionDeployTx.contractInstance
  }

  const ownerAccount = await signer.getSelectedAccount()
  const nftCollectionState = await collectionInstance.fetchState()
  expect(nftCollectionState.fields.collectionOwner).toEqual(ownerAccount.address)

  return collectionInstance
}
