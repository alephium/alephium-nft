import { useState } from 'react'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import { Contract, Script, stringToHex } from 'alephium-web3'
import { testAddress1, testWallet1 } from '../utils/signers'
import { subContractId } from '../utils'
import { provider } from '../utils/providers'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import { mintNFTScript } from '../utils/contracts'

export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState(null)
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
    const router = useRouter()

    async function onChange(e) {
        const file = e.target.files[0]
        try {
            const added = await client.add(
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

    async function uploadToIPFS() {
        const { name, description, price } = formInput
        if (!name || !description || !price || !fileUrl) return
        /* first, upload to IPFS */
        const data = JSON.stringify({
            name, description, image: fileUrl
        })
        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            /* after file is uploaded to IPFS, return the URL to use it in the transaction */
            return url
        } catch (error) {
            console.log('Error uploading file: ', error)
        }
    }

    // TODO: Move nft collection from test here
    async function listNFTForSale() {
        const uri = await uploadToIPFS()
        const name = formInput.name
        const signer = await testWallet1(provider)

        const nullContractId = '0000000000000000000000000000000000000000000000000000000000000000'
        const nftContractId = subContractId(nullContractId, stringToHex(uri))
        console.log('uri', uri)
        console.log('nftContractId', nftContractId)
        // meaning no collection

        const mintNFTTx = await mintNFTScript.transactionForDeployment(
            signer,
            {
                initialFields: {
                    nftCollectionContractId: nullContractId,
                    name: stringToHex(name),
                    symbol: stringToHex(name),
                    uri: stringToHex(uri)
                },
                gasAmount: 200000
            }
        )

        const result = await signer.submitTransaction(
            mintNFTTx.unsignedTx, mintNFTTx.txId, testAddress1
        )

        console.log('result', result)

        router.push('/')
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
                    placeholder="Asset Price in Eth"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
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
                <button onClick={listNFTForSale} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
                    Create NFT
                </button>
            </div>
        </div>
    )
}