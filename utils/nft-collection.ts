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

    const nftCollectionDeployTx = await NFTOpenCollection.deploy(
      this.signer,
      {
        initialFields: {
          nonEnumerableNftTemplateId: nonEnumerableNFTTemplateId,
          collectionUri: web3.stringToHex(collectionUri),
          totalSupply: 0n
        },
        gasAmount: 100000
      }
    )

    return nftCollectionDeployTx
  }

  async createPreDesignedCollection(
    collectionUri: string,
    baseUri: string
  ): Promise<DeployContractResult<NFTPreDesignedCollectionInstance>> {
    const nftCollectionDeployTx = await NFTPreDesignedCollection.deploy(
      this.signer,
      {
        initialFields: {
          enumerableNftTemplateId: enumerableNFTTemplateId,
          collectionUri: web3.stringToHex(collectionUri),
          tokenBaseUri: web3.stringToHex(baseUri),
          totalSupply: 0n
        },
        gasAmount: 100000
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
          nftCollectionContractId: nftCollectionContractId,
          uri: web3.stringToHex(nftUri)
        },
        attoAlphAmount: BigInt(1.1e18),
        gasAmount: 100000
      }
    )
  }

  async mintPreDesignedNFT(
    nftCollectionContractId: string,
  ) {
    return await MintPreDesignedNFT.execute(
      this.signer,
      {
        initialFields: {
          nftCollectionContractId: nftCollectionContractId
        },
        attoAlphAmount: BigInt(1.1e18),
        gasAmount: 100000
      }
    )
  }
}
