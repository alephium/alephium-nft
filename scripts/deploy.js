const web3 = require('alephium-web3')
const fs = require('fs')

async function main() {
  const provider = new web3.NodeProvider('http://127.0.0.1:22973')
  const signer = await testWallet1(provider)


  // Create NFT marketplace
  const nftListingContract = await web3.Contract.fromSource(provider, 'nft_listing.ral')
  const nftMarketplaceContract = await web3.Contract.fromSource(provider, 'nft_marketplace.ral')
  const adminAccount = (await signer.getAccounts())[0]

  const createNFTMarketplaceTx = await nftMarketplaceContract.transactionForDeployment(signer, {
    initialFields: {
      nftListingByteCode: nftListingContract.bytecode,
      admin: adminAccount.address,
      listingPrice: 10,    // Listing price default to 10 ALPH
      commissionRate: 200  // 200 basis point: 2%
    }
  })
  const createNFTMarketplaceSubmitResult = await signer.submitTransaction(
    createNFTMarketplaceTx.unsignedTx,
    createNFTMarketplaceTx.txId
  )

  // Create the default NFT Collection
  const nftContract = await web3.Contract.fromSource(provider, 'nft.ral')
  const nftCollectionContract = await web3.Contract.fromSource(provider, 'nft_collection.ral')

  const nftCollectionDeployTx = await nftCollectionContract.transactionForDeployment(signer, {
    initialFields: {
      nftByteCode: nftContract.bytecode,
      collectionName: web3.stringToHex("DefaultCollection"),
      collectionDescription: web3.stringToHex("Default Collection"),
      collectionUri: web3.stringToHex("http://default.collection")
    }
  })

  const createNFTCollectionSubmitResult = await signer.submitTransaction(
    nftCollectionDeployTx.unsignedTx,
    nftCollectionDeployTx.txId
  )

  const config = JSON.stringify(
    {
      defaultNftCollectionContractId: nftCollectionDeployTx.contractId,
      marketplaceContractId: createNFTMarketplaceTx.contractId
    }
  )

  console.log('writing config', config)
  fs.writeFileSync('configs/addresses.json', config)
}

async function testWallet1(provider) {
  const wallet = new web3.NodeWallet(provider, 'alephium-web3-test-only-wallet')
  await wallet.unlock('alph')
  return wallet
}

(async () => {
  await main()
})().catch(e => {
  console.log(e)
});