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
import { default as NFTPublicSaleCollectionRandomContractJson } from "../nft/publicsale/random/NFTPublicSaleCollectionRandom.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace NFTPublicSaleCollectionRandomTypes {
  export type Fields = {
    nftTemplateId: HexString;
    collectionUri: HexString;
    collectionOwner: Address;
    nftBaseUri: HexString;
    maxSupply: bigint;
    mintPrice: bigint;
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
      params: CallContractParams<{ index: bigint }>;
      result: CallContractResult<HexString>;
    };
    getCollectionOwner: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<Address>;
    };
    getMaxSupply: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getNFTUri: {
      params: CallContractParams<{ index: bigint }>;
      result: CallContractResult<HexString>;
    };
    getMintPrice: {
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
  NFTPublicSaleCollectionRandomInstance,
  NFTPublicSaleCollectionRandomTypes.Fields
> {
  eventIndex = { Mint: 0 };
  consts = {
    PublicSaleErrorCodes: { IncorrectTokenIndex: BigInt(0) },
    ErrorCodes: {
      IncorrectTokenIndex: BigInt(2),
      NFTNotFound: BigInt(0),
      TokenOwnerAllowedOnly: BigInt(1),
    },
  };

  at(address: string): NFTPublicSaleCollectionRandomInstance {
    return new NFTPublicSaleCollectionRandomInstance(address);
  }

  tests = {
    getCollectionUri: async (
      params: Omit<
        TestContractParams<NFTPublicSaleCollectionRandomTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getCollectionUri", params);
    },
    totalSupply: async (
      params: Omit<
        TestContractParams<NFTPublicSaleCollectionRandomTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "totalSupply", params);
    },
    nftByIndex: async (
      params: TestContractParams<
        NFTPublicSaleCollectionRandomTypes.Fields,
        { index: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "nftByIndex", params);
    },
    mint: async (
      params: TestContractParams<
        NFTPublicSaleCollectionRandomTypes.Fields,
        { index: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "mint", params);
    },
    getCollectionOwner: async (
      params: Omit<
        TestContractParams<NFTPublicSaleCollectionRandomTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<Address>> => {
      return testMethod(this, "getCollectionOwner", params);
    },
    getMaxSupply: async (
      params: Omit<
        TestContractParams<NFTPublicSaleCollectionRandomTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "getMaxSupply", params);
    },
    withdraw: async (
      params: TestContractParams<
        NFTPublicSaleCollectionRandomTypes.Fields,
        { to: Address; amount: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "withdraw", params);
    },
    getNFTUri: async (
      params: TestContractParams<
        NFTPublicSaleCollectionRandomTypes.Fields,
        { index: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getNFTUri", params);
    },
    getMintPrice: async (
      params: Omit<
        TestContractParams<NFTPublicSaleCollectionRandomTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "getMintPrice", params);
    },
  };
}

// Use this object to test and deploy the contract
export const NFTPublicSaleCollectionRandom = new Factory(
  Contract.fromJson(
    NFTPublicSaleCollectionRandomContractJson,
    "",
    "11baac3edeec0dd9693a191bcced5988e94cad1e17de465572d19186a93abb35"
  )
);

// Use this class to interact with the blockchain
export class NFTPublicSaleCollectionRandomInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<NFTPublicSaleCollectionRandomTypes.State> {
    return fetchContractState(NFTPublicSaleCollectionRandom, this);
  }

  async getContractEventsCurrentCount(): Promise<number> {
    return getContractEventsCurrentCount(this.address);
  }

  subscribeMintEvent(
    options: EventSubscribeOptions<NFTPublicSaleCollectionRandomTypes.MintEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTPublicSaleCollectionRandom.contract,
      this,
      options,
      "Mint",
      fromCount
    );
  }

  methods = {
    getCollectionUri: async (
      params?: NFTPublicSaleCollectionRandomTypes.CallMethodParams<"getCollectionUri">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.CallMethodResult<"getCollectionUri">
    > => {
      return callMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "getCollectionUri",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    totalSupply: async (
      params?: NFTPublicSaleCollectionRandomTypes.CallMethodParams<"totalSupply">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.CallMethodResult<"totalSupply">
    > => {
      return callMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "totalSupply",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    nftByIndex: async (
      params: NFTPublicSaleCollectionRandomTypes.CallMethodParams<"nftByIndex">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.CallMethodResult<"nftByIndex">
    > => {
      return callMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "nftByIndex",
        params,
        getContractByCodeHash
      );
    },
    mint: async (
      params: NFTPublicSaleCollectionRandomTypes.CallMethodParams<"mint">
    ): Promise<NFTPublicSaleCollectionRandomTypes.CallMethodResult<"mint">> => {
      return callMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "mint",
        params,
        getContractByCodeHash
      );
    },
    getCollectionOwner: async (
      params?: NFTPublicSaleCollectionRandomTypes.CallMethodParams<"getCollectionOwner">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.CallMethodResult<"getCollectionOwner">
    > => {
      return callMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "getCollectionOwner",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getMaxSupply: async (
      params?: NFTPublicSaleCollectionRandomTypes.CallMethodParams<"getMaxSupply">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.CallMethodResult<"getMaxSupply">
    > => {
      return callMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "getMaxSupply",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getNFTUri: async (
      params: NFTPublicSaleCollectionRandomTypes.CallMethodParams<"getNFTUri">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.CallMethodResult<"getNFTUri">
    > => {
      return callMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "getNFTUri",
        params,
        getContractByCodeHash
      );
    },
    getMintPrice: async (
      params?: NFTPublicSaleCollectionRandomTypes.CallMethodParams<"getMintPrice">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.CallMethodResult<"getMintPrice">
    > => {
      return callMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "getMintPrice",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  async multicall<
    Calls extends NFTPublicSaleCollectionRandomTypes.MultiCallParams
  >(
    calls: Calls
  ): Promise<NFTPublicSaleCollectionRandomTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      NFTPublicSaleCollectionRandom,
      this,
      calls,
      getContractByCodeHash
    )) as NFTPublicSaleCollectionRandomTypes.MultiCallResults<Calls>;
  }
}
