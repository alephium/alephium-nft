import { Project, stringToHex, addressFromContractId } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'

const deployNFTContractTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const nftContract = Project.contract("NFT")
  const initialFields = {
    owner: network.settings.marketplaceAdminAddress,
    isTokenWithdrawn: false,
    name: stringToHex("template_name"),
    description: stringToHex("template_description"),
    uri: stringToHex("template_uri"),
    collectionAddress: addressFromContractId("0".repeat(64))
  }

  const result = await deployer.deployContract(nftContract, {
    initialFields: initialFields
  })

  console.log(`NFT Contract Template: ${result.contractAddress}, contract id: ${result.contractId}`)
}

export default deployNFTContractTemplate
