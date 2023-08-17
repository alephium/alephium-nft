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
  EventSubscribeOptions,
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
import { default as NFTOpenCollectionContractJson } from "../nft/open/NFTOpenCollection.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace NFTOpenCollectionTypes {
  export type Fields = {
    nftTemplateId: HexString;
    collectionUri: HexString;
    collectionOwner: Address;
    totalSupply: bigint;
  };

  export type State = ContractState<Fields>;

  export type MintEvent = ContractEvent<{ minter: Address; index: bigint }>;

  export interface CallMethodTable {
    getCollectionUri: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    totalSupply: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    nftByIndex: {
      params: CallContractParams<{ index: bigint }>;
      result: CallContractResult<HexString>;
    };
    mint: {
      params: CallContractParams<{ nftUri: HexString }>;
      result: CallContractResult<HexString>;
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
  NFTOpenCollectionInstance,
  NFTOpenCollectionTypes.Fields
> {
  eventIndex = { Mint: 0 };
  consts = {
    ErrorCodes: { NFTNotFound: BigInt(0), TokenOwnerAllowedOnly: BigInt(1) },
  };

  at(address: string): NFTOpenCollectionInstance {
    return new NFTOpenCollectionInstance(address);
  }

  tests = {
    getCollectionUri: async (
      params: Omit<
        TestContractParams<NFTOpenCollectionTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getCollectionUri", params);
    },
    totalSupply: async (
      params: Omit<
        TestContractParams<NFTOpenCollectionTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "totalSupply", params);
    },
    nftByIndex: async (
      params: TestContractParams<
        NFTOpenCollectionTypes.Fields,
        { index: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "nftByIndex", params);
    },
    mint: async (
      params: TestContractParams<
        NFTOpenCollectionTypes.Fields,
        { nftUri: HexString }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "mint", params);
    },
    withdraw: async (
      params: TestContractParams<
        NFTOpenCollectionTypes.Fields,
        { to: Address; amount: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "withdraw", params);
    },
  };
}

// Use this object to test and deploy the contract
export const NFTOpenCollection = new Factory(
  Contract.fromJson(
    NFTOpenCollectionContractJson,
    "",
    "333ca3637f631d1d5aa21f8fd577d0e9c6046354f027f36754a8d241f9ffe071"
  )
);

// Use this class to interact with the blockchain
export class NFTOpenCollectionInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<NFTOpenCollectionTypes.State> {
    return fetchContractState(NFTOpenCollection, this);
  }

  async getContractEventsCurrentCount(): Promise<number> {
    return getContractEventsCurrentCount(this.address);
  }

  subscribeMintEvent(
    options: EventSubscribeOptions<NFTOpenCollectionTypes.MintEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTOpenCollection.contract,
      this,
      options,
      "Mint",
      fromCount
    );
  }

  methods = {
    getCollectionUri: async (
      params?: NFTOpenCollectionTypes.CallMethodParams<"getCollectionUri">
    ): Promise<NFTOpenCollectionTypes.CallMethodResult<"getCollectionUri">> => {
      return callMethod(
        NFTOpenCollection,
        this,
        "getCollectionUri",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    totalSupply: async (
      params?: NFTOpenCollectionTypes.CallMethodParams<"totalSupply">
    ): Promise<NFTOpenCollectionTypes.CallMethodResult<"totalSupply">> => {
      return callMethod(
        NFTOpenCollection,
        this,
        "totalSupply",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    nftByIndex: async (
      params: NFTOpenCollectionTypes.CallMethodParams<"nftByIndex">
    ): Promise<NFTOpenCollectionTypes.CallMethodResult<"nftByIndex">> => {
      return callMethod(
        NFTOpenCollection,
        this,
        "nftByIndex",
        params,
        getContractByCodeHash
      );
    },
    mint: async (
      params: NFTOpenCollectionTypes.CallMethodParams<"mint">
    ): Promise<NFTOpenCollectionTypes.CallMethodResult<"mint">> => {
      return callMethod(
        NFTOpenCollection,
        this,
        "mint",
        params,
        getContractByCodeHash
      );
    },
  };

  async multicall<Calls extends NFTOpenCollectionTypes.MultiCallParams>(
    calls: Calls
  ): Promise<NFTOpenCollectionTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      NFTOpenCollection,
      this,
      calls,
      getContractByCodeHash
    )) as NFTOpenCollectionTypes.MultiCallResults<Calls>;
  }
}
