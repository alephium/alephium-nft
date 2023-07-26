import { addressFromContractId, stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { EnumerableNFT } from '../artifacts/ts'

const deployEnumerableNFTTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const initialFields = {
    collectionId: stringToHex(""),
    tokenUri: stringToHex(""),
    nftIndex: 1
  }

  const result = await deployer.deployContract(EnumerableNFT, {
    // @ts-ignore
    initialFields: initialFields,
    gasAmount: 100000
  })

  const contractId = result.contractInstance.contractId
  const contractAddress = addressFromContractId(contractId)
  console.log(`EnumerableNFT Template: ${contractAddress}, contract id: ${contractId}`)
}

export default deployEnumerableNFTTemplate
