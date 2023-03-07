import { stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NFT } from '../artifacts/ts/NFT'

const deployNFTContractTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const initialFields = {
    owner: network.settings.marketplaceAdminAddress,
    isTokenWithdrawn: false,
    name: stringToHex("template_name"),
    description: stringToHex("template_description"),
    uri: stringToHex("template_uri"),
    collectionId: "0".repeat(64),
    tokenIndex: 0n
  }

  const result = await deployer.deployContract(NFT, {
    initialFields: initialFields
  })

  console.log(`NFT Contract Template: ${result.contractAddress}, contract id: ${result.contractId}`)
}

export default deployNFTContractTemplate
