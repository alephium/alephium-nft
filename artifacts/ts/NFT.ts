/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  Contract,
  ContractState,
  TestContractResult,
  HexString,
  ContractFactory,
  SubscribeOptions,
  EventSubscription,
  CallContractParams,
  CallContractResult,
  TestContractParams,
  ContractEvent,
  subscribeContractEvent,
  subscribeContractEvents,
  testMethod,
  callMethod,
  fetchContractState,
  ContractInstance,
  getContractEventsCurrentCount,
} from "@alephium/web3";
import { default as NFTContractJson } from "../nft.ral.json";

// Custom types for the contract
export namespace NFTTypes {
  export type Fields = {
    name: HexString;
    description: HexString;
    uri: HexString;
    collectionAddress: HexString;
    owner: HexString;
    isTokenWithdrawn: boolean;
  };

  export type State = ContractState<Fields>;

  export type NFTOwnerUpdatedEvent = ContractEvent<{
    previousOwner: HexString;
    newOwner: HexString;
  }>;
  export type NFTWithdrawnEvent = ContractEvent<{ owner: HexString }>;
  export type NFTDepositedEvent = ContractEvent<{ owner: HexString }>;
  export type NFTBurntEvent = ContractEvent<{ owner: HexString }>;
}

class Factory extends ContractFactory<NFTInstance, NFTTypes.Fields> {
  at(address: string): NFTInstance {
    return new NFTInstance(address);
  }

  async testGetMetadataMethod(
    params: Omit<TestContractParams<NFTTypes.Fields, never>, "testArgs">
  ): Promise<TestContractResult<[HexString, HexString, HexString, HexString]>> {
    return testMethod(this, "getMetadata", params);
  }

  async testGetOwnerMethod(
    params: Omit<TestContractParams<NFTTypes.Fields, never>, "testArgs">
  ): Promise<TestContractResult<HexString>> {
    return testMethod(this, "getOwner", params);
  }

  async testTransferOwnershipMethod(
    params: TestContractParams<NFTTypes.Fields, { newOwner: HexString }>
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "transferOwnership", params);
  }

  async testTransferOwnershipAndAssetMethod(
    params: TestContractParams<NFTTypes.Fields, { newOwner: HexString }>
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "transferOwnershipAndAsset", params);
  }

  async testUpdateOwnerMethod(
    params: TestContractParams<NFTTypes.Fields, { newOwner: HexString }>
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "updateOwner", params);
  }

  async testDepositMethod(
    params: Omit<TestContractParams<NFTTypes.Fields, never>, "testArgs">
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "deposit", params);
  }

  async testWithdrawMethod(
    params: Omit<TestContractParams<NFTTypes.Fields, never>, "testArgs">
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "withdraw", params);
  }

  async testBurnMethod(
    params: Omit<TestContractParams<NFTTypes.Fields, never>, "testArgs">
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "burn", params);
  }
}

// Use this object to test and deploy the contract
export const NFT = new Factory(
  Contract.fromJson(
    NFTContractJson,
    "",
    "f4ef07b08a1b9e5c780b0346a333323889cfc93000daac544d6390180b541263"
  )
);

// Use this class to interact with the blockchain
export class NFTInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<NFTTypes.State> {
    return fetchContractState(NFT, this);
  }

  async getContractEventsCurrentCount(): Promise<number> {
    return getContractEventsCurrentCount(this.address);
  }

  subscribeNFTOwnerUpdatedEvent(
    options: SubscribeOptions<NFTTypes.NFTOwnerUpdatedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFT.contract,
      this,
      options,
      "NFTOwnerUpdated",
      fromCount
    );
  }

  subscribeNFTWithdrawnEvent(
    options: SubscribeOptions<NFTTypes.NFTWithdrawnEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFT.contract,
      this,
      options,
      "NFTWithdrawn",
      fromCount
    );
  }

  subscribeNFTDepositedEvent(
    options: SubscribeOptions<NFTTypes.NFTDepositedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFT.contract,
      this,
      options,
      "NFTDeposited",
      fromCount
    );
  }

  subscribeNFTBurntEvent(
    options: SubscribeOptions<NFTTypes.NFTBurntEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFT.contract,
      this,
      options,
      "NFTBurnt",
      fromCount
    );
  }

  subscribeAllEvents(
    options: SubscribeOptions<
      | NFTTypes.NFTOwnerUpdatedEvent
      | NFTTypes.NFTWithdrawnEvent
      | NFTTypes.NFTDepositedEvent
      | NFTTypes.NFTBurntEvent
    >,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvents(NFT.contract, this, options, fromCount);
  }

  async callGetMetadataMethod(
    params?: Omit<CallContractParams<{}>, "args">
  ): Promise<CallContractResult<[HexString, HexString, HexString, HexString]>> {
    return callMethod(
      NFT,
      this,
      "getMetadata",
      params === undefined ? {} : params
    );
  }

  async callGetOwnerMethod(
    params?: Omit<CallContractParams<{}>, "args">
  ): Promise<CallContractResult<HexString>> {
    return callMethod(
      NFT,
      this,
      "getOwner",
      params === undefined ? {} : params
    );
  }
}
