import * as web3 from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import { NFTCollection as NFTCollectionFactory, NFTCollectionInstance } from '../artifacts/ts/NFTCollection'
import { NFT } from '../artifacts/ts/NFT'
import { MintNFT, BurnNFT, DepositNFT, WithdrawNFT } from '../artifacts/ts/scripts'
import { DeployContractResult } from '@alephium/web3'

export class NFTCollection extends DeployHelpers {
  defaultNFTCollectionId: string = "0".repeat(64)

  async create(
    collectionName: string,
    collectionSymbol: string,
    totalSupply: bigint
  ): Promise<DeployContractResult<NFTCollectionInstance>> {

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

    const nftCollectionDeployTx = await NFTCollectionFactory.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId: nftDeployResult.contractId,
          name: web3.stringToHex(collectionName),
          symbol: web3.stringToHex(collectionSymbol),
          totalSupply,
          currentTokenIndex: 0n
        }
      }
    )

    return nftCollectionDeployTx
  }

  async mintNFT(
    nftCollectionContractId: string,
    nftUri: string
  ) {
    return await MintNFT.execute(
      this.signer,
      {
        initialFields: {
          nftCollectionContractId: nftCollectionContractId,
          uri: web3.stringToHex(nftUri)
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
