import Image from 'next/image';
import images from '../assets';
import { NFTCard, SearchBar, withTransition, CreatorCard } from '../components';
import { NFTListing, fetchNFTListings } from '../components/NFTListing';
import { prettifyAttoAlphAmount } from '@alephium/web3';
import { addressToCreatorImage, shortenAddress } from '../utils/address';
import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { useTheme } from 'next-themes';
import LoaderWithText from '../components/LoaderWithText';
import axios from "axios"
import ReactPaginate from 'react-paginate';

const Home = () => {
  const [hideButtons, setHideButtons] = useState(false);
  const [activeSelect, setActiveSelect] = useState<string>('Recently Listed');
  const [searchText, setSearchText] = useState<string>('')
  const { theme } = useTheme();
  const [nftListings, setNftListing] = useState<NFTListing[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [topSellers, setTopSellers] = useState<{ address: string, totalAmount: string }[]>([])
  const [page, setPage] = useState<number>(0)
  const [pageCount, setPageCount] = useState<number | undefined>(undefined)
  const pageSize = 20

  const parentRef: MutableRefObject<any> = useRef(null);
  const scrollRef: MutableRefObject<any> = useRef(null);

  async function loadNFTListings(
    address?: string,
    priceOrder?: string,
    searchText?: string,
    page?: number
  ) {
    setIsLoading(true)
    const totalResult = await axios.get(`api/nft-listings-count?search=${searchText}`)
    setPageCount(Math.ceil(totalResult.data.total / pageSize))

    const listings = await fetchNFTListings(
      address,
      priceOrder,
      searchText,
      page,
      pageSize
    )
    setIsLoading(false)
    setNftListing(listings)
  }

  async function loadTopSellers() {
    const result = await axios.get('api/top-sellers')
    const sellers = result.data.map((seller: any) => {
      return { address: seller._id, totalAmount: seller.totalAmount['$numberDecimal'] }
    })

    setTopSellers(sellers)
  }

  useEffect(() => {
    loadTopSellers()
    loadNFTListings(undefined, toPriceOrder(activeSelect), searchText, page)
  }, [activeSelect, searchText, page])

  const onHandleSearch = (value: string) => {
    setSearchText(value)
    loadNFTListings(undefined, toPriceOrder(activeSelect), value, page)
  };

  const onClearSearch = () => {
    setSearchText('')
    loadNFTListings(undefined, toPriceOrder(activeSelect), '', page)
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

  const handleOnClick = (event: any) => {
    if (event.nextSelectedPage !== undefined) {
      setPage(event.nextSelectedPage)
      loadNFTListings(undefined, toPriceOrder(activeSelect), searchText, event.nextSelectedPage)
    }
  };

  return (
    <div className="flex justify-center p-12">
      <div className="w-full ml-32 mr-32 md:ml-20 md:mr-20 sm:ml-10 sm:mr-10">
        {
          <>
            <div>
              <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">
                ⭐ Top Listers
              </h1>
              <div className="relative flex-1 max-w-full flex mt-3" ref={parentRef}>
                <div className="flex flex-row w-max overflow-x-scroll no-scrollbar select-none" ref={scrollRef}>
                  {topSellers.map((seller, i) => (
                    <CreatorCard
                      key={seller.address}
                      rank={`${i + 1}`}
                      creatorImage={addressToCreatorImage(seller.address)}
                      creatorName={shortenAddress(seller.address)}
                      creatorAlphs={prettifyAttoAlphAmount(seller.totalAmount) || ''}
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
                <h1 className="flex-1 font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold sm:mb-4">❇️  Hot Listings</h1>
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
                  <>
                    <div className="mt-3">
                      <div className="grid-container">
                        {nftListings.map((nft) => <NFTCard key={nft._id} nft={{ tokenId: nft._id, minted: true, ...nft }} />)}
                      </div>
                    </div>
                    {
                      pageCount !== 0 && < ReactPaginate
                        containerClassName={"pagination"}
                        breakLabel="..."
                        nextLabel=">"
                        previousLabel="<"
                        onClick={handleOnClick}
                        forcePage={page}
                        pageCount={pageCount!}
                      />
                    }
                  </>
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
    case 'Recently Listed':
      return undefined
  }
}

export default withTransition(Home);
