import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import withTransition from '../components/withTransition';
import { shortenName } from '../utils/shortenName';
import { shortenAddress } from '../utils/shortenAddress';
import { Button, Loader, Modal } from '../components';
import images from '../assets';
import { useAlephiumConnectContext } from '@alephium/web3-react';
import { ONE_ALPH, prettifyAttoAlphAmount, binToHex, contractIdFromAddress } from '@alephium/web3'
import { useNFT } from '../components/nft';
import { useTokens } from '../components/token';
import { useNFTListings } from '../components/NFTListing';
import { NFTMarketplace } from '../utils/nft-marketplace';
import Link from 'next/link';
import { NFTCollection, fetchNFTCollectionMetadata } from '../components/NFTCollection';
import { waitTxConfirmed } from '../utils';
import { ConnectToWalletBanner } from '../components/ConnectToWalletBanner';

interface PaymentBodyCmpProps {
  nft: {
    tokenId: string,
    name: string,
    description: string,
    image: string,
    collectionId: string
    tokenOwner?: string,
    price?: bigint
    marketAddress?: string
    commissionRate?: bigint,
    listingContractId?: string
  }
}

const PaymentBodyCmp = ({ nft }: PaymentBodyCmpProps) => (
  <div className="flex flex-col">
    <div className="flexBetween">
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">Item</p>
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">Subtotal</p>
    </div>

    <div className="flexBetweenStart my-5">
      <div className="flex-1 flexStartCenter">
        <div className="relative w-28 h-28">
          <Image src={nft.image} layout="fill" objectFit="cover" />
        </div>
        {
          nft.tokenOwner && (
            <div className="flexCenterStart flex-col ml-5">
              <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm minlg:text-xl">{shortenAddress(nft.tokenOwner)}</p>
              <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal">{nft.name}</p>
            </div>
          )
        }
      </div>

      {nft.price ? (
        <div>
          <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal">{prettifyAttoAlphAmount(nft.price)} <span className="font-semibold">ALPH</span></p>
        </div>

      ) : null}
    </div>

    <div className="flexBetween mt-10">
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">Total</p>
      {nft.price ? (
        <p className="font-poppins dark:text-white text-nft-black-1 text-base minlg:text-xl font-normal">{prettifyAttoAlphAmount(nft.price)} <span className="font-semibold">ALPH</span></p>
      ) : null}
    </div>
  </div>
);

const AssetDetails = () => {
  const context = useAlephiumConnectContext()
  const [paymentModal, setPaymentModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const router = useRouter();
  const { tokenId } = router.query
  const { nft, isLoading: isNFTLoading } = useNFT(tokenId as string, false, context.signerProvider)
  const { tokenIds, isLoading: isTokensLoading } = useTokens(context.account?.address, context.signerProvider)
  const { nftListings, isLoading: isNFTListingLoading } = useNFTListings(context.signerProvider)
  const [collectionMetadata, setCollectionMetadata] = useState<Omit<NFTCollection, "nfts"> | undefined>(undefined);
  const [isBuyingNFT, setIsBuyingNFT] = useState(false);

  useEffect(() => {
    // disable body scroll when navbar is open
    if (paymentModal || successModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'visible';
    }

    if (nft?.collectionId) {
      fetchNFTCollectionMetadata(nft.collectionId).then((metadata) => {
        setCollectionMetadata(metadata)
      })
    }
  }, [paymentModal, successModal, nft?.collectionId]);

  if (!context.account) {
    return (
      <ConnectToWalletBanner />
    );
  }

  if (isNFTLoading || isTokensLoading || isNFTListingLoading || !nft || isBuyingNFT) {
    return <Loader />;
  }

  const isOwner = tokenIds.includes(nft.tokenId)
  const nftListing = nftListings.find((listing) => listing._id == nft.tokenId)

  function getPriceBreakdowns(nftPrice: bigint, commissionRate: bigint) {
    const commission = BigInt(nftPrice * commissionRate) / BigInt(10000)
    const nftDeposit = ONE_ALPH
    const gasAmount = BigInt(200000)
    const totalAmount = BigInt(nftPrice) + commission + nftDeposit + gasAmount

    return [commission, nftDeposit, gasAmount, totalAmount]
  }

  const checkout = async () => {
    if (nftListing && context.signerProvider?.nodeProvider) {
      const nftMarketplace = new NFTMarketplace(context.signerProvider)
      // TODO: Display the price breakdowns
      const [commission, nftDeposit, gasAmount, totalAmount] = getPriceBreakdowns(nftListing.price, nftListing.commissionRate)

      setIsBuyingNFT(true)
      const result = await nftMarketplace.buyNFT(
        totalAmount,
        nftListing._id,
        binToHex(contractIdFromAddress(nftListing.marketAddress))
      )
      setPaymentModal(false);
      setSuccessModal(true);
      await waitTxConfirmed(context.signerProvider.nodeProvider, result.txId)
      setIsBuyingNFT(false)
    } else {
      console.debug(
        "can not buy NFT",
        context.signerProvider?.nodeProvider,
        context.signerProvider,
        context.account,
        nftListing
      )
    }
  };

  return (
    <div className="relative flex justify-center md:flex-col min-h-screen">
      <div className="relative flex-1 flexTop sm:px-4 p-12 border-r md:border-r-0 md:border-b dark:border-nft-black-1 border-nft-gray-1">
        <div className="relative w-557 minmd:w-2/3 minmd:h-2/3 sm:w-full sm:h-300 h-557 ">
          <Image src={nft.image} objectFit="cover" className=" rounded-xl shadow-lg" layout="fill" />
        </div>
      </div>

      <div className="flex-1 justify-start sm:px-4 p-12 sm:pb-4">
        <div className="flex flex-row sm:flex-col">
          <h2 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-3xl">{nft.name.length > 14 ? shortenName(nft.name) : nft.name}</h2>
        </div>
        {
          nft.collectionId && collectionMetadata && (
            <>
              <div className="flex w-full flex-wrap justify-start md:justify-center">
                From&nbsp;
                <div className="flex flex-row sm:flex-col collection-link">
                  <Link href={{ pathname: '/collection-details', query: { collectionId: nft.collectionId } }} color={"blue"}>
                    {collectionMetadata.name}
                  </Link>
                </div>
              </div>
            </>
          )
        }

        <div className="mt-10">
          <p className="font-poppins dark:text-white text-nft-black-1 text-xs minlg:text-base font-normal">Owner</p>
          <div className="flex flex-row items-center mt-3">
            <div className="relative w-12 h-12 minlg:w-20 minlg:h-20 mr-2">
              <Image src={images.creator1} objectFit="cover" className="rounded-full" />
            </div>
            <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-lg font-semibold">
              {shortenAddress(context.account?.address)}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col">
          <div className="w-full border-b dark:border-nft-black-1 border-nft-gray-1 flex flex-row">
            <p className="font-poppins dark:text-white text-nft-black-1 font-medium text-base mb-2">Details</p>
          </div>
          <div className="mt-3">
            <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base">
              {nft.description}
            </p>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col mt-10">
          {
            (isOwner && nftListing) ? (
              <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base border border-gray p-2">
                You cannot buy your own NFT
              </p>
            ) : null
          }
          {
            (isOwner && !nftListing) ? (
              <Button
                btnName="Sell on AlephiumNFT Marketplace"
                classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                handleClick={() => router.push(`/sell-nft?tokenId=${nft.tokenId}`)}
              />
            ) : null
          }
          {
            (!isOwner && nftListing) ? (
              <Button
                btnName={`Buy for ${prettifyAttoAlphAmount(nftListing.price)} ALPH`}
                classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                handleClick={() => setPaymentModal(true)}
              />
            ) : null
          }
        </div>
      </div>

      {paymentModal && (
        <Modal
          header="Check Out"
          body={<PaymentBodyCmp nft={nftListing && { collectionId: nft.collectionId, tokenId: nftListing._id, ...nftListing } || nft} />}
          footer={(
            <div className="flex flex-row sm:flex-col">
              <Button
                btnName="Checkout"
                classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                handleClick={checkout}
              />
              <Button
                btnName="Cancel"
                classStyles="rounded-xl"
                handleClick={() => setPaymentModal(false)}
              />
            </div>
          )}
          handleClose={() => setPaymentModal(false)}
        />
      )}

      {isNFTLoading && (
        <Modal
          header="Buying NFT..."
          body={(
            <div className="flexCenter flex-col text-center">
              <div className="relative w-52 h-52">
                <Loader />
              </div>
            </div>
          )}
          handleClose={() => setSuccessModal(false)}
        />
      )}

      {successModal && (
        <Modal
          header="Payment Successful"
          body={(
            <div className="flexCenter flex-col text-center" onClick={() => setSuccessModal(false)}>
              <div className="relative w-52 h-52">
                <Image src={nft.image} objectFit="cover" layout="fill" />
              </div>
              <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal mt-10">
                You successfully purchased <span className="font-semibold">{nft.name}</span> from <span className="font-semibold">{shortenAddress(context.account?.address)}</span>.
              </p>
            </div>
          )}
          footer={(
            <div className="flexCenter flex-col">
              <Button
                btnName="Check it out"
                classStyles="sm:mr-0 sm:mb-5 rounded-xl"
                handleClick={() => router.push('/my-nfts')}
              />
            </div>
          )}
          handleClose={() => setSuccessModal(false)}
        />
      )}
    </div>
  );
};

export default withTransition(AssetDetails);
