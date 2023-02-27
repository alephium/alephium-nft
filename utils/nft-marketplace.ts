import {
  web3,
  Number256,
  DeployContractResult,
  ExecuteScriptResult
} from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import { NFTListing } from '../artifacts/ts/NFTListing'
import { NFTMarketPlace, NFTMarketPlaceInstance } from '../artifacts/ts/NFTMarketPlace'
import { ListNFT, UpdateNFTPrice, BuyNFT, CancelListing, UpdateListingFee, UpdateAdmin, UpdateComissionRate } from '../artifacts/ts/scripts'
import { ContractEvent } from '@alephium/web3/dist/src/api/api-alephium'
import { randomContractAddress, randomContractId } from '.'

export class NFTMarketplace extends DeployHelpers {

  async create(): Promise<DeployContractResult<NFTMarketPlaceInstance>> {

    const nftListingDeployTx = await NFTListing.deploy(
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

    const adminAddress = (await this.signer.getSelectedAccount()).address
    const nftMarketplaceDeployResult = await NFTMarketPlace.deploy(
      this.signer,
      {
        initialFields: {
          nftListingTemplateId: nftListingDeployTx.contractId,
          admin: adminAddress,
          listingFee: 10n,    // Listing price default to 10 ALPH
          commissionRate: 200n  // 200 basis point: 2%
        }
      }
    )

    return nftMarketplaceDeployResult
  }

  async listNFT(
    tokenId: string,
    price: Number256,
    marketPlaceContractId: string
  ): Promise<ExecuteScriptResult> {
    return await ListNFT.execute(
      this.signer,
      {
        initialFields: {
          tokenId: tokenId,
          price: BigInt(price),
          marketPlaceContractId: marketPlaceContractId
        }
      }
    )
  }

  async updateNFTPrice(
    price: Number256,
    tokenId: string,
    marketPlaceContractId: string
  ): Promise<ExecuteScriptResult> {
    return await UpdateNFTPrice.execute(
      this.signer,
      {
        initialFields: {
          price: BigInt(price),
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
  ): Promise<ExecuteScriptResult> {
    return await BuyNFT.execute(
      this.signer,
      {
        initialFields: {
          totalPayment: BigInt(totalPayment),
          tokenId: tokenId,
          nftMarketplaceContractId: marketPlaceContractId
        }
      }
    )
  }

  async cancelNFTListing(
    tokenId: string,
    marketPlaceContractId: string
  ): Promise<ExecuteScriptResult> {
    return await CancelListing.execute(
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
  ): Promise<ExecuteScriptResult> {
    return await UpdateListingFee.execute(
      this.signer,
      {
        initialFields: {
          price: BigInt(price),
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 200000
      }
    )
  }

  async updateAdmin(
    admin: string,
    marketPlaceContractId: string
  ): Promise<ExecuteScriptResult> {
    return await UpdateAdmin.execute(
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
  ): Promise<ExecuteScriptResult> {
    return await UpdateComissionRate.execute(
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
