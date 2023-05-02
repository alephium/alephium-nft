import { useRouter } from 'next/router'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import { useCollection } from '../components/nft-collection'
import NFTCollectionCard from '../components/nft-collection-card'
import { NFTCard } from '../components/nft-card'
import { color } from '@web3uikit/styles';
import { addressFromContractId } from '@alephium/web3'

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
              id={collectionId as string}
              name={collection.name}
              description={collection.description}
              imageUrl={collection.image}
              totalSupply={collection.totalSupply}
              detailsBorder={`2px solid ${color.mint30}`}
              width='300px'
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pt-4">
              {
                collection.nfts.map((nft, i) => {
                  return (
                    <NFTCard
                      key={i}
                      tokenInfo={{
                        name: nft.name,
                        token_id: nft.tokenId,
                        owner_of: context.account?.address,
                        description: nft.description,
                        token_address: addressFromContractId(nft.tokenId),
                        metadata: `{"image": "${nft.image}"}`,
                        listed: nft.listed
                      }}
                      width='300px'
                    />
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
