import Image, { StaticImageData } from 'next/image';
import images from '../assets';
import { NFTCard, SearchBar, withTransition, CreatorCard } from '../components';
import { NFTListing, fetchNFTListings } from '../components/NFTListing';
import { prettifyAttoAlphAmount } from '@alephium/web3';
import { shortenAddress } from '../utils/shortenAddress';
import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { useTheme } from 'next-themes';
import LoaderWithText from '../components/LoaderWithText';

const Home = () => {
  const [hideButtons, setHideButtons] = useState(false);
  const [activeSelect, setActiveSelect] = useState<string>('Recently Added');
  const [searchText, setSearchText] = useState<string>('')
  const { theme } = useTheme();
  const [nftListings, setNftListing] = useState<NFTListing[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const parentRef: MutableRefObject<any> = useRef(null);
  const scrollRef: MutableRefObject<any> = useRef(null);

  async function loadNFTListings(
    address?: string,
    priceOrder?: string,
    searchText?: string
  ) {
    setIsLoading(true)
    const listings = await fetchNFTListings(
      address,
      priceOrder,
      searchText
    )
    setIsLoading(false)
    setNftListing(listings)
  }

  useEffect(() => {
    loadNFTListings(undefined, toPriceOrder(activeSelect), searchText)
  }, [activeSelect, setNftListing, searchText])

  const onHandleSearch = (value: string) => {
    setSearchText(value)
    loadNFTListings(undefined, toPriceOrder(activeSelect), value)
  };

  const onClearSearch = () => {
    setSearchText('')
    loadNFTListings(undefined, toPriceOrder(activeSelect), '')
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
      topCreatorObj[listing.tokenOwner] = BigInt(topCreatorObj[listing.tokenOwner]) + BigInt(listing.price)
    } else {
      topCreatorObj[listing.tokenOwner] = BigInt(listing.price)
    }

    return topCreatorObj
  }, {} as { [key: string]: bigint })

  const rankedTopNineSellers = Object.entries(topSellers).map((creator) => {
    return ({ address: creator[0], sum: creator[1] })
  }).sort((a, b) => Number(b.sum - a.sum)).slice(0, 9)

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
              {
                isLoading ? (
                  <LoaderWithText text={`Loading...`} />
                ) : (
                  <div className="mt-3 w-full flex flex-wrap justify-start md:justify-center">
                    {nftListings.map((nft) => <NFTCard key={nft._id} nft={{ tokenId: nft._id, ...nft }} />)}
                  </div>
                )
              }
              {
                (!isLoading && !nftListings.length) ? (
                  <div className="flex justify-center sm:px-4 p-12" >
                    <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">
                      No NFT Listing found
                    </h1>
                  </div>
                ) : null
              }
            </div>
          </>
        }
      </div>
    </div >
  );
};

function toPriceOrder(activeSelect: string): string | undefined {
  switch (activeSelect) {
    case 'Price (low to high)':
      return 'asc'
    case 'Price (high to low)':
      return 'desc'
    case 'Recently Added':
      return undefined
  }
}

export default withTransition(Home);
