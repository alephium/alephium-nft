import { useRouter } from 'next/router'
import { useWallet } from '@alephium/web3-react'
import { useCollectionMetadata } from '../components/NFTCollection'
import { Button, Input } from '../components'
import Image from 'next/image';
import images from '../assets';
import { nftImageUrl, shortenAddress } from '../services/utils';
import { useCallback, useState, useMemo } from 'react';
import { ipfsClient } from '../services/ipfs';
import { useDropzone } from 'react-dropzone';
import { useTheme } from 'next-themes';
import { NFTCollectionHelper } from '../../shared/nft-collection';
import { ConnectToWalletBanner } from '../components/ConnectToWalletBanner';
import { waitTxConfirmed } from '../../shared';
import LoaderWithText from '../components/LoaderWithText';

export default function MintNFT() {
  const wallet = useWallet()
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [formInput, updateFormInput] = useState({ name: '', description: '' })
  const router = useRouter()
  const { theme } = useTheme();
  const [isMinting, setIsMinting] = useState<boolean>(false)
  const { collectionId } = router.query
  const { collectionMetadata } = useCollectionMetadata(collectionId as string)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const onDrop = useCallback(async (acceptedFile: any[]) => {
    const file = acceptedFile[0]
    console.log("file", file)
    try {
      const added = await ipfsClient.add(
        {
          content: file,
        },
        {
          progress: (bytes: number, path?: string) => {
            setIsUploading(true)
            console.log("bytes", bytes)
            console.log("path", path)
          }
        }
      )
      setIsUploading(false)
      const url: string = `https://alephium-nft.infura-ipfs.io/ipfs/${added.path}`
      console.log("url", url)
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: 'image/*',
    maxSize: 5000000,
  });

  const fileStyle = useMemo(() => (
    `dark:bg-nft-black-1 bg-white border dark:border-white border-nft-gray-2 flex flex-col items-center p-5 rounded-sm border-dashed
    ${isDragActive && ' border-file-active'}
    ${isDragAccept && ' border-file-accept'}
    ${isDragReject && ' border-file-reject'}
    `
  ), [isDragActive, isDragAccept, isDragReject]);


  async function uploadToIPFS(): Promise<string | undefined> {
    const { name, description } = formInput
    if (!name || !description || !fileUrl) return
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
    try {
      const added = await ipfsClient.add(data)
      const url = `https://alephium-nft.infura-ipfs.io/ipfs/${added.cid}`
      /* after file is uploaded to IPFS, return the URL to use it in the transaction */
      return url
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }

  async function mintNFT() {
    const uri = await uploadToIPFS()
    if (uri && wallet?.signer?.nodeProvider && wallet.account && collectionMetadata) {
      const nftCollection = new NFTCollectionHelper(wallet.signer)
      setIsMinting(true)
      const royalty = !!collectionMetadata.royaltyRate
      const result = await nftCollection.openCollection.mint(collectionMetadata.id, uri, royalty)
      await waitTxConfirmed(wallet.signer.nodeProvider, result.txId)
      setIsMinting(false)
      router.push('/my-nfts')
    } else {
      console.debug('wallet..', wallet)
    }
  }

  if (!wallet) {
    return (
      <ConnectToWalletBanner />
    );
  }

  if (!collectionId) return (<h1 className="px-20 py-10 text-3xl">No collection</h1>)

  return (
    <>
      {
        collectionMetadata && (
          <div className="relative flex justify-center md:flex-col min-h-screen">
            <div className="relative flex-1 flexTop sm:px-4 p-12 border-r md:border-r-0 md:border-b dark:border-nft-black-1 border-nft-gray-1">
              <div className="relative sm:w-full sm:h-300 w-3/4 h-557 mx-auto">
                <Image src={nftImageUrl(collectionMetadata)} objectFit="cover" className=" rounded-xl shadow-lg" layout="fill" />
              </div>
            </div>
            <div className="flex-1 justify-start sm:px-4 p-12 sm:pb-4">
              <div className="flex flex-row sm:flex-col">
                <h2 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-3xl">{collectionMetadata.name}</h2>
              </div>

              <div className="mt-10">
                <p className="font-poppins dark:text-white text-nft-black-1 text-xs minlg:text-base font-normal">Owner</p>
                <div className="flex flex-row items-center mt-3">
                  <div className="relative w-12 h-12 minlg:w-20 minlg:h-20 mr-2">
                    <Image src={images.creator1} objectFit="cover" className="rounded-full" />
                  </div>
                  <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-lg font-semibold">
                    {shortenAddress(wallet?.account.address)}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-col">
                <div className="w-full border-b dark:border-nft-black-1 border-nft-gray-1 flex flex-row">
                  <p className="font-poppins dark:text-white text-nft-black-1 font-medium text-base mb-2">Details</p>
                </div>
                <div className="mt-3">
                  <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base">
                    {collectionMetadata.description}
                  </p>
                </div>
              </div>
              <div className="mt-16">
                <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">Upload Image for NFT</p>
                <div className="mt-4">
                  <div {...getRootProps()} className={fileStyle}>
                    <input {...getInputProps()} />
                    <div className="flexCenter flex-col text-center">
                      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">
                        JPG, PNG, GIF, SVG, WEBM Max 5mb.
                      </p>
                      {
                        isUploading ? (
                          <LoaderWithText text={`Uploading...`} />
                        ) : (
                          <div className="my-12 w-full flex justify-center">
                            <Image
                              src={fileUrl || images.upload}
                              width={fileUrl ? 200 : 100}
                              height={fileUrl ? 200 : 100}
                              objectFit="contain"
                              loading="lazy"
                              alt="file upload"
                              className={theme === 'light' ? 'filter invert' : ''}
                            />
                          </div>
                        )
                      }
                      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm">
                        Drag and Drop File,
                      </p>
                      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm mt-2">
                        or Browse media on your device.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Input
                inputType="input"
                title="Name"
                placeholder="NFT Name"
                handleClick={(e) => updateFormInput({ ...formInput, name: (e.target as HTMLInputElement).value })}
              />
              <Input
                inputType="textarea"
                title="Description"
                placeholder="NFT Description"
                handleClick={(e) => updateFormInput({ ...formInput, description: (e.target as HTMLInputElement).value })}
              />
              {isMinting ? (
                <LoaderWithText text={`Sign and mint NFT...`} />
              ) : (
                <div className="mt-7 w-full flex justify-end">
                  <Button
                    btnName="Mint NFT"
                    classStyles="rounded-xl"
                    handleClick={() => mintNFT()}
                    disabled={!fileUrl || !formInput.name || !formInput.description}
                  />
                </div>
              )}
            </div>
          </div>
        )
      }
    </>
  )
}
