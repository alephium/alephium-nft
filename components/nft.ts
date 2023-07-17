import axios from "axios"
import useSWR from "swr"
import { EnumerableNFT, EnumerableNFTInstance, NFTMarketPlaceInstance, NFTPublicSaleCollectionRandomInstance, NonEnumerableNFT, NonEnumerableNFTInstance } from '../artifacts/ts'
import { marketplaceContractId } from '../configs/nft'
import { web3, addressFromTokenId, hexToString, SignerProvider, addressFromContractId, NodeProvider, subContractId, binToHex, encodeU256 } from "@alephium/web3"

export interface NFT {
  name: string,
  description: string,
  image: string,
  tokenId: string,
  listed: boolean,
  minted: boolean,
  collectionId: string,
  price?: bigint,
  tokenIndex?: number
}

export async function fetchNFT(
  tokenId: string,
  listed: boolean
): Promise<NFT | undefined> {
  const nodeProvider = web3.getCurrentNodeProvider()
  const tokenAddress = addressFromTokenId(tokenId)

  if (!!nodeProvider) {
    try {
      const nftState = await nodeProvider.contracts.getContractsAddressState(tokenAddress, { group: 0 })
      if (nftState) {
        let metadataUri: string | undefined
        let collectionId: string | undefined
        if (nftState.codeHash === NonEnumerableNFT.contract.codeHash) {
          const nonEnumerableNFTInstance = new NonEnumerableNFTInstance(tokenAddress)
          const multiCallResult = await nonEnumerableNFTInstance.multicall({
            getTokenUri: {},
            getCollectionId: {}
          })
          metadataUri = hexToString(multiCallResult.getTokenUri.returns)
          collectionId = multiCallResult.getCollectionId.returns
        } else if (nftState.codeHash === EnumerableNFT.contract.codeHash) {
          const enumerableNFTInstance = new EnumerableNFTInstance(tokenAddress)
          const multiCallResult = await enumerableNFTInstance.multicall({
            getTokenUri: {},
            getCollectionId: {}
          })
          metadataUri = hexToString(multiCallResult.getTokenUri.returns)
          collectionId = multiCallResult.getCollectionId.returns
        }

        if (metadataUri && collectionId) {
          try {
            const metadata = (await axios.get(metadataUri)).data
            return {
              name: metadata.name,
              description: metadata.description,
              image: metadata.image,
              tokenId: tokenId,
              collectionId: collectionId,
              minted: true,
              listed
            }
          } catch {
            return undefined
          }
        }
      }
    } catch (e) {
      console.debug(`error fetching state for ${tokenId}`, e)
    }
  }
}

export async function fetchPreMintNFT(
  collectionId: string,
  tokenIndex: bigint,
  mintPrice?: bigint
): Promise<NFT | undefined> {
  const nodeProvider = web3.getCurrentNodeProvider()
  const tokenId = subContractId(collectionId, binToHex(encodeU256(tokenIndex)), 0)
  if (!!nodeProvider) {
    try {
      const collectionAddress = addressFromContractId(collectionId)
      const collection = new NFTPublicSaleCollectionRandomInstance(collectionAddress)
      const tokenUri = hexToString((await collection.methods.getTokenUri({ args: { index: tokenIndex } })).returns)
      if (mintPrice === undefined) {
        mintPrice = (await collection.methods.getMintPrice()).returns
      }
      const metadata = (await axios.get(tokenUri)).data
      return {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        tokenId: tokenId,
        collectionId: collectionId,
        listed: false,
        minted: false,
        price: mintPrice,
        tokenIndex: Number(tokenIndex)
      }
    } catch (e) {
      console.error(`error fetching information for pre mint NFT ${tokenId}`, e)
      return undefined
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

      const marketplaceState = await new NFTMarketPlaceInstance(addressFromContractId(marketplaceContractId)).fetchState()
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
  nodeProvider?: NodeProvider
) => {
  const { data, error, ...rest } = useSWR(
    nodeProvider &&
    [
      tokenId,
      "nft",
    ],
    async () => {
      if (!nodeProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(nodeProvider)

      return await fetchNFT(tokenId, listed)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { nft: data, isLoading: !data && !error, ...rest }
}
