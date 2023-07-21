import useSWR from "swr"
import { NETWORK } from '../configs/nft'
import { web3, SignerProvider, Account } from "@alephium/web3"
import { fetchNFTCollectionMetadata } from "../utils/nft-collection"

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
