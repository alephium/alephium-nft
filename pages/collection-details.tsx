import { useRouter } from 'next/router'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import { fetchNFTCollection, NFTCollection } from '../components/NFTCollection'
import { Button, Loader, NFTCard } from '../components'
import Image from 'next/image';
import images from '../assets';
import { shortenAddress } from '../utils/address';
import { useEffect, useState } from 'react';
import { defaultExplorerUrl, defaultNodeUrl } from '../configs/nft';
import { ExplorerProvider, NodeProvider, prettifyAttoAlphAmount, web3 } from '@alephium/web3';
import { NFTCollection as NFTCollectionHelper } from '../utils/nft-collection';
import { waitTxConfirmed } from '../utils';
import LoaderWithText from '../components/LoaderWithText';

const MintBatch = ({ collection } : { collection: NFTCollection}) => {
  const context = useAlephiumConnectContext()
  const router = useRouter()
  const [isMinting, setIsMinting] = useState<boolean>(false)
  const [batchSize, setBatchSize] = useState(1)
  const minBatchSize = 1
  const maxBatchSize = collection.maxBatchMintSize!

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
      if (context.signerProvider?.nodeProvider && context.account && collection) {
        const nftCollection = new NFTCollectionHelper(context.signerProvider)
        setIsMinting(true)
        const result = await nftCollection.mintBatchSequential(BigInt(batchSize), collection.mintPrice!, collection.id)
        await waitTxConfirmed(context.signerProvider.nodeProvider, result.txId)
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
      <div className="text-sm font-light mt-1">{prettifyAttoAlphAmount(collection.mintPrice!)} ALPH</div>
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
          />
        </div>
      </div>
      {isMinting ? (<LoaderWithText text={`Sign and mint NFT...`} />) : null}
    </div>
  );
};

export default function CollectionDetails() {
  const context = useAlephiumConnectContext()
  const router = useRouter()
  const { collectionId } = router.query
  const [isNFTCollectionLoading, setIsNFTCollectionLoading] = useState<boolean>(false)
  const [collection, setCollection] = useState<NFTCollection | undefined>(undefined)

  useEffect(() => {
    const nodeProvider = context.signerProvider?.nodeProvider || new NodeProvider(defaultNodeUrl)
    const explorerProvider = context.signerProvider?.explorerProvider || new ExplorerProvider(defaultExplorerUrl)
    web3.setCurrentNodeProvider(nodeProvider)
    web3.setCurrentExplorerProvider(explorerProvider)

    if (collectionId) {
      setIsNFTCollectionLoading(true)
      fetchNFTCollection(collectionId as string).then((result) => {
        setIsNFTCollectionLoading(false)
        setCollection(result)
      })
    }
  }, [collectionId])

  if (!collectionId) return (<h1 className="px-20 py-10 text-3xl">No collection</h1>)

  if (isNFTCollectionLoading) {
    return (
      <div className="flexStart min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <>
      {
        collection && (
          <div className="relative flex flex-col w-full">
            <div className="relative flex justify-center md:flex-col">
              <div className="relative flex-1 flexTop sm:px-4 p-12 border-r md:border-r-0 md:border-b dark:border-nft-black-1 border-nft-gray-1">
                <div className="relative sm:w-full sm:h-300 w-full h-557">
                  <Image src={collection.image} objectFit="cover" className="rounded-xl shadow-lg" layout="fill" />
                </div>
              </div>
              <div className="flex-1 justify-start sm:px-4 p-12 sm:pb-4">
                <div className="flex flex-row sm:flex-col">
                  <h2 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-3xl">{collection.name}</h2>
                </div>

                <div className="mt-10">
                  <p className="font-poppins dark:text-white text-nft-black-1 text-xs minlg:text-base font-normal">Owner</p>
                  <div className="flex flex-row items-center mt-3">
                    <div className="relative w-12 h-12 minlg:w-20 minlg:h-20 mr-2">
                      <Image src={images.creator1} objectFit="cover" className="rounded-full" />
                    </div>
                    <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-lg font-semibold">
                      {shortenAddress(collection.owner)}
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex flex-col">
                  <div className="w-full border-b dark:border-nft-black-1 border-nft-gray-1 flex flex-row">
                    <p className="font-poppins dark:text-white text-nft-black-1 font-medium text-base mb-2">Details</p>
                  </div>
                  <div className="mt-3">
                    <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base">
                      {collection.description}
                    </p>
                  </div>
                </div>
                <div className="mt-10 flex flex-wrap">
                  <div className="w-full border-b dark:border-nft-black-1 border-nft-gray-1 flex flex-row">
                    <p className="font-poppins dark:text-white text-nft-black-1 font-medium text-base mb-2">
                      {collection.maxSupply ? `Minted NFTs ${collection.totalSupply}; Max Supply ${collection.maxSupply}` : `Minted NFTs ${collection.totalSupply}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col mt-10">
                  {
                    collection.collectionType === 'NFTOpenCollection' ? (
                      (context.account?.address != collection.owner) ? (
                        <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base border border-gray p-2">
                          Only collection owner can mint NFT
                        </p>
                      ) : (
                        <Button
                          btnName={"Mint More"}
                          classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                          handleClick={() => router.push(`/mint-nft?collectionId=${collection.id}`)}
                        />
                      )
                    ) : (<MintBatch collection={collection}/>)
                  }
                </div>
              </div>
            </div>

            <div className="grid-container sm:px-4 p-12">
              {collection.nfts.map((nft, i) => <NFTCard key={i} nft={nft}/>)}
            </div>
          </div>
        )
      }
    </>
  )
}