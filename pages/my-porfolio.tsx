import { addressFromContractId, node, ONE_ALPH } from '@alephium/web3'
import { useState } from 'react'
import { NFTMarketplace } from '../utils/nft-marketplace'
import { marketplaceContractId } from '../configs/nft'
import TxStatusAlert, { useTxStatusStates } from './tx-status-alert'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import { NFT } from '../components/nft'
import { useCollections } from '../components/nft-collection'
import Link from 'next/link'
import { NFTCard } from '../components/nft-card'

export default function Home() {
  const [nftBeingSold, setNFTBeingSold] = useState<NFT | undefined>(undefined)
  const [nftSellingPrice, setNFTSellingPrice] = useState<number | undefined>(undefined)
  const context = useAlephiumConnectContext()
  const [showSetPriceModal, setShowSetPriceModal] = useState(false);
  const minimumNFTPrice = 0.0001 // ALPH

  const [
    ongoingTxId,
    setOngoingTxId,
    ongoingTxDescription,
    setOngoingTxDescription,
    txStatusCallback,
    setTxStatusCallback,
    resetTxStatus
  ] = useTxStatusStates()

  const { nftCollections, isLoading } = useCollections(context.signerProvider, context.account)

  function resetState() {
    resetTxStatus()
    setNFTBeingSold(undefined)
    setNFTSellingPrice(undefined)
  }

  function getNFTMarketplace(): NFTMarketplace | undefined {
    if (context.signerProvider) {
      return new NFTMarketplace(context.signerProvider)
    }
  }

  async function sellNFT(nft: NFT, price: number) {
    setShowSetPriceModal(false)

    const nftMarketplace = getNFTMarketplace()
    if (!!nftMarketplace) {
      const priceInSets = BigInt(price) * ONE_ALPH
      const listNFTTxResult = await nftMarketplace.listNFT(nft.tokenId, priceInSets, marketplaceContractId)

      setOngoingTxId(listNFTTxResult.txId)
      setOngoingTxDescription('listing NFT')
      setTxStatusCallback(() => async (txStatus: node.TxStatus) => {
        if (txStatus.type === 'Confirmed') {
          resetState()
        } else if (txStatus.type === 'TxNotFound') {
          resetState()
          console.error('List NFT transaction not found')
        }
      })
    }
  }

  function sellingNFT(nft: NFT) {
    setNFTBeingSold(nft)
    setShowSetPriceModal(true)
  }

  function cancelSellingNFT() {
    setShowSetPriceModal(false)
    resetState()
  }

  if (isLoading) return (<h1 className="px-20 py-10 text-3xl">Loading...</h1>)
  if (nftCollections.length === 0) return (<h1 className="px-20 py-10 text-3xl">I have no NFTs</h1>)
  return (
    <>
      {
        ongoingTxId ? <TxStatusAlert txId={ongoingTxId} description={ongoingTxDescription} txStatusCallback={txStatusCallback} /> : undefined
      }

      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: '1600px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-1">
            {
              nftCollections.flatMap((nftCollection) => nftCollection.nfts).map((nft, i) => {
                return (
                  <NFTCard
                    tokenInfo={{
                      name: nft.name,
                      token_id: nft.tokenId,
                      owner_of: context.account?.address,
                      description: nft.description,
                      collection_id: nft.collectionId,
                      token_address: addressFromContractId(nft.tokenId),
                      metadata: `{"image": "${nft.image}"}`
                    }}
                    width='300px'
                  >
                  </NFTCard>
                )
              })
            }
          </div>
          {
            showSetPriceModal && nftBeingSold ? (
              <>
                <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50">
                  <div className="relative w-auto my-6 mx-auto max-w-3xl">
                    <div className="rounded-lg shadow-lg relative flex flex-col w-full bg-white">
                      <form className="bg-black shadow-md rounded px-10 pt-6 pb-8 w-full">
                        <label className="block text-white text-sm font-bold mb-1">
                          Price (ALPH)
                        </label>
                        <input
                          type="number"
                          min="0"
                          onChange={e => setNFTSellingPrice(+e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-1 text-black"
                        />
                      </form>
                      <div className="flex bg-white items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                        <button
                          className="mt-4 bg-gray-500 text-white font-bold py-1 m-2 w-32 rounded"
                          type="button"
                          onClick={() => cancelSellingNFT()}
                        >
                          Cancel
                        </button>
                        {
                          (nftSellingPrice && (nftSellingPrice > minimumNFTPrice)) ?
                            <button
                              className="mt-4 bg-pink-500 text-white font-bold py-1 m-2 w-32 rounded"
                              type="button"
                              onClick={() => sellNFT(nftBeingSold, nftSellingPrice)}
                            >
                              Submit
                            </button> :
                            <button
                              className="mt-4 bg-pink-500 text-white font-bold py-1 m-2 w-32 rounded"
                              type="button"
                              disabled
                            >
                              Submit
                            </button>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null
          }
        </div>
      </div>
    </>
  )
}