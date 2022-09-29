import {
  Asset,
  Contract,
  ContractState,
  NodeProvider,
  Script,
  binToHex,
  node,
  Fields,
  FieldsSig,
  fromApiVals,
  fromApiNumber256,
  fromApiTokens,
  contractIdFromAddress
} from '@alephium/web3'
import mintNFT from '../artifacts/mint_nft.ral.json'
import listNFT from '../artifacts/list_nft.ral.json'
import buyNFT from '../artifacts/buy_nft.ral.json'
import withdrawNFT from '../artifacts/withdraw_nft.ral.json'
import NFTMarketplace from '../artifacts/nft_marketplace.ral.json'
import NFTListing from '../artifacts/nft_listing.ral.json'
import NFTCollection from '../artifacts/nft_collection.ral.json'
import NFT from '../artifacts/nft.ral.json'

export const mintNFTScript = Script.fromJson(mintNFT)
export const listNFTScript = Script.fromJson(listNFT)
export const buyNFTScript = Script.fromJson(buyNFT)
export const withdrawNFTScript = Script.fromJson(withdrawNFT)

export const NFTMarketplaceContract = Contract.fromJson(NFTMarketplace)
export const NFTListingContract = Contract.fromJson(NFTListing)
export const NFTCollectionContract = Contract.fromJson(NFTCollection)
export const NFTContract = Contract.fromJson(NFT)

export async function fetchState(
  nodeProvider: NodeProvider,
  contract: Contract,
  address: string,
  group: number
): Promise<ContractState> {
  const state = await nodeProvider.contracts.getContractsAddressState(address, {
    group: group
  })
  return fromApiContractState(contract, state)
}

function fromApiContractState(
  contract: Contract,
  state: node.ContractState
): ContractState {
  return {
    address: state.address,
    contractId: binToHex(contractIdFromAddress(state.address)),
    bytecode: state.bytecode,
    initialStateHash: state.initialStateHash,
    codeHash: state.codeHash,
    fields: fromApiFields(state.fields, contract.fieldsSig),
    fieldsSig: contract.fieldsSig,
    asset: fromApiAsset(state.asset)
  }
}

function fromApiFields(vals: node.Val[], fieldsSig: node.FieldsSig): Fields {
  return fromApiVals(vals, fieldsSig.names, fieldsSig.types)
}

function fromApiAsset(asset: node.AssetState): Asset {
  return {
    alphAmount: fromApiNumber256(asset.attoAlphAmount),
    tokens: fromApiTokens(asset.tokens)
  }
}
