import { addressFromContractId, stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { EnumerableNFT } from '../artifacts/ts'

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

  const result = await deployer.deployContract(EnumerableNFT, {
    initialFields: initialFields
  })

  const contractId = result.contractInstance.contractId
  const contractAddress = addressFromContractId(contractId)
  console.log(`NFT Contract Template: ${contractAddress}, contract id: ${contractId}`)
}

export default deployNFTContractTemplate
