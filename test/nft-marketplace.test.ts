import { web3, subContractId, binToHex, encodeU256, addressFromContractId, sleep, ONE_ALPH } from '@alephium/web3'
import { testNodeWallet, testAddress } from '@alephium/web3-test'
import { NFTCollectionHelper } from '../shared/nft-collection'
import { NFTMarketplace } from '../shared/nft-marketplace'
import { NFTListingInstance, NFTMarketPlaceInstance } from '../artifacts/ts'

describe('nft marketplace', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl)
  const provider = web3.getCurrentNodeProvider()
  const testAddress2 = '19PEu7VJMqbZDLtY8Jk9LNpwx5juUiC1WdFwo9QsPyX6y'

  test('Create NFT listing, update price and buy NFT through NFT marketplace', async () => {
    const signer = await testNodeWallet()
    const nftCollection = new NFTCollectionHelper(signer)
    const nftMarketplace = new NFTMarketplace(signer)
    await nftMarketplace.buildProject()

    const nftMarketplaceDeployResult = await nftMarketplace.create()
    const nftMarketplaceContractId = nftMarketplaceDeployResult.contractInstance.contractId
    const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
    const nftCollectionDeployTx = await nftCollection.createOpenCollection("https://crypto-punk-uri")
    const nftCollectionContractId = nftCollectionDeployTx.contractInstance.contractId

    const nftUri = "https://cryptopunks.app/cryptopunks/details/1"
    const nftContractId = subContractId(nftCollectionContractId, binToHex(encodeU256(0n)), 0)
    await nftCollection.mintOpenNFT(
      nftCollectionContractId,
      nftUri
    )

    const tokenId = nftContractId
    const price = BigInt("1000000000000000000")
    const nftListingContractId = subContractId(nftMarketplaceContractId, tokenId, 0)
    const nftListingContractAddress = addressFromContractId(nftListingContractId)

    // list NFT
    {
      await nftMarketplace.listNFT(tokenId, price, nftMarketplaceContractId)
      await sleep(3000)

      const nftMarketplaceContractEvents = await provider.events.getEventsContractContractaddress(
        nftMarketplaceContractAddress,
        { start: 0, group: 0 }
      )
      expect(nftMarketplaceContractEvents.events.length).toEqual(1)

      const nftListedEventFields = nftMarketplaceContractEvents.events[0].fields
      expect(BigInt(+nftListedEventFields[0].value)).toEqual(price)
      expect(nftListedEventFields[1].value).toEqual(tokenId)
      expect(nftListedEventFields[2].value).toEqual(testAddress)

      // Check the initial state for NFT listing
      const nftListingContractState = await new NFTListingInstance(nftListingContractAddress).fetchState()
      expect(nftListingContractState.fields.price).toEqual(price)
      expect(nftListingContractState.fields.tokenId).toEqual(tokenId)
      expect(nftListingContractState.fields.tokenOwner).toEqual(testAddress)
      expect(nftListingContractState.fields.marketAddress).toEqual(nftMarketplaceContractAddress)
    }

    // Update the price
    const newPrice = BigInt("2000000000000000000")
    {
      await nftMarketplace.updateNFTPrice(newPrice, tokenId, nftMarketplaceContractId)
      const nftListingContractState = await new NFTListingInstance(nftListingContractAddress).fetchState()
      expect(nftListingContractState.fields.price).toEqual(newPrice)

      const nftMarketplaceContractEvents = await provider.events.getEventsContractContractaddress(
        nftMarketplaceContractAddress,
        { start: 1, group: 0 }
      )
      expect(nftMarketplaceContractEvents.events.length).toEqual(1)

      const nftPriceUpdatedEventFields = nftMarketplaceContractEvents.events[0].fields
      expect(nftPriceUpdatedEventFields[0].value).toEqual(tokenId)
      expect(BigInt(+nftPriceUpdatedEventFields[1].value)).toEqual(price)
      expect(BigInt(+nftPriceUpdatedEventFields[2].value)).toEqual(newPrice)
    }
    // TODO: verify other signer won't be able to update price

    // Buy the NFT
    {
      const totalAmount = newPrice + BigInt("1000000000000000000")
      await nftMarketplace.buyNFT(totalAmount, tokenId, nftMarketplaceContractId)
      await sleep(3000)

      const nftMarketplaceContractEvents = await provider.events.getEventsContractContractaddress(
        nftMarketplaceContractAddress,
        { start: 2, group: 0 }
      )
      expect(nftMarketplaceContractEvents.events.length).toEqual(1)

      const nftPriceUpdatedEventFields = nftMarketplaceContractEvents.events[0].fields
      expect(BigInt(+nftPriceUpdatedEventFields[0].value)).toEqual(newPrice)
      expect(nftPriceUpdatedEventFields[1].value).toEqual(tokenId)
      expect(nftPriceUpdatedEventFields[2].value).toEqual(testAddress)
      expect(nftPriceUpdatedEventFields[3].value).toEqual(testAddress)

      // TODO: Verify NFTListingContract is gone
    }

    // Cancel the listing
    {
      await nftMarketplace.listNFT(tokenId, price, nftMarketplaceContractId)

      const nftMarketplaceContractEvents = await provider.events.getEventsContractContractaddress(
        nftMarketplaceContractAddress,
        { start: 3, group: 0 }
      )

      expect(nftMarketplaceContractEvents.events.length).toEqual(1)

      const nftListedEventFields = nftMarketplaceContractEvents.events[0].fields
      const nftListingContractId = nftListedEventFields[3].value.toString()
      const nftListingContractAddress = addressFromContractId(nftListingContractId)

      const nftListingContractState = await new NFTListingInstance(nftListingContractAddress).fetchState()
      expect(nftListingContractState.fields.tokenOwner).toEqual(testAddress)

      await nftMarketplace.cancelNFTListing(tokenId, nftMarketplaceContractId)

      // NFTListing doesn't exist any more
      await expect(new NFTListingInstance(nftListingContractAddress).fetchState()).rejects.toThrow(Error)
    }

    // Check withdraw
    {
      await checkWithdraw(
        nftMarketplace,
        nftMarketplaceContractId,
        testAddress2,
        nftMarketplace.defaultListingFee
      )
    }
  }, 300000)

  test('Update metadata in the NFT marketplace', async () => {
    const signer = await testNodeWallet()
    const nftMarketplace = new NFTMarketplace(signer)
    await nftMarketplace.buildProject()

    const nftMarketplaceDeployTx = await nftMarketplace.create()
    const nftMarketplaceContractId = nftMarketplaceDeployTx.contractInstance.contractId

    // Update listing price
    await checkListingFee(
      nftMarketplace,
      nftMarketplaceContractId
    )(ONE_ALPH / 10n, ONE_ALPH / 5n, ONE_ALPH / 5n)

    // Update Commission Rate
    await checkCommissionRate(
      nftMarketplace,
      nftMarketplaceContractId
    )(200, 250, 250)

    // Update Admin
    await checkUpdateAdmin(
      nftMarketplace,
      nftMarketplaceContractId
    )(testAddress, testAddress2, testAddress2)

    // Update with the wrong admin will fail
    await expect(
      nftMarketplace.updateListingFee(BigInt(10), nftMarketplaceContractId)
    ).rejects.toThrow(Error)

    await expect(
      nftMarketplace.updateCommissionRate(BigInt(200), nftMarketplaceContractId)
    ).rejects.toThrow(Error)

    await expect(
      nftMarketplace.updateAdmin(testAddress, nftMarketplaceContractId)
    ).rejects.toThrow(Error)

    await expect(
      nftMarketplace.withdrawFromMarketPlace(testAddress, ONE_ALPH / 10n, nftMarketplaceContractId)
    ).rejects.toThrow(Error)
  }, 30000)

  function checkListingFee(
    nftMarketplace: NFTMarketplace,
    nftMarketplaceContractId: string,
  ) {
    const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
    return async (previousValue: bigint, updateValue: bigint, updatedValue: bigint) => {
      const stateBefore = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
      expect(stateBefore.fields.listingFee).toEqual(previousValue)

      await nftMarketplace.updateListingFee(updateValue, nftMarketplaceContractId)

      const stateAfter = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
      expect(stateAfter.fields.listingFee).toEqual(updatedValue)
    }
  }

  function checkCommissionRate(
    nftMarketplace: NFTMarketplace,
    nftMarketplaceContractId: string,
  ) {
    const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
    return async (previousValue: number, updateValue: number, updatedValue: number) => {
      const stateBefore = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
      expect(stateBefore.fields.commissionRate).toEqual(BigInt(previousValue))

      await nftMarketplace.updateCommissionRate(BigInt(updateValue), nftMarketplaceContractId)

      const stateAfter = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
      expect(stateAfter.fields.commissionRate).toEqual(BigInt(updatedValue))
    }
  }

  function checkUpdateAdmin(
    nftMarketplace: NFTMarketplace,
    nftMarketplaceContractId: string,
  ) {
    const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
    return async (previousValue: string, updateValue: string, updatedValue: string) => {
      const stateBefore = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
      expect(stateBefore.fields.admin).toEqual(previousValue)

      await nftMarketplace.updateAdmin(updateValue, nftMarketplaceContractId)

      const stateAfter = await new NFTMarketPlaceInstance(nftMarketplaceContractAddress).fetchState()
      expect(stateAfter.fields.admin).toEqual(updatedValue)
    }
  }

  async function checkWithdraw(
    nftMarketplace: NFTMarketplace,
    nftMarketplaceContractId: string,
    to: string,
    withdrawAmount: bigint
  ) {
    const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)
    const balanceBefore = await nftMarketplace.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftMarketplaceContractAddress)
    await nftMarketplace.withdrawFromMarketPlace(to, withdrawAmount, nftMarketplaceContractId)
    const balanceAfter = await nftMarketplace.signer.nodeProvider!.addresses.getAddressesAddressBalance(nftMarketplaceContractAddress)
    expect(BigInt(balanceAfter.balance)).toEqual(BigInt(balanceBefore.balance) - withdrawAmount)
  }
})
