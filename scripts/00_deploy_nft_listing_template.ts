import { Project, binToHex, contractIdFromAddress } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { randomBytes } from 'crypto'
import base58 from 'bs58'

const deployNFTListingTemplate: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const initialFields = {
    price: 1000,
    tokenId: randomContractId(),
    tokenOwner: randomContractAddress(),
    marketAddress: randomContractAddress(),
    commissionRate: network.settings.commissionRate
  }

  const nftListingContract = Project.contract("NFTListing")
  const result = await deployer.deployContract(nftListingContract, {
    // @ts-ignore
    initialFields: initialFields
  })
  console.log(`NFTListing Template: ${result.contractAddress}, contract id: ${result.contractId}`)
}

function randomContractId() {
  return binToHex(contractIdFromAddress(randomContractAddress()))
}

function randomContractAddress() {
  const prefix = Buffer.from([0x03])
  const bytes = Buffer.concat([prefix, randomBytes(32)])
  return base58.encode(bytes)
}

export default deployNFTListingTemplate
