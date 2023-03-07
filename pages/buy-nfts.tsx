import { useEffect, useState } from 'react'
import * as web3 from '@alephium/web3'
import { addressFromContractId, binToHex, contractIdFromAddress, hexToString, prettifyExactAmount } from '@alephium/web3'
import { NFTMarketplace } from '../utils/nft-marketplace'
import { marketplaceContractId } from '../configs/nft'
import { NFTListingContract, NFTContract, NFTMarketplaceContract, fetchState } from '../utils/contracts'
import axios from 'axios'
import TxStatusAlert, { useTxStatusStates } from './tx-status-alert'
import { useRouter } from 'next/router'
import { ContractEvent } from '@alephium/web3/dist/src/api/api-alephium'
import { prettifyAttoAlphAmount, ONE_ALPH } from '@alephium/web3'
import { useContext } from '@alephium/web3-react'

interface NFTListing {
  price: bigint
  name: string,
  description: string,
  image: string,
  tokenId: string,
  tokenOwner: string,
  marketAddress: string
  commissionRate: bigint,
  listingContractId: string
}

export default function BuyNFTs() {
  const [nftListings, setNftListings] = useState([] as NFTListing[])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [commissionRate, setCommissionRate] = useState<bigint | undefined>(undefined)
  const router = useRouter()
  const context = useContext()

  const [
    ongoingTxId,
    setOngoingTxId,
    ongoingTxDescription,
    setOngoingTxDescription,
    txStatusCallback,
    setTxStatusCallback,
    resetTxStatus
  ] = useTxStatusStates()

  useEffect(() => {
    loadListedNFTs()
    loadMarketplaceCommissionRate()
  }, [context.account])

  async function loadMarketplaceCommissionRate() {
    if (context.signerProvider?.nodeProvider) {
      try {
        const marketplaceState = await fetchState(
          context.signerProvider.nodeProvider,
          NFTMarketplaceContract,
          addressFromContractId(marketplaceContractId),
          0
        )

        setCommissionRate(marketplaceState.fields.commissionRate as bigint)
      } catch (e) {
        console.debug(`error fetching state for market place`, e)
      }
    }
  }

  async function loadListedNFT(event: ContractEvent): Promise<NFTListing | undefined> {
    const tokenId = event.fields[1].value.toString()
    const listingContractId = event.fields[3].value.toString()

    if (context.signerProvider?.nodeProvider) {
      var listingState = undefined

      try {
        listingState = await fetchState(
          context.signerProvider.nodeProvider,
          NFTListingContract,
          addressFromContractId(listingContractId),
          0
        )
      } catch (e) {
        console.log(`error fetching state for ${tokenId}`, e)
      }

      if (listingState && listingState.codeHash === NFTListingContract.codeHash) {
        const nftState = await fetchState(
          context.signerProvider.nodeProvider,
          NFTContract,
          addressFromContractId(tokenId),
          0
        )

        const metadataUri = hexToString(nftState.fields.uri as string)
        const metadata = (await axios.get(metadataUri)).data
        return {
          price: listingState.fields.price as bigint,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          tokenId: tokenId,
          tokenOwner: listingState.fields.tokenOwner as string,
          marketAddress: listingState.fields.marketAddress as string,
          commissionRate: listingState.fields.commissionRate as bigint,
          listingContractId: listingContractId
        }
      }
    }
  }

  async function loadListedNFTs() {
    const items = new Map<string, NFTListing>()

    if (context.signerProvider?.nodeProvider && context.signerProvider && context.account) {
      const nftMarketplace = new NFTMarketplace(
        context.signerProvider.nodeProvider,
        context.signerProvider
      )

      const marketplaceContractAddress = addressFromContractId(marketplaceContractId)
      const events: ContractEvent[] = await nftMarketplace.getListedNFTs(marketplaceContractAddress)

      for (var event of events) {
        const listedNFT = await loadListedNFT(event)
        listedNFT && items.set(listedNFT.listingContractId, listedNFT)
      }
    }


    setNftListings(Array.from(items.values()))
    setLoadingState('loaded')
  }

  async function buyNFT(nftListing: NFTListing) {
    if (context.signerProvider?.nodeProvider && context.account && commissionRate) {
      const nftMarketplace = new NFTMarketplace(
        context.signerProvider.nodeProvider,
        context.signerProvider
      )

      const [commission, nftDeposit, gasAmount, totalAmount] = getPriceBreakdowns(nftListing.price, commissionRate)
      console.debug("commission", commission)
      console.debug("nftDeposit", nftDeposit)
      console.debug("gasAmount", gasAmount)
      console.debug("totalAmount", totalAmount)
      const buyNFTTxResult = await nftMarketplace.buyNFT(
        totalAmount,
        nftListing.tokenId,
        binToHex(contractIdFromAddress(nftListing.marketAddress))
      )
      console.debug('buyNFTTxResult', buyNFTTxResult)
      setOngoingTxId(buyNFTTxResult.txId)
      setOngoingTxDescription('buying NFT')

      setTxStatusCallback(() => async (txStatus: web3.node.TxStatus) => {
        if (txStatus.type === 'Confirmed') {
          resetTxStatus()
          router.push('/my-nfts')
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
        context.account,
        commissionRate
      )
    }
  }

  if (loadingState === 'loaded' && !nftListings.length) return (<h1 className="px-20 py-10 text-3xl">No NFTs for sale</h1>)
  return (
    <>
      {
        ongoingTxId ? <TxStatusAlert txId={ongoingTxId} description={ongoingTxDescription} txStatusCallback={txStatusCallback} /> : undefined
      }

      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: '1600px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {
              nftListings.map((nftListing, i) => (
                <div key={i} className="border shadow rounded-xl overflow-hidden">
                  <div className="p-4 object-center">
                    <img src={nftListing.image} />
                  </div>
                  <div className="p-4">
                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nftListing.name}</p>
                    <div style={{ height: '70px', overflow: 'hidden' }}>
                      <p className="text-gray-400">{nftListing.description}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-black">
                    <p className="text-2xl font-bold text-white">{prettifyAttoAlphAmount(nftListing.price)} ALPH </p>
                    {commissionRate?.toString() && showPriceBreakdowns(nftListing.price, commissionRate)}
                    <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNFT(nftListing)}>Buy</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </>
  )
}

function getPriceBreakdowns(nftPrice: bigint, commissionRate: bigint) {
  const commission = (nftPrice * commissionRate) / BigInt(10000)
  const nftDeposit = ONE_ALPH
  const gasAmount = BigInt(200000)
  const totalAmount = BigInt(nftPrice) + commission + nftDeposit + gasAmount

  return [commission, nftDeposit, gasAmount, totalAmount]
}

function showPriceBreakdowns(nftPrice: bigint, commissionRate: bigint) {
  const [commission, nftDeposit, gasAmount, totalAmount] = getPriceBreakdowns(nftPrice, commissionRate)
  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto sm:-mx-6 lg:-mx-8" >
        <div className="py-2 inline-block min-w-full sm:px-6 lg:px-8">
          <table className="min-w-full">
            <thead>
              <tr>
                <th scope="col" className="text-sm py-4 font-bold text-white text-left">
                  Total amount ≈ {prettifyAttoAlphAmount(totalAmount)} ALPH
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-black">
                <td className="whitespace-nowrap text-sm font-medium text-white">NFT Price</td>
                <td className="text-sm text-white whitespace-nowrap">
                  {prettifyAttoAlphAmount(BigInt(nftPrice))}
                </td>
              </tr>
              <tr className="bg-black">
                <td className="whitespace-nowrap text-sm font-medium text-white">Commission</td>
                <td className="text-sm text-white whitespace-nowrap">
                  {prettifyAttoAlphAmount(BigInt(commission))}
                </td>
              </tr>
              <tr className="bg-black">
                <td className="whitespace-nowrap text-sm font-medium text-white">NFT Contract Deposit</td>
                <td className="text-sm text-white whitespace-nowrap">
                  {prettifyAttoAlphAmount(BigInt(nftDeposit))}
                </td>
              </tr>
              <tr className="bg-black">
                <td className="whitespace-nowrap text-sm font-medium text-white">Gas</td>
                <td className="text-sm text-white whitespace-nowrap">
                  {prettifyExactAmount(BigInt(gasAmount), 18)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
