import { web3, subContractId, addressFromContractId, binToHex, groupOfAddress, codec } from '@alephium/web3'
import { getSigners } from '@alephium/web3-test'
import * as utils from '../../../shared'
import { checkEvent, getNFTCollection, getNFTUri } from '../utils'
import { NFTCollectionHelper } from '../../../shared/nft-collection'
import { NFT, NFTOpenCollection, NFTOpenCollectionInstance, NFTOpenCollectionWithRoyaltyInstance } from '../../../artifacts/ts'

describe('nft open collection', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl, undefined, fetch)

  it('should test minting nft in open collection', async () => {
    // Without royalty
    await testNFTMinting(false)

    // With royalty
    await testNFTMinting(true)
  }, 60000)
})

const royaltyRate = BigInt(200)

async function testNFTMinting(royalty: boolean) {
  const [signer] = await getSigners(1)
  const nftCollection = await getNFTCollection(signer)

  let nftCollectionDeployTx
  if (royalty) {
    nftCollectionDeployTx = await nftCollection.openCollection.createWithRoyalty("https://crypto-punk-uri", royaltyRate, signer)
  } else {
    nftCollectionDeployTx = await nftCollection.openCollection.create("https://crypto-punk-uri", signer)
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
  nftIndex: bigint
) {
  let royalty = false
  if (nftOpenCollectionInstance instanceof NFTOpenCollectionWithRoyaltyInstance) {
    royalty = true
  }

  const nftCollectionContractAddress = addressFromContractId(nftOpenCollectionInstance.contractId)
  const group = groupOfAddress(nftCollectionContractAddress)
  const nftContractId = subContractId(
    nftOpenCollectionInstance.contractId, binToHex(codec.u256Codec.encode(nftIndex)), group
  )

  const { txId } = await nftCollection.openCollection.mint(
    nftOpenCollectionInstance.contractId,
    getNFTUri(nftIndex),
    royalty,
    nftCollection.signer
  )

  // NFT just minted
  const nftByIndexResult = await nftOpenCollectionInstance.view.nftByIndex({ args: { index: nftIndex } })
  expect(nftByIndexResult.returns).toEqual(nftContractId)
  // NFT doesn't exist yet
  await expect(nftOpenCollectionInstance.view.nftByIndex({ args: { index: nftIndex + BigInt(1) } })).rejects.toThrow(Error)

  const nftInstance = NFT.at(addressFromContractId(nftContractId))
  const nftContractState = await nftInstance.fetchState()
  const [collectionId, index] = (await nftInstance.view.getCollectionIndex()).returns
  expect(collectionId).toEqual(nftOpenCollectionInstance.contractId)
  expect(index).toEqual(nftIndex)
  utils.checkHexString(nftContractState.fields.tokenUri, getNFTUri(nftIndex))

  const account = await nftCollection.signer.getSelectedAccount()
  await checkEvent(NFTOpenCollection, txId, {
    txId,
    contractAddress: nftOpenCollectionInstance.address,
    eventIndex: 0,
    name: 'Mint',
    fields: { minter: account.address, index: nftIndex }
  })

  if (royalty) {
    const nftOpenCollectionWithRoyaltyInstance = nftOpenCollectionInstance as NFTOpenCollectionWithRoyaltyInstance
    const tokenIdResult = await nftOpenCollectionWithRoyaltyInstance.view.nftByIndex({ args: { index: nftIndex } })
    const tokenId = tokenIdResult.returns
    const royaltyAmount = await nftOpenCollectionWithRoyaltyInstance.view.royaltyAmount({ args: { tokenId: tokenId, salePrice: BigInt(100) } })

    expect(royaltyAmount.returns).toEqual(BigInt(100) * royaltyRate / BigInt(10000))
  }
  return txId
}
