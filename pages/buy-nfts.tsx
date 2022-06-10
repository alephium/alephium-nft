import { useEffect, useState } from 'react'
import { testAddress1 } from '../test/helpers/signer'
import { provider } from '../utils/providers'
import { NFTContract } from '../utils/contracts'
import axios from 'axios'

export default function BuyNFTs() {
    const [nfts, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')
    useEffect(() => {
        loadListedNFTs()
    }, [])

    async function loadListedNFTs() {
        // Setup marketplace and get all the listed NFTListed
        //
        //     event NFTListed(
        //       price: U256,
        //       tokenId: ByteVec,
        //       tokenOwner: Address,
        //       listingContractId: ByteVec,
        //       listingContractAddress: Address
        //     )
        //
        const items = []
        setNfts(items)
        setLoadingState('loaded')
    }

    async function buyNft(nft) {
        console.log('buy nft', nft)
    }

    if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">No NFTs for sale</h1>)
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
                                    <p className="text-2xl font-bold text-white">{nft.price} ALPH </p>
                                    <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}