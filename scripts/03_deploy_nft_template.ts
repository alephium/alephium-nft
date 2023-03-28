import { stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NFT } from '../artifacts/ts'

const deployNFTTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const initialFields = {
    collectionId: stringToHex("collection_id"),
    uri: stringToHex("template_uri")
  }

  const result = await deployer.deployContract(NFT, {
    // @ts-ignore
    initialFields: initialFields
  })
  console.log(`NFT Template: ${result.contractAddress}, contract id: ${result.contractId}`)
}

export default deployNFTTemplate
