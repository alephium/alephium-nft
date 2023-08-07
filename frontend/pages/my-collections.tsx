import Image from 'next/image';
import withTransition from '../components/withTransition';
import { ConnectToWalletBanner } from '../components/ConnectToWalletBanner';
import { Loader, Banner } from '../components';
import { addressToCreatorImage, shortenAddress } from '../services/utils';
import { useAlephiumConnectContext } from '@alephium/web3-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { shortenName } from '../services/utils';
import { backendUrl } from '../../configs/nft';
import { NFTCollectionMetadata, fetchNFTCollectionMetadata } from '../../shared/nft-collection';

interface NFTCollection {
  _id: string  // NFTCollection contract id
  type: 'NFTOpenCollection' | 'NFTPublicSaleCollection'
  owner: string
  name: string
  description: string
  image: string
}

const NFTCollectionCard = ({ collection }: { collection: NFTCollection }) => {
  const context = useAlephiumConnectContext()
  const [metadata, setMetadata] = useState<NFTCollectionMetadata | undefined>()
  useEffect(() => {
    (async () => {
      if (context.signerProvider
        && context.signerProvider.nodeProvider
        && context.signerProvider.explorerProvider
        && context.account?.address
      ) {
        fetchNFTCollectionMetadata(context.signerProvider.nodeProvider, collection._id)
          .then((metadata) => setMetadata(metadata))
          .catch((err) => console.error(err))
      }
    })()
  }, [context.signerProvider, context.account, collection])

  return (
    <Link href={{ pathname: '/collection-details', query: { collectionId: collection._id } }}>
      <motion.div
        whileInView={{ opacity: [0, 1] }}
        transition={{ duration: 0.5 }}
        className="dark:bg-nft-black-3 bg-white rounded-2xl cursor-pointer shadow-md hover:shadow-lg duration-500 p-4"
      >
        <div className="relative w-full h-52 sm:h-48 minmd:h-60 minlg:h-280 rounded-2xl overflow-hidden">
          <Image
            className="flex justify-center items-center hover:scale-110 transition-all duration-500"
            src={collection.image}
            layout="fill"
            objectFit="cover"
            alt={`nftCollection${collection._id}`}
          />
        </div>
        <div className="mt-3 flex flex-col">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xs minlg:text-xl">
            {collection.name.length > 14 ? shortenName(collection.name) : collection.name}
          </p>
          {metadata !== undefined
            ? (<p className="font-poppins dark:text-white text-nft-black-1 text-xs minlg:text-lg">Total supply {metadata.totalSupply.toString()}</p>)
            : null
          }
        </div>
      </motion.div>
    </Link>
  )
}

const MyCollections = () => {
  const context = useAlephiumConnectContext()

  const [collections, setCollections] = useState<NFTCollection[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    (async () => {
      if (context.signerProvider
        && context.signerProvider.nodeProvider
        && context.signerProvider.explorerProvider
        && context.account?.address
      ) {
        setIsLoading(true)
        const result = await axios.get(`${backendUrl}/api/nft-collections-by-owner/${context.account.address}`)
        setCollections(result.data)
        setIsLoading(false)
      }
    })()
  }, [context.signerProvider, context.account]);

  if (!context.account) {
    return (
      <ConnectToWalletBanner />
    );
  }

  if (isLoading) {
    return (
      <div className="flexStart min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full flex justify-start items-center flex-col min-h-screen">
      <div className="w-full flexCenter flex-col">
        <Banner
          name="Your creative collections section."
          childStyles="text-center mb-4"
          parentStyles="h-80 justify-center"
        />

        <div className="flexCenter flex-col -mt-20 z-0">
          <div className="flexCenter w-40 h-40 sm:w-36 sm:h-36 p-1 dark:bg-nft-black-4 bg-white rounded-full">
            <Image
              src={addressToCreatorImage(context.account.address)}
              className="rounded-full object-cover"
              objectFit="cover"
            />
          </div>
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl mt-6">{shortenAddress(context.account.address)}</p>
        </div>
      </div>

      {!isLoading && !collections.length ? (
        <div className="flexCenter sm:p-4 p-16">
          <h1 className="font-poppins dark:text-white text-nft-black-1 font-extrabold text-3xl">No Collections Owned!</h1>
        </div>
      ) : (
        <div className="sm:px-4 p-12 w-full ml-32 mr-32 md:ml-20 md:mr-20 sm:ml-10 sm:mr-10 mt-3">
          <div className="grid-container">
            {collections.map((collection) => (
              <NFTCollectionCard key={collection._id} collection={collection} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default withTransition(MyCollections);