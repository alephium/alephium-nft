import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NFTListing } from '../artifacts/ts'
import { ZERO_ADDRESS } from '@alephium/web3'

const deployNFTListingTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const initialFields = {
    price: 0n,
    tokenId: '',
    tokenOwner: ZERO_ADDRESS,
    marketAddress: ZERO_ADDRESS,
    commissionRate: network.settings.commissionRate
  }

  const result = await deployer.deployContract(NFTListing, {
    initialFields: initialFields
  })
  const contractId = result.contractInstance.contractId
  const contractAddress = result.contractInstance.address
  console.log(`NFTListing Template: ${contractAddress}, contract id: ${contractId}`)
}

export default deployNFTListingTemplate
