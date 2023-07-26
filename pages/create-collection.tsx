import { useCallback, useState, useMemo, useEffect } from 'react'
import { NFTCollectionDeployer } from '../utils/nft-collection'
import { ipfsClient } from '../utils/ipfs'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import { useRouter } from 'next/router'
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import images from '../assets';
import { useTheme } from 'next-themes'
import { Button, Input, Loader } from '../components';
import { ConnectToWalletBanner } from '../components/ConnectToWalletBanner'
import { waitTxConfirmed } from '../utils'
import LoaderWithText from '../components/LoaderWithText'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { convertAmountWithDecimals } from '@alephium/web3'
import { useSnackbar } from 'notistack'
import SwitchButton from '../components/SwitchButton'

export default function CreateCollections() {
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [formInput, updateFormInput] = useState({name: '', description: '', tokenBaseUri: '', maxSupply: '', mintPrice: '', maxBatchMintSize: '' })
  const context = useAlephiumConnectContext()
  const router = useRouter()
  const { theme } = useTheme();
  const [isCreatingCollection, setIsCreatingCollection] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [mintRandomly, setMintRandomly] = useState<boolean>(false)
  const { enqueueSnackbar } = useSnackbar()

  const onDrop = useCallback(async (acceptedFile: any[]) => {
    const file = acceptedFile[0]
    console.log("file", file)
    try {
      const added = await ipfsClient.add(
        {
          content: file,
        },
        {
          progress: (bytes, path) => {
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

  async function createOpenCollection() {
    const collectionUri = await uploadToIPFS()
    if (collectionUri && context.signerProvider?.nodeProvider && context.account) {
      const nftCollection = new NFTCollectionDeployer(context.signerProvider)
      setIsCreatingCollection(true)
      const createCollectionTxResult = await nftCollection.createOpenCollection(collectionUri)
      await waitTxConfirmed(context.signerProvider.nodeProvider, createCollectionTxResult.txId)
      router.push(`/collection-details?collectionId=${createCollectionTxResult.contractInstance.contractId}`)
    } else {
      console.debug('context..', context)
    }
  }

  function tryParseInt(inputName: string, maxSupplyStr: string, decimals: number): bigint {
    if (!maxSupplyStr) throw new Error(`${inputName} is not specified`)
    const maxSupply = convertAmountWithDecimals(maxSupplyStr, decimals)
    if (maxSupply === undefined || maxSupply <= 0) throw new Error(`Invalid ${inputName}`)
    return maxSupply
  }

  async function createPublicSaleCollection() {
    try {
      const { tokenBaseUri, maxSupply: maxSupplyStr, mintPrice: mintPriceStr, maxBatchMintSize: maxBatchMintSizeStr } = formInput
      // Verify that this URL is correct, metadata is valid
      if (!tokenBaseUri) throw new Error(`token base uri is not specified`)

      // TODO: how do we verify the max supply?
      const maxSupply = tryParseInt('max supply', maxSupplyStr, 0)
      const mintPrice = tryParseInt('mint price', mintPriceStr, 18)
      const collectionUri = await uploadToIPFS()
      if (collectionUri && context.signerProvider?.nodeProvider && context.account) {
        const nftCollection = new NFTCollectionDeployer(context.signerProvider)
        setIsCreatingCollection(true)
        const createCollectionTxResult = mintRandomly
          ? (await nftCollection.createPublicSaleCollectionRandom(maxSupply, mintPrice, collectionUri, tokenBaseUri))
          : (await nftCollection.createPublicSaleCollectionSequential(maxSupply, mintPrice, collectionUri, tokenBaseUri, tryParseInt('max batch mint size', maxBatchMintSizeStr, 0)))
        await waitTxConfirmed(context.signerProvider.nodeProvider, createCollectionTxResult.txId)
        router.push(`/collection-details?collectionId=${createCollectionTxResult.contractInstance.contractId}`)
      } else {
        console.debug('context..', context)
      }
    } catch (error) {
      setIsCreatingCollection(false)
      enqueueSnackbar(`${error}`, { variant: 'error', persist: false })
    }
  }

  function collectionImage() {
    return (
      <div className="mt-16">
        <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">Upload Image for Collection Profile</p>
        <div className="mt-4">
          <div {...getRootProps()} className={fileStyle}>
            <input {...getInputProps()} />
            <div className="flexCenter flex-col text-center">
              <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">
                JPG, PNG, GIF, SVG, WEBM Max 100mb.
              </p>
              {isUploading ? (
                <LoaderWithText text={`Uploading...`} />
              ) : (<div className="my-12 w-full flex justify-center">
                <Image
                  src={fileUrl || images.upload}
                  width={fileUrl ? 200 : 100}
                  height={fileUrl ? 200 : 100}
                  objectFit="contain"
                  alt="file upload"
                  className={theme === 'light' ? 'filter invert' : ''}
                />
              </div>)}
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
    )
  }

  function collectionName() {
    return (
      <Input
        inputType="input"
        title="Name"
        placeholder="NFT Collection Name"
        handleClick={(e) => updateFormInput({ ...formInput, name: (e.target as HTMLInputElement).value })}
      />
    )
  }

  function collectionDescription() {
    return (
      <Input
        inputType="textarea"
        title="Description"
        placeholder="NFT Collection Description"
        handleClick={(e) => updateFormInput({ ...formInput, description: (e.target as HTMLInputElement).value })}
      />
    )
  }

  function collectionMaxSupply() {
    return (
      <Input
        inputType="number"
        title="Max Supply"
        placeholder="NFT Collection Max Supply"
        handleClick={(e) => updateFormInput({ ...formInput, maxSupply: (e.target as HTMLInputElement).value })}
      />
    )
  }

  function collectionMaxBatchMintSize() {
    return (
      <Input
        inputType="number"
        title="Max Batch Mint Size"
        placeholder="NFT Collection Max Batch Mint Size"
        handleClick={(e) => updateFormInput({ ...formInput, maxBatchMintSize: (e.target as HTMLInputElement).value })}
      />
    )
  }

  function collectionMintPrice() {
    return (
      <Input
        inputType="alph"
        title="Mint Price"
        placeholder="NFT Collection Mint Price"
        handleClick={(e) => updateFormInput({ ...formInput, mintPrice: (e.target as HTMLInputElement).value })}
      />
    )
  }

  function collectionTokenBaseURI() {
    return (
      <Input
        inputType="input"
        title="Token Base URI"
        placeholder="Token Base URI"
        handleClick={(e) => updateFormInput({ ...formInput, tokenBaseUri: (e.target as HTMLInputElement).value })}
      />
    )
  }

  function createCollectionButton(handleClick: () => void, type: 'NFTOpenCollection' | 'NFTPublicSaleCollection') {
    const disabled = type === 'NFTOpenCollection'
      ? (!fileUrl || !formInput.name || !formInput.description)
      : (!fileUrl || !formInput.name || !formInput.description || !formInput.maxSupply || !formInput.mintPrice)
    return isCreatingCollection ? (
      <LoaderWithText text={`Sign and create collection...`} />
    ) : (
      <>
      <div className="flex items-center justify-between mt-3">
        {type === 'NFTPublicSaleCollection'
          ? <>
              <SwitchButton onToggle={(enabled) => {setMintRandomly(enabled)}}/>
              <div className="ml-2">Mint Randomly</div>
            </>
          : null
        }
        <div className='ml-auto'>
          <Button
            btnName="Create NFT Collection"
            classStyles="rounded-xl"
            handleClick={handleClick}
            disabled={disabled}
          />
        </div>
      </div>
      </>
    )
  }

  if (!context.account) {
    return (
      <ConnectToWalletBanner />
    );
  }

  return (
    <>
      <div className="flex justify-center sm:px-4 p-12">
        <div className="w-3/5 md:w-full">
          <Tabs>
            <TabList>
              <Tab>Open Collection</Tab>
              <Tab>Pre-designed Collection</Tab>
            </TabList>
            <TabPanel>
              {collectionImage()}
              {collectionName()}
              {collectionDescription()}
              {createCollectionButton(() => createOpenCollection(), 'NFTOpenCollection')}
            </TabPanel>
            <TabPanel>
              {collectionImage()}
              {collectionMaxSupply()}
              {!mintRandomly ? <div>{collectionMaxBatchMintSize()}</div> : null}
              {collectionMintPrice()}
              {collectionTokenBaseURI()}
              {collectionName()}
              {collectionDescription()}
              {createCollectionButton(() => createPublicSaleCollection(), 'NFTPublicSaleCollection')}
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </>
  )
}
