import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NFTMarketPlace } from '../artifacts/ts'

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

  const result = await deployer.deployContract(NFTMarketPlace, {
    // @ts-ignore
    initialFields: initialFields
  })

  console.log(`NFT Marketplace: ${result.contractAddress}, contract id: ${result.contractId}`)
}

export default deployMarketplace
