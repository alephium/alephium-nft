const base58 = require('bs58')
const fs = require('fs')
const {
  web3,
  Project,
  binToHex,
  stringToHex,
  contractIdFromAddress,
  addressFromContractId
} = require('@alephium/web3')
const { NodeWallet } = require('@alephium/web3-wallet')
const { randomBytes } = require('crypto')

async function main() {
  const nodeUrl = 'http://localhost:22973'
  web3.setCurrentNodeProvider(nodeUrl)
  const signer = await testWallet1()
  const adminAccount = await signer.getSelectedAccount()

  await Project.build()

  // Create NFT marketplace
  const nftListingContract = Project.contract("NFTListing")
  const createNFTListingTx = await nftListingContract.deploy(signer, {
    initialFields: {
      price: 1000,
      tokenId: randomContractId(),
      tokenOwner: randomContractAddress(),
      marketAddress: randomContractAddress(),
      commissionRate: 200  // 200 basis point: 2%
    }
  })

  const nftMarketplaceContract = Project.contract("NFTMarketPlace")
  const createNFTMarketplaceTx = await nftMarketplaceContract.deploy(signer, {
    initialFields: {
      nftListingTemplateId: createNFTListingTx.contractId,
      admin: adminAccount.address,
      listingFee: 10,    // Listing price default to 10 ALPH
      commissionRate: 200  // 200 basis point: 2%
    }
  })

  // Create the NFT contract template
  const nftContract = Project.contract("NFT")
  const createNFTTx = await nftContract.deploy(signer, {
    initialFields: {
      owner: adminAccount.address,
      isTokenWithdrawn: false,
      name: stringToHex("template_name"),
      description: stringToHex("template_description"),
      uri: stringToHex("template_uri"),
      collectionAddress: addressFromContractId("0".repeat(64))
    }
  })

  const nftCollectionContract = Project.contract("NFTCollection")
  const nftCollectionDeployTx = await nftCollectionContract.deploy(signer, {
    initialFields: {
      nftTemplateId: createNFTTx.contractId,
      collectionName: stringToHex("DefaultCollection"),
      collectionDescription: stringToHex("Default Collection"),
      collectionUri: stringToHex("http://default.collection")
    }
  })

  const config = JSON.stringify(
    {
      defaultNftCollectionContractId: nftCollectionDeployTx.contractId,
      marketplaceContractId: createNFTMarketplaceTx.contractId
    }
  )

  console.log('writing config', config)
  fs.writeFileSync('configs/addresses.json', config)
}

async function testWallet1() {
  const wallet = new NodeWallet('alephium-web3-test-only-wallet')
  await wallet.unlock('alph')
  return wallet
}

function randomContractId() {
  return binToHex(contractIdFromAddress(randomContractAddress()))
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
