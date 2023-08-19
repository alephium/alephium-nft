import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress } from '@alephium/web3'
import { getSigners } from '@alephium/web3-test'
import * as utils from '../../../shared'
import { checkEvent, getNFTCollection, getNFTUri } from '../utils'
import { NFTCollectionHelper } from '../../../shared/nft-collection'
import { NFTInstance, NFTOpenCollection, NFTOpenCollectionInstance, NFTOpenCollectionWithRoyaltyInstance } from '../../../artifacts/ts'

describe('nft open collection', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl, undefined, fetch)

  it('should test minting nft in open collection', async () => {
    // Without royalty
    await testNFTMinting(false)

    // With royalyt
    await testNFTMinting(true)
  }, 60000)
})

const royaltyRate = BigInt(200)

async function testNFTMinting(royalty: boolean) {
  const [signer] = await getSigners(1)
  const nftCollection = await getNFTCollection(signer)
  nftCollection.buildProject(false)

  let nftCollectionDeployTx = undefined
  if (royalty) {
    nftCollectionDeployTx = await nftCollection.createOpenCollectionWithRoyalty("https://crypto-punk-uri", royaltyRate, signer)
  } else {
    nftCollectionDeployTx = await nftCollection.createOpenCollection("https://crypto-punk-uri", signer)
  }

  const contractInstance = nftCollectionDeployTx.contractInstance
  const ownerAccount = await signer.getSelectedAccount()
  const nftCollectionState = await contractInstance.fetchState()
  expect(nftCollectionState.fields.collectionOwner).toEqual(ownerAccount.address)

  for (let i = BigInt(0); i < BigInt(10); i++) {
    await mintAndVerify(nftCollection, contractInstance, i)
  }
}

async function mintAndVerify(
  nftCollection: NFTCollectionHelper,
  nftOpenCollectionInstance: NFTOpenCollectionWithRoyaltyInstance | NFTOpenCollectionInstance,
  tokenIndex: bigint
) {
  let royalty = false
  if (nftOpenCollectionInstance instanceof NFTOpenCollectionWithRoyaltyInstance) {
    royalty = true
  }

  const nftCollectionContractAddress = addressFromContractId(nftOpenCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(
    nftOpenCollectionInstance.contractId, binToHex(encodeU256(tokenIndex)), group
  )

  const { txId } = await nftCollection.mintOpenNFT(
    nftOpenCollectionInstance.contractId,
    getNFTUri(tokenIndex),
    nftCollection.signer,
    royalty
  )

  // NFT just minted
  const nftByIndexResult = await nftOpenCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)
  // NFT doesn't exist yet
  await expect(nftOpenCollectionInstance.methods.nftByIndex({ args: { index: tokenIndex + BigInt(1) } })).rejects.toThrow(Error)

  const nftContractState = await new NFTInstance(addressFromContractId(nftContractId)).fetchState()
  utils.checkHexString(nftContractState.fields.tokenUri, getNFTUri(tokenIndex))

  const account = await nftCollection.signer.getSelectedAccount()
  await checkEvent(NFTOpenCollection, txId, {
    txId,
    contractAddress: nftOpenCollectionInstance.address,
    eventIndex: 0,
    name: 'Mint',
    fields: { minter: account.address, index: tokenIndex }
  })

  if (royalty) {
    const nftOpenCollectionWithRoyaltyInstance = nftOpenCollectionInstance as NFTOpenCollectionWithRoyaltyInstance
    const tokenIdResult = await nftOpenCollectionWithRoyaltyInstance.methods.nftByIndex({ args: { index: tokenIndex } })
    const tokenId = tokenIdResult.returns
    const royaltyAmount = await nftOpenCollectionWithRoyaltyInstance.methods.royaltyAmount({ args: { tokenId: tokenId, salePrice: BigInt(100) } })

    expect(royaltyAmount.returns).toEqual(BigInt(100) * royaltyRate / BigInt(10000))
  }
  return txId
}
