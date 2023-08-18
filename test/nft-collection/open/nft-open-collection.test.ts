import { web3, subContractId, addressFromContractId, encodeU256, binToHex, groupOfAddress } from '@alephium/web3'
import { getSigners } from '@alephium/web3-test'
import * as utils from '../../../shared'
import { checkEvent, getNFTCollection, getNFTUri } from '../utils'
import { NFTCollectionHelper } from '../../../shared/nft-collection'
import { NFTInstance, NFTOpenCollection, NFTOpenCollectionInstance } from '../../../artifacts/ts'

describe('nft open collection', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl, undefined, fetch)

  it('should test minting nft in open collection without royalty', async () => {
    const [signer] = await getSigners(1)
    const nftCollection = await getNFTCollection(signer)
    nftCollection.buildProject(false)

    const nftCollectionDeployTx = await nftCollection.createOpenCollection("https://crypto-punk-uri", signer)
    const nftCollectionInstance = nftCollectionDeployTx.contractInstance

    const ownerAccount = await signer.getSelectedAccount()
    const nftCollectionState = await nftCollectionInstance.fetchState()
    expect(nftCollectionState.fields.collectionOwner).toEqual(ownerAccount.address)

    for (let i = 0n; i < 10n; i++) {
      await mintOpenNFTAndVerify(nftCollection, nftCollectionInstance, i)
    }
  }, 60000)
})

async function mintOpenNFTAndVerify(
  nftCollection: NFTCollectionHelper,
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

  return txId
}
