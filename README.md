# Alephium NFT Marketplace Demo

A demonstration of NFT and NFT marketplace on the Alephium blockchain, showcasing different minting strategies and NFT trading capabilities.

## Features

- NFT Marketplace contract for buying and selling NFTs
- Multiple NFT collection types:
  - Open collections (unlimited minting)
  - Public sale collections with random minting
  - Public sale collections with sequential minting
- Optional royalty support for collections
- Batch minting capabilities
- Price updates for listed NFTs
- Commission system for marketplace trades

## Prerequisites

- Node.js and Yarn
- Docker and Docker Compose
- Git

## Getting Started

1. Start the Alephium development environment with Mongodb:
   ```bash
   cd docker
   docker-compose up -d
   ```

2. Install dependencies:
   ```bash
   yarn
   ```

3. Deploy the smart contracts:
   ```bash
   yarn run deploy:contracts
   ```
   This will deploy:
   - The NFT marketplace contract for trading NFTs
   - A default NFT collection contract

4. Start the backend server:
   ```bash
   yarn run start:backend
   ```

5. Start the frontend development server:
   ```bash
   yarn run start:frontend
   ```
   The frontend will be available at http://localhost:3000


## Testing

Run all contract tests:

```bash
yarn run test:contracts
```

Run specific test file:

```bash
yarn run test:contracts -- nft-marketplace.test.ts
```
