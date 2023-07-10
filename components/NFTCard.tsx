import Image from 'next/image';
import Link from 'next/link';

import { shortenAddress } from '../utils/address';
import { shortenName } from '../utils';
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
  var motionDivClassName = "flex-1 min-w-215 max-w-max xs:max-w-none sm:w-full sm:min-w-155 minmd:min-w-256 minlg:min-w-256 dark:bg-nft-black-3 bg-white rounded-2xl p-4 m-4 minlg:m-100 sm:my-2 sm:mx-2 cursor-pointer shadow-md hover:shadow-lg duration-500"
  motionDivClassName = nft.minted ? motionDivClassName : motionDivClassName + " border"
  const query = nft.minted ? { tokenId: nft.tokenId } : { collectionId: nft.collectionId, tokenIndex: nft.tokenIndex }
  return (
    <Link href={{ pathname: '/nft-details', query: query }}>
      <motion.div
        whileInView={{ opacity: [0, 1] }}
        transition={{ duration: 0.5 }}
        className={motionDivClassName}
      >
        <div className="relative w-full h-52 sm:h-36 minmd:h-60 minlg:h-300 rounded-2xl overflow-hidden">
          <Image
            className="flex justify-center items-center hover:scale-110 transition-all duration-500"
            src={nft.image}
            layout="fill"
            objectFit="cover"
            alt={`nft${nft.tokenId}`}
          />
        </div>
        <div className="mt-3 flex flex-col">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xs minlg:text-xl">
            {nft.name.length > 14 ? shortenName(nft.name) : nft.name}
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

export default NFTCard;
