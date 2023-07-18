import axios from "axios"
import useSWR from "swr"
import { groupIndex, NETWORK } from '../configs/nft'
import { NFT, fetchNFT } from './nft'
import { fetchNFTListingsByOwner } from "./NFTListing"
import { web3, hexToString, binToHex, SignerProvider, addressFromContractId, contractIdFromAddress, Account, subContractId, encodeU256, groupOfAddress, sleep } from "@alephium/web3"
import { NFTOpenCollection, NFTPublicSaleCollectionSequential } from "../artifacts/ts"

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

export async function fetchListedNFTs(
  signerProvider: SignerProvider,
  address: string
): Promise<NFTCollection[]> {
  if (signerProvider.nodeProvider) {
    const items = []
    web3.setCurrentNodeProvider(signerProvider.nodeProvider)
    const listings = await fetchNFTListingsByOwner(address)
    for (var listing of listings) {
      const index = items.findIndex((item) => item.id === listing.collectionId)
      if (index === -1) {
        const metadata = await fetchNFTCollectionMetadata(listing.collectionId)
        if (metadata) {
          items.push({
            ...metadata,
            nfts: [{ tokenId: listing._id, listed: true, minted: true, ...listing }]
          })
        }
      } else {
        items[index].nfts.push({ tokenId: listing._id, listed: true, minted: true, ...listing })
      }
    }

    return items

  } else {
    return Promise.resolve([])
  }
}

async function fetchNFTCollections(
  tokenIds: string[]
): Promise<NFTCollection[]> {
  const items = []

  for (var tokenId of tokenIds) {
    const nft = await fetchNFT(tokenId, false)
    if (!!nft) {
      const index = items.findIndex((item) => item.id === nft.collectionId)
      if (index === -1) {
        const metadata = await fetchNFTCollectionMetadata(nft.collectionId)
        if (metadata) {
          items.push({
            ...metadata,
            nfts: [nft]
          })
        }
      } else {
        items[index].nfts.push(nft)
      }
    }
  }

  return items
}

export async function fetchNFTsFromUTXOs(
  signerProvider: SignerProvider,
  address: string
): Promise<NFTCollection[]> {
  if (signerProvider.nodeProvider) {
    web3.setCurrentNodeProvider(signerProvider.nodeProvider)
    const balances = await signerProvider.nodeProvider.addresses.getAddressesAddressBalance(address)
    const tokenBalances = balances.tokenBalances !== undefined ? balances.tokenBalances : []
    const tokenIds = tokenBalances
      .filter((token) => +token.amount == 1)
      .map((token) => token.id)

    return await fetchNFTCollections(tokenIds)
  }

  return Promise.resolve([]);
}

export async function fetchAllNFTCollections(
  signerProvider: SignerProvider,
  address: string
): Promise<NFTCollection[]> {
  const nftsFromUTXOs = await fetchNFTsFromUTXOs(signerProvider, address)
  const listedNFTs = await fetchListedNFTs(
    signerProvider,
    address
  )

  return mergeNFTCollections(listedNFTs, nftsFromUTXOs)
}

export function mergeNFTCollections(
  left: NFTCollection[],
  right: NFTCollection[]
): NFTCollection[] {
  for (const l of left) {
    const index = right.findIndex((item) => item.id === l.id)
    if (index === -1) {
      right.push(l)
    } else {
      right[index].nfts = right[index].nfts.concat(l.nfts)
    }
  }

  return right
}

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
  if (state.codeHash == NFTOpenCollection.contract.codeHash || state.codeHash == NFTPublicSaleCollectionSequential.contract.codeHash) {
    const metadataUri = hexToString(state.immFields[1].value as string)
    const metadata = (await axios.get(metadataUri)).data

    let collectionType: 'NFTOpenCollection' | 'NFTPublicSaleCollection'
    let nftBaseUri: string | undefined
    let maxSupply: bigint | undefined
    let mintPrice: bigint | undefined
    let maxBatchMintSize: number | undefined

    if (state.codeHash == NFTPublicSaleCollectionSequential.contract.codeHash) {
      collectionType = "NFTPublicSaleCollection"
      nftBaseUri = state.immFields[2].value as string
      maxSupply = BigInt(state.immFields[4].value as string)
      mintPrice = BigInt(state.immFields[5].value as string)
      maxBatchMintSize = parseInt(state.immFields[6].value as string)
    } else {
      collectionType = "NFTOpenCollection"
    }

    return {
      id: collectionId,
      collectionType: collectionType,
      name: metadata.name,
      description: metadata.description,
      totalSupply: BigInt(state.mutFields[0].value as string),
      owner: state.immFields[2].value as string,
      image: metadata.image,
      maxSupply: maxSupply,
      mintPrice: mintPrice,
      maxBatchMintSize: maxBatchMintSize,
      nftBaseUri: nftBaseUri
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
