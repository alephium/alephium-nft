import * as web3 from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import listNFTArtifact from '../artifacts/list_nft.ral.json'
import updateNFTPriceArtifact from '../artifacts/update_nft_price.ral.json'
import buyNFTArtifact from '../artifacts/buy_nft.ral.json'
import cancelListingArtifact from '../artifacts/cancel_listing.ral.json'
import updateListingFeeArtifact from '../artifacts/update_listing_price.ral.json'
import updateAdminArtifact from '../artifacts/update_admin.ral.json'
import updateCommissionRateArtifact from '../artifacts/update_commission_rate.ral.json'
import nftListingArtifact from '../artifacts/nft_listing.ral.json'
import nftMarketplaceArtifact from '../artifacts/nft_marketplace.ral.json'
import { ContractEvent } from '@alephium/web3/dist/src/api/api-alephium'
import { Number256 } from '@alephium/web3'
import { randomContractAddress, randomContractId } from '.'

export class NFTMarketplace extends DeployHelpers {

  async create(): Promise<web3.DeployContractTransaction> {
    const nftListingContract = this.deployFromSource ?
      await web3.Contract.fromSource(this.provider, 'nft_listing.ral') :
      web3.Contract.fromJson(nftListingArtifact)

    const nftListingDeployTx = await this.createContract(
      nftListingContract,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          price: 1000,
          tokenId: randomContractId(),
          tokenOwner: randomContractAddress(),
          marketAddress: randomContractAddress(),
          commissionRate: 200  // 200 basis point: 2%
        }
      }
    )

    const nftMarketplaceContract = this.deployFromSource ?
      await web3.Contract.fromSource(this.provider, 'nft_marketplace.ral') :
      web3.Contract.fromJson(nftMarketplaceArtifact)

    const adminAccount = (await this.signer.getAccounts())[0]

    const nftMarketplaceDeployTx = await this.createContract(
      nftMarketplaceContract,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          nftListingTemplateId: nftListingDeployTx.contractId,
          admin: adminAccount.address,
          listingFee: 10,    // Listing price default to 10 ALPH
          commissionRate: 200  // 200 basis point: 2%
        }
      }
    )

    return nftMarketplaceDeployTx
  }

  async listNFT(
    tokenId: string,
    price: Number256,
    marketPlaceContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'list_nft.ral') :
      web3.Script.fromJson(listNFTArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          tokenId: tokenId,
          price: price,
          marketPlaceContractId: marketPlaceContractId
        },
        gasAmount: 200000  // TODO: set appropriately
      }
    )
  }

  async updateNFTPrice(
    price: Number256,
    tokenId: string,
    marketPlaceContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'update_nft_price.ral') :
      web3.Script.fromJson(updateNFTPriceArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          price: price,
          tokenId: tokenId,
          nftMarketplaceContractId: marketPlaceContractId
        }
      }
    )
  }

  async buyNFT(
    totalPayment: number,
    tokenId: string,
    marketPlaceContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'buy_nft.ral') :
      web3.Script.fromJson(buyNFTArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          totalPayment: totalPayment,
          tokenId: tokenId,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 200000  // TODO: set appropriately
      }
    )
  }

  async cancelNFTListing(
    tokenId: string,
    marketPlaceContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'cancel_listing.ral') :
      web3.Script.fromJson(cancelListingArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          tokenId: tokenId,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 300000  // TODO: set appropriately
      }
    )
  }

  async updateListingFee(
    price: number,
    marketPlaceContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'update_listing_fee.ral') :
      web3.Script.fromJson(updateListingFeeArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          price: price,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 300000
      }
    )
  }

  async updateAdmin(
    admin: string,
    marketPlaceContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'update_admin.ral') :
      web3.Script.fromJson(updateAdminArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          newAdmin: admin,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 300000
      }
    )
  }

  async updateCommissionRate(
    commissionRate: number,
    marketPlaceContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.deployFromSource ?
      await web3.Script.fromSource(this.provider, 'update_commission_rate.ral') :
      web3.Script.fromJson(updateCommissionRateArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          newCommissionRate: commissionRate,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 300000
      }
    )
  }

  async getListedNFTs(marketPlaceContractAddress: string): Promise<ContractEvent[]> {
    const contractEvents = await this.provider.events.getEventsContractContractaddress(
      marketPlaceContractAddress,
      { start: 0 }
    )
    // NFTListed event has index 0
    return contractEvents.events.filter((event) => event.eventIndex == 0)
  }
}
