# Alephium NFT

## Install

```
npm install
```

## Getting Started

First, run the development server:

```
npm run dev
# or
yarn dev
```

## Start a devnet

```
npm run start-devnet // this will start a devnet for smart contract tests
```

## Stop/restart devnet

```
npm run stop-devnet
npm run restart-devnet
```

## Testing Smart Contract

```
npm test:contracts
```

or

```
npm test:contracts -- nft-marketplace.test.ts
```

## Deploy Smart Contracts
Before running the application, two smart contracts need to be created:
1. A [marketplace smart contract](contracts/nft_marketplace.ral) where
   NFTs can be traded
2. A default [NFT collection smart
   contract](contracts/nft_collection.ral), which will be the default
   collection for NFTs that do not explicitly belong to any NFT
   collections

```
npm deploy:contracts
```

