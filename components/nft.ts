import axios from "axios"
import useSWR from "swr"
import { NonEnumerableNFT } from '../artifacts/ts'
import { fetchNFTMarketplaceState } from '../utils/contracts'
import { fetchNonEnumerableNFTState } from "../utils/contracts"
import { marketplaceContractId } from '../configs/nft'
import { web3, addressFromTokenId, hexToString, SignerProvider, addressFromContractId, ExplorerProvider } from "@alephium/web3"

export interface NFT {
  name: string,
  description: string,
  image: string,
  tokenId: string,
  listed: boolean,
  collectionId: string
}

export async function fetchNFT(
  tokenId: string,
  listed: boolean
): Promise<NFT | undefined> {
  var nftState = undefined

  const nodeProvider = web3.getCurrentNodeProvider()
  if (!!nodeProvider) {
    try {
      nftState = await fetchNonEnumerableNFTState(
        addressFromTokenId(tokenId)
      )
    } catch (e) {
      console.debug(`error fetching state for ${tokenId}`, e)
    }

    if (nftState && nftState.codeHash === NonEnumerableNFT.contract.codeHash) {
      const metadataUri = hexToString(nftState.fields.uri as string)
      try {
        const metadata = (await axios.get(metadataUri)).data
        return {
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          tokenId: tokenId,
          collectionId: nftState.fields.collectionId,
          listed
        }
      } catch {
        return undefined
      }
    }
  }
}

export const useCommissionRate = (
  signerProvider?: SignerProvider
) => {
  const { data, error, ...rest } = useSWR(
    signerProvider &&
    signerProvider.nodeProvider &&
    [
      "commissionRate",
    ],
    async () => {
      if (!signerProvider || !signerProvider.nodeProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(signerProvider.nodeProvider)

      const marketplaceState = await fetchNFTMarketplaceState(
        addressFromContractId(marketplaceContractId)
      )

      return marketplaceState.fields.commissionRate as bigint
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { commissionRate: data, isLoading: !data && !error, ...rest }
}

export const useNFT = (
  tokenId: string,
  listed: boolean,
  signerProvider?: SignerProvider
) => {
  const { data, error, ...rest } = useSWR(
    signerProvider &&
    signerProvider.nodeProvider &&
    [
      tokenId,
      "nft",
    ],
    async () => {
      if (!signerProvider?.nodeProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(signerProvider.nodeProvider)

      return await fetchNFT(tokenId, listed)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { nft: data, isLoading: !data && !error, ...rest }
}
