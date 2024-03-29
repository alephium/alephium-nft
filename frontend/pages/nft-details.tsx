import Image from 'next/image';
import Link from 'next/link';
import withTransition from '../components/withTransition';
import { Button, Loader, Modal } from '../components';
import { NFTMarketplace } from '../../shared/nft-marketplace';
import {
  prettifyAttoAlphAmount,
  binToHex,
  contractIdFromAddress,
  web3,
  NodeProvider,
  ExplorerProvider
} from '@alephium/web3'
import { getAlephiumNFTConfig } from '../../shared/configs';
import { fetchPreMintNFT } from '../components/nft';
import { fetchNFTListingById, NFTListing } from '../components/NFTListing';
import { fetchTokens } from '../components/token';
import { addressToCreatorImage, nftImageUrl, shortenAddress, showNFTDisplayName } from '../services/utils';
import { useWallet } from '@alephium/web3-react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { waitTxConfirmed } from '../../shared';
import { NFTCollectionHelper, NFTCollection, fetchNFTCollectionMetadata } from '../../shared/nft-collection';
import { fetchMintedNFT, NFT } from '../../shared/nft';

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
          <Image src={nftImageUrl(nft)} layout="fill" objectFit="cover" />
        </div>
        {
          nft.tokenOwner && (
            <div className="flexCenterStart flex-col ml-5">
              <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm minlg:text-xl">{shortenAddress(nft.tokenOwner)}</p>
              <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal">{showNFTDisplayName(nft)}</p>
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
  const wallet = useWallet()
  const [paymentModal, setPaymentModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const router = useRouter();
  const { tokenId, collectionId, nftIndex } = router.query
  const [nft, setNFT] = useState<NFT | undefined>(undefined)
  const [isNFTLoading, setIsNFTLoading] = useState<boolean>(false)
  const [tokenIds, setTokenIds] = useState<string[]>([])
  const [isTokensLoading, setIsTokensLoading] = useState<boolean>(false)
  const [nftListing, setNftListing] = useState<NFTListing | undefined>()
  const [isNFTListingLoading, setIsNFTListingLoading] = useState<boolean>(false)
  const [collectionMetadata, setCollectionMetadata] = useState<Omit<NFTCollection, "nfts"> | undefined>(undefined);
  const [isBuyingNFT, setIsBuyingNFT] = useState(false);
  const [isCancellingNFTListing, setIsCancellingNFTListing] = useState(false);
  const defaultNodeUrl = getAlephiumNFTConfig().defaultNodeUrl
  const defaultExplorerUrl = getAlephiumNFTConfig().defaultExplorerUrl

  useEffect(() => {
    const nodeProvider = wallet?.signer?.nodeProvider || new NodeProvider(defaultNodeUrl)
    const explorerProvider = wallet?.signer?.explorerProvider || new ExplorerProvider(defaultExplorerUrl)
    web3.setCurrentNodeProvider(nodeProvider)
    web3.setCurrentExplorerProvider(explorerProvider)

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

    if (tokenId) {
      setIsNFTLoading(true)
      fetchMintedNFT(tokenId as string, false).then((nft) => {
        setNFT(nft)
        setIsNFTLoading(false)
      })

      setIsTokensLoading(true)
      fetchTokens(nodeProvider, wallet?.account.address).then((tokens) => {
        setTokenIds(tokens)
        setIsTokensLoading(false)
      })


      setIsNFTListingLoading(true)
      fetchNFTListingById(tokenId as string).then((listing) => {
        setNftListing(listing)
        setIsNFTListingLoading(false)
      })
    }

    if (collectionId && nftIndex) {
      setIsNFTLoading(true)
      fetchPreMintNFT(collectionId as string, BigInt(nftIndex as string)).then((nft) => {
        setNFT(nft)
        setIsNFTLoading(false)
      })
    }

  }, [paymentModal, successModal, nft?.collectionId, wallet?.account.address, tokenId]);

  if (isNFTLoading || isTokensLoading || isNFTListingLoading || !nft || isBuyingNFT || isCancellingNFTListing) {
    return <Loader />;
  }

  const isOwner = tokenIds.includes(nft.tokenId) || (nftListing && nftListing.tokenOwner === wallet?.account.address)

  const checkout = async () => {
    if (wallet?.signer.nodeProvider) {
      try {
        let result
        setIsBuyingNFT(true)
        if (nft.minted === true && nftListing) {
          const nftMarketplace = new NFTMarketplace(wallet.signer)
          result = await nftMarketplace.buyNFT(
            nftListing.price,
            nftListing._id,
            binToHex(contractIdFromAddress(nftListing.marketAddress))
          )
        } else if (nft.minted === false && nft.price && nftIndex && collectionId) {
          const nftCollection = new NFTCollectionHelper(wallet.signer)
          result = await nftCollection.publicSaleCollection.random.mint(BigInt(nftIndex as string), nft.price, collectionId as string, false)
        }

        setPaymentModal(false);
        setSuccessModal(true);
        if (result) {
          await waitTxConfirmed(wallet.signer.nodeProvider, result.txId)
        }
        setIsBuyingNFT(false)
      } catch (e) {
        setPaymentModal(false);
        setIsBuyingNFT(false)
        setSuccessModal(false);
        console.debug("Can not buy NFT", e)
      }
    }
  };

  const cancelListing = async () => {
    const marketplaceContractId = getAlephiumNFTConfig().marketplaceContractId
    if (nftListing && wallet?.signer.nodeProvider) {
      const nftMarketplace = new NFTMarketplace(wallet.signer)
      setIsCancellingNFTListing(true)
      const result = await nftMarketplace.cancelNFTListing(tokenId as string, marketplaceContractId)
      await waitTxConfirmed(wallet.signer.nodeProvider, result.txId)
      setIsCancellingNFTListing(false)
      router.push('/my-nfts')
    } else {
      console.debug(
        "can not cancel NFT listing",
        wallet?.signer.nodeProvider,
        wallet?.signer,
        wallet?.account,
        nftListing
      )
    }
  }

  return (
    <div className="relative flex justify-center md:flex-col min-h-screen">
      <div className="relative flex-1 flexTop sm:px-4 p-12 border-r md:border-r-0 md:border-b dark:border-nft-black-1 border-nft-gray-1">
        <div className="relative sm:w-full sm:h-300 w-3/4 h-557 mx-auto">
          <Image src={nftImageUrl(nft)} objectFit="cover" className="rounded-xl shadow-lg" layout="fill" />
        </div>
      </div>

      <div className="flex-1 justify-start sm:px-4 p-12 sm:pb-4">
        <div className="flex flex-row sm:flex-col">
          <h2 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-3xl">{showNFTDisplayName(nft)}</h2>
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

        {
          nftListing?.tokenOwner ? (
            <div className="mt-10">
              <p className="font-poppins dark:text-white text-nft-black-1 text-xs minlg:text-base font-normal">Owner</p>
              <div className="flex flex-row items-center mt-3">
                <div className="relative w-12 h-12 minlg:w-20 minlg:h-20 mr-2">
                  <Image src={addressToCreatorImage(nftListing.tokenOwner)} objectFit="cover" className="rounded-full" />
                </div>
                <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-lg font-semibold">
                  {shortenAddress(nftListing.tokenOwner)}
                </p>
              </div>
            </div>
          ) : null
        }

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

        {
          collectionMetadata?.royaltyRate ? (
            <div className="mt-10 flex flex-col">
              <div className="font-poppins dark:text-white text-nft-black-1 font-medium text-base mb-2">Royalty {(collectionMetadata.royaltyRate * 100n / 10000n).toString()}%</div>
            </div>
          ) : null
        }

        <div className="flex flex-row sm:flex-col mt-10">
          {
            (isOwner && nftListing) ? (
              <Button
                btnName="Cancel NFT Listing"
                classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                handleClick={cancelListing}
              />
            ) : null
          }
          {
            (isOwner && !nftListing) ? (
              <Button
                btnName="Sell NFT"
                classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                handleClick={() => router.push(`/sell-nft?tokenId=${nft.tokenId}`)}
              />
            ) : null
          }
          {
            (!isOwner && !!wallet?.account && nftListing) ? (
              <Button
                btnName={`Buy for ${prettifyAttoAlphAmount(nftListing.price)} ALPH`}
                classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                handleClick={() => setPaymentModal(true)}
              />
            ) : null
          }
          {
            (wallet?.account && nft.price && nft.minted === false) ? (
              <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base border border-gray p-2">
                Not minted yet
              </p>
            ) : null
          }
          {
            (!wallet?.account) ? (
              <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base border border-gray p-2">
                To transact, please connect to wallet
              </p>
            ) : null
          }
        </div>
      </div>

      {paymentModal && (
        <Modal
          header="Check Out"
          body={<PaymentBodyCmp nft={nftListing && { tokenId: nftListing._id, ...nftListing } || nft} />}
          footer={(
            <div className="flex flex-row sm:flex-col">
              <Button
                btnName={nft.minted ? "Checkout" : "Mint"}
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
                <Image src={nftImageUrl(nft)} objectFit="cover" layout="fill" />
              </div>
              <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal mt-10">
                You successfully {nft.minted ? "purchased" : "minted"} <span className="font-semibold">{showNFTDisplayName(nft)}</span>.
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
