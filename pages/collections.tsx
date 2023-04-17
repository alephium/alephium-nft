import { web3 } from '@alephium/web3'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import { fetchNFTCollection, NFTCollection } from '../components/nft'
import Link from 'next/link'

export default function Collections() {
  const [collection, setCollection] = useState<NFTCollection | undefined>(undefined)
  const context = useAlephiumConnectContext()
  const router = useRouter()
  const { collectionId } = router.query

  useEffect(() => {
    if (!!collectionId && context.signerProvider?.nodeProvider && context.signerProvider?.explorerProvider) {
      web3.setCurrentNodeProvider(context.signerProvider?.nodeProvider)
      web3.setCurrentExplorerProvider(context.signerProvider?.explorerProvider)
      fetchNFTCollection(collectionId as string).then((fetchedCollection) => (
        setCollection(fetchedCollection)
      ))
    }
  }, [collectionId, context.signerProvider?.nodeProvider, context.signerProvider?.explorerProvider])

  if (!collectionId) return (<h1 className="px-20 py-10 text-3xl">No collection</h1>)

  return (
    <>
      {
        collection && (
          <>
            <div className="flex justify-center">
              <table className="w-1/2 flex flex-col pb-12">
                <tbody>
                  <tr>
                    <td>
                      <img className="rounded mt-4" src={collection.image} />
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap text-sm font-medium"><b>Collection Name</b>: {collection.name}</td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap text-sm font-medium"><b>Description</b>: {collection.description}</td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap text-sm font-medium"><b>Total Supply</b>: {collection.totalSupply.toString()}</td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap text-sm font-medium">
                      <b>Already Minted</b>: {collection.totalSupply.toString().concat(',  ')}
                      <Link href={`/mint-nfts?collectionId=${collection.id}`}><a className="mr-6 text-blue-500">mint more </a></Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {
                collection.nfts.map((nft, i) => {
                  return (
                    <div key={i} className="border shadow rounded-xl overflow-hidden">
                      <div className="p-4 object-center">
                        <img src={nft.image} />
                      </div>
                      <div className="p-4">
                        <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                        <div style={{ height: '70px', overflow: 'hidden' }}>
                          <p className="text-gray-400">{nft.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </>
        )
      }
    </>
  )
}
