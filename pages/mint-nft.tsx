import { useRouter } from 'next/router'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import { useCollection } from '../components/nft-collection'
import { Button, Input } from '../components'
import Image from 'next/image';
import images from '../assets';
import { shortenAddress } from '../utils/shortenAddress';
import { useCallback, useState, useMemo } from 'react';
import { ipfsClient } from '../utils/ipfs';
import { useDropzone } from 'react-dropzone';
import { useTheme } from 'next-themes';
import { NFTCollection } from '../utils/nft-collection';

export default function MintNFT() {
  const context = useAlephiumConnectContext()
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [formInput, updateFormInput] = useState({ name: '', description: '' })
  const router = useRouter()
  const { theme } = useTheme();
  const { collectionId } = router.query

  const { collection } = useCollection(collectionId as string, context.signerProvider)

  const onDrop = useCallback(async (acceptedFile: any[]) => {
    const file = acceptedFile[0]
    console.log("file", file)
    try {
      const added = await ipfsClient.add({
        content: file,
      })
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
    if (uri && context.signerProvider?.nodeProvider && context.account && collection) {
      const nftCollection = new NFTCollection(context.signerProvider)

      await nftCollection.mintOpenNFT(collection.id, uri)
      router.push('/my-nfts')
    } else {
      console.debug('context..', context)
    }
  }

  if (!collectionId) return (<h1 className="px-20 py-10 text-3xl">No collection</h1>)

  return (
    <>
      {
        collection && (
          <div className="relative flex justify-center md:flex-col min-h-screen">
            <div className="relative flex-1 flexCenter sm:px-4 p-12 border-r md:border-r-0 md:border-b dark:border-nft-black-1 border-nft-gray-1">
              <div className="relative w-557 minmd:w-2/3 minmd:h-2/3 sm:w-full sm:h-300 h-557 ">
                <Image src={collection.image} objectFit="cover" className=" rounded-xl shadow-lg" layout="fill" />
              </div>
            </div>
            <div className="flex-1 justify-start sm:px-4 p-12 sm:pb-4">
              <div className="flex flex-row sm:flex-col">
                <h2 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-3xl">{collection.name}</h2>
              </div>

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
                    {collection.description}
                  </p>
                </div>
              </div>
              <div className="mt-16">
                <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">Upload File</p>
                <div className="mt-4">
                  <div {...getRootProps()} className={fileStyle}>
                    <input {...getInputProps()} />
                    <div className="flexCenter flex-col text-center">
                      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">
                        JPG, PNG, GIF, SVG, WEBM Max 100mb.
                      </p>
                      <div className="my-12 w-full flex justify-center">
                        <Image
                          src={images.upload}
                          width={100}
                          height={100}
                          objectFit="contain"
                          alt="file upload"
                          className={theme === 'light' ? 'filter invert' : ''}
                        />
                      </div>
                      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm">
                        Drag and Drop File,
                      </p>
                      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm mt-2">
                        or Browse media on your device.
                      </p>
                    </div>
                  </div>
                  {fileUrl && (
                    <aside>
                      <div>
                        <img src={fileUrl} alt="asset_file" />
                      </div>
                    </aside>
                  )}
                </div>
              </div>
              <Input
                inputType="input"
                title="Name"
                placeholder="NFT Collection Name"
                handleClick={(e) => updateFormInput({ ...formInput, name: (e.target as HTMLInputElement).value })}
              />
              <Input
                inputType="textarea"
                title="Description"
                placeholder="NFT Collection Description"
                handleClick={(e) => updateFormInput({ ...formInput, description: (e.target as HTMLInputElement).value })}
              />
              <div className="mt-7 w-full flex justify-end">
                <Button
                  btnName="Create NFT Collection"
                  classStyles="rounded-xl"
                  handleClick={() => mintNFT()}
                />
              </div>
            </div>
          </div>
        )
      }
    </>
  )
}
