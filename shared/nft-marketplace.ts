import {
  Number256,
  DeployContractResult,
  ExecuteScriptResult,
  ONE_ALPH,
  DUST_AMOUNT,
  NodeProvider,
  SignerProvider,
} from '@alephium/web3'
import { DeployHelpers } from './deploy-helpers'
import { NFTListing, NFTMarketPlace, NFTMarketPlaceInstance } from '../artifacts/ts'
import { ListNFT, UpdateNFTPrice, BuyNFT, CancelListing, UpdateListingFee, UpdateAdmin, UpdateComissionRate, WithdrawFromMarketPlace } from '../artifacts/ts/scripts'
import { ContractEvent } from '@alephium/web3/dist/src/api/api-alephium'
import { randomContractAddress, randomContractId } from '.'

export class NFTMarketplace extends DeployHelpers {
  static defaultListingFee: bigint = ONE_ALPH / 10n // Listing price default to 0.1 ALPH
  static defaultCommissionRate: bigint = 200n       // 200 basis point: 2%

  async create(
    signer: SignerProvider = this.signer
  ): Promise<DeployContractResult<NFTMarketPlaceInstance>> {

    const nftListingDeployTx = await NFTListing.deploy(
      signer,
      {
        initialFields: {
          tokenId: randomContractId(),
          tokenOwner: randomContractAddress(),
          marketContractId: randomContractId(),
          commissionRate: NFTMarketplace.defaultCommissionRate,
          listingFee: NFTMarketplace.defaultListingFee,
          price: 1000n,
          royalty: false
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
          listingFee: NFTMarketplace.defaultListingFee,
          commissionRate: NFTMarketplace.defaultCommissionRate
        }
      }
    )

    return nftMarketplaceDeployResult
  }

  async listNFT(
    tokenId: string,
    price: Number256,
    marketPlaceContractId: string,
    signer: SignerProvider = this.signer
  ): Promise<ExecuteScriptResult> {
    return await ListNFT.execute(
      signer,
      {
        initialFields: {
          tokenId: tokenId,
          price: BigInt(price),
          nftMarketplace: marketPlaceContractId,
          royalty: false
        },
        attoAlphAmount: ONE_ALPH + DUST_AMOUNT,
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
    marketPlaceContractId: string,
    signer: SignerProvider = this.signer
  ): Promise<ExecuteScriptResult> {
    return await UpdateNFTPrice.execute(
      signer,
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
    marketPlaceContractId: string,
    signer: SignerProvider = this.signer
  ): Promise<ExecuteScriptResult> {
    return await BuyNFT.execute(
      signer,
      {
        initialFields: {
          totalPayment: BigInt(totalPayment),
          tokenId: tokenId,
          nftMarketplace: marketPlaceContractId
        },
        attoAlphAmount: BigInt(totalPayment) + DUST_AMOUNT,
      }
    )
  }

  async cancelNFTListing(
    tokenId: string,
    marketPlaceContractId: string,
    signer: SignerProvider = this.signer
  ): Promise<ExecuteScriptResult> {
    return await CancelListing.execute(
      signer,
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
    marketPlaceContractId: string,
    signer: SignerProvider = this.signer
  ): Promise<ExecuteScriptResult> {
    return await UpdateListingFee.execute(
      signer,
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
    marketPlaceContractId: string,
    signer: SignerProvider = this.signer
  ): Promise<ExecuteScriptResult> {
    return await UpdateAdmin.execute(
      signer,
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
    marketPlaceContractId: string,
    signer: SignerProvider = this.signer
  ): Promise<ExecuteScriptResult> {
    return await UpdateComissionRate.execute(
      signer,
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
    marketPlaceContractId: string,
    signer: SignerProvider = this.signer
  ): Promise<ExecuteScriptResult> {
    return await WithdrawFromMarketPlace.execute(
      signer,
      {
        initialFields: {
          to,
          amount,
          nftMarketplace: marketPlaceContractId
        }
      }
    )
  }

  async getMarketplaceEvents(nodeProvider: NodeProvider, marketPlaceContractAddress: string, start: number): Promise<ContractEvent[]> {
    const contractEvents = await nodeProvider.events.getEventsContractContractaddress(
      marketPlaceContractAddress,
      { start }
    )
    // NFTListed event has index 0
    return contractEvents.events;
  }
}
