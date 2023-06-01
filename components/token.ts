import useSWR from "swr"
import { SignerProvider } from "@alephium/web3"

const SUPPRESS_ERROR_STATUS = [429]

export const useTokens = (
  address?: string,
  signerProvider?: SignerProvider
) => {
  const { data, error, ...rest } = useSWR(
    signerProvider &&
    signerProvider.explorerProvider &&
    address && [
      address,
      "addressTokens",
    ],
    async () => {
      if (!signerProvider?.explorerProvider || !address) {
        return []
      }
      const allTokens: string[] = []

      const tokenIds: string[] = await signerProvider.explorerProvider.addresses.getAddressesAddressTokens(address)

      for (const tokenId of tokenIds) {
        if (allTokens.findIndex((id) => id == tokenId) === -1) {
          allTokens.push(tokenId)
        }
      }

      return allTokens
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