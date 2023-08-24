import Image from 'next/image';
import Link from 'next/link';

import { nftImageUrl, shortenAddress, showNFTDisplayName } from '../services/utils';
import { motion } from 'framer-motion';
import { prettifyNumber, prettifyNumberConfig } from '@alephium/web3';

interface NFTCardProps {
  nft: {
    tokenId: string,
    name: string,
    description: string,
    image: string,
    tokenOwner?: string,
    collectionId?: string
    tokenIndex?: number,
    price?: bigint
    minted?: boolean
    marketAddress?: string
    commissionRate?: bigint,
    listingContractId?: string
  }
}

const NFTCard = ({ nft }: NFTCardProps) => {
  var motionDivClassName = "dark:bg-nft-black-3 bg-white rounded-2xl cursor-pointer shadow-md hover:shadow-lg duration-500 p-4"
  motionDivClassName = nft.minted ? motionDivClassName : motionDivClassName + " border"
  const query = nft.minted ? { tokenId: nft.tokenId } : { collectionId: nft.collectionId, tokenIndex: nft.tokenIndex }
  return (
    <Link href={{ pathname: '/nft-details', query: query }}>
      <motion.div
        whileInView={{ opacity: [0, 1] }}
        transition={{ duration: 0.5 }}
        className={motionDivClassName}
      >
        <div className="relative w-full h-52 sm:h-48 minmd:h-60 minlg:h-280 rounded-2xl overflow-hidden">
          <Image
            className="flex justify-center items-center hover:scale-110 transition-all duration-500"
            src={nftImageUrl(nft)}
            layout="fill"
            objectFit="cover"
            alt={`nft${nft.tokenId}`}
          />
        </div>
        <div className="mt-3 flex flex-col">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xs minlg:text-xl">
            {showNFTDisplayName(nft)}
          </p>
          <div className="flexBetween mt-1 minlg:mt-3 flex-row xs:flex-col xs:items-start xs:mt-3">
            {
              nft.price ? (
                <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xs minlg:text-lg">
                  {formatNFTPrice(nft.price)} <span className="normal">ALPH</span>
                </p>
              ) : null
            }
            {
              nft.tokenOwner ? (
                <p className="font-poppins dark:text-white text-nft-black-1 text-xs minlg:text-lg">{shortenAddress(nft.tokenOwner)}</p>
              ) : null
            }
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

const prettifyConfig = {
  ...prettifyNumberConfig['ALPH'],
  maxDecimalPlaces: 2
}

function formatNFTPrice(price: bigint): string | undefined {
  const priceStr = price.toString()
  if (priceStr.length > 24) {
    return prettifyNumberWithUnit(price, 24, 'M')
  }
  if (priceStr.length > 21) {
    return prettifyNumberWithUnit(price, 21, 'K')
  }
  return prettifyNumberWithUnit(price, 18, '')
}

function prettifyNumberWithUnit(number: bigint, decimals: number, unit: string): string | undefined {
  const prettifyAmount = prettifyNumber(number, decimals, prettifyConfig)
  if (prettifyAmount === undefined) return undefined
  return prettifyAmount + unit
}

export const NFTSkeletonLoader = () => {
  return (
    <div className="w-full">
      <div className="animate-pulse">
        <div className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 h-52 sm:h-48 minmd:h-60 minlg:h-280 rounded"></div>
      </div>
      <div className="mt-2">
        <div className="animate-pulse">
          <div className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 h-4 w-1/2 mb-2 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 h-4 w-full rounded"></div>
        </div>
      </div>
    </div>
  )
}

export default NFTCard;
