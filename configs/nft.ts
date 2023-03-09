export const NETWORK: string = process.env.NEXT_PUBLIC_NETWORK || 'devnet'

import devnetDeployment from '../.deployments.devnet.json'

export const devnetConfig = {
  "groupIndex": 0,
  "commissionRate": 200,
  "listingFee": 10,
  "defaultNftCollectionContractId": devnetDeployment.contracts.NFTOpenCollection.contractId,
  "marketplaceContractId": devnetDeployment.contracts.NFTMarketPlace.contractId,
  "marketplaceAdminAddress": "1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH"
}

export const testnetConfig = {
  "groupIndex": 0,
  "commissionRate": 200,
  "listingFee": 1,
  "defaultNftCollectionContractId": "",
  "marketplaceContractId": "",
  "marketplaceAdminAddress": ""
}

export const mainnetConfig = {
  "groupIndex": 0,
  "commissionRate": 200,
  "listingFee": 1,
  "defaultNftCollectionContractId": "",
  "marketplaceContractId": "",
  "marketplaceAdminAddress": ""
}

export const defaultNftCollectionContractId: string =
  NETWORK === 'mainnet'
    ? mainnetConfig.marketplaceContractId
    : NETWORK === 'testnet'
      ? testnetConfig.defaultNftCollectionContractId
      : devnetConfig.defaultNftCollectionContractId

export const marketplaceContractId: string =
  NETWORK === 'mainnet'
    ? mainnetConfig.marketplaceContractId
    : NETWORK === 'testnet'
      ? testnetConfig.marketplaceContractId
      : devnetConfig.marketplaceContractId
