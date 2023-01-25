export const NETWORK: string = process.env.NEXT_PUBLIC_NETWORK || 'devnet'

export const defaultNftCollectionContractId: string =
  NETWORK === 'mainnet'
  ? ''
  : NETWORK === 'testnet'
  ? '76911c8db0629ec75e77bd8d339baabef5d7d220ba6fead6af25aa83c62ae600'
  : '999913f2a7f799d38960a1229e85f1199866fb35d184ba6a9cdce7265cb9f300'

export const marketplaceContractId: string =
  NETWORK === 'mainnet'
  ? ''
  : NETWORK === 'testnet'
  ? '212ad7f5c534940918ddd48801b7862886ef2f2eacb7a2652b78ef985369cd00'
  : 'a04e4c6e54d5234486ca59bab6db7f127b4b3a3431147b1fb605f8b49f6a8100'
