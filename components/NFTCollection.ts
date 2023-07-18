import axios from "axios"
import useSWR from "swr"
import { NETWORK } from '../configs/nft'
import { NFT, fetchNFT, fetchPreMintNFT } from './nft'
import { fetchNFTListingsByOwner } from "./NFTListing"
import { web3, hexToString, binToHex, SignerProvider, addressFromContractId, contractIdFromAddress, Account, subContractId, encodeU256 } from "@alephium/web3"
import { NFTOpenCollection, NFTPublicSaleCollectionSequential } from "../artifacts/ts"
import { contractExists } from "../utils"

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
  maxBatchMintSize?: number
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

export async function fetchNFTCollection(
  collectionId: string
): Promise<NFTCollection | undefined> {
  const metadata = await fetchNFTCollectionMetadata(collectionId)
  if (metadata) {
    const collectionAddress = addressFromContractId(collectionId)
    const explorerProvider = web3.getCurrentExplorerProvider()

    const nfts = []
    if (metadata.collectionType == "NFTOpenCollection") {
      if (explorerProvider) {
        const { subContracts } = await explorerProvider.contracts.getContractsContractSubContracts(collectionAddress)
        for (const tokenAddress of subContracts || []) {
          const tokenId = binToHex(contractIdFromAddress(tokenAddress))
          const nft = await fetchNFT(tokenId, false)
          if (nft) {
            nfts.push(nft)
          }
        }
      }
    } else {
      const nodeProvider = web3.getCurrentNodeProvider()
      const maxSupply = metadata.maxSupply!
      const mintPrice = metadata.mintPrice!

      for (let i = 0; i < maxSupply; i++) {
        const tokenId = subContractId(collectionId, binToHex(encodeU256(BigInt(i))), 0)
        const minted = await contractExists(tokenId, nodeProvider)
        let nft: NFT | undefined
        if (minted) {
          nft = await fetchNFT(tokenId, false)
        } else {
          nft = await fetchPreMintNFT(collectionId, BigInt(i), mintPrice)
        }
        if (nft) {
          nfts.push(nft)
        }
      }
    }

    return {
      nfts: nfts,
      ...metadata
    }
  }
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
    let maxSupply: bigint | undefined
    let mintPrice: bigint | undefined
    let maxBatchMintSize: number | undefined

    if (state.codeHash == NFTPublicSaleCollectionSequential.contract.codeHash) {
      collectionType = "NFTPublicSaleCollection"
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
      maxBatchMintSize: maxBatchMintSize
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
