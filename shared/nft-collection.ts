import { DeployHelpers } from './deploy-helpers'
import {
  NFTOpenCollection,
  NFTOpenCollectionInstance,
  NFTOpenCollectionTypes,
  NFTOpenCollectionWithRoyalty,
  NFTOpenCollectionWithRoyaltyInstance,
  NFTPublicSaleCollectionRandom,
  NFTPublicSaleCollectionRandomInstance,
  NFTPublicSaleCollectionRandomWithRoyalty,
  NFTPublicSaleCollectionRandomWithRoyaltyInstance,
  NFTPublicSaleCollectionSequential,
  NFTPublicSaleCollectionSequentialInstance,
  NFTPublicSaleCollectionSequentialWithRoyalty,
  NFTPublicSaleCollectionSequentialWithRoyaltyInstance,
  NFTPublicSaleCollectionSequentialTypes,
  NFTOpenCollectionWithRoyaltyTypes,
  NFTPublicSaleCollectionSequentialWithRoyaltyTypes
} from '../artifacts/ts'
import {
  CreateOpenCollection,
  CreateOpenCollectionWithRoyalty,
  CreatePublicSaleCollectionSequential,
  CreatePublicSaleCollectionSequentialWithRoyalty,
  MintBatchSequential,
  MintNextSequential,
  MintOpenNFT,
  MintSpecific,
  WithdrawFromPublicSaleCollectionRandom,
} from '../artifacts/ts/scripts'
import {
  DeployContractResult,
  DUST_AMOUNT,
  ONE_ALPH,
  stringToHex,
  groupOfAddress,
  addressFromContractId,
  binToHex,
  hexToBinUnsafe,
  hexToString,
  contractIdFromAddress,
  subContractId,
  encodeU256,
  isHexString,
  NodeProvider,
  ExplorerProvider,
  SignerProvider
} from '@alephium/web3'
import { getAlephiumNFTConfig } from './configs'
import * as blake from 'blakejs'
import axios from 'axios'
import { NFT } from './nft'

export class NFTCollectionHelper extends DeployHelpers {
  public openCollection: OpenCollection
  public publicSaleCollection: PublicSaleCollection

  constructor(signer: SignerProvider) {
    super(signer)
    this.openCollection = new OpenCollection(signer)
    this.publicSaleCollection = new PublicSaleCollection(signer)
  }
}

async function calcContractId(nodeProvider: NodeProvider, txId: string, unsignedTx: string, groupIndex: number) {
  const parsedUnsignedTx = await nodeProvider.transactions.postTransactionsDecodeUnsignedTx({ unsignedTx })
  const outputIndex = parsedUnsignedTx.unsignedTx.fixedOutputs.length
  const hex = txId + outputIndex.toString(16).padStart(8, '0')
  const hashHex = binToHex(blake.blake2b(hexToBinUnsafe(hex), undefined, 32))
  return hashHex.slice(0, 62) + groupIndex.toString(16).padStart(2, '0')
}

export interface NFTCollectionBase {
  id: string
  name: string
  description: string
  owner: string
  totalSupply: bigint
  image: string,
  royaltyRate?: bigint,
  balance?: string,
  nfts: NFT[]
}

export interface NFTOpenCollection extends NFTCollectionBase {
  collectionType: 'NFTOpenCollection'
}

export interface NFTPublicSaleCollection extends NFTCollectionBase {
  collectionType: 'NFTPublicSaleCollection'
  maxSupply: bigint
  mintPrice: bigint
  maxBatchMintSize: number
  nftBaseUri: string
  royaltyRate?: bigint
  balance?: string
}

export type NFTOpenCollectionMetadata = Omit<NFTOpenCollection, 'nfts'>
export type NFTPublicSaleCollectionMetadata = Omit<NFTPublicSaleCollection, 'nfts'>

export type NFTCollection = NFTOpenCollection | NFTPublicSaleCollection
export type NFTCollectionMetadata = NFTOpenCollectionMetadata | NFTPublicSaleCollectionMetadata

export type NFTsByCollection = Map<NFTCollection, NFT[]>

async function fetchNonEnumerableNFTs(nodeProvider: NodeProvider, addresses: string[], listed: boolean): Promise<NFT[]> {
  if (addresses.length === 0) return []
  const methodIndexes = [0, 1] // getTokenUri, getCollectionId
  const calls = addresses.flatMap((address) => methodIndexes.map((idx) => ({
    group: groupOfAddress(address),
    address: address,
    methodIndex: idx
  })))
  const callResult = await nodeProvider.contracts.postContractsMulticallContract({ calls })
  const getNFT = async (address: string, metadataUri: string, collectionId: string): Promise<NFT | undefined> => {
    try {
      if (metadataUri && collectionId) {
        const metadata = (await axios.get(metadataUri)).data
        return {
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          tokenId: binToHex(contractIdFromAddress(address)),
          collectionId: collectionId,
          minted: true,
          listed
        }
      }
    } catch (error) {
      console.error(`failed to get non-enumerable nft, collection id: ${collectionId}, address: ${address} error: ${error}`)
    }
    return undefined
  }
  const promises = addresses.map((address, idx) => {
    const callResultIndex = idx * 2
    const metadataUri = hexToString(callResult.results[callResultIndex].returns[0].value as string)
    const collectionId = callResult.results[callResultIndex + 1].returns[0].value as string
    return getNFT(address, metadataUri, collectionId)
  })
  return (await Promise.all(promises)).filter((nft) => nft !== undefined) as NFT[]
}

async function fetchEnumerableNFTs(collectionMetadata: NFTPublicSaleCollectionMetadata, indexes: number[], listed: boolean): Promise<NFT[]> {
  if (collectionMetadata.nftBaseUri === undefined) return []
  const groupIndex = groupOfAddress(addressFromContractId(collectionMetadata.id))
  const getNFT = async (index: number): Promise<NFT | undefined> => {
    try {
      const hexStr = collectionMetadata.nftBaseUri + Buffer.from(index.toString(), 'ascii').toString('hex')
      const tokenUri = hexToString(hexStr)
      const metadata = (await axios.get(tokenUri)).data
      const tokenId = subContractId(collectionMetadata.id, binToHex(encodeU256(BigInt(index))), groupIndex)
      return {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        tokenId: tokenId,
        collectionId: collectionMetadata.id,
        listed: listed,
        minted: false,
        tokenIndex: index
      }
    } catch (error) {
      console.error(`failed to fetch enumerable nft, collection id: ${collectionMetadata.id}, index: ${index}, error: ${error}`)
    }
    return undefined
  }
  const promises = indexes.map((index) => getNFT(index))
  return (await Promise.all(promises)).filter((nft) => nft !== undefined) as NFT[]
}

export async function fetchNFTByPage(
  nodeProvider: NodeProvider,
  explorerProvider: ExplorerProvider,
  collectionMetadata: NFTCollectionMetadata,
  page: number,
  pageSize: number
): Promise<NFT[]> {
  const skipped = page * pageSize
  if (collectionMetadata.collectionType === 'NFTOpenCollection') {
    if (explorerProvider === undefined) return []
    const collectionAddress = addressFromContractId(collectionMetadata.id)
    const { subContracts } = await explorerProvider.contracts.getContractsContractSubContracts(collectionAddress)
    const addresses = (subContracts ?? []).slice(skipped, skipped + pageSize)
    return await fetchNonEnumerableNFTs(nodeProvider, addresses, false)
  }

  const range = (from: number, count: number): number[] => Array.from(Array(count).keys()).map((v) => from + v)
  const totalSupply = Number(collectionMetadata.totalSupply)
  const maxSupply = Number(collectionMetadata.maxSupply!)
  const indexes = range(skipped, pageSize).filter((idx) => idx < maxSupply)
  const nfts = await fetchEnumerableNFTs(collectionMetadata, indexes, false)
  return nfts.map<NFT>((nft) => {
    if (nft.tokenIndex! < totalSupply) {
      return { ...nft, minted: true }
    } else {
      return { ...nft, mintPrice: collectionMetadata.mintPrice }
    }
  })
}

// TODO: Improve using multi-call, but it doesn't seem to work for NFTPublicSaleCollection?
export async function fetchNFTCollectionMetadata(
  nodeProvider: NodeProvider,
  collectionId: string
): Promise<NFTCollectionMetadata | undefined> {
  const collectionAddress = addressFromContractId(collectionId)
  const state = await nodeProvider.contracts.getContractsAddressState(collectionAddress, { group: 0 })
  if (state.codeHash === NFTOpenCollection.contract.codeHash) {
    const contractState = NFTOpenCollection.contract.fromApiContractState(state) as NFTOpenCollectionTypes.State
    const metadataUri = hexToString(contractState.fields.collectionUri)
    const metadata = (await axios.get(metadataUri)).data
    return {
      id: collectionId,
      collectionType: 'NFTOpenCollection',
      name: metadata.name,
      description: metadata.description,
      totalSupply: contractState.fields.totalSupply,
      owner: contractState.fields.collectionOwner,
      image: metadata.image
    }
  } else if (state.codeHash === NFTOpenCollectionWithRoyalty.contract.codeHash) {
    const contractState = NFTOpenCollectionWithRoyalty.contract.fromApiContractState(state) as NFTOpenCollectionWithRoyaltyTypes.State
    const metadataUri = hexToString(contractState.fields.collectionUri)
    const metadata = (await axios.get(metadataUri)).data
    const contractBalance = await nodeProvider.addresses.getAddressesAddressBalance(collectionAddress)
    return {
      id: collectionId,
      collectionType: 'NFTOpenCollection',
      name: metadata.name,
      description: metadata.description,
      totalSupply: contractState.fields.totalSupply,
      owner: contractState.fields.collectionOwner,
      royaltyRate: contractState.fields.royaltyRate,
      image: metadata.image,
      balance: contractBalance.balanceHint
    }
  } else if (state.codeHash === NFTPublicSaleCollectionSequential.contract.codeHash) {
    const contractState = NFTPublicSaleCollectionSequential.contract.fromApiContractState(state) as NFTPublicSaleCollectionSequentialTypes.State
    const metadataUri = hexToString(contractState.fields.collectionUri)
    const metadata = (await axios.get(metadataUri)).data
    return {
      id: collectionId,
      collectionType: 'NFTPublicSaleCollection',
      name: metadata.name,
      description: metadata.description,
      totalSupply: contractState.fields.totalSupply,
      owner: contractState.fields.collectionOwner,
      image: metadata.image,
      maxSupply: contractState.fields.maxSupply,
      mintPrice: contractState.fields.mintPrice,
      maxBatchMintSize: Number(contractState.fields.maxBatchMintSize),
      nftBaseUri: contractState.fields.nftBaseUri
    }
  } else if (state.codeHash === NFTPublicSaleCollectionSequentialWithRoyalty.contract.codeHash) {
    const contractState = NFTPublicSaleCollectionSequentialWithRoyalty.contract.fromApiContractState(state) as NFTPublicSaleCollectionSequentialWithRoyaltyTypes.State
    const metadataUri = hexToString(contractState.fields.collectionUri)
    const metadata = (await axios.get(metadataUri)).data
    const contractBalance = await nodeProvider.addresses.getAddressesAddressBalance(collectionAddress)
    return {
      id: collectionId,
      collectionType: 'NFTPublicSaleCollection',
      name: metadata.name,
      description: metadata.description,
      totalSupply: contractState.fields.totalSupply,
      owner: contractState.fields.collectionOwner,
      image: metadata.image,
      maxSupply: contractState.fields.maxSupply,
      mintPrice: contractState.fields.mintPrice,
      maxBatchMintSize: Number(contractState.fields.maxBatchMintSize),
      nftBaseUri: contractState.fields.nftBaseUri,
      royaltyRate: contractState.fields.royaltyRate,
      balance: contractBalance.balanceHint
    }
  }
}

export async function checkAndGetCollectionMetadata(nodeProvider: NodeProvider, collectionId: string): Promise<NFTCollectionMetadata> {
  if (!isHexString(collectionId) || collectionId.length !== 64) {
    throw new Error('Invalid nft collection id')
  }
  const metadata = await fetchNFTCollectionMetadata(nodeProvider, collectionId)
  if (metadata === undefined) {
    throw new Error('Unknown nft collection type')
  }
  return metadata
}

class OpenCollection extends DeployHelpers {
  async create(
    collectionUri: string,
    signer: SignerProvider = this.signer
  ): Promise<DeployContractResult<NFTOpenCollectionInstance>> {
    const config = getAlephiumNFTConfig()
    const ownerAddress = (await signer.getSelectedAccount()).address
    let result = await CreateOpenCollection.execute(signer, {
      initialFields: {
        openCollectionTemplateId: config.openCollectionTemplateId,
        nftTemplateId: config.nftTemplateId,
        collectionUri: stringToHex(collectionUri),
        collectionOwner: ownerAddress,
        totalSupply: 0n
      },
      attoAlphAmount: ONE_ALPH
    })
    const groupIndex = groupOfAddress(ownerAddress)
    const contractId = await calcContractId(this.nodeProvider, result.txId, result.unsignedTx, groupIndex)
    return {
      ...result,
      contractInstance: NFTOpenCollection.at(addressFromContractId(contractId))
    }
  }

  async createWithRoyalty(
    collectionUri: string,
    royaltyRate: bigint,
    signer: SignerProvider = this.signer,
  ): Promise<DeployContractResult<NFTOpenCollectionWithRoyaltyInstance>> {
    const config = getAlephiumNFTConfig()
    const ownerAddress = (await signer.getSelectedAccount()).address
    let result = await CreateOpenCollectionWithRoyalty.execute(signer, {
      initialFields: {
        openCollectionWithRoyaltyTemplateId: config.openCollectionWithRoyaltyTemplateId,
        nftTemplateId: config.nftTemplateId,
        collectionUri: stringToHex(collectionUri),
        collectionOwner: ownerAddress,
        royaltyRate,
        totalSupply: 0n
      },
      attoAlphAmount: ONE_ALPH
    })
    const groupIndex = groupOfAddress(ownerAddress)
    const contractId = await calcContractId(this.nodeProvider, result.txId, result.unsignedTx, groupIndex)
    return {
      ...result,
      contractInstance: NFTOpenCollectionWithRoyalty.at(addressFromContractId(contractId))
    }
  }

  async mint(
    nftCollectionContractId: string,
    nftUri: string,
    royalty: boolean = false,
    signer: SignerProvider = this.signer,
  ) {
    return await MintOpenNFT.execute(
      signer,
      {
        initialFields: {
          nftCollectionId: nftCollectionContractId,
          uri: stringToHex(nftUri),
          royalty
        },
        attoAlphAmount: BigInt(1.1e18)
      }
    )
  }
}

class PublicSaleCollection extends DeployHelpers {
  public random: PublicSaleCollectionRandom
  public sequential: PublicSaleCollectionSequential

  constructor(signer: SignerProvider) {
    super(signer)
    this.random = new PublicSaleCollectionRandom(signer)
    this.sequential = new PublicSaleCollectionSequential(signer)
  }
}

class PublicSaleCollectionRandom extends DeployHelpers {
  async create(
    maxSupply: bigint,
    mintPrice: bigint,
    collectionUri: string,
    baseUri: string,
    signer: SignerProvider = this.signer
  ): Promise<DeployContractResult<NFTPublicSaleCollectionRandomInstance>> {
    const config = getAlephiumNFTConfig()
    const ownerAddress = (await signer.getSelectedAccount()).address
    const nftCollectionDeployTx = await NFTPublicSaleCollectionRandom.deploy(
      signer,
      {
        initialFields: {
          nftTemplateId: config.nftTemplateId,
          collectionUri: stringToHex(collectionUri),
          nftBaseUri: stringToHex(baseUri),
          collectionOwner: ownerAddress,
          maxSupply: maxSupply,
          mintPrice: mintPrice,
          totalSupply: 0n
        }
      }
    )

    return nftCollectionDeployTx
  }

  // TODO: simplify
  async createWithRoyalty(
    maxSupply: bigint,
    mintPrice: bigint,
    collectionUri: string,
    baseUri: string,
    royaltyRate: bigint,
    signer: SignerProvider = this.signer
  ): Promise<DeployContractResult<NFTPublicSaleCollectionRandomWithRoyaltyInstance>> {
    const config = getAlephiumNFTConfig()
    const ownerAddress = (await signer.getSelectedAccount()).address
    const nftCollectionDeployTx = await NFTPublicSaleCollectionRandomWithRoyalty.deploy(
      signer,
      {
        initialFields: {
          nftTemplateId: config.nftTemplateId,
          collectionUri: stringToHex(collectionUri),
          nftBaseUri: stringToHex(baseUri),
          collectionOwner: ownerAddress,
          maxSupply: maxSupply,
          mintPrice: mintPrice,
          royaltyRate,
          totalSupply: 0n
        }
      }
    )

    return nftCollectionDeployTx
  }

  async mint(
    index: bigint,
    mintPrice: bigint,
    nftCollectionContractId: string,
    royalty: boolean,
    signer: SignerProvider = this.signer
  ) {
    return await MintSpecific.execute(
      signer,
      {
        initialFields: {
          index: index,
          mintPrice: mintPrice,
          nftCollectionId: nftCollectionContractId,
          royalty
        },
        attoAlphAmount: BigInt(1.1e18) + mintPrice
      }
    )
  }

  async withdraw(
    to: string,
    amount: bigint,
    nftCollectionId: string,
    royalty: boolean,
    signer: SignerProvider = this.signer
  ) {
    return await WithdrawFromPublicSaleCollectionRandom.execute(
      signer,
      {
        initialFields: {
          to: to,
          amount: amount,
          nftCollectionId: nftCollectionId,
          royalty
        }
      }
    )
  }
}

class PublicSaleCollectionSequential extends DeployHelpers {

  async create(
    maxSupply: bigint,
    mintPrice: bigint,
    collectionUri: string,
    baseUri: string,
    maxBatchMintSize: bigint,
    signer: SignerProvider = this.signer
  ): Promise<DeployContractResult<NFTPublicSaleCollectionSequentialInstance>> {
    const config = getAlephiumNFTConfig()
    const ownerAddress = (await signer.getSelectedAccount()).address
    const result = await CreatePublicSaleCollectionSequential.execute(signer, {
      initialFields: {
        publicSaleCollectionTemplateId: config.publicSaleCollectionTemplateId,
        nftTemplateId: config.nftTemplateId,
        collectionUri: stringToHex(collectionUri),
        nftBaseUri: stringToHex(baseUri),
        collectionOwner: ownerAddress,
        maxSupply: maxSupply,
        mintPrice: mintPrice,
        maxBatchMintSize: maxBatchMintSize,
        totalSupply: 0n
      },
      attoAlphAmount: ONE_ALPH
    })
    const groupIndex = groupOfAddress(ownerAddress)
    const contractId = await calcContractId(this.nodeProvider, result.txId, result.unsignedTx, groupIndex)
    return {
      ...result,
      contractInstance: NFTPublicSaleCollectionSequential.at(addressFromContractId(contractId))
    }
  }

  async createWithRoyalty(
    maxSupply: bigint,
    mintPrice: bigint,
    collectionUri: string,
    baseUri: string,
    maxBatchMintSize: bigint,
    royaltyRate: bigint,
    signer: SignerProvider = this.signer
  ): Promise<DeployContractResult<NFTPublicSaleCollectionSequentialWithRoyaltyInstance>> {
    const config = getAlephiumNFTConfig()
    const ownerAddress = (await signer.getSelectedAccount()).address
    const result = await CreatePublicSaleCollectionSequentialWithRoyalty.execute(signer, {
      initialFields: {
        publicSaleCollectionTemplateId: config.publicSaleCollectionWithRoyaltyTemplateId,
        nftTemplateId: config.nftTemplateId,
        collectionUri: stringToHex(collectionUri),
        nftBaseUri: stringToHex(baseUri),
        collectionOwner: ownerAddress,
        maxSupply: maxSupply,
        mintPrice: mintPrice,
        maxBatchMintSize: maxBatchMintSize,
        royaltyRate: royaltyRate,
        totalSupply: 0n
      },
      attoAlphAmount: ONE_ALPH
    })
    const groupIndex = groupOfAddress(ownerAddress)
    const contractId = await calcContractId(this.nodeProvider, result.txId, result.unsignedTx, groupIndex)
    return {
      ...result,
      contractInstance: NFTPublicSaleCollectionSequentialWithRoyalty.at(addressFromContractId(contractId))
    }
  }

  async batchMint(
    batchSize: bigint,
    mintPrice: bigint,
    nftCollectionContractId: string,
    royalty: boolean,
    signer: SignerProvider = this.signer
  ) {
    return await MintBatchSequential.execute(
      signer,
      {
        initialFields: {
          nftCollectionId: nftCollectionContractId,
          batchSize: batchSize,
          mintPrice: mintPrice,
          royalty
        },
        attoAlphAmount: batchSize * (ONE_ALPH + mintPrice) + (batchSize + 1n) * DUST_AMOUNT
      }
    )
  }

  async mintNext(
    mintPrice: bigint,
    nftCollectionContractId: string,
    royalty: boolean,
    signer: SignerProvider = this.signer
  ) {
    return await MintNextSequential.execute(
      signer,
      {
        initialFields: {
          nftCollectionId: nftCollectionContractId,
          mintPrice: mintPrice,
          royalty
        },
        attoAlphAmount: ONE_ALPH + mintPrice + DUST_AMOUNT * 2n
      }
    )
  }
}