import {
  web3,
  Number256,
  DeployContractResult,
  ExecuteScriptResult,
  ONE_ALPH,
  DUST_AMOUNT
} from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import { NFTListing, NFTMarketPlace, NFTMarketPlaceInstance } from '../artifacts/ts'
import { ListNFT, UpdateNFTPrice, BuyNFT, CancelListing, UpdateListingFee, UpdateAdmin, UpdateComissionRate, WithdrawFromMarketPlace } from '../artifacts/ts/scripts'
import { ContractEvent } from '@alephium/web3/dist/src/api/api-alephium'
import { randomContractAddress, randomContractId } from '.'

export class NFTMarketplace extends DeployHelpers {
  defaultListingFee: bigint = ONE_ALPH / 10n // Listing price default to 0.1 ALPH
  defaultCommissionRate: bigint = 200n       // 200 basis point: 2%

  async create(): Promise<DeployContractResult<NFTMarketPlaceInstance>> {

    const nftListingDeployTx = await NFTListing.deploy(
      this.signer,
      {
        initialFields: {
          price: 1000n,
          tokenId: randomContractId(),
          tokenOwner: randomContractAddress(),
          marketAddress: randomContractAddress()
        }
      }
    )

    const adminAddress = (await this.signer.getSelectedAccount()).address
    const nftMarketplaceDeployResult = await NFTMarketPlace.deploy(
      this.signer,
      {
        initialFields: {
          nftListingTemplateId: nftListingDeployTx.contractInstance.contractId,
          admin: adminAddress,
          listingFee: this.defaultListingFee,
          commissionRate: this.defaultCommissionRate
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
          nftMarketplace: marketPlaceContractId
        },
        attoAlphAmount: this.defaultListingFee + ONE_ALPH + DUST_AMOUNT,
        tokens: [
          {
            id: tokenId,
            amount: 1n
          }
        ]
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
          nftMarketplace: marketPlaceContractId
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
          nftMarketplace: marketPlaceContractId
        },
        attoAlphAmount: totalPayment
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
          nftMarketplace: marketPlaceContractId
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
          nftMarketplace: marketPlaceContractId
        }
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
          nftMarketplace: marketPlaceContractId
        }
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
          nftMarketplace: marketPlaceContractId
        }
      }
    )
  }

  async withdrawFromMarketPlace(
    to: string,
    amount: bigint,
    marketPlaceContractId: string
  ): Promise<ExecuteScriptResult> {
    return await WithdrawFromMarketPlace.execute(
      this.signer,
      {
        initialFields: {
          to,
          amount,
          nftMarketplace: marketPlaceContractId
        }
      }
    )
  }

  async getMarketplaceEvents(marketPlaceContractAddress: string, start: number): Promise<ContractEvent[]> {
    const nodeProvider = web3.getCurrentNodeProvider()
    const contractEvents = await nodeProvider.events.getEventsContractContractaddress(
      marketPlaceContractAddress,
      { start }
    )
    // NFTListed event has index 0
    return contractEvents.events;
  }
}
