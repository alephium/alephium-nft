import { useState, useEffect } from 'react';
import { NFTListing } from '../components/nft-listing'

import { Banner, Loader, NFTCard, SearchBar, withTransition } from '../components';

import { useNFTListings } from '../components/nft-listing';
import { useAlephiumConnectContext } from '@alephium/web3-react';

const Home = () => {
  const context = useAlephiumConnectContext()
  //const [nfts, setNfts] = useState<NFTListing[]>([]);
  const [nfts, setNfts] = useState<NFTListing[]>([]);
  const [nftsCopy, setNftsCopy] = useState<NFTListing[]>([]);
  const [activeSelect, setActiveSelect] = useState<'Price (low to high)' | 'Price (high to low)'>('Price (low to high)');
  //const [isLoading, setIsLoading] = useState(true);

  const { nftListings, isLoading } = useNFTListings(context.signerProvider)

  //setNfts(nftListings)
  //setNftsCopy(nftListings)

  //  useEffect(() => {
  //    setNfts(nftListings)
  //    setNftsCopy(nftListings)
  //  }, [nftListings]);

  //useEffect(() => {
  //  const sortedNfts = [...nftListings];
  //
  //  switch (activeSelect) {
  //    case 'Price (low to high)':
  //      setNfts(sortedNfts.sort((a, b) => Number(a.price - b.price)));
  //      break;
  //    case 'Price (high to low)':
  //      setNfts(sortedNfts.sort((a, b) => Number(b.price - a.price)));
  //      break;
  //    default:
  //      setNfts(nfts);
  //      break;
  //  }
  //}, [activeSelect, nfts]);

  const onHandleSearch = (value: string) => {
    const filteredNfts = nfts.filter(({ name }) => name.toLowerCase().includes(value.toLowerCase()));

    if (filteredNfts.length) {
      setNfts(filteredNfts);
    } else {
      setNfts(nftsCopy);
    }
  };

  const onClearSearch = () => {
    if (nfts.length && nftsCopy.length) {
      setNfts(nftsCopy);
    }
  };

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-full minmd:w-4/5">

        {!isLoading && !nfts.length ? (
          <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">The marketplace is empty.</h1>
        ) : isLoading ? <Loader /> : (
          <>
            <div className="mt-10">
              <div className="flexBetween mx-4 xs:mx-0 minlg:mx-8 sm:flex-col sm:items-start">
                <h1 className="flex-1 font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold sm:mb-4">🔥 Hot NFTs</h1>
                <div className="flex-2 sm:w-full flex flex-row sm:flex-col">
                  <SearchBar
                    activeSelect={activeSelect}
                    setActiveSelect={setActiveSelect}
                    handleSearch={onHandleSearch}
                    clearSearch={onClearSearch}
                  />
                </div>
              </div>
              <div className="mt-3 w-full flex flex-wrap justify-start md:justify-center">
                {nfts.map((nft) => <NFTCard key={nft._id} nft={{ tokenId: nft._id, ...nft }} />)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default withTransition(Home);
