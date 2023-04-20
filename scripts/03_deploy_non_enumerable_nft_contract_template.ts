import { addressFromContractId, stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NonEnumerableNFT } from '../artifacts/ts'

const deployNonEnumerableNFTTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const initialFields = {
    collectionId: stringToHex("collection-id"),
    uri: stringToHex("template_uri")
  }

  const result = await deployer.deployContract(NonEnumerableNFT, {
    // @ts-ignore
    initialFields: initialFields,
    gasAmount: 100000
  })

  const contractId = result.contractInstance.contractId
  const contractAddress = addressFromContractId(contractId)
  console.log(`NonEnumerableNFT Template: ${contractAddress}, contract id: ${contractId}`)
}

export default deployNonEnumerableNFTTemplate
