const CLUSTER: string | undefined = process.env.NEXT_PUBLIC_CLUSTER

export const defaultNftCollectionContractId: string =
  CLUSTER === 'mainnet'
  ? ''
  : CLUSTER === 'testnet'
  ? '9b9a51faedb5e33d870ff7e2dc382912213cfe325ce2e58ab882989f629857b3'
  : '165330c18dc1e5c71ec2fa29c6cebdf46fc2a175259382f187248ffbfa051000'

export const marketplaceContractId: string =
  CLUSTER === 'mainnet'
  ? ''
  : CLUSTER === 'testnet'
  ? '6bd062326ed0958cecca2a93f1d452b8745dc2cf52cf1d2d3fc5aff02a703d2a'
  : 'a8a6359f6c37fb2986d8bf95d1b7ca71365281d83247e740cdc6cffd0b6b0700'
