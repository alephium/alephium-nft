export const NETWORK: string | undefined = process.env.NEXT_PUBLIC_NETWORK

export const defaultNftCollectionContractId: string =
  NETWORK === 'mainnet'
  ? ''
  : NETWORK === 'testnet'
  ? '76911c8db0629ec75e77bd8d339baabef5d7d220ba6fead6af25aa83c62ae600'
  : '165330c18dc1e5c71ec2fa29c6cebdf46fc2a175259382f187248ffbfa051000'

export const marketplaceContractId: string =
  NETWORK === 'mainnet'
  ? ''
  : NETWORK === 'testnet'
  ? '212ad7f5c534940918ddd48801b7862886ef2f2eacb7a2652b78ef985369cd00'
  : 'a8a6359f6c37fb2986d8bf95d1b7ca71365281d83247e740cdc6cffd0b6b0700'
