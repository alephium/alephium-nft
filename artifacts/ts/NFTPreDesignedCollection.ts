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
import { default as NFTPreDesignedCollectionContractJson } from "../nft/nft-pre-designed-collection.ral.json";

// Custom types for the contract
export namespace NFTPreDesignedCollectionTypes {
  export type Fields = {
    nftTemplateId: HexString;
    name: HexString;
    symbol: HexString;
    totalSupply: bigint;
    baseUri: HexString;
  };

  export type State = ContractState<Fields>;

  export type MintedEvent = ContractEvent<{
    minter: HexString;
    tokenIndex: bigint;
    tokenId: HexString;
  }>;

  export interface CallMethodTable {
    getName: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    getSymbol: {
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
      params: CallContractParams<{ tokenIndex: bigint }>;
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
  NFTPreDesignedCollectionInstance,
  NFTPreDesignedCollectionTypes.Fields
> {
  at(address: string): NFTPreDesignedCollectionInstance {
    return new NFTPreDesignedCollectionInstance(address);
  }

  tests = {
    getName: async (
      params: Omit<
        TestContractParams<NFTPreDesignedCollectionTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getName", params);
    },
    getSymbol: async (
      params: Omit<
        TestContractParams<NFTPreDesignedCollectionTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getSymbol", params);
    },
    totalSupply: async (
      params: Omit<
        TestContractParams<NFTPreDesignedCollectionTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "totalSupply", params);
    },
    nftByIndex: async (
      params: TestContractParams<
        NFTPreDesignedCollectionTypes.Fields,
        { index: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "nftByIndex", params);
    },
    mint: async (
      params: TestContractParams<
        NFTPreDesignedCollectionTypes.Fields,
        { tokenIndex: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "mint", params);
    },
  };
}

// Use this object to test and deploy the contract
export const NFTPreDesignedCollection = new Factory(
  Contract.fromJson(
    NFTPreDesignedCollectionContractJson,
    "",
    "9301ca6e8075f1404006642735728e2c250cd1dc4d3927c14a05a2f2c90e19a4"
  )
);

// Use this class to interact with the blockchain
export class NFTPreDesignedCollectionInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<NFTPreDesignedCollectionTypes.State> {
    return fetchContractState(NFTPreDesignedCollection, this);
  }

  async getContractEventsCurrentCount(): Promise<number> {
    return getContractEventsCurrentCount(this.address);
  }

  subscribeMintedEvent(
    options: SubscribeOptions<NFTPreDesignedCollectionTypes.MintedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTPreDesignedCollection.contract,
      this,
      options,
      "Minted",
      fromCount
    );
  }

  methods = {
    getName: async (
      params?: NFTPreDesignedCollectionTypes.CallMethodParams<"getName">
    ): Promise<NFTPreDesignedCollectionTypes.CallMethodResult<"getName">> => {
      return callMethod(
        NFTPreDesignedCollection,
        this,
        "getName",
        params === undefined ? {} : params
      );
    },
    getSymbol: async (
      params?: NFTPreDesignedCollectionTypes.CallMethodParams<"getSymbol">
    ): Promise<NFTPreDesignedCollectionTypes.CallMethodResult<"getSymbol">> => {
      return callMethod(
        NFTPreDesignedCollection,
        this,
        "getSymbol",
        params === undefined ? {} : params
      );
    },
    totalSupply: async (
      params?: NFTPreDesignedCollectionTypes.CallMethodParams<"totalSupply">
    ): Promise<
      NFTPreDesignedCollectionTypes.CallMethodResult<"totalSupply">
    > => {
      return callMethod(
        NFTPreDesignedCollection,
        this,
        "totalSupply",
        params === undefined ? {} : params
      );
    },
    nftByIndex: async (
      params: NFTPreDesignedCollectionTypes.CallMethodParams<"nftByIndex">
    ): Promise<
      NFTPreDesignedCollectionTypes.CallMethodResult<"nftByIndex">
    > => {
      return callMethod(NFTPreDesignedCollection, this, "nftByIndex", params);
    },
    mint: async (
      params: NFTPreDesignedCollectionTypes.CallMethodParams<"mint">
    ): Promise<NFTPreDesignedCollectionTypes.CallMethodResult<"mint">> => {
      return callMethod(NFTPreDesignedCollection, this, "mint", params);
    },
  };

  async multicall<Calls extends NFTPreDesignedCollectionTypes.MultiCallParams>(
    calls: Calls
  ): Promise<NFTPreDesignedCollectionTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      NFTPreDesignedCollection,
      this,
      calls
    )) as NFTPreDesignedCollectionTypes.MultiCallResults<Calls>;
  }
}