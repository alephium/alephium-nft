import { Deployer, DeployFunction } from '@alephium/cli'
import { NFTOpenCollection, NFTPublicSaleCollectionSequential } from '../artifacts/ts'
import { ZERO_ADDRESS } from '@alephium/web3'

const deployCollectionTemplate: DeployFunction = async (deployer: Deployer): Promise<void> => {
  const openCollection = await deployer.deployContract(NFTOpenCollection, {
    initialFields: {
      nftTemplateId: '',
      collectionUri: '',
      collectionOwner: ZERO_ADDRESS,
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
      collectionOwner: ZERO_ADDRESS,
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