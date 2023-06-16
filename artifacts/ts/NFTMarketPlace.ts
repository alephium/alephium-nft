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
import { default as NFTMarketPlaceContractJson } from "../marketplace/NFTMarketPlace.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace NFTMarketPlaceTypes {
  export type Fields = {
    nftListingTemplateId: HexString;
    admin: Address;
    listingFee: bigint;
    commissionRate: bigint;
  };

  export type State = ContractState<Fields>;

  export type NFTListedEvent = ContractEvent<{
    price: bigint;
    tokenId: HexString;
    tokenOwner: Address;
    listingContractId: HexString;
  }>;
  export type NFTSoldEvent = ContractEvent<{
    price: bigint;
    tokenId: HexString;
    previousOwner: Address;
    newOwner: Address;
  }>;
  export type NFTListingCancelledEvent = ContractEvent<{
    tokenId: HexString;
    tokenOwner: Address;
  }>;
  export type NFTListingPriceUpdatedEvent = ContractEvent<{
    tokenId: HexString;
    oldPrice: bigint;
    newPrice: bigint;
  }>;
  export type AdminUpdatedEvent = ContractEvent<{
    previous: Address;
    new: Address;
  }>;
  export type ListingFeeUpdatedEvent = ContractEvent<{
    previous: bigint;
    new: bigint;
  }>;
  export type CommissionRateUpdatedEvent = ContractEvent<{
    previous: bigint;
    new: bigint;
  }>;

  export interface CallMethodTable {
    listNFT: {
      params: CallContractParams<{ tokenId: HexString; price: bigint }>;
      result: CallContractResult<Address>;
    };
    getListingFee: {
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
  NFTMarketPlaceInstance,
  NFTMarketPlaceTypes.Fields
> {
  consts = {
    ErrorCodes: {
      AdminAllowedOnly: BigInt(0),
      TokenOwnerAllowedOnly: BigInt(1),
      NFTPriceIsZero: BigInt(2),
    },
  };

  at(address: string): NFTMarketPlaceInstance {
    return new NFTMarketPlaceInstance(address);
  }

  tests = {
    buyNFT: async (
      params: TestContractParams<
        NFTMarketPlaceTypes.Fields,
        { tokenId: HexString }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "buyNFT", params);
    },
    listNFT: async (
      params: TestContractParams<
        NFTMarketPlaceTypes.Fields,
        { tokenId: HexString; price: bigint }
      >
    ): Promise<TestContractResult<Address>> => {
      return testMethod(this, "listNFT", params);
    },
    cancelNFTListing: async (
      params: TestContractParams<
        NFTMarketPlaceTypes.Fields,
        { tokenId: HexString }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "cancelNFTListing", params);
    },
    updateNFTPrice: async (
      params: TestContractParams<
        NFTMarketPlaceTypes.Fields,
        { tokenId: HexString; newPrice: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "updateNFTPrice", params);
    },
    updateAdmin: async (
      params: TestContractParams<
        NFTMarketPlaceTypes.Fields,
        { newAdmin: Address }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "updateAdmin", params);
    },
    updateListingFee: async (
      params: TestContractParams<
        NFTMarketPlaceTypes.Fields,
        { newListingFee: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "updateListingFee", params);
    },
    updateCommissionRate: async (
      params: TestContractParams<
        NFTMarketPlaceTypes.Fields,
        { newCommissionRate: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "updateCommissionRate", params);
    },
    getListingFee: async (
      params: Omit<
        TestContractParams<NFTMarketPlaceTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "getListingFee", params);
    },
    withdraw: async (
      params: TestContractParams<
        NFTMarketPlaceTypes.Fields,
        { to: Address; amount: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "withdraw", params);
    },
  };
}

// Use this object to test and deploy the contract
export const NFTMarketPlace = new Factory(
  Contract.fromJson(
    NFTMarketPlaceContractJson,
    "",
    "bfddeeaf71e7ca0e85d140792bf5318c5716813ca1f2e95c0b8584d1fcba22c8"
  )
);

// Use this class to interact with the blockchain
export class NFTMarketPlaceInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<NFTMarketPlaceTypes.State> {
    return fetchContractState(NFTMarketPlace, this);
  }

  async getContractEventsCurrentCount(): Promise<number> {
    return getContractEventsCurrentCount(this.address);
  }

  subscribeNFTListedEvent(
    options: SubscribeOptions<NFTMarketPlaceTypes.NFTListedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTMarketPlace.contract,
      this,
      options,
      "NFTListed",
      fromCount
    );
  }

  subscribeNFTSoldEvent(
    options: SubscribeOptions<NFTMarketPlaceTypes.NFTSoldEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTMarketPlace.contract,
      this,
      options,
      "NFTSold",
      fromCount
    );
  }

  subscribeNFTListingCancelledEvent(
    options: SubscribeOptions<NFTMarketPlaceTypes.NFTListingCancelledEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTMarketPlace.contract,
      this,
      options,
      "NFTListingCancelled",
      fromCount
    );
  }

  subscribeNFTListingPriceUpdatedEvent(
    options: SubscribeOptions<NFTMarketPlaceTypes.NFTListingPriceUpdatedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTMarketPlace.contract,
      this,
      options,
      "NFTListingPriceUpdated",
      fromCount
    );
  }

  subscribeAdminUpdatedEvent(
    options: SubscribeOptions<NFTMarketPlaceTypes.AdminUpdatedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTMarketPlace.contract,
      this,
      options,
      "AdminUpdated",
      fromCount
    );
  }

  subscribeListingFeeUpdatedEvent(
    options: SubscribeOptions<NFTMarketPlaceTypes.ListingFeeUpdatedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTMarketPlace.contract,
      this,
      options,
      "ListingFeeUpdated",
      fromCount
    );
  }

  subscribeCommissionRateUpdatedEvent(
    options: SubscribeOptions<NFTMarketPlaceTypes.CommissionRateUpdatedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTMarketPlace.contract,
      this,
      options,
      "CommissionRateUpdated",
      fromCount
    );
  }

  subscribeAllEvents(
    options: SubscribeOptions<
      | NFTMarketPlaceTypes.NFTListedEvent
      | NFTMarketPlaceTypes.NFTSoldEvent
      | NFTMarketPlaceTypes.NFTListingCancelledEvent
      | NFTMarketPlaceTypes.NFTListingPriceUpdatedEvent
      | NFTMarketPlaceTypes.AdminUpdatedEvent
      | NFTMarketPlaceTypes.ListingFeeUpdatedEvent
      | NFTMarketPlaceTypes.CommissionRateUpdatedEvent
    >,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvents(
      NFTMarketPlace.contract,
      this,
      options,
      fromCount
    );
  }

  methods = {
    listNFT: async (
      params: NFTMarketPlaceTypes.CallMethodParams<"listNFT">
    ): Promise<NFTMarketPlaceTypes.CallMethodResult<"listNFT">> => {
      return callMethod(
        NFTMarketPlace,
        this,
        "listNFT",
        params,
        getContractByCodeHash
      );
    },
    getListingFee: async (
      params?: NFTMarketPlaceTypes.CallMethodParams<"getListingFee">
    ): Promise<NFTMarketPlaceTypes.CallMethodResult<"getListingFee">> => {
      return callMethod(
        NFTMarketPlace,
        this,
        "getListingFee",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  async multicall<Calls extends NFTMarketPlaceTypes.MultiCallParams>(
    calls: Calls
  ): Promise<NFTMarketPlaceTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      NFTMarketPlace,
      this,
      calls,
      getContractByCodeHash
    )) as NFTMarketPlaceTypes.MultiCallResults<Calls>;
  }
}
