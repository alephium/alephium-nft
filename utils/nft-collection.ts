import * as web3 from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import { NFTOpenCollection, NFTOpenCollectionInstance, NFTPreDesignedCollection, NFTPreDesignedCollectionInstance } from '../artifacts/ts'
import { MintOpenNFT, MintPreDesignedNFT } from '../artifacts/ts/scripts'
import { DeployContractResult } from '@alephium/web3'
import { nonEnumerableNFTTemplateId, enumerableNFTTemplateId } from '../configs/nft'

export class NFTCollection extends DeployHelpers {
  async createOpenCollection(
    collectionUri: string
  ): Promise<DeployContractResult<NFTOpenCollectionInstance>> {

    const ownerAddress = (await this.signer.getSelectedAccount()).address
    const nftCollectionDeployTx = await NFTOpenCollection.deploy(
      this.signer,
      {
        initialFields: {
          nonEnumerableNftTemplateId: nonEnumerableNFTTemplateId,
          collectionUri: web3.stringToHex(collectionUri),
          collectionOwner: ownerAddress,
          totalSupply: 0n
        }
      }
    )

    return nftCollectionDeployTx
  }

  async createPreDesignedCollection(
    maxSupply: bigint,
    mintPrice: bigint,
    collectionUri: string,
    baseUri: string
  ): Promise<DeployContractResult<NFTPreDesignedCollectionInstance>> {
    const ownerAddress = (await this.signer.getSelectedAccount()).address
    const nftCollectionDeployTx = await NFTPreDesignedCollection.deploy(
      this.signer,
      {
        initialFields: {
          enumerableNftTemplateId: enumerableNFTTemplateId,
          collectionUri: web3.stringToHex(collectionUri),
          tokenBaseUri: web3.stringToHex(baseUri),
          collectionOwner: ownerAddress,
          maxSupply: maxSupply,
          mintPrice: mintPrice,
          totalSupply: 0n
        }
      }
    )

    return nftCollectionDeployTx
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

  async mintPreDesignedNFT(
    index: bigint,
    mintPrice: bigint,
    nftCollectionContractId: string,
  ) {
    return await MintPreDesignedNFT.execute(
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
}
