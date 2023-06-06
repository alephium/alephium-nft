import { useState } from 'react';
import { useRouter } from 'next/router';
import withTransition from '../components/withTransition';
import { marketplaceContractId } from '../configs/nft'
import { Button, Input, Loader, Banner } from '../components';
import { useNFT } from '../components/nft';
import { useAlephiumConnectContext } from '@alephium/web3-react';
import { NFT } from '../components/nft'
import { NFTMarketplace } from '../utils/nft-marketplace';
import { ONE_ALPH } from '@alephium/web3';
import { waitTxConfirmed } from '../utils';
import { ConnectToWalletBanner } from '../components/ConnectToWalletBanner';

const SellNFT = () => {
  const context = useAlephiumConnectContext()
  const [price, setPrice] = useState<number>(0);
  const router = useRouter();
  const { tokenId } = router.query;
  const { nft, isLoading: isNFTLoading } = useNFT(tokenId as string, false, context.signerProvider)

  function getNFTMarketplace(): NFTMarketplace | undefined {
    if (context.signerProvider) {
      return new NFTMarketplace(context.signerProvider)
    }
  }

  async function sell(nft: NFT, price: number) {
    const nftMarketplace = getNFTMarketplace()
    if (!!nftMarketplace && context.signerProvider?.nodeProvider) {
      const priceInSets = BigInt(price) * ONE_ALPH
      const result = await nftMarketplace.listNFT(nft.tokenId, priceInSets, marketplaceContractId)
      await waitTxConfirmed(context.signerProvider.nodeProvider, result.txId)

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
          inputType="number"
          title="Price"
          placeholder="Asset Price"
          handleClick={(e) => setPrice(Number((e.target as HTMLInputElement).value))}
        />

        <img className="rounded mt-4" width="350" src={nft.image} />

        <div className="mt-7 w-full flex justify-end">
          <Button
            btnName="List NFT"
            classStyles="rounded-xl"
            handleClick={() => sell(nft, price)}
            disabled={!price || price <= 0}
          />
        </div>
      </div>
    </div>
  );
};

export default withTransition(SellNFT);
