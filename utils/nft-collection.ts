import { DeployHelpers } from './deploy-helpers'
import {
  NFTPublicSaleCollectionSequentialTypes,
  NFTOpenCollectionTypes,
  NFTOpenCollection,
  NFTOpenCollectionInstance,
  NFTPublicSaleCollectionRandom,
  NFTPublicSaleCollectionRandomInstance,
  NFTPublicSaleCollectionSequential,
  NFTPublicSaleCollectionSequentialInstance,
  NFTPublicSaleCollectionRandomTypes
} from '../artifacts/ts'
import {
  MintBatchSequential,
  MintNextSequential,
  MintOpenNFT,
  MintSpecificPublicSaleNFT,
  WithdrawFromPublicSaleCollection
} from '../artifacts/ts/scripts'
import {
  web3,
  stringToHex,
  DeployContractResult,
  DUST_AMOUNT,
  ONE_ALPH,
  binToHex,
  contractIdFromAddress,
  hexToString,
  subContractId,
  encodeU256,
  addressFromContractId
} from '@alephium/web3'
import { nftTemplateId, groupIndex } from '../configs/nft'
import { NFT } from "../utils/nft"
import axios from "axios"
import { contractExists } from '.'

export class NFTCollectionDeployer extends DeployHelpers {
  async createOpenCollection(
    collectionUri: string
  ): Promise<DeployContractResult<NFTOpenCollectionInstance>> {

    const ownerAddress = (await this.signer.getSelectedAccount()).address
    const nftCollectionDeployTx = await NFTOpenCollection.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId: nftTemplateId,
          collectionUri: stringToHex(collectionUri),
          collectionOwner: ownerAddress,
          totalSupply: 0n
        }
      }
    )

    return nftCollectionDeployTx
  }

  async createPublicSaleCollectionRandom(
    maxSupply: bigint,
    mintPrice: bigint,
    collectionUri: string,
    baseUri: string
  ): Promise<DeployContractResult<NFTPublicSaleCollectionRandomInstance>> {
    const ownerAddress = (await this.signer.getSelectedAccount()).address
    const nftCollectionDeployTx = await NFTPublicSaleCollectionRandom.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId: nftTemplateId,
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

  async createPublicSaleCollectionSequential(
    maxSupply: bigint,
    mintPrice: bigint,
    collectionUri: string,
    baseUri: string,
    maxBatchMintSize: bigint
  ): Promise<DeployContractResult<NFTPublicSaleCollectionSequentialInstance>> {
    if (maxBatchMintSize > maxSupply) throw new Error('Invalid max batch mint size')
    const ownerAddress = (await this.signer.getSelectedAccount()).address
    return await NFTPublicSaleCollectionSequential.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId: nftTemplateId,
          collectionUri: stringToHex(collectionUri),
          nftBaseUri: stringToHex(baseUri),
          collectionOwner: ownerAddress,
          maxSupply: maxSupply,
          mintPrice: mintPrice,
          maxBatchMintSize: maxBatchMintSize,
          totalSupply: 0n
        }
      }
    )
  }

  async mintBatchSequential(
    batchSize: bigint,
    mintPrice: bigint,
    nftCollectionContractId: string
  ) {
    return await MintBatchSequential.execute(
      this.signer,
      {
        initialFields: {
          nftCollection: nftCollectionContractId,
          batchSize: batchSize,
          mintPrice: mintPrice
        },
        attoAlphAmount: batchSize * (ONE_ALPH + mintPrice) + (batchSize + 1n) * DUST_AMOUNT
      }
    )
  }

  async mintNextSequential(mintPrice: bigint, nftCollectionContractId: string) {
    return await MintNextSequential.execute(
      this.signer,
      {
        initialFields: {
          nftCollection: nftCollectionContractId,
          mintPrice: mintPrice
        },
        attoAlphAmount: ONE_ALPH + mintPrice + DUST_AMOUNT * 2n
      }
    )
  }

  async mintOpenNFT(
    nftCollectionContractId: string,
    nftUri: string,
  ) {
    return await MintOpenNFT.execute(
      this.signer,
      {
        initialFields: {
          nftCollection: nftCollectionContractId,
          uri: stringToHex(nftUri)
        },
        attoAlphAmount: BigInt(1.1e18)
      }
    )
  }

  async mintSpecificPublicSaleNFT(
    index: bigint,
    mintPrice: bigint,
    nftCollectionContractId: string,
  ) {
    return await MintSpecificPublicSaleNFT.execute(
      this.signer,
      {
        initialFields: {
          index: index,
          mintPrice: mintPrice,
          nftCollection: nftCollectionContractId
        },
        attoAlphAmount: BigInt(1.1e18) + mintPrice
      }
    )
  }

  async withdrawFromPublicSaleCollection(
    to: string,
    amount: bigint,
    nftCollectionId: string,
  ) {
    return await WithdrawFromPublicSaleCollection.execute(
      this.signer,
      {
        initialFields: {
          to: to,
          amount: amount,
          nftCollection: nftCollectionId
        }
      }
    )
  }
}

export interface NFTCollectionBase {
  id: string
  name: string
  description: string
  owner: string
  totalSupply: bigint
  image: string
  nfts: NFT[]
}

export interface NFTOpenCollection extends NFTCollectionBase {
  collectionType: 'NFTOpenCollection'
}

export interface NFTPublicSaleCollectionSequential extends NFTCollectionBase {
  collectionType: 'NFTPublicSaleCollectionSequential'
  maxSupply: bigint
  mintPrice: bigint
  maxBatchMintSize: number
  nftBaseUri: string
}

export interface NFTPublicSaleCollectionRandom extends NFTCollectionBase {
  collectionType: 'NFTPublicSaleCollectionRandom'
  maxSupply: bigint
  mintPrice: bigint
  nftBaseUri: string
}

export type NFTOpenCollectionMetadata = Omit<NFTOpenCollection, 'nfts'>
export type NFTPublicSaleCollectionSequentialMetadata = Omit<NFTPublicSaleCollectionSequential, 'nfts'>
export type NFTPublicSaleCollectionRandomMetadata = Omit<NFTPublicSaleCollectionRandom, 'nfts'>

export type NFTCollection = NFTOpenCollection | NFTPublicSaleCollectionSequential | NFTPublicSaleCollectionRandom
export type NFTPublicSaleCollectionMetadata = NFTPublicSaleCollectionSequentialMetadata | NFTPublicSaleCollectionRandomMetadata
export type NFTCollectionMetadata = NFTOpenCollectionMetadata | NFTPublicSaleCollectionMetadata

export type NFTsByCollection = Map<NFTCollection, NFT[]>

async function fetchNFTsByTokenAddresses(addresses: string[], listed: boolean): Promise<NFT[]> {
  if (addresses.length === 0) return []
  const nodeProvider = web3.getCurrentNodeProvider()
  const methodIndexes = [0, 1] // getTokenUri, getCollectionId
  const calls = addresses.flatMap((address) => methodIndexes.map((idx) => ({
    group: groupIndex,
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
      console.error(`failed to get nft by token address, collection id: ${collectionId}, address: ${address} error: ${error}`)
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

async function fetchPublicSaleNFTs(collectionMetadata: NFTPublicSaleCollectionMetadata, indexes: number[], listed: boolean): Promise<NFT[]> {
  if (collectionMetadata.nftBaseUri === undefined) return []
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
      console.error(`failed to fetch public sale nft, collection id: ${collectionMetadata.id}, index: ${index}, error: ${error}`)
    }
    return undefined
  }
  const promises = indexes.map((index) => getNFT(index))
  return (await Promise.all(promises)).filter((nft) => nft !== undefined) as NFT[]
}

// TODO: query if NFTs have been minted in one request.
async function checkRandomCollectionNFTMinted(collectionId: string, nfts: NFT[]): Promise<NFT[]> {
  const collectionAddress = addressFromContractId(collectionId)
  const collection = NFTPublicSaleCollectionRandom.at(collectionAddress)
  const promises = nfts.map((nft) =>
    collection.methods.nftByIndex({ args: { index: BigInt(nft.tokenIndex!) }})
      .then(() => true)
      .catch((err) => false) // TODO: handle error properly
  )
  const nftMinted = await Promise.all(promises)
  return nfts.map<NFT>((nft, index) => ({ ...nft, minted: nftMinted[index] }))
}

export async function fetchNFTByPage(collectionMetadata: NFTCollectionMetadata, page: number, pageSize: number): Promise<NFT[]> {
  const skipped = page * pageSize
  if (collectionMetadata.collectionType === 'NFTOpenCollection') {
    const explorerProvider = web3.getCurrentExplorerProvider()
    if (explorerProvider === undefined) return []
    const collectionAddress = addressFromContractId(collectionMetadata.id)
    const { subContracts } = await explorerProvider.contracts.getContractsContractSubContracts(collectionAddress)
    const addresses = (subContracts ?? []).slice(skipped, skipped + pageSize)
    return await fetchNFTsByTokenAddresses(addresses, false)
  }

  const range = (from: number, count: number): number[] => Array.from(Array(count).keys()).map((v) => from + v)
  const totalSupply = Number(collectionMetadata.totalSupply)
  const maxSupply = Number(collectionMetadata.maxSupply!)
  const indexes = range(skipped, pageSize).filter((idx) => idx < maxSupply)
  const nfts = await fetchPublicSaleNFTs(collectionMetadata, indexes, false)
  return collectionMetadata.collectionType === 'NFTPublicSaleCollectionSequential'
    ? nfts.map<NFT>((nft) => {
        if (nft.tokenIndex! < totalSupply) {
          return {...nft, minted: true}
        } else {
          return {...nft, mintPrice: collectionMetadata.mintPrice }
        }
      })
    : (await checkRandomCollectionNFTMinted(collectionMetadata.id, nfts))
}

// TODO: Improve using multi-call, but it doesn't seem to work for NFTPublicSaleCollection?
export async function fetchNFTCollectionMetadata(
  collectionId: string
): Promise<NFTCollectionMetadata | undefined> {
  const nodeProvider = web3.getCurrentNodeProvider()
  const collectionAddress = addressFromContractId(collectionId)
  const state = await nodeProvider.contracts.getContractsAddressState(collectionAddress, { group: 0 })
  if (state.codeHash == NFTOpenCollection.contract.codeHash) {
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
  } else if (state.codeHash === NFTPublicSaleCollectionSequential.contract.codeHash) {
    const contractState = NFTPublicSaleCollectionSequential.contract.fromApiContractState(state) as NFTPublicSaleCollectionSequentialTypes.State
    const metadataUri = hexToString(contractState.fields.collectionUri)
    const metadata = (await axios.get(metadataUri)).data
    return {
      id: collectionId,
      collectionType: 'NFTPublicSaleCollectionSequential',
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
  } else if (state.codeHash === NFTPublicSaleCollectionRandom.contract.codeHash) {
    const contractState = NFTPublicSaleCollectionRandom.contract.fromApiContractState(state) as NFTPublicSaleCollectionRandomTypes.State
    const metadataUri = hexToString(contractState.fields.collectionUri)
    const metadata = (await axios.get(metadataUri)).data
    return {
      id: collectionId,
      collectionType: 'NFTPublicSaleCollectionRandom',
      name: metadata.name,
      description: metadata.description,
      totalSupply: contractState.fields.totalSupply,
      owner: contractState.fields.collectionOwner,
      image: metadata.image,
      maxSupply: contractState.fields.maxSupply,
      mintPrice: contractState.fields.mintPrice,
      nftBaseUri: contractState.fields.nftBaseUri
    }
  }
}