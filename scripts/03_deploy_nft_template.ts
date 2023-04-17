import { addressFromContractId, stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { EnumerableNFT } from '../artifacts/ts'

const deployNFTTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const initialFields = {
    collectionId: stringToHex("collection_id"),
    uri: stringToHex("template_uri")
  }

  const result = await deployer.deployContract(EnumerableNFT, {
    // @ts-ignore
    initialFields: initialFields
  })

  const contractId = result.contractInstance.contractId
  const contractAddress = addressFromContractId(contractId)
  console.log(`NFT Template: ${contractAddress}, contract id: ${contractId}`)
}

export default deployNFTTemplate
