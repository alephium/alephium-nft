import Image, { StaticImageData } from 'next/image';
import images from '../assets';
import { Loader, NFTCard, SearchBar, withTransition, CreatorCard } from '../components';
import { NFTListing, fetchNFTListings } from '../components/NFTListing';
import { NodeProvider, prettifyAttoAlphAmount } from '@alephium/web3';
import { defaultNodeUrl } from '../configs/nft'
import { marketplaceContractAddress } from '../configs/nft'
import { shortenAddress } from '../utils/shortenAddress';
import { useAlephiumConnectContext } from '@alephium/web3-react';
import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { useTheme } from 'next-themes';

const Home = () => {
  const context = useAlephiumConnectContext()
  const [hideButtons, setHideButtons] = useState(false);
  const [nfts, setNfts] = useState<NFTListing[]>([]);
  const [activeSelect, setActiveSelect] = useState<string>('Recently Added');
  const { theme } = useTheme();
  const [nftListings, setNftListing] = useState<NFTListing[]>([])
  const [originNftListings, setOriginNftListing] = useState<NFTListing[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const parentRef: MutableRefObject<any> = useRef(null);
  const scrollRef: MutableRefObject<any> = useRef(null);

  useEffect(() => {
    const nodeProvider = context.signerProvider?.nodeProvider || new NodeProvider(defaultNodeUrl)
    setIsLoading(true)
    fetchNFTListings(marketplaceContractAddress, nodeProvider).then((listings) => {
      setNftListing(listings)
      setIsLoading(false)
      setOriginNftListing(listings)
    })

  }, [context.signerProvider]);

  useEffect(() => {
    const nftListingsCopy = [...nftListings]
    switch (activeSelect) {
      case 'Price (low to high)':
        setNfts(nftListingsCopy.sort((a, b) => Number(a.price - b.price)));
        break;
      case 'Price (high to low)':
        setNfts(nftListingsCopy.sort((a, b) => Number(b.price - a.price)));
        break;
      case 'Recently Added':
        setNfts(originNftListings);
        break;
    }

  }, [activeSelect, nftListings, originNftListings])

  const onHandleSearch = (value: string) => {
    const filteredNfts = nftListings.filter(({ name }) => name.toLowerCase().includes(value.toLowerCase()));
    if (filteredNfts.length) {
      setNfts(filteredNfts);
    } else {
      setNfts([]);
    }
  };

  const onClearSearch = () => {
    setNfts(nftListings);
  };

  const handleScroll = (direction: string) => {
    const { current } = scrollRef;

    const scrollAmount = window.innerWidth > 1800 ? 270 : 210;

    if (direction === 'left') {
      current.scrollLeft -= scrollAmount;
    } else {
      current.scrollLeft += scrollAmount;
    }
  };

  const isScrollable = () => {
    const { current } = scrollRef;
    const { current: parent } = parentRef;

    if (current?.scrollWidth >= parent?.offsetWidth) {
      setHideButtons(false);
    } else {
      setHideButtons(true);
    }
  };

  useEffect(() => {
    isScrollable();

    window.addEventListener('resize', isScrollable);

    return () => {
      window.removeEventListener('resize', isScrollable);
    };
  });

  const topSellers: { [key: string]: bigint } = nftListings.reduce((topCreatorObj, listing) => {
    if (topCreatorObj[listing.tokenOwner]) {
      topCreatorObj[listing.tokenOwner] = topCreatorObj[listing.tokenOwner] + listing.price
    } else {
      topCreatorObj[listing.tokenOwner] = listing.price
    }

    return topCreatorObj
  }, {} as { [key: string]: bigint })

  const rankedTopNineSellers = Object.entries(topSellers).map((creator) => {
    return ({ address: creator[0], sum: creator[1] })
  }).sort((a, b) => Number(b.sum - a.sum)).slice(0, 9)

  if (!context || isLoading) {
    return (
      <div className="flexStart min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!isLoading && !nftListings.length) {
    return (
      <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">
        The marketplace is empty.
      </h1>
    )
  }

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-full minmd:w-4/5">
        {
          <>
            <div>
              <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">
                ⭐ Top Sellers
              </h1>
              <div className="relative flex-1 max-w-full flex mt-3" ref={parentRef}>
                <div className="flex flex-row w-max overflow-x-scroll no-scrollbar select-none" ref={scrollRef}>
                  {rankedTopNineSellers.map((seller, i) => (
                    <CreatorCard
                      key={seller.address}
                      rank={`${i + 1}`}
                      creatorImage={(images as { [key: string]: StaticImageData })[`creator${i + 1}`]}
                      creatorName={shortenAddress(seller.address)}
                      creatorAlphs={prettifyAttoAlphAmount(seller.sum) || ''}
                    />
                  ))}
                  {!hideButtons && (
                    <>
                      <div onClick={() => handleScroll('left')} className="absolute w-8 h-8 minlg:w-12 minlg:h-12 top-45 cursor-pointer left-0">
                        <Image
                          src={images.left}
                          layout="fill"
                          objectFit="contain"
                          alt="left_arrow"
                          className={theme === 'light' ? 'filter invert' : ''}
                        />
                      </div>
                      <div onClick={() => handleScroll('right')} className="absolute w-8 h-8 minlg:w-12 minlg:h-12 top-45 cursor-pointer right-0">
                        <Image
                          src={images.right}
                          layout="fill"
                          objectFit="contain"
                          alt="right_arrow"
                          className={theme === 'light' ? 'filter invert' : ''}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="flexBetween mx-4 xs:mx-0 minlg:mx-8 sm:flex-col sm:items-start">
                <h1 className="flex-1 font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold sm:mb-4">❇️  Hot NFTs</h1>
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
        }
      </div>
    </div>
  );
};

export default withTransition(Home);
