import * as web3 from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import { NFTCollection as NFTCollectionFactory, NFTCollectionInstance } from '../artifacts/ts/NFTCollection'
import { NFT } from '../artifacts/ts/NFT'
import { MintNFT, BurnNFT, DepositNFT, WithdrawNFT } from '../artifacts/ts/scripts'
import { addressFromContractId, DeployContractResult } from '@alephium/web3'

export class NFTCollection extends DeployHelpers {
  defaultNFTCollectionAddress: string = addressFromContractId("0".repeat(64))

  async create(
    collectionName: string,
    collectionDescription: string,
    collectionUri: string
  ): Promise<DeployContractResult<NFTCollectionInstance>> {

    const nftDeployResult = await NFT.deploy(
      this.signer,
      {
        initialFields: {
          owner: (await this.signer.getSelectedAccount()).address,
          isTokenWithdrawn: false,
          name: web3.stringToHex("template_name"),
          description: web3.stringToHex("template_description"),
          uri: web3.stringToHex("template_uri"),
          collectionAddress: this.defaultNFTCollectionAddress
        }
      }
    )

    const nftCollectionDeployTx = await NFTCollectionFactory.deploy(
      this.signer,
      {
        initialFields: {
          nftTemplateId: nftDeployResult.contractId,
          collectionName: web3.stringToHex(collectionName),
          collectionDescription: web3.stringToHex(collectionDescription),
          collectionUri: web3.stringToHex(collectionUri)
        }
      }
    )

    return nftCollectionDeployTx
  }

  async mintNFT(
    nftCollectionContractId: string,
    nftName: string,
    nftDescription: string,
    nftUri: string
  ) {
    return await MintNFT.execute(
      this.signer,
      {
        initialFields: {
          nftCollectionContractId: nftCollectionContractId,
          name: web3.stringToHex(nftName),
          description: web3.stringToHex(nftDescription),
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
        gasPrice: gasPrice
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
