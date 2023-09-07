/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  ExecutableScript,
  ExecuteScriptParams,
  ExecuteScriptResult,
  Script,
  SignerProvider,
  HexString,
} from "@alephium/web3";
import { default as BuyNFTScriptJson } from "../scripts/BuyNFT.ral.json";
import { default as CancelListingScriptJson } from "../scripts/CancelListing.ral.json";
import { default as CreateOpenCollectionScriptJson } from "../scripts/CreateOpenCollection.ral.json";
import { default as CreateOpenCollectionWithRoyaltyScriptJson } from "../scripts/CreateOpenCollectionWithRoyalty.ral.json";
import { default as CreatePublicSaleCollectionSequentialScriptJson } from "../scripts/CreatePublicSaleCollectionSequential.ral.json";
import { default as CreatePublicSaleCollectionSequentialWithRoyaltyScriptJson } from "../scripts/CreatePublicSaleCollectionSequentialWithRoyalty.ral.json";
import { default as ListNFTScriptJson } from "../scripts/ListNFT.ral.json";
import { default as MintBatchSequentialScriptJson } from "../scripts/MintBatchSequential.ral.json";
import { default as MintNextSequentialScriptJson } from "../scripts/MintNextSequential.ral.json";
import { default as MintOpenNFTScriptJson } from "../scripts/MintOpenNFT.ral.json";
import { default as MintSpecificScriptJson } from "../scripts/MintSpecific.ral.json";
import { default as UpdateAdminScriptJson } from "../scripts/UpdateAdmin.ral.json";
import { default as UpdateComissionRateScriptJson } from "../scripts/UpdateComissionRate.ral.json";
import { default as UpdateNFTPriceScriptJson } from "../scripts/UpdateNFTPrice.ral.json";
import { default as WithdrawFromMarketPlaceScriptJson } from "../scripts/WithdrawFromMarketPlace.ral.json";
import { default as WithdrawFromOpenCollectionScriptJson } from "../scripts/WithdrawFromOpenCollection.ral.json";
import { default as WithdrawFromPublicSaleCollectionRandomScriptJson } from "../scripts/WithdrawFromPublicSaleCollectionRandom.ral.json";
import { default as WithdrawFromPublicSaleCollectionSequentialScriptJson } from "../scripts/WithdrawFromPublicSaleCollectionSequential.ral.json";

export const BuyNFT = new ExecutableScript<{
  totalPayment: bigint;
  tokenId: HexString;
  nftMarketplace: HexString;
}>(Script.fromJson(BuyNFTScriptJson));
export const CancelListing = new ExecutableScript<{
  tokenId: HexString;
  nftMarketplace: HexString;
}>(Script.fromJson(CancelListingScriptJson));
export const CreateOpenCollection = new ExecutableScript<{
  openCollectionTemplateId: HexString;
  nftTemplateId: HexString;
  collectionUri: HexString;
  collectionOwner: Address;
  totalSupply: bigint;
}>(Script.fromJson(CreateOpenCollectionScriptJson));
export const CreateOpenCollectionWithRoyalty = new ExecutableScript<{
  openCollectionWithRoyaltyTemplateId: HexString;
  nftTemplateId: HexString;
  collectionUri: HexString;
  collectionOwner: Address;
  royaltyRate: bigint;
  totalSupply: bigint;
}>(Script.fromJson(CreateOpenCollectionWithRoyaltyScriptJson));
export const CreatePublicSaleCollectionSequential = new ExecutableScript<{
  publicSaleCollectionTemplateId: HexString;
  nftTemplateId: HexString;
  collectionUri: HexString;
  nftBaseUri: HexString;
  collectionOwner: Address;
  maxSupply: bigint;
  mintPrice: bigint;
  maxBatchMintSize: bigint;
  totalSupply: bigint;
}>(Script.fromJson(CreatePublicSaleCollectionSequentialScriptJson));
export const CreatePublicSaleCollectionSequentialWithRoyalty =
  new ExecutableScript<{
    publicSaleCollectionTemplateId: HexString;
    nftTemplateId: HexString;
    collectionUri: HexString;
    nftBaseUri: HexString;
    collectionOwner: Address;
    maxSupply: bigint;
    mintPrice: bigint;
    maxBatchMintSize: bigint;
    royaltyRate: bigint;
    totalSupply: bigint;
  }>(
    Script.fromJson(CreatePublicSaleCollectionSequentialWithRoyaltyScriptJson)
  );
export const ListNFT = new ExecutableScript<{
  tokenId: HexString;
  price: bigint;
  nftMarketplace: HexString;
  royalty: boolean;
}>(Script.fromJson(ListNFTScriptJson));
export const MintBatchSequential = new ExecutableScript<{
  nftCollectionId: HexString;
  batchSize: bigint;
  mintPrice: bigint;
  royalty: boolean;
}>(Script.fromJson(MintBatchSequentialScriptJson));
export const MintNextSequential = new ExecutableScript<{
  nftCollectionId: HexString;
  mintPrice: bigint;
  royalty: boolean;
}>(Script.fromJson(MintNextSequentialScriptJson));
export const MintOpenNFT = new ExecutableScript<{
  nftCollectionId: HexString;
  uri: HexString;
  royalty: boolean;
}>(Script.fromJson(MintOpenNFTScriptJson));
export const MintSpecific = new ExecutableScript<{
  index: bigint;
  mintPrice: bigint;
  nftCollectionId: HexString;
  royalty: boolean;
}>(Script.fromJson(MintSpecificScriptJson));
export const UpdateAdmin = new ExecutableScript<{
  newAdmin: Address;
  nftMarketplace: HexString;
}>(Script.fromJson(UpdateAdminScriptJson));
export const UpdateComissionRate = new ExecutableScript<{
  newCommissionRate: bigint;
  nftMarketplace: HexString;
}>(Script.fromJson(UpdateComissionRateScriptJson));
export const UpdateNFTPrice = new ExecutableScript<{
  price: bigint;
  tokenId: HexString;
  nftMarketplace: HexString;
}>(Script.fromJson(UpdateNFTPriceScriptJson));
export const WithdrawFromMarketPlace = new ExecutableScript<{
  to: Address;
  amount: bigint;
  nftMarketplace: HexString;
}>(Script.fromJson(WithdrawFromMarketPlaceScriptJson));
export const WithdrawFromOpenCollection = new ExecutableScript<{
  to: Address;
  amount: bigint;
  nftCollectionId: HexString;
  royalty: boolean;
}>(Script.fromJson(WithdrawFromOpenCollectionScriptJson));
export const WithdrawFromPublicSaleCollectionRandom = new ExecutableScript<{
  to: Address;
  amount: bigint;
  nftCollectionId: HexString;
  royalty: boolean;
}>(Script.fromJson(WithdrawFromPublicSaleCollectionRandomScriptJson));
export const WithdrawFromPublicSaleCollectionSequential = new ExecutableScript<{
  to: Address;
  amount: bigint;
  nftCollectionId: HexString;
  royalty: boolean;
}>(Script.fromJson(WithdrawFromPublicSaleCollectionSequentialScriptJson));
