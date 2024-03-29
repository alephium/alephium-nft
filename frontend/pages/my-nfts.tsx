import Image from 'next/image';
import withTransition from '../components/withTransition';
import { ConnectToWalletBanner } from '../components/ConnectToWalletBanner';
import { Loader, NFTCard, Banner } from '../components';
import { addressToCreatorImage, shortenAddress } from '../services/utils';
import { useWallet } from '@alephium/web3-react';
import { useEffect, useState } from 'react';
import { fetchNFTsByAddress } from '../components/nft';
import { NFT } from '../../shared/nft';
import { ExplorerProvider, NodeProvider, web3 } from "@alephium/web3"
import { useRouter } from 'next/router';
import { getDefaultExplorerUrl, getDefaultNodeUrl } from '../../shared/configs';
import { getExplorerProvider, getNodeProvider } from '../../shared';

const MyNFTs = () => {
  const wallet = useWallet()

  const router = useRouter();
  const [nfts, setNFTs] = useState<NFT[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { address } = router.query

  const userAddress = address as string || wallet?.account.address

  useEffect(() => {
    (async () => {
      if (userAddress) {
        setIsLoading(true)
        const nodeProvider = getNodeProvider()
        const explorerProvider = getExplorerProvider()
        web3.setCurrentNodeProvider(nodeProvider)
        web3.setCurrentExplorerProvider(explorerProvider)
        const nfts = await fetchNFTsByAddress(userAddress)
        setNFTs(nfts)
        setIsLoading(false)
      }
    })()
  }, [wallet?.signer, wallet?.account, userAddress]);

  if (!userAddress) {
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
          name="Your creative NFT's section."
          childStyles="text-center mb-4"
          parentStyles="h-80 justify-center"
        />

        <div className="flexCenter flex-col -mt-20 z-0">
          <div className="flexCenter w-40 h-40 sm:w-36 sm:h-36 p-1 dark:bg-nft-black-4 bg-white rounded-full">
            <Image
              src={addressToCreatorImage(userAddress)}
              className="rounded-full object-cover"
              objectFit="cover"
            />
          </div>
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl mt-6">{shortenAddress(userAddress)}</p>
        </div>
      </div>

      {!isLoading && !nfts.length ? (
        <div className="flexCenter sm:p-4 p-16">
          <h1 className="font-poppins dark:text-white text-nft-black-1 font-extrabold text-3xl">No NFTs Owned!</h1>
        </div>
      ) : (
        <div className="sm:px-4 p-12 w-full ml-32 mr-32 md:ml-20 md:mr-20 sm:ml-10 sm:mr-10 mt-3">
          <div className="grid-container">
            {nfts.map((nft) => (
              <NFTCard
                key={nft.tokenId}
                nft={{ tokenOwner: userAddress || '', ...nft }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default withTransition(MyNFTs);
