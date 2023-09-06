import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NFTListing } from '../artifacts/ts'
import { ZERO_ADDRESS } from '@alephium/web3'

const deployNFTListingTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const result = await deployer.deployContract(NFTListing, {
    initialFields: {
      tokenId: '',
      tokenOwner: ZERO_ADDRESS,
      marketContractId: '',
      commissionRate: BigInt(network.settings.commissionRate),
      price: 0n,
      royalty: false
    }
  })
  const contractId = result.contractInstance.contractId
  const contractAddress = result.contractInstance.address
  console.log(`NFTListing Template: ${contractAddress}, contract id: ${contractId}`)
}

export default deployNFTListingTemplate
