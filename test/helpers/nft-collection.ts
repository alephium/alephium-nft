import * as web3 from 'alephium-web3'
import { Web3Helpers } from '../helpers/web3-helpers'

export class NFTCollection extends Web3Helpers {

  async create(
    collectionName: string,
    collectionDescription: string,
    collectionUri: string
  ): Promise<[string, string, number]> {
    const nftContract = await web3.Contract.fromSource(this.provider, 'nft.ral')

    const nftCollectionDeployTx = await this.createContract(
      'nft_collection.ral',
      {
        initialFields: {
          nftByteCode: nftContract.bytecode,
          collectionName: web3.stringToHex(collectionName),
          collectionDescription: web3.stringToHex(collectionDescription),
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
    nftName: string,
    nftDescription: string,
    nftUri: string
  ) {
    await this.callTxScript(
      'mint_nft.ral',
      {
        initialFields: {
          nftCollectionContractId: nftCollectionContractId,
          name: web3.stringToHex(nftName),
          description: web3.stringToHex(nftDescription),
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