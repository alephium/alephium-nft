import useSWR from "swr"
import { NodeProvider, SignerProvider } from "@alephium/web3"
import { Balance } from "@alephium/web3/dist/src/api/api-alephium"

const SUPPRESS_ERROR_STATUS = [429]

export async function fetchTokens(
  nodeProvider: NodeProvider,
  address?: string
): Promise<string[]> {
  if (!address) {
    return []
  }

  const allTokens: string[] = []
  const balance: Balance = await nodeProvider.addresses.getAddressesAddressBalance(address)
  const tokenIds = (balance?.tokenBalances || []).map((t) => t.id)
  for (const tokenId of tokenIds) {
    if (allTokens.findIndex((id) => id == tokenId) === -1) {
      allTokens.push(tokenId)
    }
  }

  return allTokens
}

export const useTokens = (
  address?: string,
  signerProvider?: SignerProvider
) => {
  const { data, error, ...rest } = useSWR(
    signerProvider &&
    signerProvider.nodeProvider &&
    address && [
      address,
      "addressTokens",
    ],
    async () => {
      if (!signerProvider?.nodeProvider || !address) {
        return []
      }

      return await fetchTokens(signerProvider.nodeProvider, address)
    },
    {
      refreshInterval: 30000,
      shouldRetryOnError: (error: any) => {
        const errorCode = error?.status || error?.errorCode
        const suppressError =
          errorCode && SUPPRESS_ERROR_STATUS.includes(errorCode)
        return suppressError
      },
    }
  )

  return { tokenIds: data || [], isLoading: !data && !error, ...rest }
}