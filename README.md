# Alephium NFT

## Install

```
yarn
```

## Getting Started

First, run the development server:

```
yarn run dev
```

## Stop/restart devnet

```
npx @alephium/cli devnet start // this will start a devnet for smart contract tests
npx @alephium/cli devnet stop
```

or

```
cd test/docker
docker-compose up -d
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
yarn run deploy:contracts
```

## Testing Smart Contract

```
yarn run test:contracts
```

or

```
yarn run test:contracts -- nft-marketplace.test.ts
```
