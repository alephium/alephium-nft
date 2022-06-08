import * as web3 from 'alephium-web3'
import * as utils from '../test/helpers/utils'
import { NFTCollection } from '../test/helpers/nft-collection'
import { testWallet1, testAddress1 } from '../test/helpers/signer'

describe('nft collection', function() {
  it('should test nft collection', async () => {
    const provider = new web3.NodeProvider('http://127.0.0.1:22973')
    const signer = await testWallet1(provider)

    const nftCollection = new NFTCollection(provider, signer)

    const [
      nftCollectionContractId,
      nftCollectionContractAddress,
      nftCollectionContractGroup
    ] = await nftCollection.create(
      "CryptoPunk", "CP", "https://www.larvalabs.com/cryptopunks"
    )

    // Mint NFT
    const nftUri = "https://cryptopunks.app/cryptopunks/details/1"
    const nftContractId = utils.subContractId(nftCollectionContractId, web3.stringToHex(nftUri))
    const nftName = "CryptoPunk #0001"
    const nftSymbol = "CP0001"
    const nftContractAddress = utils.addressFromContractId(nftContractId)
    await nftCollection.mintNFT(
      nftCollectionContractId,
      nftCollectionContractAddress,
      nftCollectionContractGroup,
      nftName,
      nftSymbol,
      nftUri
    )

    const nftCollectionContractEvents = await provider.events.getEventsContractContractaddress(
      nftCollectionContractAddress,
      { start: 0, group: nftCollectionContractGroup }
    )

    expect(nftCollectionContractEvents.events.length).toEqual(1)

    const nftMintedEventFields = nftCollectionContractEvents.events[0].fields
    // Check minter address
    expect(nftMintedEventFields[0].value).toEqual(testAddress1)
    // Check collection address
    expect(nftMintedEventFields[1].value).toEqual(nftCollectionContractAddress)
    // Check info of the minted NFT
    expect(utils.checkHexString(nftMintedEventFields[2].value, nftName))
    expect(utils.checkHexString(nftMintedEventFields[3].value, nftSymbol))
    expect(utils.checkHexString(nftMintedEventFields[4].value, nftUri))
    expect(nftMintedEventFields[5].value).toEqual(nftContractId)
    expect(nftMintedEventFields[6].value).toEqual(nftContractAddress)

    const nftContractState = await provider.contracts.getContractsAddressState(
      nftContractAddress, { group: 0 }
    )
    expect(nftContractState.fields.length).toEqual(5)
    expect(nftContractState.fields[0].value).toEqual(testAddress1)
    utils.checkHexString(nftContractState.fields[1].value, "CryptoPunk #0001")
    utils.checkHexString(nftContractState.fields[2].value, "CP0001")
    utils.checkHexString(nftContractState.fields[3].value, "https://cryptopunks.app/cryptopunks/details/1")
    expect(nftContractState.fields[4].value).toEqual(nftCollectionContractAddress)


    // Burn NFT
    const balanceBeforeBurning = await provider.addresses.getAddressesAddressBalance(testAddress1)

    const gasAmount = 20000
    const gasPrice = 1000000000 * 100
    const totalGas = gasAmount * gasPrice
    await nftCollection.burnNFT(
      utils.subContractId(nftCollectionContractId, web3.stringToHex(nftUri)),
      gasAmount,
      gasPrice
    )

    const alphAmountInNFT = +nftContractState.asset.alphAmount
    const balanceAfterBurning = await provider.addresses.getAddressesAddressBalance(testAddress1)
    const refundedFromNFT = +balanceAfterBurning.balance + totalGas - +balanceBeforeBurning.balance

    const relativeDiff = utils.relativeDiff(alphAmountInNFT, refundedFromNFT)
    expect(relativeDiff).toBeLessThan(0.001)
  })
})