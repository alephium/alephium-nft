import * as web3 from '@alephium/web3'
import { Web3Helpers } from '../scripts/web3-helpers'
import listNFTArtifact from '../artifacts/list_nft.ral.json'
import updateNFTPriceArtifact from '../artifacts/update_nft_price.ral.json'
import buyNFTArtifact from '../artifacts/buy_nft.ral.json'
import cancelListingArtifact from '../artifacts/cancel_listing.ral.json'
import updateListingPriceArtifact from '../artifacts/update_listing_price.ral.json'
import updateAdminArtifact from '../artifacts/update_admin.ral.json'
import updateCommissionRateArtifact from '../artifacts/update_commission_rate.ral.json'
import nftListingArtifact from '../artifacts/nft_listing.ral.json'
import nftMarketplaceArtifact from '../artifacts/nft_marketplace.ral.json'
import { ContractEvent } from '@alephium/web3/dist/src/api/api-alephium'

export class NFTMarketplace extends Web3Helpers {

  updateSigner(signer: web3.NodeWallet): any {
    this.signer = signer
  }

  async create(): Promise<web3.DeployContractTransaction> {
    const nftListingContract = this.isTest ?
      await web3.Contract.fromSource(this.provider, 'nft_listing.ral') :
      await web3.Contract.fromJson(nftListingArtifact)

    const nftMarketplaceContract = this.isTest ?
      await web3.Contract.fromSource(this.provider, 'nft_marketplace.ral') :
      await web3.Contract.fromJson(nftMarketplaceArtifact)

    const adminAccount = (await this.signer.getAccounts())[0]

    const nftMarketplaceDeployTx = await this.createContract(
      nftMarketplaceContract,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          nftListingByteCode: nftListingContract.bytecode,
          admin: adminAccount.address,
          listingPrice: 10,    // Listing price default to 10 ALPH
          commissionRate: 200  // 200 basis point: 2%
        }
      }
    )

    return nftMarketplaceDeployTx
  }

  async listNFT(
    tokenId: string,
    price: number,
    marketPlaceContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.isTest ?
      await web3.Script.fromSource(this.provider, 'list_nft.ral') :
      await web3.Script.fromJson(listNFTArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          tokenId: tokenId,
          price: price,
          marketPlaceContractId: marketPlaceContractId
        }
      }
    )
  }

  async updateNFTPrice(
    price: number,
    nftListingContractId: string,
  ): Promise<web3.SubmissionResult> {
    const script = this.isTest ?
      await web3.Script.fromSource(this.provider, 'update_nft_price.ral') :
      await web3.Script.fromJson(updateNFTPriceArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          price: price,
          nftListingContractId: nftListingContractId
        }
      }
    )
  }

  async buyNFT(
    totalPayment: number,
    marketPlaceContractId: string,
    nftListingContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.isTest ?
      await web3.Script.fromSource(this.provider, 'buy_nft.ral') :
      await web3.Script.fromJson(buyNFTArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          totalPayment: totalPayment,
          nftListingContractId: nftListingContractId,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 200000  // TODO: set appropriately
      }
    )
  }

  async cancelNFTListing(
    nftListingContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.isTest ?
      await web3.Script.fromSource(this.provider, 'cancel_listing.ral') :
      await web3.Script.fromJson(cancelListingArtifact)

    return await this.callTxScript(
      script,
      {
        signerAddress: this.signerAddress,
        initialFields: {
          nftListingContractId: nftListingContractId
        },
        gasAmount: 300000  // TODO: set appropriately
      }
    )
  }

  async updateListingPrice(
    price: number,
    marketPlaceContractId: string
  ): Promise<web3.SubmissionResult> {
    const script = this.isTest ?
      await web3.Script.fromSource(this.provider, 'update_listing_price.ral') :
      await web3.Script.fromJson(updateListingPriceArtifact)

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
    const script = this.isTest ?
      await web3.Script.fromSource(this.provider, 'update_admin.ral') :
      await web3.Script.fromJson(updateAdminArtifact)

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
    const script = this.isTest ?
      await web3.Script.fromSource(this.provider, 'update_commission_rate.ral') :
      await web3.Script.fromJson(updateCommissionRateArtifact)

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
