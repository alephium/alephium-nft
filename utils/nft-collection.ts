import * as web3 from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import { NFTOpenCollection, NFTOpenCollectionInstance, NFTPublicSaleCollectionRandom, NFTPublicSaleCollectionRandomInstance, NFTPublicSaleCollectionSequential, NFTPublicSaleCollectionSequentialInstance } from '../artifacts/ts'
import { MintBatchSequential, MintNextSequential, MintOpenNFT, MintSpecificPublicSaleNFT, WithdrawFromPublicSaleCollection } from '../artifacts/ts/scripts'
import { DeployContractResult, DUST_AMOUNT, ONE_ALPH } from '@alephium/web3'
import { nftTemplateId } from '../configs/nft'

export class NFTCollection extends DeployHelpers {
  async createOpenCollection(
    collectionUri: string
  ): Promise<DeployContractResult<NFTOpenCollectionInstance>> {

    const ownerAddress = (await this.signer.getSelectedAccount()).address
    const nftCollectionDeployTx = await NFTOpenCollection.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId: nftTemplateId,
          collectionUri: web3.stringToHex(collectionUri),
          collectionOwner: ownerAddress,
          totalSupply: 0n
        }
      }
    )

    return nftCollectionDeployTx
  }

  async createPublicSaleCollectionRandom(
    maxSupply: bigint,
    mintPrice: bigint,
    collectionUri: string,
    baseUri: string
  ): Promise<DeployContractResult<NFTPublicSaleCollectionRandomInstance>> {
    const ownerAddress = (await this.signer.getSelectedAccount()).address
    const nftCollectionDeployTx = await NFTPublicSaleCollectionRandom.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId: nftTemplateId,
          collectionUri: web3.stringToHex(collectionUri),
          nftBaseUri: web3.stringToHex(baseUri),
          collectionOwner: ownerAddress,
          maxSupply: maxSupply,
          mintPrice: mintPrice,
          totalSupply: 0n
        }
      }
    )

    return nftCollectionDeployTx
  }

  async createPublicSaleCollectionSequential(
    maxSupply: bigint,
    mintPrice: bigint,
    collectionUri: string,
    baseUri: string,
    maxBatchMintSize: bigint
  ): Promise<DeployContractResult<NFTPublicSaleCollectionSequentialInstance>> {
    const ownerAddress = (await this.signer.getSelectedAccount()).address
    return await NFTPublicSaleCollectionSequential.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId: nftTemplateId,
          collectionUri: web3.stringToHex(collectionUri),
          nftBaseUri: web3.stringToHex(baseUri),
          collectionOwner: ownerAddress,
          maxSupply: maxSupply,
          mintPrice: mintPrice,
          maxBatchMintSize: maxBatchMintSize,
          totalSupply: 0n
        }
      }
    )
  }

  async mintBatchSequential(
    batchSize: bigint,
    mintPrice: bigint,
    nftCollectionContractId: string
  ) {
    return await MintBatchSequential.execute(
      this.signer,
      {
        initialFields: {
          nftCollection: nftCollectionContractId,
          batchSize: batchSize,
          mintPrice: mintPrice
        },
        attoAlphAmount: batchSize * (ONE_ALPH + mintPrice) + (batchSize + 1n) * DUST_AMOUNT
      }
    )
  }

  async mintNextSequential(mintPrice: bigint, nftCollectionContractId: string) {
    return await MintNextSequential.execute(
      this.signer,
      {
        initialFields: {
          nftCollection: nftCollectionContractId,
          mintPrice: mintPrice
        },
        attoAlphAmount: ONE_ALPH + mintPrice + DUST_AMOUNT * 2n
      }
    )
  }

  async mintOpenNFT(
    nftCollectionContractId: string,
    nftUri: string,
  ) {
    return await MintOpenNFT.execute(
      this.signer,
      {
        initialFields: {
          nftCollection: nftCollectionContractId,
          uri: web3.stringToHex(nftUri)
        },
        attoAlphAmount: BigInt(1.1e18)
      }
    )
  }

  async mintSpecificPublicSaleNFT(
    index: bigint,
    mintPrice: bigint,
    nftCollectionContractId: string,
  ) {
    return await MintSpecificPublicSaleNFT.execute(
      this.signer,
      {
        initialFields: {
          index: index,
          mintPrice: mintPrice,
          nftCollection: nftCollectionContractId
        },
        attoAlphAmount: BigInt(1.1e18) + mintPrice
      }
    )
  }

  async withdrawFromPublicSaleCollection(
    to: string,
    amount: bigint,
    nftCollectionId: string,
  ) {
    return await WithdrawFromPublicSaleCollection.execute(
      this.signer,
      {
        initialFields: {
          to: to,
          amount: amount,
          nftCollection: nftCollectionId
        }
      }
    )
  }
}