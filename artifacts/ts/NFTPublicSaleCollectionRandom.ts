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
  Asset,
  ContractInstance,
  getContractEventsCurrentCount,
  TestContractParamsWithoutMaps,
  TestContractResultWithoutMaps,
  SignExecuteContractMethodParams,
  SignExecuteScriptTxResult,
  signExecuteMethod,
  addStdIdToFields,
  encodeContractFields,
  Narrow,
} from "@alephium/web3";
import { default as NFTPublicSaleCollectionRandomContractJson } from "../nft/publicsale/random/NFTPublicSaleCollectionRandom.ral.json";
import { getContractByCodeHash, registerContract } from "./contracts";

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
    validateNFT: {
      params: CallContractParams<{ nftId: HexString; nftIndex: bigint }>;
      result: CallContractResult<null>;
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
    withdraw: {
      params: CallContractParams<{ to: Address; amount: bigint }>;
      result: CallContractResult<null>;
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
  export type MulticallReturnType<Callss extends MultiCallParams[]> = {
    [index in keyof Callss]: MultiCallResults<Callss[index]>;
  };

  export interface SignExecuteMethodTable {
    getCollectionUri: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    totalSupply: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    nftByIndex: {
      params: SignExecuteContractMethodParams<{ index: bigint }>;
      result: SignExecuteScriptTxResult;
    };
    validateNFT: {
      params: SignExecuteContractMethodParams<{
        nftId: HexString;
        nftIndex: bigint;
      }>;
      result: SignExecuteScriptTxResult;
    };
    mint: {
      params: SignExecuteContractMethodParams<{ index: bigint }>;
      result: SignExecuteScriptTxResult;
    };
    getCollectionOwner: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getMaxSupply: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    withdraw: {
      params: SignExecuteContractMethodParams<{ to: Address; amount: bigint }>;
      result: SignExecuteScriptTxResult;
    };
    getNFTUri: {
      params: SignExecuteContractMethodParams<{ index: bigint }>;
      result: SignExecuteScriptTxResult;
    };
    getMintPrice: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
  }
  export type SignExecuteMethodParams<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["params"];
  export type SignExecuteMethodResult<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["result"];
}

class Factory extends ContractFactory<
  NFTPublicSaleCollectionRandomInstance,
  NFTPublicSaleCollectionRandomTypes.Fields
> {
  encodeFields(fields: NFTPublicSaleCollectionRandomTypes.Fields) {
    return encodeContractFields(
      addStdIdToFields(this.contract, fields),
      this.contract.fieldsSig,
      []
    );
  }

  eventIndex = { Mint: 0 };
  consts = {
    PublicSaleErrorCodes: { IncorrectTokenIndex: BigInt("0") },
    ErrorCodes: {
      IncorrectTokenIndex: BigInt("2"),
      NFTNotFound: BigInt("0"),
      CollectionOwnerAllowedOnly: BigInt("1"),
      NFTNotPartOfCollection: BigInt("2"),
    },
  };

  at(address: string): NFTPublicSaleCollectionRandomInstance {
    return new NFTPublicSaleCollectionRandomInstance(address);
  }

  tests = {
    getCollectionUri: async (
      params: Omit<
        TestContractParamsWithoutMaps<
          NFTPublicSaleCollectionRandomTypes.Fields,
          never
        >,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(
        this,
        "getCollectionUri",
        params,
        getContractByCodeHash
      );
    },
    totalSupply: async (
      params: Omit<
        TestContractParamsWithoutMaps<
          NFTPublicSaleCollectionRandomTypes.Fields,
          never
        >,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "totalSupply", params, getContractByCodeHash);
    },
    nftByIndex: async (
      params: TestContractParamsWithoutMaps<
        NFTPublicSaleCollectionRandomTypes.Fields,
        { index: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "nftByIndex", params, getContractByCodeHash);
    },
    validateNFT: async (
      params: TestContractParamsWithoutMaps<
        NFTPublicSaleCollectionRandomTypes.Fields,
        { nftId: HexString; nftIndex: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "validateNFT", params, getContractByCodeHash);
    },
    mint: async (
      params: TestContractParamsWithoutMaps<
        NFTPublicSaleCollectionRandomTypes.Fields,
        { index: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "mint", params, getContractByCodeHash);
    },
    getCollectionOwner: async (
      params: Omit<
        TestContractParamsWithoutMaps<
          NFTPublicSaleCollectionRandomTypes.Fields,
          never
        >,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<Address>> => {
      return testMethod(
        this,
        "getCollectionOwner",
        params,
        getContractByCodeHash
      );
    },
    getMaxSupply: async (
      params: Omit<
        TestContractParamsWithoutMaps<
          NFTPublicSaleCollectionRandomTypes.Fields,
          never
        >,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getMaxSupply", params, getContractByCodeHash);
    },
    withdraw: async (
      params: TestContractParamsWithoutMaps<
        NFTPublicSaleCollectionRandomTypes.Fields,
        { to: Address; amount: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "withdraw", params, getContractByCodeHash);
    },
    getNFTUri: async (
      params: TestContractParamsWithoutMaps<
        NFTPublicSaleCollectionRandomTypes.Fields,
        { index: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getNFTUri", params, getContractByCodeHash);
    },
    getMintPrice: async (
      params: Omit<
        TestContractParamsWithoutMaps<
          NFTPublicSaleCollectionRandomTypes.Fields,
          never
        >,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getMintPrice", params, getContractByCodeHash);
    },
  };

  stateForTest(
    initFields: NFTPublicSaleCollectionRandomTypes.Fields,
    asset?: Asset,
    address?: string
  ) {
    return this.stateForTest_(initFields, asset, address, undefined);
  }
}

// Use this object to test and deploy the contract
export const NFTPublicSaleCollectionRandom = new Factory(
  Contract.fromJson(
    NFTPublicSaleCollectionRandomContractJson,
    "",
    "55317db571a2a8e63fb955b61f76d3fa602df3d8ad8e9c0ac7d0c13fff47ac2e",
    []
  )
);
registerContract(NFTPublicSaleCollectionRandom);

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

  view = {
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
    validateNFT: async (
      params: NFTPublicSaleCollectionRandomTypes.CallMethodParams<"validateNFT">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.CallMethodResult<"validateNFT">
    > => {
      return callMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "validateNFT",
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
    withdraw: async (
      params: NFTPublicSaleCollectionRandomTypes.CallMethodParams<"withdraw">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.CallMethodResult<"withdraw">
    > => {
      return callMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "withdraw",
        params,
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

  transact = {
    getCollectionUri: async (
      params: NFTPublicSaleCollectionRandomTypes.SignExecuteMethodParams<"getCollectionUri">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.SignExecuteMethodResult<"getCollectionUri">
    > => {
      return signExecuteMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "getCollectionUri",
        params
      );
    },
    totalSupply: async (
      params: NFTPublicSaleCollectionRandomTypes.SignExecuteMethodParams<"totalSupply">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.SignExecuteMethodResult<"totalSupply">
    > => {
      return signExecuteMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "totalSupply",
        params
      );
    },
    nftByIndex: async (
      params: NFTPublicSaleCollectionRandomTypes.SignExecuteMethodParams<"nftByIndex">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.SignExecuteMethodResult<"nftByIndex">
    > => {
      return signExecuteMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "nftByIndex",
        params
      );
    },
    validateNFT: async (
      params: NFTPublicSaleCollectionRandomTypes.SignExecuteMethodParams<"validateNFT">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.SignExecuteMethodResult<"validateNFT">
    > => {
      return signExecuteMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "validateNFT",
        params
      );
    },
    mint: async (
      params: NFTPublicSaleCollectionRandomTypes.SignExecuteMethodParams<"mint">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.SignExecuteMethodResult<"mint">
    > => {
      return signExecuteMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "mint",
        params
      );
    },
    getCollectionOwner: async (
      params: NFTPublicSaleCollectionRandomTypes.SignExecuteMethodParams<"getCollectionOwner">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.SignExecuteMethodResult<"getCollectionOwner">
    > => {
      return signExecuteMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "getCollectionOwner",
        params
      );
    },
    getMaxSupply: async (
      params: NFTPublicSaleCollectionRandomTypes.SignExecuteMethodParams<"getMaxSupply">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.SignExecuteMethodResult<"getMaxSupply">
    > => {
      return signExecuteMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "getMaxSupply",
        params
      );
    },
    withdraw: async (
      params: NFTPublicSaleCollectionRandomTypes.SignExecuteMethodParams<"withdraw">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.SignExecuteMethodResult<"withdraw">
    > => {
      return signExecuteMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "withdraw",
        params
      );
    },
    getNFTUri: async (
      params: NFTPublicSaleCollectionRandomTypes.SignExecuteMethodParams<"getNFTUri">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.SignExecuteMethodResult<"getNFTUri">
    > => {
      return signExecuteMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "getNFTUri",
        params
      );
    },
    getMintPrice: async (
      params: NFTPublicSaleCollectionRandomTypes.SignExecuteMethodParams<"getMintPrice">
    ): Promise<
      NFTPublicSaleCollectionRandomTypes.SignExecuteMethodResult<"getMintPrice">
    > => {
      return signExecuteMethod(
        NFTPublicSaleCollectionRandom,
        this,
        "getMintPrice",
        params
      );
    },
  };

  async multicall<
    Calls extends NFTPublicSaleCollectionRandomTypes.MultiCallParams
  >(
    calls: Calls
  ): Promise<NFTPublicSaleCollectionRandomTypes.MultiCallResults<Calls>>;
  async multicall<
    Callss extends NFTPublicSaleCollectionRandomTypes.MultiCallParams[]
  >(
    callss: Narrow<Callss>
  ): Promise<NFTPublicSaleCollectionRandomTypes.MulticallReturnType<Callss>>;
  async multicall<
    Callss extends
      | NFTPublicSaleCollectionRandomTypes.MultiCallParams
      | NFTPublicSaleCollectionRandomTypes.MultiCallParams[]
  >(callss: Callss): Promise<unknown> {
    return await multicallMethods(
      NFTPublicSaleCollectionRandom,
      this,
      callss,
      getContractByCodeHash
    );
  }
}
