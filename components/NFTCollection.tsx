import useSWR from "swr"
import { NETWORK } from '../configs/nft'
import { web3, SignerProvider, Account } from "@alephium/web3"
import { fetchNFTCollectionMetadata } from "../utils/nft-collection"
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { shortenName } from '../utils';
import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "./Loader";

export interface NFTCollection {
  _id: string
  type: 'NFTOpenCollection' | 'NFTPublicSaleCollectionSequential' | 'NFTPublicSaleCollectionRandom'
  name: string
  description: string
  image: string
}

const NFTCollectionCard = ({ nftCollection }: { nftCollection: NFTCollection }) => {
  return (
    <Link href={{ pathname: '/collection-details', query: { collectionId: nftCollection._id } }}>
      <motion.div
        whileInView={{ opacity: [0, 1] }}
        transition={{ duration: 0.5 }}
        className="dark:bg-nft-black-3 bg-white rounded-2xl cursor-pointer shadow-md hover:shadow-lg duration-500 p-4"
      >
        <div className="relative w-full h-52 sm:h-48 minmd:h-60 minlg:h-280 rounded-2xl overflow-hidden">
          <Image
            className="flex justify-center items-center hover:scale-110 transition-all duration-500"
            src={nftCollection.image}
            layout="fill"
            objectFit="cover"
            alt={`nftCollection${nftCollection._id}`}
          />
        </div>
        <div className="mt-3 flex flex-col">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xs minlg:text-xl">
            {nftCollection.name.length > 14 ? shortenName(nftCollection.name) : nftCollection.name}
          </p>
        </div>
      </motion.div>
    </Link>
  )
}

export function NFTCollections() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [collections, setCollections] = useState<NFTCollection[] | undefined>()

  useEffect(() => {
    setIsLoading(true)
    axios.get('api/nft-collections')
      .then((result) => {
        setCollections(result.data)
        setIsLoading(false)
      })
      .catch((err) => {
        setIsLoading(false)
        console.error(`failed to loading collections, error: ${err}`)
      })
  }, [])

  return (
    <div className="mt-10">
      <div className="flexBetween mx-4 xs:mx-0 minlg:mx-8 sm:flex-col sm:items-start">
        <h1 className="flex-1 font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold sm:mb-4">❇️  NFT Collections</h1>
      </div>
      {collections !== undefined ? (
        <div className="grid-container mt-3">
          {collections.map((nftCollection) => <NFTCollectionCard key={nftCollection._id} nftCollection={nftCollection}/>)}
        </div>
      ) : null}
      {isLoading ? <Loader/> : null}
      {
        (!isLoading && collections !== undefined && collections.length === 0) ? (
          <div className="flex justify-center sm:px-4 p-12" >
            <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">
              No NFT Collection found
            </h1>
          </div>
        ) : null
      }
    </div>
  )
}

export const useCollectionMetadata = (
  collectionId?: string,
  signerProvider?: SignerProvider
) => {
  const { data: collectionMetadata, error, ...rest } = useSWR(
    collectionId &&
    signerProvider?.nodeProvider &&
    signerProvider?.explorerProvider &&
    [
      collectionId,
      "collection",
    ],
    async () => {
      if (!signerProvider || !signerProvider.nodeProvider || !signerProvider.explorerProvider) {
        return undefined;
      }

      web3.setCurrentNodeProvider(signerProvider.nodeProvider)
      web3.setCurrentExplorerProvider(signerProvider.explorerProvider)

      return await fetchNFTCollectionMetadata(collectionId as string)
    },
    {
      refreshInterval: 60e3 /* 1 minute */,
      suspense: true
    },
  )

  return { collectionMetadata, ...rest }
}

export const getAccountIdentifier = (account: Account) =>
  `${NETWORK}::${account.address}`
