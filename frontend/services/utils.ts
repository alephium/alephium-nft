import { StaticImageData } from 'next/image';
import images from '../assets';
import * as bs58 from 'bs58'

export function shortenAddress(address: string): string {
  return `${address.slice(0, 5)}...${address.slice(address.length - 4)}`
};

export function addressToCreatorImage(address: string): StaticImageData {
  const hex = Buffer.from(bs58.decode(address)).toString('hex')
  const index = Number(BigInt('0x' + hex) % 10n)
  return (images as { [key: string]: StaticImageData })[`creator${index + 1}`]
}

export const shortenName = (name: string) => (
  `${name.slice(0, 14)}...`
)

export function nftImageUrl(nft: { image: string }): string {
  if (nft.image.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${nft.image.slice(7)}`
  }
  return nft.image
}

export function showNFTDisplayName(nft: { name?: string, tokenIndex?: number }): string {
  return nft.name ? (nft.name.length > 14 ?
    shortenName(nft.name) : nft.name) :
    (nft.tokenIndex ? nft.tokenIndex.toString() : '')
}