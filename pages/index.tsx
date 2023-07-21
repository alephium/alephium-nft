import Image from 'next/image';
import images from '../assets';
import { withTransition, CreatorCard } from '../components';
import { prettifyAttoAlphAmount } from '@alephium/web3';
import { addressToCreatorImage, shortenAddress } from '../utils/address';
import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { useTheme } from 'next-themes';
import axios from "axios"
import { NFTCollections } from '../components/NFTCollection';

const Home = () => {
  const [hideButtons, setHideButtons] = useState(false);
  const { theme } = useTheme();
  const [topSellers, setTopSellers] = useState<{ address: string, totalAmount: string }[]>([])

  const parentRef: MutableRefObject<any> = useRef(null);
  const scrollRef: MutableRefObject<any> = useRef(null);

  async function loadTopSellers() {
    const result = await axios.get('api/top-sellers')
    const sellers = result.data.map((seller: any) => {
      return { address: seller._id, totalAmount: seller.totalAmount['$numberDecimal'] }
    })

    setTopSellers(sellers)
  }

  useEffect(() => {
    loadTopSellers()
  }, [])


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
            <NFTCollections />
          </>
        }
      </div>
    </div >
  );
};

export default withTransition(Home);
