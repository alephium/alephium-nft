import useSWR from "swr"
import { web3, addressFromContractId, hexToString, SignerProvider } from "@alephium/web3"
import { ContractEvent } from "@alephium/web3/dist/src/api/api-alephium"
import { fetchNFTListingState, fetchNonEnumerableNFTState } from "../utils/contracts"
import { NFTListing as NFTListingFactory } from '../artifacts/ts'
import axios from "axios"
import { NFTMarketplace } from "../utils/nft-marketplace"
import { marketplaceContractId } from '../configs/nft'

export interface NFTListing {
  _id: string,
  price: bigint
  name: string,
  description: string,
  image: string,
  tokenOwner: string,
  marketAddress: string
  commissionRate: bigint,
  listingContractId: string
}

export async function fetchNFTListings(
  signerProvider: SignerProvider,
  marketplaceContractAddress: string,
  address?: string
): Promise<NFTListing[]> {
  if (signerProvider?.nodeProvider) {
    const res = await axios.get(`api/marketplace-events/count`)
    const nftMarketplace = new NFTMarketplace(signerProvider)
    const events = await nftMarketplace.getMarketplaceEvents(marketplaceContractAddress, res.data.count)
    for (var event of events) {
      await nftListingEventReducer(event, marketplaceContractAddress, signerProvider)
    }
  }

  const result = await axios.get(`api/nft-listings`)
  const nftListings: NFTListing[] = result.data

  if (address) {
    return nftListings.filter((listing) => listing.tokenOwner === address)
  } else {
    return nftListings
  }
}

async function fetchNFTListing(
  signerProvider: SignerProvider,
  event: ContractEvent
): Promise<NFTListing | undefined> {
  const tokenId = event.fields[1].value.toString()
  const listingContractId = event.fields[3].value.toString()

  if (signerProvider.nodeProvider) {
    var listingState = undefined

    try {
      listingState = await fetchNFTListingState(
        addressFromContractId(listingContractId)
      )
    } catch (e) {
      console.debug(`error fetching state for ${tokenId}`, e)
    }

    if (listingState && listingState.codeHash === NFTListingFactory.contract.codeHash) {
      const nftState = await fetchNonEnumerableNFTState(
        addressFromContractId(tokenId)
      )

      const metadataUri = hexToString(nftState.fields.uri as string)
      const metadata = (await axios.get(metadataUri)).data
      return {
        _id: tokenId,
        price: listingState.fields.price as bigint,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        tokenOwner: listingState.fields.tokenOwner as string,
        marketAddress: listingState.fields.marketAddress as string,
        commissionRate: listingState.fields.commissionRate as bigint,
        listingContractId: listingContractId
      }
    }
  }
}

async function nftListingEventReducer(
  event: ContractEvent,
  marketplaceContractAddress: string,
  signerProvider: SignerProvider
) {
  axios.post(`api/marketplace-events`, {
    txId: event.txId,
    contractAddress: marketplaceContractAddress,
    eventIndex: event.eventIndex,
    fields: event.fields
  })

  // NFTListed or NFTListingPriceUpdated
  if (event.eventIndex === 0 || event.eventIndex === 3) {
    const listedNFT = await fetchNFTListing(signerProvider, event)
    if (listedNFT) {
      // Persist NFT Listing
      const result = await axios.post(`api/nft-listings`, {
        id: listedNFT._id,
        price: listedNFT.price,
        name: listedNFT.name,
        description: listedNFT.description,
        image: listedNFT.image,
        tokenOwner: listedNFT.tokenOwner,
        marketAddress: listedNFT.marketAddress,
        commissionRate: listedNFT.commissionRate,
        listingContractId: listedNFT.listingContractId
      })

      console.debug("Persist nft listing", result, event)
    }
  }

  // NFTSold or NFTListingCancelled
  if (event.eventIndex === 1 || event.eventIndex === 2) {
    const tokenId = event.fields[1].value.toString()
    // Remove NFT Listing
    const result = await axios.delete(`api/nft-listings?id=${tokenId}`)
    console.debug("Delete nft listing", result, event)
  }
}

export const useNFTListings = (
  signerProvider?: SignerProvider
) => {
  const { data, error, ...rest } = useSWR(
    signerProvider &&
    [
      "nftListings",
    ],
    async () => {
      if (!signerProvider || !signerProvider.nodeProvider || !signerProvider.explorerProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(signerProvider.nodeProvider)
      web3.setCurrentExplorerProvider(signerProvider.explorerProvider)

      const marketplaceContractAddress = addressFromContractId(marketplaceContractId)
      return await fetchNFTListings(signerProvider, marketplaceContractAddress)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { nftListings: data || [], isLoading: !data && !error, ...rest }
}
