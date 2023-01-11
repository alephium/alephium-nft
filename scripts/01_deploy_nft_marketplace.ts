import { Project } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'

const deployMarketplace: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const nftListingTemplateResult = deployer.getDeployContractResult('NFTListing')

  const initialFields = {
    nftListingTemplateId: nftListingTemplateResult.contractId,
    admin: network.settings.marketplaceAdminAddress,
    listingFee: network.settings.listingFee,
    commissionRate: network.settings.commissionRate
  }

  const nftMarketplaceContract = Project.contract("NFTMarketPlace")
  const result = await deployer.deployContract(nftMarketplaceContract, {
    // @ts-ignore
    initialFields: initialFields
  })

  console.log(`NFT Marketplace: ${result.contractAddress}, contract id: ${result.contractId}`)
}

export default deployMarketplace
