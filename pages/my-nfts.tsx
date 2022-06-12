import { useEffect, useState } from 'react'
import { testAddress1 } from '../scripts/signer'
import { provider } from '../utils/providers'
import { NFTContract } from '../utils/contracts'
import { hexToString } from '../utils'
import { addressFromContractId } from 'alephium-web3'
import { getNFTMarketplace } from '../scripts/nft-marketplace'
import { getNFTCollection } from '../scripts/nft-collection'
import addresses from '../configs/addresses.json'

import axios from 'axios'

interface NFT {
    name: string,
    description: string,
    image: string,
    tokenId: string,
    collectionAddress: string
}

export default function Home() {
    const [nfts, setNfts] = useState([] as NFT[])
    const [loadingState, setLoadingState] = useState('not-loaded')

    useEffect(() => {
        loadNFTs()
    }, [])

    async function loadNFT(tokenId: string): undefined | NFT {
        var nftState = undefined
        try {
            nftState = await provider.contracts.getContractsAddressState(
                addressFromContractId(tokenId),
                { group: 0 }
            )
        } catch (e) {
            console.debug(`error fetching state for ${tokenId}`, e)
        }

        if (nftState && nftState.codeHash === NFTContract.codeHash) {
            const metadataUri = hexToString(nftState.fields[3].value)
            const metadata = (await axios.get(metadataUri)).data
            return {
                name: metadata.name,
                description: metadata.description,
                image: metadata.image,
                tokenId: tokenId,
                collectionAddress: nftState.fields[4].value
            }
        }
    }

    async function loadNFTs() {
        const utxos = await provider.addresses.getAddressesAddressUtxos(testAddress1)
        const tokens = utxos.utxos
            .flatMap((utxo) => utxo.tokens)
            .filter((token) => token.amount == 1)
            .map((token) => token.id)

        const items = []
        for (var token of tokens) {
            const nft = await loadNFT(token)
            nft && items.push(nft)
        }

        setNfts(items)
        setLoadingState('loaded')
    }

    async function sellNft(nft) {
        const nftMarketplace = await getNFTMarketplace()
        const nftCollection = await getNFTCollection()
        const depositNFTResult = await nftCollection.depositNFT(nft.tokenId)
        const listNFTTxResult = await nftMarketplace.listNFT(nft.tokenId, 1000, addresses.marketplaceContractId)

        loadNFTs()
    }

    if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">I have no NFTs</h1>)
    return (
        <div className="flex justify-center">
            <div className="px-4" style={{ maxWidth: '1600px' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                        nfts.map((nft, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nft.image} />
                                <div className="p-4">
                                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                                    <div style={{ height: '70px', overflow: 'hidden' }}>
                                        <p className="text-gray-400">{nft.description}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-black">
                                    <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => sellNft(nft)}>Sell</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}