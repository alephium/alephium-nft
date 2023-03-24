import { stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NFTOpenCollection } from '../artifacts/ts'
import { maxU256 } from '../utils'

const deployDefaultNFTCollection: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const nftTemplateResult = deployer.getDeployContractResult('NFT')
  const initialFields = {
    nftTemplateId: nftTemplateResult.contractId,
    currentTokenIndex: 0n,
    uri: stringToHex("https://metadata.url"),
    totalSupply: maxU256
  }

  const result = await deployer.deployContract(NFTOpenCollection, {
    initialFields: initialFields
  })

  console.log(`Default NFT Collection: ${result.contractAddress}, contract id: ${result.contractId}`)
}

export default deployDefaultNFTCollection
