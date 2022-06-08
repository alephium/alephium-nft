import * as web3 from 'alephium-web3'
import { checkHexString, subContractId } from '../helpers/utils'
import { testAddress1 } from '../helpers/signer'
import { timeout } from './utils'
import { Web3Helpers } from '../helpers/web3-helpers'

export class NFTCollection extends Web3Helpers {

  async create(
    collectionName: string,
    collectionSymbol: string,
    collectionUri: string
  ): Promise<[string, string, number]> {
    const nftContract = await web3.Contract.fromSource(this.provider, 'nft.ral')

    const nftCollectionDeployTx = await this.createContract(
      'nft_collection.ral',
      {
        initialFields: {
          nftByteCode: nftContract.bytecode,
          collectionName: web3.stringToHex(collectionName),
          collectionSymbol: web3.stringToHex(collectionSymbol),
          collectionUri: web3.stringToHex(collectionUri)
        }
      }
    )

    return [
      nftCollectionDeployTx.contractId,
      nftCollectionDeployTx.contractAddress,
      nftCollectionDeployTx.fromGroup
    ]
  }

  async mintNFT(
    nftCollectionContractId: string,
    nftCollectionContractAddress: string,
    nftCollectionContractGroup: number,
    nftName: string,
    nftSymbol: string,
    nftUri: string
  ) {
    await this.callTxScript(
      'mint_nft.ral',
      {
        initialFields: {
          nftCollectionContractId: nftCollectionContractId,
          name: web3.stringToHex(nftName),
          symbol: web3.stringToHex(nftSymbol),
          uri: web3.stringToHex(nftUri)
        },
        gasAmount: 200000  // TODO: set appropriately
      }
    )
  }

  async burnNFT(nftContractId: string, gasAmount?: number, gasPrice?: number) {
    await this.callTxScript(
      'burn_nft.ral',
      {
        initialFields: {
          nftContractId: nftContractId
        },
        gasAmount: gasAmount,
        gasPrice: gasPrice
      }
    )
  }

  async depositNFT(nftContractId: string, gasAmount?: number, gasPrice?: number) {
    await this.callTxScript(
      'deposit_nft.ral',
      {
        initialFields: {
          nftContractId: nftContractId
        },
        gasAmount: gasAmount,
        gasPrice: gasPrice
      }
    )
  }

  async withdrawNFT(nftContractId: string, gasAmount?: number, gasPrice?: number) {
    await this.callTxScript(
      'withdraw_nft.ral',
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