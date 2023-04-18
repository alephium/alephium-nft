import { addressFromContractId, stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NonEnumerableNFT } from '../artifacts/ts'

const deployNFTTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const initialFields = {
    collectionId: stringToHex("collection_id"),
    uri: stringToHex("template_uri")
  }

  const result = await deployer.deployContract(NonEnumerableNFT, {
    // @ts-ignore
    initialFields: initialFields,
    gasAmount: 100000
  })

  const contractId = result.contractInstance.contractId
  const contractAddress = addressFromContractId(contractId)
  console.log(`NFT Template: ${contractAddress}, contract id: ${contractId}`)
}

export default deployNFTTemplate
