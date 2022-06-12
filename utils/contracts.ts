import { Contract, Script } from 'alephium-web3'
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