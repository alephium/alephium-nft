import { addressFromContractId, hexToString, SignerProvider } from "@alephium/web3"
import { ContractEvent } from "@alephium/web3/dist/src/api/api-alephium"
import { fetchNFTListingState, fetchNonEnumerableNFTState } from "../utils/contracts"
import { NFTListing as NFTListingFactory } from '../artifacts/ts'
import axios from "axios"
import { NFTMarketplace } from "../utils/nft-marketplace"

export interface NFTListing {
  price: bigint
  name: string,
  description: string,
  image: string,
  tokenId: string,
  tokenOwner: string,
  marketAddress: string
  commissionRate: bigint,
  listingContractId: string
}


export async function fetchNFTListings(
  signerProvider: SignerProvider,
  marketplaceContractAddress: string,
  address?: string
): Promise<Map<string, NFTListing>> {
  const items = new Map<string, NFTListing>()

  if (signerProvider?.nodeProvider) {
    const nftMarketplace = new NFTMarketplace(signerProvider)
    const events: ContractEvent[] = await nftMarketplace.getListedNFTs(marketplaceContractAddress)

    for (var event of events) {
      const listedNFT = await fetchNFTListing(signerProvider, event)
      if (address) {
        listedNFT &&
          listedNFT.tokenOwner === address &&
          items.set(listedNFT.listingContractId, listedNFT)
      } else {
        listedNFT &&
          items.set(listedNFT.listingContractId, listedNFT)
      }
    }
  }

  return items;
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
      console.log(`error fetching state for ${tokenId}`, e)
    }

    if (listingState && listingState.codeHash === NFTListingFactory.contract.codeHash) {
      const nftState = await fetchNonEnumerableNFTState(
        addressFromContractId(tokenId)
      )

      const metadataUri = hexToString(nftState.fields.uri as string)
      const metadata = (await axios.get(metadataUri)).data
      return {
        price: listingState.fields.price as bigint,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        tokenId: tokenId,
        tokenOwner: listingState.fields.tokenOwner as string,
        marketAddress: listingState.fields.marketAddress as string,
        commissionRate: listingState.fields.commissionRate as bigint,
        listingContractId: listingContractId
      }
    }
  }
}