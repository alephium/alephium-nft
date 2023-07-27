import { addressFromTokenId, ALPH_TOKEN_ID } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { NFTListing } from '../artifacts/ts'

const dummyAddress = addressFromTokenId(ALPH_TOKEN_ID)

const deployNFTListingTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const initialFields = {
    price: 0n,
    tokenId: '',
    tokenOwner: dummyAddress,
    marketAddress: dummyAddress,
    commissionRate: network.settings.commissionRate
  }

  const result = await deployer.deployContract(NFTListing, {
    initialFields: initialFields
  })
  const contractId = result.contractInstance.contractId
  const contractAddress = result.contractInstance.address
  console.log(`NFTListing Template: ${contractAddress}, contract id: ${contractId}`)
}

export default deployNFTListingTemplate
