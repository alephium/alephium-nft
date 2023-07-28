import { Deployer, DeployFunction } from '@alephium/cli'
import { NFTOpenCollection, NFTPublicSaleCollectionSequential } from '../artifacts/ts'
import { addressFromContractId, ALPH_TOKEN_ID } from '@alephium/web3'

const dummyAddress = addressFromContractId(ALPH_TOKEN_ID)

const deployCollectionTemplate: DeployFunction = async (deployer: Deployer): Promise<void> => {
  const openCollection = await deployer.deployContract(NFTOpenCollection, {
    initialFields: {
      nftTemplateId: '',
      collectionUri: '',
      collectionOwner: dummyAddress,
      totalSupply: 0n
    }
  })
  console.log(`NFT open collection template contract id: ${openCollection.contractInstance.contractId}`)
  console.log(`NFT open collection template contract address: ${openCollection.contractInstance.address}`)

  const publicSaleCollection = await deployer.deployContract(NFTPublicSaleCollectionSequential, {
    initialFields: {
      nftTemplateId: '',
      collectionUri: '',
      nftBaseUri: '',
      collectionOwner: dummyAddress,
      maxSupply: 0n,
      mintPrice: 0n,
      maxBatchMintSize: 0n,
      totalSupply: 0n
    }
  })
  console.log(`NFT public sale collection template contract id: ${publicSaleCollection.contractInstance.contractId}`)
  console.log(`NFT public sale collection template contract address: ${publicSaleCollection.contractInstance.address}`)
}

export default deployCollectionTemplate