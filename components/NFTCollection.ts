import axios from "axios"
import useSWR from "swr"
import { groupIndex, NETWORK } from '../configs/nft'
import { NFT } from './nft'
import { web3, hexToString, binToHex, SignerProvider, addressFromContractId, contractIdFromAddress, Account, subContractId, encodeU256, groupOfAddress, sleep, NodeProvider } from "@alephium/web3"
import { NFTOpenCollection, NFTOpenCollectionTypes, NFTPublicSaleCollectionSequential, NFTPublicSaleCollectionSequentialTypes } from "../artifacts/ts"

export interface NFTCollection {
  id: string,
  collectionType: 'NFTOpenCollection' | 'NFTPublicSaleCollection',
  name: string,
  description: string,
  owner: string,
  totalSupply: bigint,
  image: string,
  nfts: NFT[],
  maxSupply?: bigint
  mintPrice?: bigint
  maxBatchMintSize?: number,
  nftBaseUri?: string
}

export type NFTCollectionMetadata = Omit<NFTCollection, 'nfts'>

export type NFTsByCollection = Map<NFTCollection, NFT[]>

async function fetchNonEnumerableNFTs(addresses: string[], listed: boolean): Promise<NFT[]> {
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

async function fetchEnumerableNFTs(collectionMetadata: NFTCollectionMetadata, indexes: number[], listed: boolean): Promise<NFT[]> {
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
      console.error(`failed to fetch enumerable nft, collection id: ${collectionMetadata.id}, index: ${index}, error: ${error}`)
    }
    return undefined
  }
  const promises = indexes.map((index) => getNFT(index))
  return (await Promise.all(promises)).filter((nft) => nft !== undefined) as NFT[]
}

export async function fetchNFTByPage(collectionMetadata: NFTCollectionMetadata, page: number, pageSize: number): Promise<NFT[]> {
  const skipped = page * pageSize
  if (collectionMetadata.collectionType === 'NFTOpenCollection') {
    const explorerProvider = web3.getCurrentExplorerProvider()
    if (explorerProvider === undefined) return []
    const collectionAddress = addressFromContractId(collectionMetadata.id)
    const { subContracts } = await explorerProvider.contracts.getContractsContractSubContracts(collectionAddress)
    const addresses = (subContracts ?? []).slice(skipped, skipped + pageSize)
    return await fetchNonEnumerableNFTs(addresses, false)
  }

  const range = (from: number, count: number): number[] => Array.from(Array(count).keys()).map((v) => from + v)
  const totalSupply = Number(collectionMetadata.totalSupply)
  const maxSupply = Number(collectionMetadata.maxSupply!)
  const indexes = range(skipped, pageSize).filter((idx) => idx < maxSupply)
  const nfts = await fetchEnumerableNFTs(collectionMetadata, indexes, false)
  return nfts.map<NFT>((nft) => {
    if (nft.tokenIndex! < totalSupply) {
      return {...nft, minted: true}
    } else {
      return {...nft, mintPrice: collectionMetadata.mintPrice }
    }
  })
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
  } else if (state.codeHash == NFTPublicSaleCollectionSequential.contract.codeHash) {
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
  }
}

export const useCollectionMetadata = (
  collectionId?: string,
  signerProvider?: SignerProvider
) => {
  const { data: collectionMetadata, error, ...rest } = useSWR(
    collectionId &&
    signerProvider?.nodeProvider &&
    signerProvider?.explorerProvider &&
    [
      collectionId,
      "collection",
    ],
    async () => {
      if (!signerProvider || !signerProvider.nodeProvider || !signerProvider.explorerProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(signerProvider.nodeProvider)
      web3.setCurrentExplorerProvider(signerProvider.explorerProvider)

      return await fetchNFTCollectionMetadata(collectionId as string)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { collectionMetadata, ...rest }
}

export const getAccountIdentifier = (account: Account) =>
  `${NETWORK}::${account.address}`
