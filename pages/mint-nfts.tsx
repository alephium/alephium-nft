import { web3, node } from '@alephium/web3'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { NFTCollection } from '../utils/nft-collection'
import TxStatusAlert, { useTxStatusStates } from './tx-status-alert'
import { ipfsClient } from '../utils/ipfs'
import { useAlephiumConnectContext } from '@alephium/web3-react'
import { fetchNFTCollection, NFTCollection as NFTCollectionInfo } from '../components/nft-collection'

export default function MintNFTs() {
  const [collection, setCollection] = useState<NFTCollectionInfo | undefined>(undefined)
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [formInput, updateFormInput] = useState({ name: '', description: '' })
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

  if (!collectionId) return (<h1 className="px-20 py-10 text-3xl">No collection</h1>)

  return (
    <>
      {
        ongoingTxId ? <TxStatusAlert txId={ongoingTxId} description={ongoingTxDescription} txStatusCallback={txStatusCallback} /> : undefined
      }

      {
        collection && (
          <div className="flex justify-center">
            <table className="w-1/2 flex flex-col pb-12">
              <tbody>
                <tr>
                  <td>
                    <img className="rounded mt-4" src={collection.image} />
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap text-sm font-medium"><b>Collection Name</b>: {collection.name}</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap text-sm font-medium"><b>Description</b>: {collection.description}</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap text-sm font-medium"><b>Total Supply</b>: {collection.totalSupply.toString()}</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap text-sm font-medium">
                    <b>Already Minted</b>: {collection.totalSupply.toString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      }
      {
        collection ? (
          <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
              <input
                placeholder="Asset Name"
                className="mt-2 border rounded p-4"
                onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
              />
              <textarea
                placeholder="Asset Description"
                className="mt-2 border rounded p-4"
                onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
              />
              <input
                type="file"
                name="Asset"
                className="my-4"
                onChange={onChange}
              />
              {
                fileUrl && (
                  <img className="rounded mt-4" width="350" src={fileUrl} />
                )
              }
              <button onClick={mintNFT} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
                Mint NFT
              </button>
            </div>
          </div>
        ) : null
      }
    </>
  )
}
