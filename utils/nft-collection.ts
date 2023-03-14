import * as web3 from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import { NFT, NFTOpenCollection, NFTOpenCollectionInstance, NFTPreDesignedCollection, NFTPreDesignedCollectionInstance } from '../artifacts/ts'
import { MintOpenNFT, MintPreDesignedNFT, BurnNFT, DepositNFT, WithdrawNFT } from '../artifacts/ts/scripts'
import { binToHex, DeployContractResult, encodeU256, stringToHex } from '@alephium/web3'

export class NFTCollection extends DeployHelpers {
  defaultNFTCollectionId: string = "0".repeat(64)
  nftTemplateId: string | undefined = undefined

  async createOpenCollection(
    collectionName: string,
    collectionSymbol: string,
    totalSupply: bigint
  ): Promise<DeployContractResult<NFTOpenCollectionInstance>> {

    const nftTemplateId = await this.createNFTTemplate()
    const nftCollectionDeployTx = await NFTOpenCollection.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId,
          name: web3.stringToHex(collectionName),
          symbol: web3.stringToHex(collectionSymbol),
          totalSupply,
          currentTokenIndex: 0n
        }
      }
    )

    return nftCollectionDeployTx
  }

  async createPreDesignedCollection(
    collectionName: string,
    collectionSymbol: string,
    baseUri: string,
    totalSupply: bigint
  ): Promise<DeployContractResult<NFTPreDesignedCollectionInstance>> {

    const nftTemplateId = await this.createNFTTemplate()
    const nftCollectionDeployTx = await NFTPreDesignedCollection.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId,
          name: web3.stringToHex(collectionName),
          symbol: web3.stringToHex(collectionSymbol),
          baseUri: web3.stringToHex(baseUri),
          totalSupply
        }
      }
    )

    return nftCollectionDeployTx
  }

  async createNFTTemplate() {
    if (!!this.nftTemplateId) {
      return Promise.resolve(this.nftTemplateId)
    }

    const nftDeployResult = await NFT.deploy(
      this.signer,
      {
        initialFields: {
          owner: (await this.signer.getSelectedAccount()).address,
          isTokenWithdrawn: false,
          uri: web3.stringToHex("template_uri")
        }
      }
    )

    this.nftTemplateId = nftDeployResult.contractId
    return this.nftTemplateId
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
        }
      }
    )
  }

  async mintPreDesignedNFT(
    nftCollectionContractId: string,
    tokenIndex: bigint
  ) {
    return await MintPreDesignedNFT.execute(
      this.signer,
      {
        initialFields: {
          nftCollectionContractId: nftCollectionContractId,
          tokenIndex: tokenIndex
        }
      }
    )
  }

  async burnNFT(nftContractId: string, gasAmount?: number, gasPrice?: bigint) {
    return await BurnNFT.execute(
      this.signer,
      {
        initialFields: {
          nftContractId: nftContractId
        },
        gasAmount: gasAmount,
        gasPrice: gasPrice
      }
    )
  }

  async depositNFT(
    nftContractId: string,
    gasAmount?: number,
    gasPrice?: bigint
  ): Promise<web3.SignExecuteScriptTxResult> {
    return await DepositNFT.execute(
      this.signer,
      {
        initialFields: {
          nftContractId: nftContractId
        },
        gasAmount: gasAmount,
        gasPrice: gasPrice,
        tokens: [{ id: nftContractId, amount: 1n }]
      }
    )
  }

  async withdrawNFT(
    nftContractId: string,
    gasAmount?: number,
    gasPrice?: bigint
  ): Promise<web3.SignExecuteScriptTxResult> {
    return await WithdrawNFT.execute(
      this.signer,
      {
        initialFields: {
          nftContractId: nftContractId
        },
        gasAmount: gasAmount,
        gasPrice: gasPrice
      }
    )
  }
}
