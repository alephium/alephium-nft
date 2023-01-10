const CLUSTER: 'mainnet' | 'testnet' | 'devnet' = process.env.NEXT_PUBLIC_CLUSTER

export const defaultNftCollectionContractId: string =
  CLUSTER === 'mainnet'
  ? ''
  : CLUSTER === 'testnet'
  ? ''
  : '165330c18dc1e5c71ec2fa29c6cebdf46fc2a175259382f187248ffbfa051000'

export const marketplaceContractId: string =
  CLUSTER === 'mainnet'
  ? ''
  : CLUSTER === 'testnet'
  ? ''
  : 'a8a6359f6c37fb2986d8bf95d1b7ca71365281d83247e740cdc6cffd0b6b0700'
