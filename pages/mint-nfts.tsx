import { useState, useContext } from 'react'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import { stringToHex, subContractId } from '@alephium/web3'
import { NFTCollection } from '../scripts/nft-collection'

import addresses from '../configs/addresses.json'
import { AlephiumWeb3Context } from './alephium-web3-providers'

const ipfsClient = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

export default function MintNFTs() {
    const [fileUrl, setFileUrl] = useState(null)
    const [formInput, updateFormInput] = useState({ name: '', description: '' })

    const context = useContext(AlephiumWeb3Context)
    const router = useRouter()

    async function onChange(e) {
        const file = e.target.files[0]
        try {
            const added = await ipfsClient.add(
                file,
                {
                    progress: (prog) => console.log(`received: ${prog}`)
                }
            )
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            setFileUrl(url)
        } catch (error) {
            console.log('Error uploading file: ', error)
        }
    }

    async function uploadToIPFS(): Promise<string> {
        const { name, description } = formInput
        if (!name || !description || !fileUrl) return
        /* first, upload to IPFS */
        const data = JSON.stringify({
            name, description, image: fileUrl
        })
        try {
            const added = await ipfsClient.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
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
        if (context.nodeProvider && context.signerProvider && context.accounts && context.accounts[0]) {
            const nftCollection = new NFTCollection(
                context.nodeProvider,
                context.signerProvider,
                context.accounts[0].address
            )
            // TODO: Figure out UI to create collection, right now use default collection id

            const nftCollectionContractId = addresses.defaultNftCollectionContractId
            const nftContractId = subContractId(nftCollectionContractId, stringToHex(uri))
            const mintNFTResult = await nftCollection.mintNFT(nftCollectionContractId, name, description, uri)
            const withdrawNFTResult = await nftCollection.withdrawNFT(nftContractId)

            console.debug('mintNFTResult', mintNFTResult)
            console.debug('withdrawNFTResult', withdrawNFTResult)

            router.push('/my-nfts')
        }
    }

    return (
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
    )
}