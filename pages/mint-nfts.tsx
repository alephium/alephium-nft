import { web3, node } from '@alephium/web3'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { NFTCollection } from '../utils/nft-collection'
import TxStatusAlert, { useTxStatusStates } from './tx-status-alert'
import { ipfsClient } from '../utils/ipfs'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import { fetchNFTCollection, NFTCollection as NFTCollectionInfo } from '../components/nft-collection'
import NFTCollectionCard from '../components/nft-collection-card'
import { color } from '@web3uikit/styles';
import { Button, Form } from '@web3uikit/core'
import { ArrowCircleLeft } from '@web3uikit/icons'

export default function MintNFTs() {
  const [collection, setCollection] = useState<NFTCollectionInfo | undefined>(undefined)
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [formInput, updateFormInput] = useState({ name: '', description: '' })
  const [uploadProgressText, setUploadProgressText] = useState<string | undefined>(undefined)
  const context = useAlephiumConnectContext()
  const router = useRouter()
  const { collectionId } = router.query

  const [
    ongoingTxId,
    setOngoingTxId,
    ongoingTxDescription,
    setOngoingTxDescription,
    txStatusCallback,
    setTxStatusCallback,
    resetTxStatus
  ] = useTxStatusStates()


  useEffect(() => {
    if (!!collectionId && context.signerProvider?.nodeProvider) {
      web3.setCurrentNodeProvider(context.signerProvider?.nodeProvider)
      fetchNFTCollection(collectionId as string).then((fetchedCollection) => (
        setCollection(fetchedCollection)
      ))
    }
  }, [collectionId, context.signerProvider?.nodeProvider])

  async function onChange(e: any) {
    const file = e.target.files[0]
    try {
      const added = await ipfsClient.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      const url: string = `https://alephium-nft.infura-ipfs.io/ipfs/${added.cid}`
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }

  async function uploadToIPFS(name: string, description: string, fileUrl: string): Promise<string | undefined> {
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
    try {
      setUploadProgressText(`Upload metadata to IPFS`)
      const added = await ipfsClient.add(data)
      const url = `https://alephium-nft.infura-ipfs.io/ipfs/${added.cid}`
      /* after file is uploaded to IPFS, return the URL to use it in the transaction */
      return url
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }

  async function mintNFT(name: string, description: string, fileUrl: string) {
    const uri = await uploadToIPFS(name, description, fileUrl)
    setUploadProgressText(undefined)
    if (uri && context.signerProvider?.nodeProvider && context.account && collection) {
      const nftCollection = new NFTCollection(context.signerProvider)

      const mintNFTTxResult = await nftCollection.mintOpenNFT(collection.id, uri)
      console.debug('mintNFTTxResult', mintNFTTxResult)
      setOngoingTxId(mintNFTTxResult.txId)
      setOngoingTxDescription('minting NFT')

      let txNotFoundRetries: number = 0
      setTxStatusCallback(() => async (txStatus: node.TxStatus) => {
        if (txStatus.type === 'Confirmed') {
          resetTxStatus()
          router.push('/my-porfolio')
        } else if (txStatus.type === 'TxNotFound') {
          if (txNotFoundRetries >= 10) {
            console.info('Mint NFT transaction not found after 30 seconds, give up.')
            resetTxStatus()
          } else {
            txNotFoundRetries = txNotFoundRetries + 1
            console.info('Mint NFT transaction not found, retrying...')
          }
        }
      })
    } else {
      console.debug('context..', context)
    }
  }

  async function onSubmit(v: any) {
    console.log("on submit", v)
    const collectionName = v.data[0].inputResult
    const collectionDescription = v.data[0].inputResult
    const imageFile = v.data[2].inputResult
    try {
      const added = await ipfsClient.add(
        imageFile,
        {
          progress: (prog) => {
            setUploadProgressText(`Upload image to IPFS: ${prog} bytes`)
            console.log(`received: ${prog}`)
          }
        }
      )
      const imageUrl: string = `https://alephium-nft.infura-ipfs.io/ipfs/${added.cid}`
      console.log("Image Url", imageUrl)
      await mintNFT(collectionName, collectionDescription, imageUrl)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }

  if (!collectionId) return (<h1 className="px-20 py-10 text-3xl">No collection</h1>)
  if (ongoingTxId) return (<TxStatusAlert txId={ongoingTxId} description={ongoingTxDescription} txStatusCallback={txStatusCallback} />)
  return (
    <>
      {
        collection ? (
          <Form
            id="mint-nft"
            title='Mint NFT'
            customFooter={
              (
                <>
                  <NFTCollectionCard
                    id={collectionId}
                    name={collection.name}
                    description={collection.description}
                    imageUrl={collection.image}
                    totalSupply={collection.totalSupply}
                    detailsBorder={`2px solid ${color.mint30}`}
                    width='300px'
                    mintMore={false}
                    detailsOnly={true}
                  />
                  <Button
                    text={'Mint NFT'}
                    isFullWidth={true}
                    theme={'primary'}
                    size="regular"
                  />
                </>
              )
            }
            onSubmit={onSubmit}
            data={[
              {
                name: 'NFT Name',
                type: 'text',
                value: '',
                inputWidth: '100%',
                validation: {
                  required: true
                }
              },
              {
                name: 'NFT Description',
                type: 'textarea',
                value: '',
                inputWidth: '100%',
                validation: {
                  required: true
                }
              },
              {
                name: 'NFT Image',
                type: 'file',
                value: '',
                inputWidth: '100%',
                validation: {
                  required: true
                }
              }
            ]}
          />
        ) : null
      }
    </>
  )
}
