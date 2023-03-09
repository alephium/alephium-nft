import * as web3 from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import { NFT, NFTOpenCollection, NFTOpenCollectionInstance, NFTCollectionRandom, NFTCollectionRandomInstance } from '../artifacts/ts'
import { MintOpenNFT, MintNFTWithIndex, BurnNFT, DepositNFT, WithdrawNFT } from '../artifacts/ts/scripts'
import { DeployContractResult } from '@alephium/web3'

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

  async createRandomCollection(
    collectionName: string,
    collectionSymbol: string,
    totalSupply: bigint
  ): Promise<DeployContractResult<NFTCollectionRandomInstance>> {

    const nftTemplateId = await this.createNFTTemplate()
    const nftCollectionDeployTx = await NFTCollectionRandom.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId,
          name: web3.stringToHex(collectionName),
          symbol: web3.stringToHex(collectionSymbol),
          totalSupply,
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
          uri: web3.stringToHex("template_uri"),
          collectionId: this.defaultNFTCollectionId,
          tokenIndex: 0n
        }
      }
    )

    this.nftTemplateId = nftDeployResult.contractId
    return this.nftTemplateId
  }

  async mintNFT(
    nftCollectionContractId: string,
    nftUri: string,
    tokenIndex?: bigint
  ) {
    if (!!tokenIndex) {
      return await MintNFTWithIndex.execute(
        this.signer,
        {
          initialFields: {
            nftCollectionContractId: nftCollectionContractId,
            uri: web3.stringToHex(nftUri),
            tokenIndex: tokenIndex
          }
        }
      )
    } else {
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
