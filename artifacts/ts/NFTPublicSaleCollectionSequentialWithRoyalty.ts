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
import { default as NFTPublicSaleCollectionSequentialWithRoyaltyContractJson } from "../nft/publicsale/sequential/NFTPublicSaleCollectionSequentialWithRoyalty.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace NFTPublicSaleCollectionSequentialWithRoyaltyTypes {
  export type Fields = {
    nftTemplateId: HexString;
    collectionUri: HexString;
    nftBaseUri: HexString;
    collectionOwner: Address;
    maxSupply: bigint;
    mintPrice: bigint;
    maxBatchMintSize: bigint;
    royaltyRate: bigint;
    totalSupply: bigint;
  };

  export type State = ContractState<Fields>;

  export type MintEvent = ContractEvent<{
    minter: Address;
    fromIndex: bigint;
    mintSize: bigint;
  }>;

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
    royaltyAmount: {
      params: CallContractParams<{ tokenId: HexString; salePrice: bigint }>;
      result: CallContractResult<bigint>;
    };
    mint: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    mintBatch: {
      params: CallContractParams<{ size: bigint }>;
      result: CallContractResult<HexString>;
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
  NFTPublicSaleCollectionSequentialWithRoyaltyInstance,
  NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields
> {
  getInitialFieldsWithDefaultValues() {
    return this.contract.getInitialFieldsWithDefaultValues() as NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields;
  }

  eventIndex = { Mint: 0 };
  consts = {
    PublicSaleErrorCodes: { IncorrectTokenIndex: BigInt(0) },
    ErrorCodes: {
      IncorrectTokenIndex: BigInt(2),
      InvalidMintBatchSize: BigInt(3),
      InsufficientNumOfUnminted: BigInt(4),
      NFTNotFound: BigInt(0),
      CollectionOwnerAllowedOnly: BigInt(1),
      NFTNotPartOfCollection: BigInt(2),
    },
  };

  at(address: string): NFTPublicSaleCollectionSequentialWithRoyaltyInstance {
    return new NFTPublicSaleCollectionSequentialWithRoyaltyInstance(address);
  }

  tests = {
    getCollectionUri: async (
      params: Omit<
        TestContractParams<
          NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
          never
        >,
        "testArgs"
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getCollectionUri", params);
    },
    totalSupply: async (
      params: Omit<
        TestContractParams<
          NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
          never
        >,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "totalSupply", params);
    },
    nftByIndex: async (
      params: TestContractParams<
        NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
        { index: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "nftByIndex", params);
    },
    validateNFT: async (
      params: TestContractParams<
        NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
        { nftId: HexString; nftIndex: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "validateNFT", params);
    },
    royaltyAmount: async (
      params: TestContractParams<
        NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
        { tokenId: HexString; salePrice: bigint }
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "royaltyAmount", params);
    },
    payRoyalty: async (
      params: TestContractParams<
        NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
        { payer: Address; amount: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "payRoyalty", params);
    },
    withdrawRoyalty: async (
      params: TestContractParams<
        NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
        { to: Address; amount: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "withdrawRoyalty", params);
    },
    mint_: async (
      params: TestContractParams<
        NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
        { minter: Address; index: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "mint_", params);
    },
    mint: async (
      params: Omit<
        TestContractParams<
          NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
          never
        >,
        "testArgs"
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "mint", params);
    },
    mintBatch: async (
      params: TestContractParams<
        NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
        { size: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "mintBatch", params);
    },
    withdraw: async (
      params: TestContractParams<
        NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
        { to: Address; amount: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "withdraw", params);
    },
    getNFTUri: async (
      params: TestContractParams<
        NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
        { index: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getNFTUri", params);
    },
    getMintPrice: async (
      params: Omit<
        TestContractParams<
          NFTPublicSaleCollectionSequentialWithRoyaltyTypes.Fields,
          never
        >,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "getMintPrice", params);
    },
  };
}

// Use this object to test and deploy the contract
export const NFTPublicSaleCollectionSequentialWithRoyalty = new Factory(
  Contract.fromJson(
    NFTPublicSaleCollectionSequentialWithRoyaltyContractJson,
    "",
    "4cdc890635635f64a7697b2e73a35fa5a0faf74ebfe2fb8bdea16d4e24302b88"
  )
);

// Use this class to interact with the blockchain
export class NFTPublicSaleCollectionSequentialWithRoyaltyInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<NFTPublicSaleCollectionSequentialWithRoyaltyTypes.State> {
    return fetchContractState(
      NFTPublicSaleCollectionSequentialWithRoyalty,
      this
    );
  }

  async getContractEventsCurrentCount(): Promise<number> {
    return getContractEventsCurrentCount(this.address);
  }

  subscribeMintEvent(
    options: EventSubscribeOptions<NFTPublicSaleCollectionSequentialWithRoyaltyTypes.MintEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      NFTPublicSaleCollectionSequentialWithRoyalty.contract,
      this,
      options,
      "Mint",
      fromCount
    );
  }

  methods = {
    getCollectionUri: async (
      params?: NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodParams<"getCollectionUri">
    ): Promise<
      NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodResult<"getCollectionUri">
    > => {
      return callMethod(
        NFTPublicSaleCollectionSequentialWithRoyalty,
        this,
        "getCollectionUri",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    totalSupply: async (
      params?: NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodParams<"totalSupply">
    ): Promise<
      NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodResult<"totalSupply">
    > => {
      return callMethod(
        NFTPublicSaleCollectionSequentialWithRoyalty,
        this,
        "totalSupply",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    nftByIndex: async (
      params: NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodParams<"nftByIndex">
    ): Promise<
      NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodResult<"nftByIndex">
    > => {
      return callMethod(
        NFTPublicSaleCollectionSequentialWithRoyalty,
        this,
        "nftByIndex",
        params,
        getContractByCodeHash
      );
    },
    royaltyAmount: async (
      params: NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodParams<"royaltyAmount">
    ): Promise<
      NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodResult<"royaltyAmount">
    > => {
      return callMethod(
        NFTPublicSaleCollectionSequentialWithRoyalty,
        this,
        "royaltyAmount",
        params,
        getContractByCodeHash
      );
    },
    mint: async (
      params?: NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodParams<"mint">
    ): Promise<
      NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodResult<"mint">
    > => {
      return callMethod(
        NFTPublicSaleCollectionSequentialWithRoyalty,
        this,
        "mint",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    mintBatch: async (
      params: NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodParams<"mintBatch">
    ): Promise<
      NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodResult<"mintBatch">
    > => {
      return callMethod(
        NFTPublicSaleCollectionSequentialWithRoyalty,
        this,
        "mintBatch",
        params,
        getContractByCodeHash
      );
    },
    getNFTUri: async (
      params: NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodParams<"getNFTUri">
    ): Promise<
      NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodResult<"getNFTUri">
    > => {
      return callMethod(
        NFTPublicSaleCollectionSequentialWithRoyalty,
        this,
        "getNFTUri",
        params,
        getContractByCodeHash
      );
    },
    getMintPrice: async (
      params?: NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodParams<"getMintPrice">
    ): Promise<
      NFTPublicSaleCollectionSequentialWithRoyaltyTypes.CallMethodResult<"getMintPrice">
    > => {
      return callMethod(
        NFTPublicSaleCollectionSequentialWithRoyalty,
        this,
        "getMintPrice",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  async multicall<
    Calls extends NFTPublicSaleCollectionSequentialWithRoyaltyTypes.MultiCallParams
  >(
    calls: Calls
  ): Promise<
    NFTPublicSaleCollectionSequentialWithRoyaltyTypes.MultiCallResults<Calls>
  > {
    return (await multicallMethods(
      NFTPublicSaleCollectionSequentialWithRoyalty,
      this,
      calls,
      getContractByCodeHash
    )) as NFTPublicSaleCollectionSequentialWithRoyaltyTypes.MultiCallResults<Calls>;
  }
}
