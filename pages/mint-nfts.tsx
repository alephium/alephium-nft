import * as web3 from '@alephium/web3'
import { useState, useContext } from 'react'
import { useRouter } from 'next/router'
import { NodeProvider, SignerProvider } from '@alephium/web3'
import { NFTCollection } from '../utils/nft-collection'
import addresses from '../configs/addresses.json'
import { AlephiumWeb3Context } from './alephium-web3-providers'
import TxStatusAlert, { useTxStatus } from './tx-status-alert'
import { ipfsClient } from '../utils/ipfs'

export default function MintNFTs() {
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [formInput, updateFormInput] = useState({ name: '', description: '' })
  const context = useContext(AlephiumWeb3Context)
  const router = useRouter()

  const [
    ongoingTxId,
    setOngoingTxId,
    ongoingTxDescription,
    setOngoingTxDescription,
    txStatusCallback,
    setTxStatusCallback,
    resetTxStatus
  ] = useTxStatus()

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
    const name = formInput.name
    const description = formInput.description
    if (uri && context.nodeProvider && context.signerProvider?.provider && context.selectedAccount) {
      const nftCollection = new NFTCollection(
        context.nodeProvider,
        context.signerProvider.provider
      )

      // TODO: Figure out UI to create collection, right now use default collection id
      const nftCollectionContractId = addresses.defaultNftCollectionContractId
      const mintNFTTxResult = await nftCollection.mintNFT(nftCollectionContractId, name, description, uri)
      console.debug('mintNFTTxResult', mintNFTTxResult)
      setOngoingTxId(mintNFTTxResult.txId)
      setOngoingTxDescription('minting NFT')

      setTxStatusCallback(() => async (txStatus: web3.node.TxStatus) => {
        if (txStatus.type === 'Confirmed') {
          resetTxStatus()
          router.push('/my-nfts')
        } else if (txStatus.type === 'TxNotFound') {
          resetTxStatus()
          console.error('Mint NFT transaction not found')
        }
      })
    } else {
      console.debug('context..', context)
    }
  }

  return (
    <>
      {
        ongoingTxId ? <TxStatusAlert txId={ongoingTxId} description={ongoingTxDescription} txStatusCallback={txStatusCallback} /> : undefined
      }

      <div className="flex justify-center">
        <div className="w-1/2 flex flex-col pb-12">
          <input
            placeholder="Asset Name"
            className="mt-8 border rounded p-4"
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
    </>
  )
}
