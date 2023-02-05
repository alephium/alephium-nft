export const NETWORK: string = process.env.NEXT_PUBLIC_NETWORK || 'devnet'


export const defaultNftCollectionContractId: string =
  NETWORK === 'mainnet'
  ? ''
  : NETWORK === 'testnet'
  ? '76911c8db0629ec75e77bd8d339baabef5d7d220ba6fead6af25aa83c62ae600'
  : 'ec0d614067a74bcbdfba884096a9eaa4db27d648776ad02fb610a01664cee800'

export const marketplaceContractId: string =
  NETWORK === 'mainnet'
  ? ''
  : NETWORK === 'testnet'
  ? '58a7a7303ee61d010434dd3ce0bbd95ab25fd8ebf8b50c92a2180a8094258e00'
  : '4f34d28157418dd22b26a1f8f92ebf57b72f8fc8e29262fa45c9c8a23e61c400'
