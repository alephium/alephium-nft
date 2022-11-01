import {
  web3,
  Number256,
  Script,
  Contract,
  DeployContractTransaction,
  SubmissionResult
} from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import listNFTArtifact from '../artifacts/list_nft.ral.json'
import updateNFTPriceArtifact from '../artifacts/update_nft_price.ral.json'
import buyNFTArtifact from '../artifacts/buy_nft.ral.json'
import cancelListingArtifact from '../artifacts/cancel_listing.ral.json'
import updateListingFeeArtifact from '../artifacts/update_listing_fee.ral.json'
import updateAdminArtifact from '../artifacts/update_admin.ral.json'
import updateCommissionRateArtifact from '../artifacts/update_commission_rate.ral.json'
import nftListingArtifact from '../artifacts/nft_listing.ral.json'
import nftMarketplaceArtifact from '../artifacts/nft_marketplace.ral.json'
import { ContractEvent } from '@alephium/web3/dist/src/api/api-alephium'
import { randomContractAddress, randomContractId } from '.'

export class NFTMarketplace extends DeployHelpers {

  async create(): Promise<DeployContractTransaction> {
    const nftListingContract = Contract.fromJson(nftListingArtifact)

    const nftListingDeployTx = await nftListingContract.deploy(
      this.signer,
      {
        initialFields: {
          price: 1000n,
          tokenId: randomContractId(),
          tokenOwner: randomContractAddress(),
          marketAddress: randomContractAddress(),
          commissionRate: 200n  // 200 basis point: 2%
        }
      }
    )

    const nftMarketplaceContract = Contract.fromJson(nftMarketplaceArtifact)

    const adminAccount = await this.signer.getSelectedAccount()

    const nftMarketplaceDeployTx = await nftMarketplaceContract.deploy(
      this.signer,
      {
        initialFields: {
          nftListingTemplateId: nftListingDeployTx.contractId,
          admin: adminAccount.address,
          listingFee: 10n,    // Listing price default to 10 ALPH
          commissionRate: 200n  // 200 basis point: 2%
        }
      }
    )

    return nftMarketplaceDeployTx
  }

  async listNFT(
    tokenId: string,
    price: Number256,
    marketPlaceContractId: string
  ): Promise<SubmissionResult> {
    const script = Script.fromJson(listNFTArtifact)

    return await script.execute(
      this.signer,
      {
        initialFields: {
          tokenId: tokenId,
          price: price,
          marketPlaceContractId: marketPlaceContractId
        }
      }
    )
  }

  async updateNFTPrice(
    price: Number256,
    tokenId: string,
    marketPlaceContractId: string
  ): Promise<SubmissionResult> {
    const script = Script.fromJson(updateNFTPriceArtifact)

    return await script.execute(
      this.signer,
      {
        initialFields: {
          price: price,
          tokenId: tokenId,
          nftMarketplaceContractId: marketPlaceContractId
        }
      }
    )
  }

  async buyNFT(
    totalPayment: Number256,
    tokenId: string,
    marketPlaceContractId: string
  ): Promise<SubmissionResult> {
    const script = Script.fromJson(buyNFTArtifact)

    return await script.execute(
      this.signer,
      {
        initialFields: {
          totalPayment: totalPayment,
          tokenId: tokenId,
          nftMarketplaceContractId: marketPlaceContractId
        }
      }
    )
  }

  async cancelNFTListing(
    tokenId: string,
    marketPlaceContractId: string
  ): Promise<SubmissionResult> {
    const script = Script.fromJson(cancelListingArtifact)

    return await script.execute(
      this.signer,
      {
        initialFields: {
          tokenId: tokenId,
          nftMarketplaceContractId: marketPlaceContractId
        }
      }
    )
  }

  async updateListingFee(
    price: Number256,
    marketPlaceContractId: string
  ): Promise<SubmissionResult> {
    const script = Script.fromJson(updateListingFeeArtifact)

    return await script.execute(
      this.signer,
      {
        initialFields: {
          price: price,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 200000
      }
    )
  }

  async updateAdmin(
    admin: string,
    marketPlaceContractId: string
  ): Promise<SubmissionResult> {
    const script = Script.fromJson(updateAdminArtifact)

    return await script.execute(
      this.signer,
      {
        initialFields: {
          newAdmin: admin,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 200000
      }
    )
  }

  async updateCommissionRate(
    commissionRate: bigint,
    marketPlaceContractId: string
  ): Promise<SubmissionResult> {
    const script = Script.fromJson(updateCommissionRateArtifact)

    return await script.execute(
      this.signer,
      {
        initialFields: {
          newCommissionRate: commissionRate,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 200000
      }
    )
  }

  async getListedNFTs(marketPlaceContractAddress: string): Promise<ContractEvent[]> {
    const nodeProvider = web3.getCurrentNodeProvider()
    const contractEvents = await nodeProvider.events.getEventsContractContractaddress(
      marketPlaceContractAddress,
      { start: 0 }
    )
    // NFTListed event has index 0
    return contractEvents.events.filter((event) => event.eventIndex == 0)
  }
}
