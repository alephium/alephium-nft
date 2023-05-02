import * as web3 from '@alephium/web3'
import { addressFromContractId, binToHex, contractIdFromAddress, prettifyExactAmount } from '@alephium/web3'
import { NFTMarketplace } from '../utils/nft-marketplace'
import TxStatusAlert, { useTxStatusStates } from './tx-status-alert'
import { useRouter } from 'next/router'
import { prettifyAttoAlphAmount, ONE_ALPH } from '@alephium/web3'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import { NFTListing } from '../components/nft-listing'
import { useNFTListings } from '../components/nft-listing'
import { NFTCard } from '../components/nft-card'

export default function BuyNFTs() {
  const router = useRouter()
  const context = useAlephiumConnectContext()

  const [
    ongoingTxId,
    setOngoingTxId,
    ongoingTxDescription,
    setOngoingTxDescription,
    txStatusCallback,
    setTxStatusCallback,
    resetTxStatus
  ] = useTxStatusStates()

  const { nftListings, isLoading } = useNFTListings(context.signerProvider)

  async function buyNFT(nftListing: NFTListing) {
    if (context.signerProvider?.nodeProvider && context.account) {
      const nftMarketplace = new NFTMarketplace(context.signerProvider)
      const [commission, nftDeposit, gasAmount, totalAmount] = getPriceBreakdowns(nftListing.price, nftListing.commissionRate)
      console.debug("commission", commission)
      console.debug("nftDeposit", nftDeposit)
      console.debug("gasAmount", gasAmount)
      console.debug("totalAmount", totalAmount)
      const buyNFTTxResult = await nftMarketplace.buyNFT(
        totalAmount,
        nftListing._id,
        binToHex(contractIdFromAddress(nftListing.marketAddress))
      )
      console.debug('buyNFTTxResult', buyNFTTxResult)
      setOngoingTxId(buyNFTTxResult.txId)
      setOngoingTxDescription('buying NFT')

      setTxStatusCallback(() => async (txStatus: web3.node.TxStatus) => {
        if (txStatus.type === 'Confirmed') {
          resetTxStatus()
          router.push('/my-porfolio')
        } else if (txStatus.type === 'TxNotFound') {
          resetTxStatus()
          console.error('Deposit NFT transaction not found')
        }
      })
    } else {
      console.debug(
        "can not buy NFT",
        context.signerProvider?.nodeProvider,
        context.signerProvider,
        context.account
      )
    }
  }

  if (isLoading) return (<h1 className="px-20 py-10 text-3xl">Loading...</h1>)
  if (ongoingTxId) return (<TxStatusAlert txId={ongoingTxId} description={ongoingTxDescription} txStatusCallback={txStatusCallback} />)
  if (nftListings.length === 0) return (<h1 className="px-20 py-10 text-3xl">No NFTs for sale</h1>)
  return (
    <>
      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: '1600px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {
              nftListings.map((nftListing, i) => {
                const [commission, nftDeposit, gasAmount, totalAmount] = getPriceBreakdowns(nftListing.price, nftListing.commissionRate)
                return (
                  <NFTCard
                    key={i}
                    tokenInfo={{
                      name: nftListing.name,
                      token_id: nftListing._id,
                      owner_of: nftListing.tokenOwner,
                      description: nftListing.description,
                      token_address: addressFromContractId(nftListing._id),
                      metadata: `{"image": "${nftListing.image}"}`,
                      listingInfo: {
                        totalAmount: `${prettifyAttoAlphAmount(totalAmount)} ALPH`,
                        price: `${prettifyAttoAlphAmount(BigInt(nftListing.price))}`,
                        gas: `${prettifyExactAmount(BigInt(gasAmount), 18)}`,
                        commission: `${prettifyAttoAlphAmount(BigInt(commission))}`,
                        deposit: `${prettifyAttoAlphAmount(BigInt(nftDeposit))}`,
                        buyNFT: () => buyNFT(nftListing)
                      }
                    }}
                    width='300px'
                  >
                  </NFTCard>
                )
              })
            }
          </div>
        </div>
      </div>
    </>
  )
}

function getPriceBreakdowns(nftPrice: bigint, commissionRate: bigint) {
  const commission = BigInt(nftPrice * commissionRate) / BigInt(10000)
  const nftDeposit = ONE_ALPH
  const gasAmount = BigInt(200000)
  const totalAmount = BigInt(nftPrice) + commission + nftDeposit + gasAmount

  return [commission, nftDeposit, gasAmount, totalAmount]
}
