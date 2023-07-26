import Image from 'next/image';
import Link from 'next/link';
import withTransition from '../components/withTransition';
import { Button, Loader, Modal } from '../components';
import { NFTCollection, fetchNFTCollectionMetadata, NFTCollectionDeployer, NFTCollectionMetadata } from '../utils/nft-collection';
import { NFTMarketplace } from '../utils/nft-marketplace';
import { ONE_ALPH, prettifyAttoAlphAmount, binToHex, contractIdFromAddress, web3, NodeProvider } from '@alephium/web3'
import { defaultNodeUrl, marketplaceContractId } from '../configs/nft';
import { fetchNFTByIndex, fetchPreMintNFT } from '../components/nft';
import { fetchNFTListingById, NFTListing } from '../components/NFTListing';
import { fetchTokens } from '../components/token';
import { addressToCreatorImage, shortenAddress } from '../utils/address';
import { useAlephiumConnectContext } from '@alephium/web3-react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { waitTxConfirmed, shortenName } from '../utils';
import { fetchMintedNFT, NFT } from '../utils/nft';
import { useSnackbar } from 'notistack'

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
  const { tokenId, collectionId, tokenIndex } = router.query
  const [nft, setNFT] = useState<NFT | undefined>(undefined)
  const [isNFTLoading, setIsNFTLoading] = useState<boolean>(false)
  const [tokenIds, setTokenIds] = useState<string[]>([])
  const [isTokensLoading, setIsTokensLoading] = useState<boolean>(false)
  const [nftListing, setNftListing] = useState<NFTListing | undefined>()
  const [isNFTListingLoading, setIsNFTListingLoading] = useState<boolean>(false)
  const [collectionMetadata, setCollectionMetadata] = useState<NFTCollectionMetadata | undefined>(undefined);
  const [isBuyingNFT, setIsBuyingNFT] = useState(false);
  const [isCancellingNFTListing, setIsCancellingNFTListing] = useState(false);
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    const nodeProvider = context.signerProvider?.nodeProvider || new NodeProvider(defaultNodeUrl)
    web3.setCurrentNodeProvider(nodeProvider)

    // disable body scroll when navbar is open
    if (paymentModal || successModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'visible';
    }

    const fetchByTokenId = async (tokenId: string, fetchCollectionMetadata: boolean) => {
      try {
        setIsNFTLoading(true)
        const mintedNFT = await fetchMintedNFT(tokenId, false)
        if (mintedNFT === undefined) throw new Error('failed to fetch nft')
        setNFT(mintedNFT)
        if (fetchCollectionMetadata) {
          const collectionMetadata = await fetchNFTCollectionMetadata(mintedNFT.collectionId)
          setCollectionMetadata(collectionMetadata)
        }
        setIsNFTLoading(false)

        setIsTokensLoading(true)
        const tokens = await fetchTokens(nodeProvider, context.account?.address)
        setTokenIds(tokens)
        setIsTokensLoading(false)

        setIsNFTListingLoading(true)
        const nftListing = await fetchNFTListingById(tokenId)
        setNftListing(nftListing)
        setIsNFTListingLoading(false)
      } catch (error) {
        setIsNFTLoading(false)
        setIsTokensLoading(false)
        setIsNFTListingLoading(false)
        enqueueSnackbar(`${error}`, { variant: 'error', persist: false })
      }
    }

    const fetchByNFTIndex = async (collectionId: string, tokenIndex: string) => {
      try {
        setIsNFTLoading(true)
        const metadata = await fetchNFTCollectionMetadata(collectionId)
        if (metadata === undefined) throw new Error('collection does not exist')
        setCollectionMetadata(metadata)

        const nftInfo = await fetchNFTByIndex(metadata, BigInt(tokenIndex))
        if (nftInfo.minted) {
          await fetchByTokenId(nftInfo.tokenId, false)
        } else if (metadata.collectionType === 'NFTOpenCollection') {
          throw new Error('invalid collection type')
        } else {
          const nft = await fetchPreMintNFT(metadata, BigInt(tokenIndex))
          setNFT(nft)
        }
        setIsNFTLoading(false)
      } catch (error) {
        setIsNFTLoading(false)
        enqueueSnackbar(`${error}`, { variant: 'error', persist: false })
      }
    }

    if (tokenId) fetchByTokenId(tokenId as string, true)
    if (collectionId && tokenIndex) fetchByNFTIndex(collectionId as string, tokenIndex as string)

  }, [paymentModal, successModal, context.account?.address, tokenId, context.signerProvider?.nodeProvider, collectionId, tokenIndex, enqueueSnackbar]);

  if (isNFTLoading || isTokensLoading || isNFTListingLoading || !nft || isBuyingNFT || isCancellingNFTListing) {
    return <Loader />;
  }

  const isOwner = tokenIds.includes(nft.tokenId) || (nftListing && nftListing.tokenOwner === context.account?.address)

  function getPriceBreakdowns(nftPrice: bigint) {
    const commission = BigInt(nftPrice) * BigInt(200) / BigInt(10000)
    const nftDeposit = ONE_ALPH
    const gasAmount = BigInt(200000)
    const totalAmount = BigInt(nftPrice) + commission + nftDeposit + gasAmount

    return [commission, nftDeposit, gasAmount, totalAmount]
  }

  const checkout = async () => {
    if (context.signerProvider?.nodeProvider) {
      try {
        let result
        setIsBuyingNFT(true)
        if (nft.minted === true && nftListing) {
          const nftMarketplace = new NFTMarketplace(context.signerProvider)
          // TODO: Display the price breakdowns
          const [commission, nftDeposit, gasAmount, totalAmount] = getPriceBreakdowns(nftListing.price)
          result = await nftMarketplace.buyNFT(
            totalAmount,
            nftListing._id,
            binToHex(contractIdFromAddress(nftListing.marketAddress))
          )
        } else if (nft.minted === false && nft.price && tokenIndex && collectionId) {
          const nftCollection = new NFTCollectionDeployer(context.signerProvider)
          result = await nftCollection.mintSpecificPublicSaleNFT(BigInt(tokenIndex as string), nft.price, collectionId as string)
        }

        setPaymentModal(false);
        setSuccessModal(true);
        if (result) {
          await waitTxConfirmed(context.signerProvider.nodeProvider, result.txId)
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
    if (nftListing && context.signerProvider?.nodeProvider) {
      const nftMarketplace = new NFTMarketplace(context.signerProvider)
      setIsCancellingNFTListing(true)
      const result = await nftMarketplace.cancelNFTListing(tokenId as string, marketplaceContractId)
      await waitTxConfirmed(context.signerProvider.nodeProvider, result.txId)
      setIsCancellingNFTListing(false)
      router.push('/my-nfts')
    } else {
      console.debug(
        "can not cancel NFT listing",
        context.signerProvider?.nodeProvider,
        context.signerProvider,
        context.account,
        nftListing
      )
    }
  }

  return (
    <div className="relative flex justify-center md:flex-col min-h-screen">
      <div className="relative flex-1 flexTop sm:px-4 p-12 border-r md:border-r-0 md:border-b dark:border-nft-black-1 border-nft-gray-1">
        <div className="relative sm:w-full sm:h-300 w-full h-886">
          <Image src={nft.image} objectFit="cover" className="rounded-xl shadow-lg" layout="fill" />
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
            (!isOwner && !!context.account && nftListing) ? (
              <Button
                btnName={`Buy for ${prettifyAttoAlphAmount(nftListing.price)} ALPH`}
                classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                handleClick={() => setPaymentModal(true)}
              />
            ) : null
          }
          {
            (context.account && nft.price && nft.minted === false) ? (
              (collectionMetadata?.collectionType === 'NFTPublicSaleCollectionRandom') ?
                <Button
                  btnName={`Mint for ${prettifyAttoAlphAmount(nft.price)} ALPH`}
                  classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                  handleClick={() => setPaymentModal(true)}
                />
                : <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base border border-gray p-2">
                    Not minted yet
                  </p>
            ) : null
          }
          {
            (!context.account) ? (
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
                <Image src={nft.image} objectFit="cover" layout="fill" />
              </div>
              <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal mt-10">
                You successfully {nft.minted ? "purchased" : "minted"} <span className="font-semibold">{nft.name}</span>.
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
