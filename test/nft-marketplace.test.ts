import { web3, subContractId, binToHex, encodeU256, addressFromContractId, sleep, NodeProvider } from '@alephium/web3'
import { testWallet1, testAddress1, testAddress2 } from './signers'
import { NFTCollection } from '../utils/nft-collection'
import { NFTMarketplace } from '../utils/nft-marketplace'
import { fetchNFTMarketplaceState, fetchNFTState, fetchNFTListingState, fetchNFTCollectionState } from '../utils/contracts'
import { maxU256 } from '../utils'

describe('nft marketplace', function() {
  const nodeUrl = 'http://127.0.0.1:22973'
  web3.setCurrentNodeProvider(nodeUrl)
  const provider = web3.getCurrentNodeProvider()

  test('Create NFT listing, update price and buy NFT through NFT marketplace', async () => {
    const signer = await testWallet1()
    const nftCollection = new NFTCollection(provider, signer)
    const nftMarketplace = new NFTMarketplace(provider, signer)
    await nftMarketplace.buildProject()

    const nftMarketplaceDeployResult = await nftMarketplace.create()
    const nftMarketplaceContractAddress = nftMarketplaceDeployResult.contractAddress
    const nftMarketplaceContractId = nftMarketplaceDeployResult.contractId
    const nftCollectionDeployTx = await nftCollection.createOpenCollection("CryptoPunk", "CP", maxU256)
    const nftCollectionContractId = nftCollectionDeployTx.contractId
    const nftCollectionContractAddress = nftCollectionDeployTx.contractAddress

    const nftCollectionContractState = await fetchNFTCollectionState(nftCollectionContractAddress)
    expect(nftCollectionContractState.fields.currentTokenIndex).toEqual(0n)

    const nftUri = "https://cryptopunks.app/cryptopunks/details/1"
    const nftContractId = subContractId(nftCollectionContractId, binToHex(encodeU256(0n)), 0)
    const nftContractAddress = addressFromContractId(nftContractId)
    await nftCollection.mintNFT(
      nftCollectionContractId,
      nftUri
    )

    const nftContractState = await fetchNFTState(nftContractAddress)
    expect(nftContractState.fields.owner).toEqual(testAddress1)

    const tokenId = nftContractId
    const price = BigInt("1000000000000000000")
    const nftListingContractId = subContractId(nftMarketplaceContractId, tokenId, 0)
    const nftListingContractAddress = addressFromContractId(nftListingContractId)

    // Deposit NFT since it is withdrawn automatically when minted
    await nftCollection.depositNFT(nftContractId)

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
      expect(nftListedEventFields[2].value).toEqual(testAddress1)

      // Check the initial state for NFT listing
      const nftListingContractState = await fetchNFTListingState(nftListingContractAddress)
      expect(nftListingContractState.fields.price).toEqual(price)
      expect(nftListingContractState.fields.tokenId).toEqual(tokenId)
      expect(nftListingContractState.fields.tokenOwner).toEqual(testAddress1)
      expect(nftListingContractState.fields.marketAddress).toEqual(nftMarketplaceContractAddress)
      expect(nftListingContractState.fields.commissionRate).toEqual(200n)
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
      const nftContractStateBefore = await fetchNFTState(nftContractAddress)
      expect(nftContractStateBefore.fields.owner).toEqual(nftListingContractAddress)

      const totalAmount = newPrice + BigInt("1000000000000000000")
      await nftMarketplace.buyNFT(totalAmount, tokenId, nftMarketplaceContractId)
      await sleep(3000)

      const nftContractStateAfter = await fetchNFTState(nftContractAddress)
      expect(nftContractStateAfter.fields.owner).toEqual(testAddress1)

      const nftMarketplaceContractEvents = await provider.events.getEventsContractContractaddress(
        nftMarketplaceContractAddress,
        { start: 2, group: 0 }
      )
      expect(nftMarketplaceContractEvents.events.length).toEqual(1)

      const nftPriceUpdatedEventFields = nftMarketplaceContractEvents.events[0].fields
      expect(BigInt(+nftPriceUpdatedEventFields[0].value)).toEqual(newPrice)
      expect(nftPriceUpdatedEventFields[1].value).toEqual(tokenId)
      expect(nftPriceUpdatedEventFields[2].value).toEqual(testAddress1)
      expect(nftPriceUpdatedEventFields[3].value).toEqual(testAddress1)

      // TODO: Verify NFTListingContract is gone
    }

    // Withdraw & Deposit NFT
    {
      expect((await getTokens(provider, testAddress1))).not.toContain(tokenId)

      await nftCollection.withdrawNFT(nftContractId)

      expect((await getTokens(provider, testAddress1))).toContain(tokenId)

      await nftCollection.depositNFT(nftContractId)

      expect((await getTokens(provider, testAddress1))).not.toContain(tokenId)
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

      const nftContractStateBefore = await fetchNFTState(nftContractAddress)
      expect(nftContractStateBefore.fields.owner).toEqual(nftListingContractAddress)

      const nftListingContractState = await fetchNFTListingState(nftListingContractAddress)
      expect(nftListingContractState.fields.tokenOwner).toEqual(testAddress1)

      await nftMarketplace.cancelNFTListing(tokenId, nftMarketplaceContractId)

      const nftContractStateAfter = await fetchNFTState(nftContractAddress)
      expect(nftContractStateAfter.fields.owner).toEqual(testAddress1)

      // TODO: Verify NFTListingContract is gone
    }
  }, 300000)

  test('Update metadata in the NFT marketplace', async () => {
    const nodeUrl = 'http://127.0.0.1:22973'
    const provider = new NodeProvider(nodeUrl)
    const signer = await testWallet1()
    const nftMarketplace = new NFTMarketplace(provider, signer)
    await nftMarketplace.buildProject()

    const nftMarketplaceDeployTx = await nftMarketplace.create()
    const nftMarketplaceContractAddress = nftMarketplaceDeployTx.contractAddress
    const nftMarketplaceContractId = nftMarketplaceDeployTx.contractId

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
    await checkUpdateAdmin(
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(testAddress1, testAddress2, testAddress2)

    // Update with the wrong admin will *not* update the values correctly
    await checkListingFee(
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(20, 10, 20)

    await checkCommissionRate(
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(250, 200, 250)

    await checkUpdateAdmin(
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(testAddress2, testAddress1, testAddress2)
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

  async function getTokens(
    provider: NodeProvider,
    address: string
  ): Promise<string[]> {
    const utxos = await provider.addresses.getAddressesAddressUtxos(address)
    return utxos.utxos.flatMap((utxo) => utxo.tokens || []).map((token) => token.id)
  }
})
