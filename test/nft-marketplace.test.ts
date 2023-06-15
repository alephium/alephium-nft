import { web3, subContractId, binToHex, encodeU256, addressFromContractId, sleep } from '@alephium/web3'
import { testNodeWallet, testAddress } from '@alephium/web3-test'
import { NFTCollection } from '../utils/nft-collection'
import { NFTMarketplace } from '../utils/nft-marketplace'
import { fetchNFTMarketplaceState, fetchNFTListingState } from '../utils/contracts'

describe('nft marketplace', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl)
  const provider = web3.getCurrentNodeProvider()

  test('Create NFT listing, update price and buy NFT through NFT marketplace', async () => {
    const signer = await testNodeWallet()
    const nftCollection = new NFTCollection(signer)
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
      const nftListingContractState = await fetchNFTListingState(nftListingContractAddress)
      expect(nftListingContractState.fields.price).toEqual(price)
      expect(nftListingContractState.fields.tokenId).toEqual(tokenId)
      expect(nftListingContractState.fields.tokenOwner).toEqual(testAddress)
      expect(nftListingContractState.fields.marketAddress).toEqual(nftMarketplaceContractAddress)
    }

    // Update the price
    const newPrice = BigInt("2000000000000000000")
    {
      await nftMarketplace.updateNFTPrice(newPrice, tokenId, nftMarketplaceContractId)
      const nftListingContractState = await fetchNFTListingState(nftListingContractAddress)
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

      const nftListingContractState = await fetchNFTListingState(nftListingContractAddress)
      expect(nftListingContractState.fields.tokenOwner).toEqual(testAddress)

      await nftMarketplace.cancelNFTListing(tokenId, nftMarketplaceContractId)

      // NFTListing doesn't exist any more
      await expect(fetchNFTListingState(nftListingContractAddress)).rejects.toThrow(Error)
    }
  }, 300000)

  test('Update metadata in the NFT marketplace', async () => {
    const signer = await testNodeWallet()
    const nftMarketplace = new NFTMarketplace(signer)
    await nftMarketplace.buildProject()

    const nftMarketplaceDeployTx = await nftMarketplace.create()
    const nftMarketplaceContractId = nftMarketplaceDeployTx.contractInstance.contractId
    const nftMarketplaceContractAddress = addressFromContractId(nftMarketplaceContractId)

    // Update listing price
    await checkListingFee(
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(10, 20, 20)

    // Update Commission Rate
    await checkCommissionRate(
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(200, 250, 250)

    // Update Admin
    const testAddress2 = '19PEu7VJMqbZDLtY8Jk9LNpwx5juUiC1WdFwo9QsPyX6y'
    await checkUpdateAdmin(
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
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
  }, 30000)

  function checkListingFee(
    nftMarketplace: NFTMarketplace,
    nftMarketplaceContractId: string,
    nftMarketplaceContractAddress: string
  ) {
    return async (previousValue: number, updateValue: number, updatedValue: number) => {
      const stateBefore = await fetchNFTMarketplaceState(nftMarketplaceContractAddress)
      expect(stateBefore.fields.listingFee).toEqual(BigInt(previousValue))

      await nftMarketplace.updateListingFee(BigInt(updateValue), nftMarketplaceContractId)

      const stateAfter = await fetchNFTMarketplaceState(nftMarketplaceContractAddress)
      expect(stateAfter.fields.listingFee).toEqual(BigInt(updatedValue))
    }
  }

  function checkCommissionRate(
    nftMarketplace: NFTMarketplace,
    nftMarketplaceContractId: string,
    nftMarketplaceContractAddress: string
  ) {
    return async (previousValue: number, updateValue: number, updatedValue: number) => {
      const stateBefore = await fetchNFTMarketplaceState(nftMarketplaceContractAddress)
      expect(stateBefore.fields.commissionRate).toEqual(BigInt(previousValue))

      await nftMarketplace.updateCommissionRate(BigInt(updateValue), nftMarketplaceContractId)

      const stateAfter = await fetchNFTMarketplaceState(nftMarketplaceContractAddress)
      expect(stateAfter.fields.commissionRate).toEqual(BigInt(updatedValue))
    }
  }

  function checkUpdateAdmin(
    nftMarketplace: NFTMarketplace,
    nftMarketplaceContractId: string,
    nftMarketplaceContractAddress: string
  ) {
    return async (previousValue: string, updateValue: string, updatedValue: string) => {
      const stateBefore = await fetchNFTMarketplaceState(nftMarketplaceContractAddress)
      expect(stateBefore.fields.admin).toEqual(previousValue)

      await nftMarketplace.updateAdmin(updateValue, nftMarketplaceContractId)

      const stateAfter = await fetchNFTMarketplaceState(nftMarketplaceContractAddress)
      expect(stateAfter.fields.admin).toEqual(updatedValue)
    }
  }
})
