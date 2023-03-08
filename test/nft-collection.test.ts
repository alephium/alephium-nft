import { web3, subContractId, addressFromContractId, encodeU256, binToHex } from '@alephium/web3'
import * as utils from '../utils'
import { NFTCollection } from '../utils/nft-collection'
import { testAddress1, testWallet1 } from './signers'
import { fetchNFTCollectionState, fetchNFTState } from '../utils/contracts'

describe('nft collection', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl)
  const provider = web3.getCurrentNodeProvider()

  it('should test nft collection', async () => {
    const signer = await testWallet1()
    const nftCollection = new NFTCollection(provider, signer)
    await nftCollection.buildProject()

    const nftCollectionDeployTx = await nftCollection.create("CryptoPunk", "CP")
    const nftCollectionContractId = nftCollectionDeployTx.contractId
    const nftCollectionContractAddress = nftCollectionDeployTx.contractAddress

    const nftCollectionContractState = await fetchNFTCollectionState(nftCollectionContractAddress)
    expect(nftCollectionContractState.fields.currentTokenIndex).toEqual(0n)

    // Mint NFT
    const nftUri = "https://cryptopunks.app/cryptopunks/details/1"

    const nftContractId = subContractId(nftCollectionContractId, binToHex(encodeU256(0n)), 0)
    const nftContractAddress = addressFromContractId(nftContractId)
    await nftCollection.mintNFT(
      nftCollectionContractId,
      nftUri
    )

    const nftCollectionContractEvents = await provider.events.getEventsContractContractaddress(
      nftCollectionContractAddress,
      { start: 0 }
    )

    expect(nftCollectionContractEvents.events.length).toEqual(1)

    const nftMintedEventFields = nftCollectionContractEvents.events[0].fields
    // Minter address
    expect(nftMintedEventFields[0].value).toEqual(testAddress1)
    // NFT collection contract id
    expect(nftMintedEventFields[1].value).toEqual(nftCollectionContractId)
    // Info of the minted NFT
    expect(utils.checkHexString(nftMintedEventFields[2].value, nftUri))
    // NFT contract id
    expect(nftMintedEventFields[3].value).toEqual(nftContractId)
    // Current token index
    expect(nftMintedEventFields[4].value).toEqual(binToHex(encodeU256(0n)))

    const nftContractState = await fetchNFTState(nftContractAddress)
    expect(nftContractState.fields.owner).toEqual(testAddress1)
    expect(nftContractState.fields.isTokenWithdrawn).toEqual(true)
    utils.checkHexString(nftContractState.fields.uri, "https://cryptopunks.app/cryptopunks/details/1")
    expect(nftContractState.fields.collectionId).toEqual(nftCollectionContractId)
    expect(nftContractState.fields.tokenIndex).toEqual(0n)

    // Deposit NFT since it is withdrawn automatically when minted
    await nftCollection.depositNFT(nftContractId)
    // Burn NFT
    const balanceBeforeBurning = await provider.addresses.getAddressesAddressBalance(testAddress1)

    const gasAmount = 20000
    const gasPrice = 1000000000 * 100
    const totalGas = gasAmount * gasPrice
    await nftCollection.burnNFT(
      subContractId(nftCollectionContractId, binToHex(encodeU256(0n)), 0),
      gasAmount,
      BigInt(gasPrice)
    )

    const alphAmountInNFT = +nftContractState.asset.alphAmount.toString()
    const balanceAfterBurning = await provider.addresses.getAddressesAddressBalance(testAddress1)
    const refundedFromNFT = +balanceAfterBurning.balance + totalGas - +balanceBeforeBurning.balance

    const relativeDiff = utils.relativeDiff(alphAmountInNFT, refundedFromNFT)
    expect(relativeDiff).toBeLessThan(0.001)
  }, 20000)
})
