import * as web3 from 'alephium-web3'
import { Web3Helpers } from '../helpers/web3-helpers'

export class NFTMarketplace extends Web3Helpers {

  updateSigner(signer: web3.NodeWallet): any {
    this.signer = signer
  }

  async create(signerAddress?: string): Promise<string> {
    const nftListingContract = await web3.Contract.fromSource(this.provider, 'nft_listing.ral')
    const nftMarketplaceContract = await web3.Contract.fromSource(this.provider, 'nft_marketplace.ral')
    const adminAccount = (await this.signer.getAccounts())[0]

    const nftMarketplaceDeployTx = await this.createContract(
      'nft_marketplace.ral',
      {
        initialFields: {
          nftListingByteCode: nftListingContract.bytecode,
          admin: adminAccount.address,
          listingPrice: 10,    // Listing price default to 10 ALPH
          commissionRate: 200  // 200 basis point: 2%
        }
      },
      signerAddress
    )

    return nftMarketplaceDeployTx.contractAddress
  }

  async listNFT(
    tokenId: string,
    price: number,
    marketPlaceContractId: string,
    signerAddress?: string
  ): Promise<web3.SubmissionResult> {
    return await this.callTxScript(
      'list_nft.ral',
      {
        initialFields: {
          tokenId: tokenId,
          price: price,
          marketPlaceContractId: marketPlaceContractId
        }
      },
      signerAddress
    )
  }

  async updateNFTPrice(
    price: number,
    nftListingContractId: string,
    signerAddress?: string
  ): Promise<web3.SubmissionResult> {
    return await this.callTxScript(
      'update_nft_price.ral',
      {
        initialFields: {
          price: price,
          nftListingContractId: nftListingContractId
        }
      },
      signerAddress
    )
  }

  async buyNFT(
    totalPayment: number,
    marketPlaceContractId: string,
    nftListingContractId: string,
    signerAddress?: string
  ): Promise<web3.SubmissionResult> {
    return await this.callTxScript(
      'buy_nft.ral',
      {
        initialFields: {
          totalPayment: totalPayment,
          nftListingContractId: nftListingContractId,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 200000  // TODO: set appropriately
      },
      signerAddress
    )
  }

  async cancelNFTListing(
    nftListingContractId: string,
    signerAddress?: string
  ): Promise<web3.SubmissionResult> {
    return await this.callTxScript(
      'cancel_listing.ral',
      {
        initialFields: {
          nftListingContractId: nftListingContractId
        },
        gasAmount: 300000  // TODO: set appropriately
      },
      signerAddress
    )
  }

  async updateListingPrice(
    price: number,
    marketPlaceContractId: string,
    signerAddress?: string
  ): Promise<web3.SubmissionResult> {
    return await this.callTxScript(
      'update_listing_price.ral',
      {
        initialFields: {
          price: price,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 300000
      },
      signerAddress
    )
  }

  async updateAdmin(
    admin: string,
    marketPlaceContractId: string,
    signerAddress?: string
  ): Promise<web3.SubmissionResult> {
    return await this.callTxScript(
      'update_admin.ral',
      {
        initialFields: {
          newAdmin: admin,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 300000
      },
      signerAddress
    )
  }

  async updateCommissionRate(
    commissionRate: number,
    marketPlaceContractId: string,
    signerAddress?: string
  ): Promise<web3.SubmissionResult> {
    return await this.callTxScript(
      'update_commission_rate.ral',
      {
        initialFields: {
          newCommissionRate: commissionRate,
          nftMarketplaceContractId: marketPlaceContractId
        },
        gasAmount: 300000
      },
      signerAddress
    )
  }
}