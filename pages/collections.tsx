import { useRouter } from 'next/router'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import Link from 'next/link'
import { useCollection } from '../components/nft-collection'
import NFTCollectionCard from '../components/nft-collection-card'
import { color } from '@web3uikit/styles';

export default function Collections() {
  const context = useAlephiumConnectContext()
  const router = useRouter()
  const { collectionId } = router.query

  const { collection } = useCollection(collectionId as string, context.signerProvider)

  if (!collectionId) return (<h1 className="px-20 py-10 text-3xl">No collection</h1>)

  return (
    <>
      {
        collection && (
          <>
            <NFTCollectionCard
              id={collectionId}
              name={collection.name}
              description={collection.description}
              imageUrl={collection.image}
              totalSupply={collection.totalSupply}
              detailsBorder={`2px solid ${color.mint30}`}
              width='300px'
            />
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
