import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NFTMarketPlace } from '../artifacts/ts'

const deployMarketplace: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const nftListingTemplateResult = deployer.getDeployContractResult('NFTListing')

  const initialFields = {
    nftListingTemplateId: nftListingTemplateResult.contractInstance.contractId,
    admin: network.settings.marketplaceAdminAddress,
    listingFee: network.settings.listingFee,
    commissionRate: network.settings.commissionRate
  }

  const result = await deployer.deployContract(NFTMarketPlace, {
    // @ts-ignore
    initialFields: initialFields
  })

  const contractId = result.contractInstance.contractId
  const contractAddress = result.contractInstance.address
  console.log(`NFT Marketplace: ${contractAddress}, contract id: ${contractId}`)
}

export default deployMarketplace
