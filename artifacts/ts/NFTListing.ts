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
import { default as NFTListingContractJson } from "../marketplace/NFTListing.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace NFTListingTypes {
  export type Fields = {
    tokenId: HexString;
    tokenOwner: Address;
    marketContractId: HexString;
    commissionRate: bigint;
    listingFee: bigint;
    royalty: boolean;
    price: bigint;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    getTokenOwner: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<Address>;
    };
    getPrice: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getCommissionRate: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getListingFee: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    requiresRoyalty: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<boolean>;
    };
    getRoyaltyAmount: {
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
  consts = { ErrorCodes: { MarketplaceAllowedOnly: BigInt(0) } };

  at(address: string): NFTListingInstance {
    return new NFTListingInstance(address);
  }

  tests = {
    getTokenOwner: async (
      params: Omit<
        TestContractParams<NFTListingTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<Address>> => {
      return testMethod(this, "getTokenOwner", params);
    },
    getPrice: async (
      params: Omit<
        TestContractParams<NFTListingTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "getPrice", params);
    },
    getCommissionRate: async (
      params: Omit<
        TestContractParams<NFTListingTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "getCommissionRate", params);
    },
    getListingFee: async (
      params: Omit<
        TestContractParams<NFTListingTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "getListingFee", params);
    },
    requiresRoyalty: async (
      params: Omit<
        TestContractParams<NFTListingTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<boolean>> => {
      return testMethod(this, "requiresRoyalty", params);
    },
    buy: async (
      params: TestContractParams<NFTListingTypes.Fields, { buyer: Address }>
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "buy", params);
    },
    cancel: async (
      params: Omit<
        TestContractParams<NFTListingTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "cancel", params);
    },
    updatePrice: async (
      params: TestContractParams<NFTListingTypes.Fields, { newPrice: bigint }>
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "updatePrice", params);
    },
    getRoyaltyAmount: async (
      params: Omit<
        TestContractParams<NFTListingTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "getRoyaltyAmount", params);
    },
  };
}

// Use this object to test and deploy the contract
export const NFTListing = new Factory(
  Contract.fromJson(
    NFTListingContractJson,
    "",
    "0c5f443584dfec6e8a8b81cd00510a55867b6e8ee18472534b466d56891f57a4"
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

  methods = {
    getTokenOwner: async (
      params?: NFTListingTypes.CallMethodParams<"getTokenOwner">
    ): Promise<NFTListingTypes.CallMethodResult<"getTokenOwner">> => {
      return callMethod(
        NFTListing,
        this,
        "getTokenOwner",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getPrice: async (
      params?: NFTListingTypes.CallMethodParams<"getPrice">
    ): Promise<NFTListingTypes.CallMethodResult<"getPrice">> => {
      return callMethod(
        NFTListing,
        this,
        "getPrice",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getCommissionRate: async (
      params?: NFTListingTypes.CallMethodParams<"getCommissionRate">
    ): Promise<NFTListingTypes.CallMethodResult<"getCommissionRate">> => {
      return callMethod(
        NFTListing,
        this,
        "getCommissionRate",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getListingFee: async (
      params?: NFTListingTypes.CallMethodParams<"getListingFee">
    ): Promise<NFTListingTypes.CallMethodResult<"getListingFee">> => {
      return callMethod(
        NFTListing,
        this,
        "getListingFee",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    requiresRoyalty: async (
      params?: NFTListingTypes.CallMethodParams<"requiresRoyalty">
    ): Promise<NFTListingTypes.CallMethodResult<"requiresRoyalty">> => {
      return callMethod(
        NFTListing,
        this,
        "requiresRoyalty",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getRoyaltyAmount: async (
      params?: NFTListingTypes.CallMethodParams<"getRoyaltyAmount">
    ): Promise<NFTListingTypes.CallMethodResult<"getRoyaltyAmount">> => {
      return callMethod(
        NFTListing,
        this,
        "getRoyaltyAmount",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  async multicall<Calls extends NFTListingTypes.MultiCallParams>(
    calls: Calls
  ): Promise<NFTListingTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      NFTListing,
      this,
      calls,
      getContractByCodeHash
    )) as NFTListingTypes.MultiCallResults<Calls>;
  }
}
