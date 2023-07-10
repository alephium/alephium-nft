import axios from "axios"
import useSWR from "swr"
import { NETWORK } from '../configs/nft'
import { NFT, fetchNFT, fetchPreMintNFT } from './nft'
import { fetchNFTListings, NFTListing } from "./NFTListing"
import { web3, hexToString, binToHex, SignerProvider, addressFromContractId, contractIdFromAddress, Account, subContractId } from "@alephium/web3"
import { NFTOpenCollection, NFTPreDesignedCollection } from "../artifacts/ts"
import { contractExists } from "../utils/contracts"

export interface NFTCollection {
  id: string,
  collectionType: 'NFTOpenCollection' | 'NFTPreDesignedCollection',
  name: string,
  description: string,
  owner: string,
  totalSupply: bigint,
  image: string,
  nfts: NFT[],
  maxSupply?: bigint
  mintPrice?: bigint
}

export type NFTsByCollection = Map<NFTCollection, NFT[]>

export async function fetchListedNFTs(
  signerProvider: SignerProvider,
  address: string
): Promise<NFTCollection[]> {
  if (signerProvider.nodeProvider) {
    const items = []
    web3.setCurrentNodeProvider(signerProvider.nodeProvider)
    const listings = await fetchNFTListings(address)
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
  console.log("metadata", metadata)
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
        const tokenId = subContractId(collectionAddress, i.toString(), 0)
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

// TODO: Improve, using method calls
export async function fetchNFTCollectionMetadata(
  collectionId: string
) {
  const nodeProvider = web3.getCurrentNodeProvider()
  const collectionAddress = addressFromContractId(collectionId)
  const state = await nodeProvider.contracts.getContractsAddressState(collectionAddress, { group: 0 })
  // TODO: More reliable to use function to get metadata info
  if (state.codeHash == NFTOpenCollection.contract.codeHash || state.codeHash == NFTPreDesignedCollection.contract.codeHash) {
    const metadataUri = hexToString(state.immFields[1].value as string)
    const metadata = (await axios.get(metadataUri)).data

    let collectionType: string
    let maxSupply: bigint | undefined
    let mintPrice: bigint | undefined
    let tokenBaseUri: string | undefined

    if (state.codeHash == NFTPreDesignedCollection.contract.codeHash) {
      collectionType = "NFTPreDesignedCollection"
      tokenBaseUri = state.immFields[3].value as string
      maxSupply = BigInt(state.immFields[4].value as string)
      mintPrice = BigInt(state.immFields[5].value as string)
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
      tokenBaseUri: tokenBaseUri
    }
  }
}

export const useCollection = (
  collectionId?: string,
  signerProvider?: SignerProvider
) => {
  const { data: collection, error, ...rest } = useSWR(
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

      return await fetchNFTCollection(collectionId as string)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { collection, ...rest }
}

export const getAccountIdentifier = (account: Account) =>
  `${NETWORK}::${account.address}`
