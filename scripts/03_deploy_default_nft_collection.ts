import { stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NFTCollection } from '../artifacts/ts/NFTCollection'

const deployDefaultNFTCollection: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const nftTemplateResult = deployer.getDeployContractResult('NFT')
  const initialFields = {
    nftTemplateId: nftTemplateResult.contractId,
    currentTokenIndex: 0n,
    name: stringToHex("DefaultCollection"),
    symbol: stringToHex("Default Collection")
  }

  const result = await deployer.deployContract(NFTCollection, {
    initialFields: initialFields
  })

  console.log(`Default NFT Collection: ${result.contractAddress}, contract id: ${result.contractId}`)
}

export default deployDefaultNFTCollection
