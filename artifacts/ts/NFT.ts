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
import { default as NFTContractJson } from "../nft/nft.ral.json";

// Custom types for the contract
export namespace NFTTypes {
  export type Fields = {
    uri: HexString;
    owner: HexString;
    isTokenWithdrawn: boolean;
  };

  export type State = ContractState<Fields>;

  export type TransferEvent = ContractEvent<{ from: HexString; to: HexString }>;
  export type NFTWithdrawnEvent = ContractEvent<{ owner: HexString }>;
  export type NFTDepositedEvent = ContractEvent<{ owner: HexString }>;
  export type NFTBurntEvent = ContractEvent<{ owner: HexString }>;
}

class Factory extends ContractFactory<NFTInstance, NFTTypes.Fields> {
  at(address: string): NFTInstance {
    return new NFTInstance(address);
  }

  async testGetOwnerMethod(
    params: Omit<TestContractParams<NFTTypes.Fields, never>, "testArgs">
  ): Promise<TestContractResult<HexString>> {
    return testMethod(this, "getOwner", params);
  }

  async testGetTokenUriMethod(
    params: Omit<TestContractParams<NFTTypes.Fields, never>, "testArgs">
  ): Promise<TestContractResult<HexString>> {
    return testMethod(this, "getTokenUri", params);
  }

  async testTransferMethod(
    params: TestContractParams<NFTTypes.Fields, { to: HexString }>
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "transfer", params);
  }

  async testTransferAndWithdrawMethod(
    params: TestContractParams<NFTTypes.Fields, { newOwner: HexString }>
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "transferAndWithdraw", params);
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
    "cff21141b9136797860bc590b292721adbda2ec332eb645cee054a77514087e3"
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

  subscribeTransferEvent(
    options: SubscribeOptions<NFTTypes.TransferEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFT.contract,
      this,
      options,
      "Transfer",
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
      | NFTTypes.TransferEvent
      | NFTTypes.NFTWithdrawnEvent
      | NFTTypes.NFTDepositedEvent
      | NFTTypes.NFTBurntEvent
    >,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvents(NFT.contract, this, options, fromCount);
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

  async callGetTokenUriMethod(
    params?: Omit<CallContractParams<{}>, "args">
  ): Promise<CallContractResult<HexString>> {
    return callMethod(
      NFT,
      this,
      "getTokenUri",
      params === undefined ? {} : params
    );
  }
}
