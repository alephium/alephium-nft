import { useEffect, useState } from 'react'
import { addressFromContractId } from 'alephium-web3'
import { getNFTMarketplace } from '../scripts/nft-marketplace'
import addresses from '../configs/addresses.json'
import { provider } from '../utils/providers'
import { NFTListingContract } from '../utils/contracts'
import { hexToString } from '../utils'
import axios from 'axios'

export default function BuyNFTs() {
    const [nfts, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')
    useEffect(() => {
        loadListedNFTs()
    }, [])


    async function loadListedNFT(event) {
        console.log('load listed event', event)
        console.log('event.fields', event.fields)
        const listingContractId = event.fields[3].value

        var listingState = undefined
        try {
            listingState = await provider.contracts.getContractsAddressState(
                addressFromContractId(listingContractId),
                { group: 0 }
            )
        } catch (e) {
            console.log(`error fetching state for ${tokenId}`, e)
        }

        if (listingState && listingState.codeHash === NFTListingContract.codeHash) {
            const tokenId = listingState.fields[1].value

            const nftState = await provider.contracts.getContractsAddressState(
                addressFromContractId(tokenId),
                { group: 0 }
            )
            const metadataUri = hexToString(nftState.fields[3].value)
            const metadata = (await axios.get(metadataUri)).data

            return {
                price: listingState.fields[0].value,
                name: metadata.name,
                description: metadata.description,
                image: metadata.image,
                tokenId: tokenId,
                tokenOwner: listingState.fields[2].value,
                marketAddress: listingState.fields[3].value,
                commissionRate: listingState.fields[4].value
            }
        }
    }

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
        const nftMarketplace = await getNFTMarketplace()
        const marketplaceContractAddress = addressFromContractId(addresses.marketplaceContractId)
        const events = await nftMarketplace.getListedNFTs(marketplaceContractAddress)

        const items = []
        for (var event of events) {
            const listedNFT = await loadListedNFT(event)
            listedNFT && items.push(listedNFT)
        }

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