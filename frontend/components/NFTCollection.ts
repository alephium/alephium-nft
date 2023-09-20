import useSWR from "swr"
import { getNetwork } from "../../shared/configs";
import { web3, Account } from "@alephium/web3"
import { fetchNFTCollectionMetadata } from "../../shared/nft-collection";
import { getExplorerProvider, getNodeProvider } from "../../shared";

export const useCollectionMetadata = (
  collectionId?: string
) => {
  const { data: collectionMetadata, error, ...rest } = useSWR(
    collectionId &&
    [
      collectionId,
      "collection",
    ],
    async () => {
      web3.setCurrentNodeProvider(getNodeProvider())
      web3.setCurrentExplorerProvider(getExplorerProvider())

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
  `${getNetwork()}::${account.address}`
