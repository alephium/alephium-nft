import * as web3 from '@alephium/web3'
import { useState } from 'react'
import { NFTCollection } from '../utils/nft-collection'
import TxStatusAlert, { useTxStatusStates } from './tx-status-alert'
import { ipfsClient } from '../utils/ipfs'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import { useRouter } from 'next/router'
import { Form, Loading } from '@web3uikit/core'

export default function CreateCollections() {
  const context = useAlephiumConnectContext()
  const router = useRouter()
  const [uploadProgressText, setUploadProgressText] = useState<string | undefined>(undefined)

  const [
    ongoingTxId,
    setOngoingTxId,
    ongoingTxDescription,
    setOngoingTxDescription,
    txStatusCallback,
    setTxStatusCallback,
    resetTxStatus
  ] = useTxStatusStates()

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

  async function createCollection(name: string, description: string, fileUrl: string) {
    const uri = await uploadToIPFS(name, description, fileUrl)
    setUploadProgressText(undefined)
    if (uri && context.signerProvider?.nodeProvider && context.account) {
      const nftCollection = new NFTCollection(context.signerProvider)
      const createCollectionTxResult = await nftCollection.createOpenCollection(uri)
      setOngoingTxId(createCollectionTxResult.txId)
      setOngoingTxDescription('minting NFT')

      let txNotFoundRetries: number = 0
      setTxStatusCallback(() => async (txStatus: web3.node.TxStatus) => {
        if (txStatus.type === 'Confirmed') {
          resetTxStatus()
          router.push(`/collections?collectionId=${createCollectionTxResult.contractInstance.contractId}`)
        } else if (txStatus.type === 'TxNotFound') {
          if (txNotFoundRetries >= 10) {
            console.info('Create collection transaction not found after 30 seconds, give up.')
            resetTxStatus()
          } else {
            txNotFoundRetries = txNotFoundRetries + 1
            console.info('Create collection transaction not found, retrying...')
          }
        }
      })
    } else {
      console.debug('context..', context)
    }
  }

  async function onSubmit(v: any) {
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
      await createCollection(collectionName, collectionDescription, imageUrl)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }

  if (uploadProgressText) return (<h1 className="px-20 py-10 text-3xl"><Loading spinnerType='wave' spinnerColor='grey' text={uploadProgressText} size={30} /></h1>)
  if (ongoingTxId) return (<TxStatusAlert txId={ongoingTxId} description={ongoingTxDescription} txStatusCallback={txStatusCallback} />)
  return (
    <>
      <Form
        id="create-collection"
        title='Create Collection'
        buttonConfig={{
          onClick: (e) => e.preventDefault,
          theme: 'primary',
          isFullWidth: true
        }}
        onSubmit={onSubmit}
        data={[
          {
            name: 'Collection Name',
            type: 'text',
            value: '',
            inputWidth: '100%',
            validation: {
              required: true
            }
          },
          {
            name: 'Collection Description',
            type: 'textarea',
            value: '',
            inputWidth: '100%',
            validation: {
              required: true
            }
          },
          {
            name: 'Collection Image',
            type: 'file',
            value: '',
            inputWidth: '100%',
            validation: {
              required: true
            }
          }
        ]}
      />
    </>
  )
}
