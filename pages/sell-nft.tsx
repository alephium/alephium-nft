import Image from 'next/image';
import LoaderWithText from '../components/LoaderWithText';
import withTransition from '../components/withTransition';
import { Button, Input, Loader } from '../components';
import { ConnectToWalletBanner } from '../components/ConnectToWalletBanner';
import { NFTMarketplace } from '../utils/nft-marketplace';
import { convertAlphAmountWithDecimals } from '@alephium/web3';
import { marketplaceContractId } from '../configs/nft'
import { useAlephiumConnectContext } from '@alephium/web3-react';
import { useNFT } from '../components/nft';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { waitTxConfirmed } from '../utils';
import { NFT } from '../utils/nft';

const SellNFT = () => {
  const context = useAlephiumConnectContext()
  const [price, setPrice] = useState<number>(0);
  const router = useRouter();
  const { theme } = useTheme();
  const { tokenId } = router.query;
  const { nft, isLoading: isNFTLoading } = useNFT(tokenId as string, false, context.signerProvider?.nodeProvider)
  const [isSellingNFT, setIsSellingNFT] = useState(false);

  function getNFTMarketplace(): NFTMarketplace | undefined {
    if (context.signerProvider) {
      return new NFTMarketplace(context.signerProvider)
    }
  }

  async function sell(nft: NFT, price: number) {
    const nftMarketplace = getNFTMarketplace()
    const priceInSets = convertAlphAmountWithDecimals(price)
    if (!!nftMarketplace && context.signerProvider?.nodeProvider && priceInSets) {
      setIsSellingNFT(true)
      const result = await nftMarketplace.listNFT(nft.tokenId, priceInSets, marketplaceContractId)
      await waitTxConfirmed(context.signerProvider.nodeProvider, result.txId)
      setIsSellingNFT(false)

      router.push('/');
    } else {
      console.debug(
        "can not sell NFT",
        context.signerProvider?.nodeProvider,
        context.signerProvider,
        context.account,
        nftMarketplace,
        price
      )
    }
  }

  if (!context.account) {
    return (
      <ConnectToWalletBanner />
    );
  }

  if (isNFTLoading || !nft) {
    return (
      <div className="flexCenter" style={{ height: '51vh' }}>
        <Loader />
      </div>
    );
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
        {isSellingNFT ? (
          <LoaderWithText text={`Sign and list NFT...`} />
        ) : (
          <div className="mt-7 w-full flex justify-end">
            <Button
              btnName="List NFT"
              classStyles="rounded-xl"
              handleClick={() => sell(nft, price)}
              disabled={!price || price <= 0}
            />
          </div>
        )}
        <div className="my-12 w-full flex justify-left">
          <Image
            src={nft.image}
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
