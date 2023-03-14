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
  multicallMethods,
  fetchContractState,
  ContractInstance,
  getContractEventsCurrentCount,
} from "@alephium/web3";
import { default as NFTListingContractJson } from "../marketplace/nft_listing.ral.json";

// Custom types for the contract
export namespace NFTListingTypes {
  export type Fields = {
    tokenId: HexString;
    tokenOwner: HexString;
    marketAddress: HexString;
    commissionRate: bigint;
    price: bigint;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    getTokenOwner: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    getPrice: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
  }
  export type CallMethodParams<T extends keyof CallMethodTable> =
    CallMethodTable[T]["params"];
  export type CallMethodResult<T extends keyof CallMethodTable> =
    CallMethodTable[T]["result"];
  export type MultiCallParams = Partial<{
    [Name in keyof CallMethodTable]: CallMethodTable[Name]["params"];
  }>;
  export type MultiCallResults<T extends MultiCallParams> = {
    [MaybeName in keyof T]: MaybeName extends keyof CallMethodTable
      ? CallMethodTable[MaybeName]["result"]
      : undefined;
  };
}

class Factory extends ContractFactory<
  NFTListingInstance,
  NFTListingTypes.Fields
> {
  at(address: string): NFTListingInstance {
    return new NFTListingInstance(address);
  }

  async testGetTokenOwnerMethod(
    params: Omit<TestContractParams<NFTListingTypes.Fields, never>, "testArgs">
  ): Promise<TestContractResult<HexString>> {
    return testMethod(this, "getTokenOwner", params);
  }

  async testGetPriceMethod(
    params: Omit<TestContractParams<NFTListingTypes.Fields, never>, "testArgs">
  ): Promise<TestContractResult<bigint>> {
    return testMethod(this, "getPrice", params);
  }

  async testBuyMethod(
    params: TestContractParams<NFTListingTypes.Fields, { buyer: HexString }>
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "buy", params);
  }

  async testCancelMethod(
    params: Omit<TestContractParams<NFTListingTypes.Fields, never>, "testArgs">
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "cancel", params);
  }

  async testUpdatePriceMethod(
    params: TestContractParams<NFTListingTypes.Fields, { newPrice: bigint }>
  ): Promise<TestContractResult<null>> {
    return testMethod(this, "updatePrice", params);
  }
}

// Use this object to test and deploy the contract
export const NFTListing = new Factory(
  Contract.fromJson(
    NFTListingContractJson,
    "",
    "bb183d04ec3e8824eb0bed022d73b1da14aeb9722f77724a58654c4bde117bbb"
  )
);

// Use this class to interact with the blockchain
export class NFTListingInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<NFTListingTypes.State> {
    return fetchContractState(NFTListing, this);
  }

  async callGetTokenOwnerMethod(
    params?: NFTListingTypes.CallMethodParams<"getTokenOwner">
  ): Promise<NFTListingTypes.CallMethodResult<"getTokenOwner">> {
    return callMethod(
      NFTListing,
      this,
      "getTokenOwner",
      params === undefined ? {} : params
    );
  }

  async callGetPriceMethod(
    params?: NFTListingTypes.CallMethodParams<"getPrice">
  ): Promise<NFTListingTypes.CallMethodResult<"getPrice">> {
    return callMethod(
      NFTListing,
      this,
      "getPrice",
      params === undefined ? {} : params
    );
  }

  async multicall<Calls extends NFTListingTypes.MultiCallParams>(
    calls: Calls
  ): Promise<NFTListingTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      NFTListing,
      this,
      calls
    )) as NFTListingTypes.MultiCallResults<Calls>;
  }
}
