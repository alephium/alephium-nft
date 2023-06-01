import Image from 'next/image';

import withTransition from '../components/withTransition';

import { Loader, NFTCard, Banner } from '../components';
import images from '../assets';
import { shortenAddress } from '../utils/shortenAddress';
import { useAlephiumConnectContext } from '@alephium/web3-react';
import { useCollections } from '../components/nft-collection';

const MyNFTs = () => {
  const context = useAlephiumConnectContext()

  const { nftCollections, isLoading } = useCollections(context.signerProvider, context.account)

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
          name="Your creative NFT's section."
          childStyles="text-center mb-4"
          parentStyles="h-80 justify-center"

        />

        <div className="flexCenter flex-col -mt-20 z-0">
          <div className="flexCenter w-40 h-40 sm:w-36 sm:h-36 p-1 dark:bg-nft-black-4 bg-white rounded-full">
            <Image
              src={images.creator1}
              className="rounded-full object-cover"
              objectFit="cover"
            />
          </div>
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl mt-6">{shortenAddress(context.account?.address)}</p>
        </div>
      </div>

      {!isLoading && !nftCollections.length ? (
        <div className="flexCenter sm:p-4 p-16">
          <h1 className="font-poppins dark:text-white text-nft-black-1 font-extrabold text-3xl">No NFTs Owned!</h1>
        </div>
      ) : (
        <div className="sm:px-4 p-12 w-full minmd:w-4/5 flexCenter flex-col">
          <div className="mt-3 w-full flex flex-wrap">
            {nftCollections.flatMap((nftCollection) => {
              return nftCollection.nfts.map((nft) => {
                return (
                  <NFTCard
                    key={nft.tokenId}
                    nft={{ tokenOwner: context.account?.address || '', ...nft }}
                  />
                )
              })
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default withTransition(MyNFTs);
