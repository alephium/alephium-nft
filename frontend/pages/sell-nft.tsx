import Image from 'next/image';
import LoaderWithText from '../components/LoaderWithText';
import withTransition from '../components/withTransition';
import { Button, Input, Loader } from '../components';
import { ConnectToWalletBanner } from '../components/ConnectToWalletBanner';
import { NFTMarketplace } from '../../shared/nft-marketplace';
import { convertAlphAmountWithDecimals, prettifyAttoAlphAmount } from '@alephium/web3';
import { getAlephiumNFTConfig } from '../../shared/configs'
import { useWallet } from '@alephium/web3-react';
import { useNFT } from '../components/nft';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { waitTxConfirmed } from '../../shared';
import { NFT } from '../../shared/nft';
import { nftImageUrl } from '../services/utils';
import { useCollectionMetadata } from '../components/NFTCollection';

const SellNFT = () => {
  const wallet = useWallet()
  const [price, setPrice] = useState<number>(0);
  const router = useRouter();
  const { tokenId } = router.query;
  const { nft, isLoading: isNFTLoading } = useNFT(tokenId as string, false, wallet?.signer.nodeProvider)
  const { collectionMetadata } = useCollectionMetadata(nft?.collectionId, wallet?.signer)
  const [isSellingNFT, setIsSellingNFT] = useState(false);
  const config = getAlephiumNFTConfig()

  function getNFTMarketplace(): NFTMarketplace | undefined {
    if (wallet?.signer) {
      return new NFTMarketplace(wallet.signer)
    }
  }

  async function sell(nft: NFT, price: number) {
    const nftMarketplace = getNFTMarketplace()
    const priceInSets = convertAlphAmountWithDecimals(price)
    const marketplaceContractId = config.marketplaceContractId
    if (!!nftMarketplace && wallet?.signer.nodeProvider && priceInSets) {
      setIsSellingNFT(true)
      const interfaceId = await wallet.signer.nodeProvider.guessStdInterfaceId(nft.collectionId)
      const royalty = interfaceId === '000201'
      const result = await nftMarketplace.listNFT(nft.tokenId, priceInSets, marketplaceContractId, royalty)
      await waitTxConfirmed(wallet.signer.nodeProvider, result.txId)
      setIsSellingNFT(false)

      router.push('/');
    } else {
      console.debug(
        "can not sell NFT",
        wallet?.signer.nodeProvider,
        wallet?.signer,
        wallet?.account,
        nftMarketplace,
        price
      )
    }
  }

  if (!wallet) {
    return (
      <ConnectToWalletBanner />
    );
  }

  if (isNFTLoading || !nft || !collectionMetadata) {
    return (
      <div className="flexCenter" style={{ height: '51vh' }}>
        <Loader />
      </div>
    );
  }

  function getRoyaltyAmount(price: bigint, royaltyRate: bigint) {
    return price * royaltyRate / BigInt(10000)
  }

  function commissionFee(price: bigint) {
    return price * BigInt(config.commissionRate) / 10000n
  }

  function profit(price: number) {
    const priceInSets = convertAlphAmountWithDecimals(price)!
    return priceInSets - commissionFee(priceInSets) - config.listingFee - getRoyaltyAmount(priceInSets, collectionMetadata?.royaltyRate ?? 0n)
  }

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-3/5 md:w-full">
        <h1 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl">List NFT</h1>
        <Input
          inputType="alph"
          title="Price"
          placeholder="Asset Price"
          handleClick={(e) => setPrice(Number((e.target as HTMLInputElement).value))}
        />
        <br />
        {
          price ? (
            <table>
              <tr>
                <td>Listing Fee &nbsp;&nbsp;</td>
                <td>{prettifyAttoAlphAmount(config.listingFee)} ALPH</td>
              </tr>
              <tr>
                <td>Commission &nbsp;&nbsp;</td>
                <td>{prettifyAttoAlphAmount(commissionFee(convertAlphAmountWithDecimals(price)!))} ALPH</td>
              </tr>
              {
                collectionMetadata?.royaltyRate ? (
                  <tr>
                    <td>Royalty &nbsp;&nbsp;</td>
                    <td>{prettifyAttoAlphAmount(getRoyaltyAmount(convertAlphAmountWithDecimals(price)!, collectionMetadata.royaltyRate))} ALPH</td>
                  </tr>
                ) : null
              }
              <tr>
                <td>Profit &nbsp;&nbsp;</td>
                <td>{prettifyAttoAlphAmount(profit(price))} ALPH</td>
              </tr>
            </table>
          ) : null
        }
        {isSellingNFT ? (
          <LoaderWithText text={`Sign and list NFT...`} />
        ) : (
          <div className="mt-7 w-full flex justify-end">
            <Button
              btnName="List NFT"
              classStyles="rounded-xl"
              handleClick={() => sell(nft, price)}
              disabled={!price || profit(price) <= 0}
            />
          </div>
        )}
        <div className="my-12 w-full flex justify-left">
          <Image
            src={nftImageUrl(nft)}
            width={350}
            height={350}
            objectFit="contain"
            loading="lazy"
            alt="file upload"
          />
        </div>
      </div>
    </div>
  );
};

export default withTransition(SellNFT);
