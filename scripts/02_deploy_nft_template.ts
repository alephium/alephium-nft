import { stringToHex } from '@alephium/web3'
import { Deployer, DeployFunction } from '@alephium/cli'
import { NFT } from '../artifacts/ts'

const deployNFTTemplate: DeployFunction = async (deployer: Deployer): Promise<void> => {
  const initialFields = {
    collectionId: stringToHex(""),
    tokenUri: stringToHex(""),
    nftIndex: 0n
  }

  const result = await deployer.deployContract(NFT, {
    initialFields: initialFields
  })

  const contractId = result.contractInstance.contractId
  const contractAddress = result.contractInstance.address
  console.log(`NFT Template: ${contractAddress}, contract id: ${contractId}`)
}

export default deployNFTTemplate