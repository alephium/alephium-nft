import * as web3 from '@alephium/web3'
import { verifyContractState } from '../utils'
import { testWallet1, testAddress1, testAddress2 } from './signers'
import { NFTCollection } from '../utils/nft-collection'
import { NFTMarketplace } from '../utils/nft-marketplace'
import { addressFromContractId, NodeProvider } from '@alephium/web3'

describe('nft marketplace', function() {
  test('Create NFT listing, update price and buy NFT through NFT marketplace', async () => {
    const provider = new web3.NodeProvider('http://127.0.0.1:22973')
    const signer = await testWallet1(provider)
    const nftCollection = new NFTCollection(provider, signer, testAddress1, true)
    const nftMarketplace = new NFTMarketplace(provider, signer, testAddress1, true)

    const nftMarketplaceDeployTx = await nftMarketplace.create()
    const nftMarketplaceContractAddress = nftMarketplaceDeployTx.contractAddress
    const nftMarketplaceContractId = nftMarketplaceDeployTx.contractId
    const nftCollectionDeployTx = await nftCollection.create(
      "CryptoPunk", "CP", "https://www.larvalabs.com/cryptopunks"
    )
    const nftCollectionContractId = nftCollectionDeployTx.contractId

    const nftUri = "https://cryptopunks.app/cryptopunks/details/1"
    const nftContractId = web3.subContractId(nftCollectionContractId, web3.stringToHex(nftUri))
    const nftContractAddress = web3.addressFromContractId(nftContractId)
    await nftCollection.mintNFT(
      nftCollectionContractId,
      "CryptoPunk #0001",
      "CP0001",
      nftUri
    )


    verifyContractState(provider, nftContractAddress, (state) => {
      // check the owner
      expect(state.fields[0].value).toEqual(testAddress1)
    })

    const tokenId = nftContractId
    const price = BigInt("1000000000000000000")
    const nftListingContractId = web3.subContractId(nftMarketplaceContractId, tokenId)
    const nftListingContractAddress = web3.addressFromContractId(nftListingContractId)

    // list NFT
    {
      await nftMarketplace.listNFT(tokenId, price, nftMarketplaceContractId)
      await web3.timeout(3000)

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
      await verifyContractState(provider, nftListingContractAddress, (state) => {
        expect(state.fields.length).toEqual(5)
        expect(BigInt(+state.fields[0].value)).toEqual(price)
        expect(state.fields[1].value).toEqual(tokenId)
        expect(state.fields[2].value).toEqual(testAddress1)
        expect(state.fields[3].value).toEqual(nftMarketplaceContractAddress)
        expect(+state.fields[4].value).toEqual(200)
      })
    }

    // Update the price
    const newPrice = BigInt("2000000000000000000")
    {
      await nftMarketplace.updateNFTPrice(newPrice, tokenId, nftMarketplaceContractId)
      await verifyContractState(provider, nftListingContractAddress, (state) => {
        expect(BigInt(+state.fields[0].value)).toEqual(newPrice)
      })

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
      await verifyContractState(provider, nftContractAddress, (state) => {
        // Owner of the token is the NFTListingContract
        expect(state.fields[0].value).toEqual(nftListingContractAddress)
      })

      const totalAmount = newPrice + BigInt("1000000000000000000")
      await nftMarketplace.buyNFT(totalAmount, tokenId, nftMarketplaceContractId)
      await web3.timeout(3000)

      await verifyContractState(provider, nftContractAddress, (state) => {
        // Owner of the token is back to testAddress1
        expect(state.fields[0].value).toEqual(testAddress1)
      })

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

      await verifyContractState(provider, nftContractAddress, (state) => {
        // Owner of the token is the NFTListingContract
        expect(state.fields[0].value).toEqual(nftListingContractAddress)
      })

      await verifyContractState(provider, nftListingContractAddress, (state) => {
        // Token owner in the NFTListingConctract is testAddress1
        expect(state.fields[2].value).toEqual(testAddress1)
      })

      await nftMarketplace.cancelNFTListing(tokenId, nftMarketplaceContractId)

      await verifyContractState(provider, nftContractAddress, (state) => {
        // Owner of the token is the NFTListingContract
        expect(state.fields[0].value).toEqual(testAddress1)
      })

      // TODO: Verify NFTListingContract is gone
    }
  }, 30000)

  test('Update metadata in the NFT marketplace', async () => {
    const provider = new web3.NodeProvider('http://127.0.0.1:22973')
    const signer = await testWallet1(provider)
    const nftMarketplace = new NFTMarketplace(provider, signer, testAddress1, true)

    const nftMarketplaceDeployTx = await nftMarketplace.create()
    const nftMarketplaceContractAddress = nftMarketplaceDeployTx.contractAddress
    const nftMarketplaceContractId = nftMarketplaceDeployTx.contractId

    // Update listing price
    await checkListingFee(
      provider,
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(10, 20, 20)

    // Update Commission Rate
    await checkCommissionRate(
      provider,
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(200, 250, 250)

    // Update Admin
    await checkUpdateAdmin(
      provider,
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(testAddress1, testAddress2, testAddress2)

    // Update with the wrong admin will *not* update the values correctly
    await checkListingFee(
      provider,
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(20, 10, 20)

    await checkCommissionRate(
      provider,
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(250, 200, 250)

    await checkUpdateAdmin(
      provider,
      nftMarketplace,
      nftMarketplaceContractId,
      nftMarketplaceContractAddress
    )(testAddress2, testAddress1, testAddress2)
  }, 15000)

  function checkListingFee(
    provider: NodeProvider,
    nftMarketplace: NFTMarketplace,
    nftMarketplaceContractId: string,
    nftMarketplaceContractAddress: string
  ) {
    return async (previousValue: number, updateValue: number, updatedValue: number) => {
      await verifyContractState(provider, nftMarketplaceContractAddress, (state) => {
        expect(+state.fields[2].value).toEqual(previousValue)
      })

      await nftMarketplace.updateListingFee(updateValue, nftMarketplaceContractId)

      await verifyContractState(provider, nftMarketplaceContractAddress, (state) => {
        expect(+state.fields[2].value).toEqual(updatedValue)
      })
    }
  }

  function checkCommissionRate(
    provider: NodeProvider,
    nftMarketplace: NFTMarketplace,
    nftMarketplaceContractId: string,
    nftMarketplaceContractAddress: string
  ) {
    return async (previousValue: number, updateValue: number, updatedValue: number) => {
      await verifyContractState(provider, nftMarketplaceContractAddress, (state) => {
        expect(+state.fields[3].value).toEqual(previousValue)
      })

      await nftMarketplace.updateCommissionRate(updateValue, nftMarketplaceContractId)

      await verifyContractState(provider, nftMarketplaceContractAddress, (state) => {
        expect(+state.fields[3].value).toEqual(updatedValue)
      })
    }
  }

  function checkUpdateAdmin(
    provider: NodeProvider,
    nftMarketplace: NFTMarketplace,
    nftMarketplaceContractId: string,
    nftMarketplaceContractAddress: string
  ) {
    return async (previousValue: string, updateValue: string, updatedValue: string) => {
      await verifyContractState(provider, nftMarketplaceContractAddress, (state) => {
        expect(state.fields[1].value).toEqual(previousValue)
      })

      await nftMarketplace.updateAdmin(updateValue, nftMarketplaceContractId)

      await verifyContractState(provider, nftMarketplaceContractAddress, (state) => {
        expect(state.fields[1].value).toEqual(updatedValue)
      })
    }
  }

  async function getTokens(
    provider: NodeProvider,
    address: string
  ): Promise<string[]> {
    const utxos = await provider.addresses.getAddressesAddressUtxos(address)
    return utxos.utxos.flatMap((utxo) => utxo.tokens).map((token) => token.id)
  }
})
