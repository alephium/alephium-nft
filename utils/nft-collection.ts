import * as web3 from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import nftArtifact from '../artifacts/nft.ral.json'
import nftCollectionArtifact from '../artifacts/nft_collection.ral.json'
import mintNFTArtifact from '../artifacts/mint_nft.ral.json'
import burnNFTArtifact from '../artifacts/burn_nft.ral.json'
import depositNFTArtifact from '../artifacts/deposit_nft.ral.json'
import withdrawNFTArtifact from '../artifacts/withdraw_nft.ral.json'
import { addressFromContractId } from '@alephium/web3'

export class NFTCollection extends DeployHelpers {
  defaultNFTCollectionAddress: string = addressFromContractId("0".repeat(64))

  async create(
    collectionName: string,
    collectionDescription: string,
    collectionUri: string
  ): Promise<web3.DeployContractTransaction> {
    const nftContract = this.deployFromSource ?
      await web3.Contract.fromSource(this.provider, 'nft.ral') :
      web3.Contract.fromJson(nftArtifact)

    const nftDeployTx = await this.createContract(
      nftContract,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          owner: this.signerAddress,
          name: web3.stringToHex("template_name"),
          description: web3.stringToHex("template_description"),
          uri: web3.stringToHex("template_uri"),
          collectionAddress: this.defaultNFTCollectionAddress
        }
      }
    )

    const nftCollectionContract = this.deployFromSource ?
      await web3.Contract.fromSource(this.provider, 'nft_collection.ral') :
      web3.Contract.fromJson(nftCollectionArtifact)

    const nftCollectionDeployTx = await this.createContract(
      nftCollectionContract,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          nftTemplateId: nftDeployTx.contractId,
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
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'mint_nft.ral') :
      web3.Script.fromJson(mintNFTArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
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
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'burn_nft.ral') :
      web3.Script.fromJson(burnNFTArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
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
    gasPrice?: number
  ): Promise<web3.SignExecuteScriptTxResult> {
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'deposit_nft.ral') :
      web3.Script.fromJson(depositNFTArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
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
    gasPrice?: number
  ): Promise<web3.SignExecuteScriptTxResult> {
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'withdraw_nft.ral') :
      web3.Script.fromJson(withdrawNFTArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          nftContractId: nftContractId
        },
        gasAmount: gasAmount,
        gasPrice: gasPrice
      }
    )
  }
}
