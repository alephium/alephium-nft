import { useContext, useEffect, useState } from 'react'
import * as web3 from '@alephium/web3'
import { addressFromContractId, binToHex, contractIdFromAddress, hexToString, SignerProvider } from '@alephium/web3'
import { NFTMarketplace } from '../utils/nft-marketplace'
import addresses from '../configs/addresses.json'
import { NFTListingContract, NFTContract, NFTMarketplaceContract, fetchState } from '../utils/contracts'
import axios from 'axios'
import { AlephiumWeb3Context } from './alephium-web3-providers'
import TxStatusAlert, { useTxStatus } from './tx-status-alert'
import { useRouter } from 'next/router'
import { ContractEvent } from '@alephium/web3/dist/src/api/api-alephium'
import { convertAlphToSet, formatAmountForDisplay } from '@alephium/sdk'

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
  const context = useContext(AlephiumWeb3Context)
  const router = useRouter()

  const [
    ongoingTxId,
    setOngoingTxId,
    ongoingTxDescription,
    setOngoingTxDescription,
    txStatusCallback,
    setTxStatusCallback,
    resetTxStatus
  ] = useTxStatus()

  useEffect(() => {
    loadListedNFTs()
    loadMarketplaceCommissionRate()
  }, [context.selectedAccount, context.nodeProvider])

  async function loadMarketplaceCommissionRate() {
    if (context.nodeProvider) {
      try {
        const marketplaceState = await fetchState(
          context.nodeProvider,
          NFTMarketplaceContract,
          addressFromContractId(addresses.marketplaceContractId),
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

    if (context.nodeProvider) {
      var listingState = undefined

      try {
        listingState = await fetchState(
          context.nodeProvider,
          NFTListingContract,
          addressFromContractId(listingContractId),
          0
        )
      } catch (e) {
        console.log(`error fetching state for ${tokenId}`, e)
      }

      if (listingState && listingState.codeHash === NFTListingContract.codeHash) {
        const nftState = await fetchState(
          context.nodeProvider,
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

    if (context.nodeProvider && context.signerProvider && context.selectedAccount) {
      const nftMarketplace = new NFTMarketplace(
        context.nodeProvider,
        context.signerProvider.provider as web3.SignerProvider
      )

      const marketplaceContractAddress = addressFromContractId(addresses.marketplaceContractId)
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
    if (context.nodeProvider && context.signerProvider?.provider && context.selectedAccount && commissionRate) {
      const nftMarketplace = new NFTMarketplace(
        context.nodeProvider,
        context.signerProvider.provider
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
        context.nodeProvider,
        context.signerProvider,
        context.selectedAccount,
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
                    <p className="text-2xl font-bold text-white">{formatAmountForDisplay(nftListing.price)} ALPH </p>
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
  const nftDeposit = convertAlphToSet("1")
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
                  Total amount ≈ {formatAmountForDisplay(totalAmount)} ALPH
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-black">
                <td className="whitespace-nowrap text-sm font-medium text-white">NFT Price</td>
                <td className="text-sm text-white whitespace-nowrap">
                  {formatAmountForDisplay(BigInt(nftPrice))}
                </td>
              </tr>
              <tr className="bg-black">
                <td className="whitespace-nowrap text-sm font-medium text-white">Commission</td>
                <td className="text-sm text-white whitespace-nowrap">
                  {formatAmountForDisplay(BigInt(commission))}
                </td>
              </tr>
              <tr className="bg-black">
                <td className="whitespace-nowrap text-sm font-medium text-white">NFT Contract Deposit</td>
                <td className="text-sm text-white whitespace-nowrap">
                  {formatAmountForDisplay(BigInt(nftDeposit))}
                </td>
              </tr>
              <tr className="bg-black">
                <td className="whitespace-nowrap text-sm font-medium text-white">Gas</td>
                <td className="text-sm text-white whitespace-nowrap">
                  {formatAmountForDisplay(BigInt(gasAmount), true)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
