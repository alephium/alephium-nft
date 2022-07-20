const base58 = require('bs58')
const fs = require('fs')
const web3 = require('@alephium/web3')
const { randomBytes } = require('crypto')

async function main() {
  const provider = new web3.NodeProvider('http://127.0.0.1:22973')
  const signer = await testWallet1(provider)
  const adminAccount = (await signer.getAccounts())[0]

  // Create NFT marketplace
  const nftListingContract = await web3.Contract.fromSource(provider, 'nft_listing.ral')
  const createNFTListingTx = await nftListingContract.transactionForDeployment(signer, {
    initialFields: {
      price: 1000,
      tokenId: randomContractId(),
      tokenOwner: randomContractAddress(),
      marketAddress: randomContractAddress(),
      commissionRate: 200  // 200 basis point: 2%
    }
  })
  await signer.submitTransaction(
    createNFTListingTx.unsignedTx,
    createNFTListingTx.txId
  )

  const nftMarketplaceContract = await web3.Contract.fromSource(provider, 'nft_marketplace.ral')
  const createNFTMarketplaceTx = await nftMarketplaceContract.transactionForDeployment(signer, {
    initialFields: {
      nftListingTemplateId: createNFTListingTx.contractId,
      admin: adminAccount.address,
      listingFee: 10,    // Listing price default to 10 ALPH
      commissionRate: 200  // 200 basis point: 2%
    }
  })
  await signer.submitTransaction(
    createNFTMarketplaceTx.unsignedTx,
    createNFTMarketplaceTx.txId
  )

  // Create the default NFT Collection
  const nftContract = await web3.Contract.fromSource(provider, 'nft.ral')
  const createNFTTx = await nftContract.transactionForDeployment(signer, {
    initialFields: {
      owner: adminAccount.address,
      isTokenWithdrawn: false,
      name: web3.stringToHex("template_name"),
      description: web3.stringToHex("template_description"),
      uri: web3.stringToHex("template_uri"),
      collectionAddress: web3.addressFromContractId("0".repeat(64))
    }
  })
  await signer.submitTransaction(
    createNFTTx.unsignedTx,
    createNFTTx.txId
  )

  const nftCollectionContract = await web3.Contract.fromSource(provider, 'nft_collection.ral')
  const nftCollectionDeployTx = await nftCollectionContract.transactionForDeployment(signer, {
    initialFields: {
      nftTemplateId: createNFTTx.contractId,
      collectionName: web3.stringToHex("DefaultCollection"),
      collectionDescription: web3.stringToHex("Default Collection"),
      collectionUri: web3.stringToHex("http://default.collection")
    }
  })
  await signer.submitTransaction(
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

function randomContractId() {
  return web3.binToHex(web3.contractIdFromAddress(randomContractAddress()))
}

function randomContractAddress() {
  const prefix = Buffer.from([0x03])
  const bytes = Buffer.concat([prefix, randomBytes(32)])
  return base58.encode(bytes)
}

(async () => {
  await main()
})().catch(e => {
  console.log(e)
});