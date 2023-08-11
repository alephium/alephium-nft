import { useRouter } from 'next/router'
import { useWallet } from '@alephium/web3-react'
import { fetchNFTByPage, fetchNFTCollectionMetadata, NFTCollectionMetadata, NFTPublicSaleCollectionMetadata } from '../../shared/nft-collection'
import { Button, Loader, NFTCard } from '../components'
import Image from 'next/image';
import images from '../assets';
import { shortenAddress } from '../services/utils';
import { useEffect, useState } from 'react';
import { getDefaultExplorerUrl, getDefaultNodeUrl } from '../../shared/configs';
import { ExplorerProvider, NodeProvider, prettifyAttoAlphAmount } from '@alephium/web3';
import { NFTCollectionHelper } from '../../shared/nft-collection';
import { waitTxConfirmed } from '../../shared';
import LoaderWithText from '../components/LoaderWithText';
import { InfiniteScroll } from "../components/InfiniteScroll";
import { NFTSkeletonLoader } from '../components/NFTCard';
import { NFT } from '../../shared/nft';

const MintBatch = ({ collectionMetadata }: { collectionMetadata: NFTPublicSaleCollectionMetadata }) => {
  const wallet = useWallet()
  const router = useRouter()
  const [isMinting, setIsMinting] = useState<boolean>(false)
  const [batchSize, setBatchSize] = useState(1)
  const minBatchSize = 1
  const remain = Number(collectionMetadata.maxSupply! - collectionMetadata.totalSupply!)
  const maxBatchSize = collectionMetadata.maxBatchMintSize! > remain ? remain : collectionMetadata.maxBatchMintSize!

  const updateValue = (newValue: number) => {
    if (newValue >= minBatchSize && newValue <= maxBatchSize) {
      setBatchSize(newValue)
    }
  }

  const decrementValue = () => {
    updateValue(batchSize - 1)
  }

  const incrementValue = () => {
    updateValue(batchSize + 1)
  }

  const mintBatch = async () => {
    try {
      if (wallet?.signer?.nodeProvider && wallet.account && collectionMetadata) {
        const nftCollection = new NFTCollectionHelper(wallet.signer)
        setIsMinting(true)
        const result = await nftCollection.mintBatchSequential(BigInt(batchSize), collectionMetadata.mintPrice!, collectionMetadata.id)
        await waitTxConfirmed(wallet.signer.nodeProvider, result.txId)
        setIsMinting(false)
        router.push('/my-nfts')
      }
    } catch (error) {
      setIsMinting(false)
      console.error(`failed to mint batch, error: ${error}`)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="font-poppins dark:text-white text-nft-black-1 font-medium text-base mb-2">Public Sale</div>
      <div className="text-sm font-light mt-1">{prettifyAttoAlphAmount(collectionMetadata.mintPrice!)} ALPH</div>
      <div className="flex flex-row border-box ">
        <div className="flex items-center mt-2 h-10">
          <button
            className="bg-gray-300 text-gray-600 hover:text-gray-700 hover:bg-gray-400 h-full w-8 rounded-l cursor-pointer"
            onClick={decrementValue}
            disabled={batchSize <= minBatchSize}
          >
            <span className="m-auto text-2xl font-thin">-</span>
          </button>
          <input
            readOnly
            className="outline-none text-center bg-gray-300 font-semibold h-full w-16 md:text-basecursor-default text-gray-700"
            value={batchSize}>
          </input>
          <button
            className="bg-gray-300 text-gray-600 hover:text-gray-700 hover:bg-gray-400 h-full w-8 rounded-r cursor-pointer"
            onClick={incrementValue}
            disabled={batchSize >= maxBatchSize}
          >
            <span className="m-auto text-2xl font-thin">+</span>
          </button>
          <Button
            btnName={"Mint"}
            classStyles="mr-5 ml-5 sm:mr-0 sm:mb-5 rounded-xl h-10"
            handleClick={mintBatch}
            disabled={remain === 0}
          />
        </div>
      </div>
      {isMinting ? (<LoaderWithText text={`Sign and mint NFT...`} />) : null}
    </div>
  );
};

export default function CollectionDetails() {
  const wallet = useWallet()
  const router = useRouter()
  const { collectionId } = router.query
  const [isMetadataLoading, setIsMetadataLoading] = useState<boolean>(false)
  const [collectionMetadata, setCollectionMetadata] = useState<NFTCollectionMetadata | undefined>()
  const [nfts, setNFTs] = useState<(NFT | undefined)[]>([])
  const [isNFTsLoading, setIsNFTsLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [page, setPage] = useState<number>(0)
  const pageSize = 20

  useEffect(() => {
    const nodeProvider = wallet?.signer?.nodeProvider || new NodeProvider(getDefaultNodeUrl())

    if (collectionId) {
      setIsMetadataLoading(true)
      fetchNFTCollectionMetadata(nodeProvider, collectionId as string)
        .then((result) => {
          setIsMetadataLoading(false)
          setCollectionMetadata(result)
        })
        .catch((error) => {
          setIsMetadataLoading(false)
          console.error(`failed to loading collection metadata, collection id: ${collectionId}, error: ${error}`)
        })
    }
  }, [collectionId])

  useEffect(() => {
    if (collectionMetadata === undefined) return

    const nodeProvider = wallet?.signer?.nodeProvider || new NodeProvider(getDefaultNodeUrl())
    const explorerProvider = wallet?.signer?.explorerProvider || new ExplorerProvider(getDefaultExplorerUrl())

    let cancelled = false
    setIsNFTsLoading(true)
    setNFTs(prev => {
      const maxSupply = collectionMetadata.collectionType === 'NFTOpenCollection' ? Number(collectionMetadata.totalSupply) : Number(collectionMetadata.maxSupply!)
      const remainCount = maxSupply - prev.length
      const fetchCount = remainCount > pageSize ? pageSize : remainCount
      return [...prev, ...Array(fetchCount).fill(undefined)]
    })
    fetchNFTByPage(nodeProvider, explorerProvider, collectionMetadata, page, pageSize)
      .then((nfts) => {
        if (!cancelled) {
          setHasMore(nfts.length === pageSize)
          setIsNFTsLoading(false)
          setNFTs(prev => [...prev.filter((v) => v !== undefined), ...nfts])
        }
      })
      .catch((err) => {
        if (!cancelled) setIsNFTsLoading(false)
        console.error(`failed to load nft listings, error: ${err}`)
      })
    return () => {
      cancelled = true
    }
  }, [page, collectionMetadata, wallet])

  if (!collectionId) return (<h1 className="px-20 py-10 text-3xl">No collection</h1>)

  if (isMetadataLoading) {
    return (
      <div className="flexStart min-h-screen">
        <Loader />
      </div>
    );
  }

  const onNextPage = () => {
    setPage(prevPage => prevPage + 1)
  }

  const displayNFTs = (listings: (NFT | undefined)[]) => {
    return listings.map((nft, index) => {
      return nft === undefined ? (<NFTSkeletonLoader key={index} />) : (<NFTCard key={index} nft={nft} />)
    })
  }

  return (
    <>
      {
        collectionMetadata && (
          <div className="relative flex flex-col w-full">
            <div className="relative flex justify-center md:flex-col">
              <div className="relative flex-1 flexTop sm:px-4 p-12 border-r md:border-r-0 md:border-b dark:border-nft-black-1 border-nft-gray-1">
                <div className="relative sm:w-full sm:h-300 w-3/4 h-557 mx-auto">
                  <Image src={collectionMetadata.image} objectFit="cover" className="rounded-xl shadow-lg" layout="fill" />
                </div>
              </div>
              <div className="flex-1 justify-start sm:px-4 p-12 sm:pb-4">
                <div className="flex flex-row sm:flex-col">
                  <h2 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-3xl">{collectionMetadata.name}</h2>
                </div>

                <div className="mt-10">
                  <p className="font-poppins dark:text-white text-nft-black-1 text-xs minlg:text-base font-normal">Owner</p>
                  <div className="flex flex-row items-center mt-3">
                    <div className="relative w-12 h-12 minlg:w-20 minlg:h-20 mr-2">
                      <Image src={images.creator1} objectFit="cover" className="rounded-full" />
                    </div>
                    <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-lg font-semibold">
                      {shortenAddress(collectionMetadata.owner)}
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex flex-col">
                  <div className="w-full border-b dark:border-nft-black-1 border-nft-gray-1 flex flex-row">
                    <p className="font-poppins dark:text-white text-nft-black-1 font-medium text-base mb-2">Details</p>
                  </div>
                  <div className="mt-3">
                    <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base">
                      {collectionMetadata.description}
                    </p>
                  </div>
                </div>
                <div className="mt-10 flex flex-wrap">
                  <div className="w-full border-b dark:border-nft-black-1 border-nft-gray-1 flex flex-row">
                    <p className="font-poppins dark:text-white text-nft-black-1 font-medium text-base mb-2">
                      {collectionMetadata.collectionType === 'NFTPublicSaleCollection' ? `Minted NFTs ${collectionMetadata.totalSupply}; Max Supply ${collectionMetadata.maxSupply}` : `Minted NFTs ${collectionMetadata.totalSupply}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col mt-10">
                  {
                    collectionMetadata.collectionType === 'NFTOpenCollection' ? (
                      (wallet?.account?.address != collectionMetadata.owner) ? (
                        <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base border border-gray p-2">
                          Only collection owner can mint NFT
                        </p>
                      ) : (
                        <Button
                          btnName={"Mint More"}
                          classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                          handleClick={() => router.push(`/mint-nft?collectionId=${collectionMetadata.id}`)}
                        />
                      )
                    ) : collectionMetadata.collectionType === 'NFTPublicSaleCollection' ? (
                      <MintBatch collectionMetadata={collectionMetadata} />
                    ) : null
                  }
                </div>
              </div>
            </div>

            <InfiniteScroll onNextPage={onNextPage} hasMore={hasMore} isLoading={isNFTsLoading}>
              {({ bottomSentinelRef }) => {
                return <>
                  <div className="grid-container sm:px-4 p-12">
                    {displayNFTs(nfts)}
                  </div>
                  <div ref={bottomSentinelRef}></div>
                </>
              }}
            </InfiniteScroll>
          </div>
        )
      }
    </>
  )
}