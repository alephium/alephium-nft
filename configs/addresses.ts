const CLUSTER: string | undefined = process.env.NEXT_PUBLIC_CLUSTER

export const defaultNftCollectionContractId: string =
  CLUSTER === 'mainnet'
  ? ''
  : CLUSTER === 'testnet'
  ? '5348fc12b920f4052040049098248ac67c03f6f0e6a4f376be1558cc8e510a23'
  : '165330c18dc1e5c71ec2fa29c6cebdf46fc2a175259382f187248ffbfa051000'

export const marketplaceContractId: string =
  CLUSTER === 'mainnet'
  ? ''
  : CLUSTER === 'testnet'
  ? 'f6344f27797b8fcd5c5a4cee1b3458bb7099fb0e8293336f5506e59d6603c185'
  : 'a8a6359f6c37fb2986d8bf95d1b7ca71365281d83247e740cdc6cffd0b6b0700'
