import { Project, stringToHex, addressFromContractId } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'

const deployDefaultNFTCollection: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const nftTemplateResult = deployer.getDeployContractResult('NFT')
  const initialFields = {
    nftTemplateId: nftTemplateResult.contractId,
    collectionName: stringToHex("DefaultCollection"),
    collectionDescription: stringToHex("Default Collection"),
    collectionUri: stringToHex("http://default.collection")
  }

  const nftCollectionContract = Project.contract("NFTCollection")
  const result = await deployer.deployContract(nftCollectionContract, {
    initialFields: initialFields
  })

  console.log(`Default NFT Collection: ${result.contractAddress}, contract id: ${result.contractId}`)
}

export default deployDefaultNFTCollection
